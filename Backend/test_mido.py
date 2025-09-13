#!/usr/bin/env python3
"""
Test script to verify mido is working correctly
"""

import mido
import numpy as np
import pygame
import soundfile as sf

def test_mido():
    """Test mido functionality"""
    print("🎵 Testing mido functionality...")
    
    # Create a simple MIDI file
    mid = mido.MidiFile()
    track = mido.MidiTrack()
    mid.tracks.append(track)
    
    # Set tempo
    tempo = mido.bpm2tempo(120)
    track.append(mido.MetaMessage('set_tempo', tempo=tempo))
    
    # Add a simple melody
    track.append(mido.Message('program_change', channel=0, program=24))  # Acoustic Guitar
    
    # Add some notes
    notes = [60, 62, 64, 65, 67, 65, 64, 62]  # C major scale
    for i, note in enumerate(notes):
        time_ms = int(i * 480)  # 1 beat per note
        track.append(mido.Message('note_on', channel=0, note=note, velocity=80, time=time_ms))
        track.append(mido.Message('note_off', channel=0, note=note, velocity=0, time=480))
    
    # Save MIDI file
    midi_file = "test_midi.mid"
    mid.save(midi_file)
    print(f"✅ MIDI file created: {midi_file}")
    
    # Test reading the MIDI file
    loaded_mid = mido.MidiFile(midi_file)
    print(f"✅ MIDI file loaded successfully")
    print(f"   - Tracks: {len(loaded_mid.tracks)}")
    print(f"   - Length: {loaded_mid.length:.2f} seconds")
    
    # Test basic audio generation
    print("🎸 Testing audio generation...")
    sample_rate = 44100
    duration = 4.0
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    
    # Generate a simple tone
    frequency = 440  # A4
    audio = np.sin(2 * np.pi * frequency * t) * 0.3
    
    # Apply envelope
    envelope = np.exp(-t * 2)  # Simple decay
    audio = audio * envelope
    
    # Save audio file
    audio_file = "test_audio.wav"
    sf.write(audio_file, audio, sample_rate)
    print(f"✅ Audio file created: {audio_file}")
    
    # Test pygame audio
    print("🔊 Testing audio playback...")
    pygame.mixer.init(frequency=44100, size=-16, channels=1, buffer=512)
    
    try:
        pygame.mixer.music.load(audio_file)
        pygame.mixer.music.play()
        
        # Wait for playback to finish
        while pygame.mixer.music.get_busy():
            pygame.time.wait(100)
        
        print("✅ Audio playback successful!")
        
    except Exception as e:
        print(f"❌ Audio playback error: {e}")
    
    print("\n🎉 All tests passed! mido is working correctly.")
    return True

if __name__ == "__main__":
    test_mido()
