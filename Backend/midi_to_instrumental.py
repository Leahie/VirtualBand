import mido
import fluidsynth
import numpy as np
from scipy.io.wavfile import write

# turn a midi file (general beat) into an instrumental wav file (where an instrument is playing to the midi beat)
def midi_to_instrumental(midi_file, output_wav, instrument_integer):
    # load soundfont
    fs = fluidsynth.Synth(samplerate=44100)
    fs.start()
    
    # Try to load soundfont from multiple possible locations
    soundfont_paths = [
        "FluidR3_GM.sf2",
        "./FluidR3_GM.sf2", 
        "../FluidR3_GM.sf2",
        "GeneralUser_GS_v1.471.sf2",
        "./GeneralUser_GS_v1.471.sf2"
    ]
    
    sfid = None
    for sf_path in soundfont_paths:
        try:
            sfid = fs.sfload(sf_path)
            print(f"Successfully loaded soundfont: {sf_path}")
            break
        except Exception as e:
            print(f"Failed to load {sf_path}: {e}")
            continue
    
    if sfid is None:
        print("Warning: No soundfont found, using basic synthesis")
        fs.delete()
        # Fallback to basic synthesis if no soundfont available
        return _basic_synthesis_fallback(midi_file, output_wav, instrument_integer)

    # select the appropriate program
    if instrument_integer == -1: # if it is drums
        channel = 9
        fs.program_select(channel, sfid, 128, 0)
    else:
        channel = 0
        fs.program_select(channel, sfid, 0, instrument_integer)

    # load MIDI
    mid = mido.MidiFile(midi_file)

    # collect audio samples
    audio_data = []
    sample_rate = 44100
    buffer_size = 1024

    # Get tempo and timing info
    tempo = 500000  # default tempo in microseconds per beat
    ticks_per_beat = mid.ticks_per_beat
    
    # Find tempo in the MIDI file
    for track in mid.tracks:
        for msg in track:
            if msg.type == 'set_tempo':
                tempo = msg.tempo
                break

    # Process all MIDI events with proper timing
    current_time_ticks = 0
    current_time_seconds = 0.0
    samples_rendered = 0
    
    # Collect all events from all tracks
    all_events = []
    for track in mid.tracks:
        track_time = 0
        for msg in track:
            if not msg.is_meta and msg.channel == channel:
                all_events.append((track_time, msg))
            track_time += msg.time
    
    # Sort events by time
    all_events.sort(key=lambda x: x[0])
    
    # Process events with proper timing
    for event_time, msg in all_events:
        # Convert ticks to seconds
        time_seconds = mido.tick2second(event_time, ticks_per_beat, tempo)
        
        # Render audio up to this event
        samples_needed = int((time_seconds - current_time_seconds) * sample_rate)
        for _ in range(0, samples_needed, buffer_size):
            samples = fs.get_samples(buffer_size)
            audio_data.extend(samples)
            samples_rendered += len(samples)
        
        # Process the MIDI event
        if msg.type == "note_on" and msg.velocity > 0:
            fs.noteon(channel, msg.note, msg.velocity)
        elif msg.type == "note_off" or (msg.type == "note_on" and msg.velocity == 0):
            fs.noteoff(channel, msg.note)
        
        current_time_seconds = time_seconds
    
    # Render final audio to let notes decay
    decay_samples = int(2 * sample_rate)  # 2 seconds of decay
    for _ in range(0, decay_samples, buffer_size):
        samples = fs.get_samples(buffer_size)
        audio_data.extend(samples)

    fs.delete()

    # Convert to numpy array with proper scaling to avoid clipping
    audio_np = np.array(audio_data, dtype=np.float32)
    max_val = np.max(np.abs(audio_np))
    if max_val > 0:
        audio_np = audio_np / max_val * 0.8

    audio_int16 = np.int16(audio_np * 32767)
    write(output_wav, sample_rate, audio_int16)

    print(f"Done! Saved instrumental version to {output_wav}. Audio length: {len(audio_int16) / sample_rate:.2f} seconds")


def _basic_synthesis_fallback(midi_file, output_wav, instrument_integer):
    """Fallback basic synthesis when soundfont is not available"""
    import math
    
    # Load MIDI file
    mid = mido.MidiFile(midi_file)
    
    # Audio parameters
    sample_rate = 44100
    duration = 10.0  # Default 10 seconds
    
    # Calculate total duration from MIDI
    total_time = 0
    for track in mid.tracks:
        track_time = 0
        for msg in track:
            track_time += msg.time
        total_time = max(total_time, mido.tick2second(track_time, mid.ticks_per_beat, 500000))
    
    if total_time > 0:
        duration = total_time + 2  # Add 2 seconds for decay
    
    # Generate time array
    t = np.linspace(0, duration, int(sample_rate * duration))
    audio = np.zeros_like(t)
    
    # Process MIDI events
    tempo = 500000  # Default tempo
    for track in mid.tracks:
        track_time = 0
        for msg in track:
            if msg.type == 'set_tempo':
                tempo = msg.tempo
            elif msg.type == 'note_on' and msg.velocity > 0:
                note_start = mido.tick2second(track_time, mid.ticks_per_beat, tempo)
                frequency = 440 * (2 ** ((msg.note - 69) / 12))
                
                # Find note duration by looking for corresponding note_off
                note_duration = 0.5  # Default duration
                temp_time = track_time
                for future_msg in track[track.index(msg) + 1:]:
                    temp_time += future_msg.time
                    if future_msg.type == 'note_off' and future_msg.note == msg.note:
                        note_duration = mido.tick2second(temp_time, mid.ticks_per_beat, tempo) - note_start
                        break
                
                # Generate note with ADSR envelope
                note_samples = int(note_duration * sample_rate)
                start_sample = int(note_start * sample_rate)
                
                if start_sample + note_samples < len(audio):
                    # Simple sine wave with envelope
                    note_t = np.linspace(0, note_duration, note_samples)
                    envelope = np.exp(-note_t * 2)  # Exponential decay
                    note_wave = np.sin(2 * np.pi * frequency * note_t) * envelope * 0.3
                    
                    audio[start_sample:start_sample + note_samples] += note_wave
            
            track_time += msg.time
    
    # Normalize and convert to int16
    max_val = np.max(np.abs(audio))
    if max_val > 0:
        audio = audio / max_val * 0.8
    
    audio_int16 = np.int16(audio * 32767)
    write(output_wav, sample_rate, audio_int16)
    
    print(f"Done! Saved basic synthesis version to {output_wav}. Audio length: {len(audio_int16) / sample_rate:.2f} seconds")


# for user to test it
if __name__ == "__main__":
    instruments = {
        "piano": 0,
        "guitar": 24,
        "violin": 40,
        "trumpet": 56,
        "drums": -1 
    }
    print("Choose an instrument: piano, guitar, violin, trumpet, drums")
    choice = input("Instrument: ").strip().lower()

    if choice not in instruments:
        raise ValueError(f"Invalid choice: {choice}")

    midi_file = "./samples/simple.mid"
    output_wav = "./songs/output_instrumental_from_midi.wav"
    midi_to_instrumental(midi_file, output_wav, instruments[choice])