import mido
import fluidsynth
import numpy as np
from scipy.io.wavfile import write

# turn a midi file (general beat) into an instrumental wav file (where an instrument is playing to the midi beat)
def midi_to_instrumental(midi_file, output_wav, instrument_integer):
    # load soundfont
    fs = fluidsynth.Synth(samplerate=44100)
    fs.start()
    sfid = fs.sfload("FluidR3_GM.sf2")

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