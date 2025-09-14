import librosa
import numpy as np
import mido
import os
from typing import List, Tuple

def mp3_to_midi(mp3_path: str, midi_path: str, instrument: str = "piano") -> str:
    """
    Convert MP3 audio file to MIDI using pitch detection
    
    Args:
        mp3_path: Path to input MP3 file
        midi_path: Path to output MIDI file
        instrument: Instrument type for MIDI channel selection
    
    Returns:
        Path to the generated MIDI file
    """
    try:
        # Load audio file
        print(f"Loading audio file: {mp3_path}")
        y, sr = librosa.load(mp3_path, sr=22050)  # Standard sample rate for pitch detection
        
        # Extract pitch using librosa's pitch detection
        print("Extracting pitch...")
        pitches, magnitudes = librosa.piptrack(y=y, sr=sr, threshold=0.1)
        
        # Get the most prominent pitch at each time frame
        pitch_times = []
        for t in range(pitches.shape[1]):
            index = magnitudes[:, t].argmax()
            pitch = pitches[index, t]
            if pitch > 0:  # Valid pitch detected
                pitch_times.append((t * 512 / sr, pitch))  # Convert frame to time
        
        # Convert pitches to MIDI notes
        print("Converting pitches to MIDI notes...")
        midi_notes = []
        for time, pitch in pitch_times:
            # Convert Hz to MIDI note number
            midi_note = int(12 * np.log2(pitch / 440.0) + 69)
            if 21 <= midi_note <= 108:  # Valid MIDI note range
                midi_notes.append((time, midi_note))
        
        # Create MIDI file
        print("Creating MIDI file...")
        mid = mido.MidiFile()
        track = mido.MidiTrack()
        mid.tracks.append(track)
        
        # Set tempo (120 BPM)
        track.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(120)))
        
        # Add instrument change
        channel = 0 if instrument != "drums" else 9
        track.append(mido.Message('program_change', channel=channel, program=0))
        
        # Convert notes to MIDI events
        current_time = 0
        for time, note in midi_notes:
            # Calculate delta time in ticks
            delta_time = int((time - current_time) * 480)  # 480 ticks per quarter note
            
            # Add note on
            track.append(mido.Message('note_on', 
                                    channel=channel, 
                                    note=note, 
                                    velocity=64, 
                                    time=delta_time))
            
            # Add note off after short duration
            note_duration = 0.5  # 0.5 seconds
            track.append(mido.Message('note_off', 
                                    channel=channel, 
                                    note=note, 
                                    velocity=64, 
                                    time=int(note_duration * 480)))
            
            current_time = time + note_duration
        
        # Save MIDI file
        mid.save(midi_path)
        print(f"MIDI file saved: {midi_path}")
        
        return midi_path
        
    except Exception as e:
        print(f"Error converting MP3 to MIDI: {e}")
        raise e

def simple_mp3_to_midi(mp3_path: str, midi_path: str) -> str:
    """
    Simplified MP3 to MIDI conversion for basic piano recordings
    """
    try:
        # Load audio file
        print(f"Loading audio file: {mp3_path}")
        y, sr = librosa.load(mp3_path, sr=22050)
        
        # Use onset detection to find note events
        print("Detecting note onsets...")
        onsets = librosa.onset.onset_detect(y=y, sr=sr, units='time')
        
        # Extract pitch at each onset
        print("Extracting pitches at onsets...")
        midi_notes = []
        
        for onset_time in onsets:
            # Get a small window around the onset for pitch detection
            start_sample = int(onset_time * sr)
            end_sample = min(start_sample + int(0.1 * sr), len(y))  # 100ms window
            
            if end_sample > start_sample:
                window = y[start_sample:end_sample]
                
                # Use autocorrelation for pitch detection
                autocorr = np.correlate(window, window, mode='full')
                autocorr = autocorr[autocorr.size // 2:]
                
                # Find peaks in autocorrelation
                peaks = []
                for i in range(1, len(autocorr) - 1):
                    if autocorr[i] > autocorr[i-1] and autocorr[i] > autocorr[i+1]:
                        if autocorr[i] > 0.1 * np.max(autocorr):  # Threshold
                            peaks.append(i)
                
                if peaks:
                    # Use the first significant peak for pitch
                    period = peaks[0]
                    if period > 0:
                        frequency = sr / period
                        if 80 <= frequency <= 2000:  # Reasonable frequency range
                            midi_note = int(12 * np.log2(frequency / 440.0) + 69)
                            if 21 <= midi_note <= 108:  # Valid MIDI range
                                midi_notes.append((onset_time, midi_note))
        
        # Create MIDI file
        print("Creating MIDI file...")
        mid = mido.MidiFile()
        track = mido.MidiTrack()
        mid.tracks.append(track)
        
        # Set tempo
        track.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(120)))
        
        # Add piano program
        track.append(mido.Message('program_change', channel=0, program=0))
        
        # Add notes
        current_time = 0
        for time, note in midi_notes:
            delta_time = int((time - current_time) * 480)
            
            # Note on
            track.append(mido.Message('note_on', 
                                    channel=0, 
                                    note=note, 
                                    velocity=80, 
                                    time=delta_time))
            
            # Note off after 1 second
            track.append(mido.Message('note_off', 
                                    channel=0, 
                                    note=note, 
                                    velocity=80, 
                                    time=480))  # 1 second
            
            current_time = time
        
        # Save MIDI file
        mid.save(midi_path)
        print(f"MIDI file saved: {midi_path}")
        
        return midi_path
        
    except Exception as e:
        print(f"Error in simple MP3 to MIDI conversion: {e}")
        raise e

if __name__ == "__main__":
    # Test the function
    test_mp3 = "test_recording.mp3"
    test_midi = "test_output.mid"
    
    if os.path.exists(test_mp3):
        simple_mp3_to_midi(test_mp3, test_midi)
        print("Test conversion completed!")
    else:
        print("Test MP3 file not found. Please provide a test file.")
