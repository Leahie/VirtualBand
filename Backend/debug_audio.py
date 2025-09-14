#!/usr/bin/env python3
"""
Debug script for audio generation and serving
"""

import os
import sys
import requests
from midi_to_instrumental import midi_to_instrumental
import mido

def create_test_midi():
    """Create a simple test MIDI file"""
    print("🎵 Creating test MIDI file...")
    
    # Create a simple MIDI file
    mid = mido.MidiFile()
    track = mido.MidiTrack()
    mid.tracks.append(track)
    
    # Set tempo
    track.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(120)))
    
    # Add some simple notes
    track.append(mido.Message('note_on', channel=0, note=60, velocity=80, time=0))
    track.append(mido.Message('note_off', channel=0, note=60, velocity=0, time=480))
    track.append(mido.Message('note_on', channel=0, note=64, velocity=80, time=0))
    track.append(mido.Message('note_off', channel=0, note=64, velocity=0, time=480))
    track.append(mido.Message('note_on', channel=0, note=67, velocity=80, time=0))
    track.append(mido.Message('note_off', channel=0, note=67, velocity=0, time=480))
    
    # Save MIDI file
    midi_path = os.path.join('band', 'test.mid')
    os.makedirs('band', exist_ok=True)
    mid.save(midi_path)
    print(f"✅ Test MIDI saved to: {midi_path}")
    return midi_path

def test_audio_generation():
    """Test audio generation"""
    print("🎼 Testing audio generation...")
    
    # Create test MIDI
    midi_path = create_test_midi()
    
    # Generate audio
    wav_path = os.path.join('band', 'test_audio.wav')
    try:
        midi_to_instrumental(midi_path, wav_path, 0)  # Piano
        if os.path.exists(wav_path):
            file_size = os.path.getsize(wav_path)
            print(f"✅ Audio generated successfully: {wav_path} ({file_size} bytes)")
            return wav_path
        else:
            print("❌ Audio file was not created")
            return None
    except Exception as e:
        print(f"❌ Error generating audio: {e}")
        return None

def test_api_endpoints():
    """Test API endpoints"""
    print("🌐 Testing API endpoints...")
    
    base_url = "http://localhost:5000"
    
    # Test health check
    try:
        response = requests.get(f"{base_url}/api/health")
        if response.status_code == 200:
            print("✅ Health check passed")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check error: {e}")
    
    # Test audio serving
    try:
        response = requests.get(f"{base_url}/api/audio/test_audio.wav")
        if response.status_code == 200:
            print("✅ Audio serving works")
            print(f"   Content-Type: {response.headers.get('content-type')}")
            print(f"   Content-Length: {response.headers.get('content-length')}")
        else:
            print(f"❌ Audio serving failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Audio serving error: {e}")

def main():
    print("🔧 BandForge Audio Debug Tool")
    print("=" * 40)
    
    # Test audio generation
    wav_path = test_audio_generation()
    
    if wav_path:
        print("\n" + "=" * 40)
        print("🎧 Testing audio file...")
        
        # Check if file is valid
        try:
            import wave
            with wave.open(wav_path, 'rb') as wav_file:
                print(f"✅ WAV file is valid")
                print(f"   Channels: {wav_file.getnchannels()}")
                print(f"   Sample Rate: {wav_file.getframerate()}")
                print(f"   Frames: {wav_file.getnframes()}")
        except Exception as e:
            print(f"❌ WAV file is invalid: {e}")
    
    print("\n" + "=" * 40)
    print("🌐 Testing API (make sure server is running)...")
    test_api_endpoints()
    
    print("\n" + "=" * 40)
    print("🏁 Debug complete!")

if __name__ == '__main__':
    main()
