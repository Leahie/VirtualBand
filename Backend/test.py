import os
import json
import tempfile
import subprocess
import requests
import mido
import pygame
import numpy as np
import librosa
import soundfile as sf
from scipy import signal
import io

class VirtualBand:
    def __init__(self, api_key=None):
        """Initialize the VirtualBand with Tandem API key"""
        self.api_key = "gk-CBcWXiyQ_i6izhnt49u"
        if not self.api_key:
            raise ValueError("Please provide TANDEM_API_KEY environment variable or pass api_key parameter")
        
        self.api_url = "https://api.tandemn.com/api/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        pygame.mixer.init(frequency=44100, size=-16, channels=2, buffer=512)
        
    def generate_midi_beat(self, prompt="Generate a playful, upbeat MIDI beat"):
        """Generate a MIDI beat using Tandem API"""
        try:
            # Create a detailed prompt for Tandem to generate MIDI data
            tandem_prompt = f"""
            {prompt}. Please generate a simple MIDI beat in the following JSON format:
            {{
                "tempo": 120,
                "tracks": [
                    {{
                        "name": "Drum",
                        "notes": [
                            {{"time": 0, "note": 36, "velocity": 80, "duration": 0.5}},
                            {{"time": 1, "note": 36, "velocity": 80, "duration": 0.5}},
                            {{"time": 2, "note": 36, "velocity": 80, "duration": 0.5}},
                            {{"time": 3, "note": 36, "velocity": 80, "duration": 0.5}}
                        ]
                    }},
                    {{
                        "name": "Bass",
                        "notes": [
                            {{"time": 0, "note": 48, "velocity": 70, "duration": 1.0}},
                            {{"time": 2, "note": 50, "velocity": 70, "duration": 1.0}}
                        ]
                    }},
                    {{
                        "name": "Melody",
                        "notes": [
                            {{"time": 0.5, "note": 60, "velocity": 60, "duration": 0.5}},
                            {{"time": 1.5, "note": 62, "velocity": 60, "duration": 0.5}},
                            {{"time": 2.5, "note": 64, "velocity": 60, "duration": 0.5}},
                            {{"time": 3.5, "note": 65, "velocity": 60, "duration": 0.5}}
                        ]
                    }}
                ]
            }}
            
            Make it playful and varied. Include some syncopation and interesting rhythms. Return ONLY the JSON, no other text.
            """
            
            data = {
                "model": "casperhansen/llama-3.3-70b-instruct-awq",
                "messages": [
                    {"role": "user", "content": tandem_prompt}
                ],
                "max_tokens": 2000,
                "temperature": 0.7
            }
            
            response = requests.post(self.api_url, headers=self.headers, json=data)
            response.raise_for_status()
            
            result = response.json()
            content = result['choices'][0]['message']['content']
            
            # Extract JSON from Tandem's response
            json_start = content.find('{')
            json_end = content.rfind('}') + 1
            
            if json_start == -1 or json_end == 0:
                raise ValueError("Could not find valid JSON in Tandem's response")
            
            midi_data = json.loads(content[json_start:json_end])
            return midi_data
            
        except Exception as e:
            print(f"Error generating MIDI beat: {e}")
            # Fallback to a simple beat if Tandem fails
            return {
                "tempo": 120,
                "tracks": [
                    {
                        "name": "Drum",
                        "notes": [
                            {"time": 0, "note": 36, "velocity": 80, "duration": 0.5},
                            {"time": 1, "note": 36, "velocity": 80, "duration": 0.5},
                            {"time": 2, "note": 36, "velocity": 80, "duration": 0.5},
                            {"time": 3, "note": 36, "velocity": 80, "duration": 0.5}
                        ]
                    },
                    {
                        "name": "Bass",
                        "notes": [
                            {"time": 0, "note": 48, "velocity": 70, "duration": 1.0},
                            {"time": 2, "note": 50, "velocity": 70, "duration": 1.0}
                        ]
                    },
                    {
                        "name": "Melody",
                        "notes": [
                            {"time": 0.5, "note": 60, "velocity": 60, "duration": 0.5},
                            {"time": 1.5, "note": 62, "velocity": 60, "duration": 0.5},
                            {"time": 2.5, "note": 64, "velocity": 60, "duration": 0.5},
                            {"time": 3.5, "note": 65, "velocity": 60, "duration": 0.5}
                        ]
                    }
                ]
            }
    
    def create_midi_file(self, midi_data, filename="generated_beat.mid"):
        """Convert MIDI data to actual MIDI file"""
        mid = mido.MidiFile()
        track = mido.MidiTrack()
        mid.tracks.append(track)
        
        # Set tempo
        tempo = mido.bpm2tempo(midi_data["tempo"])
        track.append(mido.MetaMessage('set_tempo', tempo=tempo))
        
        # Add tracks
        for track_data in midi_data["tracks"]:
            track = mido.MidiTrack()
            mid.tracks.append(track)
            
            # Program change for different instruments
            if "Drum" in track_data["name"]:
                track.append(mido.Message('program_change', channel=9, program=0))  # Standard Kit
            elif "Bass" in track_data["name"]:
                track.append(mido.Message('program_change', channel=0, program=32))  # Acoustic Bass
            else:  # Melody
                track.append(mido.Message('program_change', channel=1, program=24))  # Acoustic Guitar
            
            # Add notes
            for note in track_data["notes"]:
                time_ms = int(note["time"] * 480)  # Convert to MIDI ticks
                duration_ms = int(note["duration"] * 480)
                
                track.append(mido.Message('note_on', 
                                        channel=9 if "Drum" in track_data["name"] else (0 if "Bass" in track_data["name"] else 1),
                                        note=note["note"], 
                                        velocity=note["velocity"], 
                                        time=time_ms))
                track.append(mido.Message('note_off', 
                                        channel=9 if "Drum" in track_data["name"] else (0 if "Bass" in track_data["name"] else 1),
                                        note=note["note"], 
                                        velocity=0, 
                                        time=duration_ms))
        
        mid.save(filename)
        return filename
    
    def convert_midi_to_guitar(self, midi_file, output_file="guitar_beat.wav"):
        """Convert MIDI to guitar sounds using Python synthesis"""
        # Load MIDI file
        mid = mido.MidiFile(midi_file)
        
        # Audio parameters
        sample_rate = 44100
        duration = 8  # seconds
        t = np.linspace(0, duration, int(sample_rate * duration), False)
        
        # Initialize audio array
        audio = np.zeros(int(sample_rate * duration))
        
        # Process each track
        for track in mid.tracks:
            current_time = 0
            active_notes = {}
            
            for msg in track:
                current_time += msg.time
                
                if msg.type == 'note_on' and msg.velocity > 0:
                    # Convert MIDI note to frequency
                    frequency = 440 * (2 ** ((msg.note - 69) / 12))
                    
                    # Create guitar-like sound using ADSR envelope and harmonics
                    note_duration = 1.0  # Default duration
                    
                    # Generate guitar-like waveform with harmonics
                    note_audio = self.generate_guitar_tone(frequency, note_duration, sample_rate)
                    
                    # Apply time offset
                    start_sample = int(current_time * sample_rate / 480)
                    end_sample = start_sample + len(note_audio)
                    
                    if end_sample < len(audio):
                        audio[start_sample:end_sample] += note_audio * 0.3  # Mix level
                
                elif msg.type == 'note_off' or (msg.type == 'note_on' and msg.velocity == 0):
                    # Note off - could implement proper note off handling here
                    pass
        
        # Normalize and save
        audio = audio / np.max(np.abs(audio)) * 0.8
        sf.write(output_file, audio, sample_rate)
        return output_file
    
    def generate_guitar_tone(self, frequency, duration, sample_rate):
        """Generate a guitar-like tone with harmonics and ADSR envelope"""
        t = np.linspace(0, duration, int(sample_rate * duration), False)
        
        # Fundamental frequency
        fundamental = np.sin(2 * np.pi * frequency * t)
        
        # Add harmonics for guitar-like sound
        harmonics = (
            0.8 * fundamental +  # Fundamental
            0.4 * np.sin(2 * np.pi * frequency * 2 * t) +  # 2nd harmonic
            0.2 * np.sin(2 * np.pi * frequency * 3 * t) +  # 3rd harmonic
            0.1 * np.sin(2 * np.pi * frequency * 4 * t)    # 4th harmonic
        )
        
        # Apply ADSR envelope
        attack_time = 0.01
        decay_time = 0.1
        sustain_level = 0.7
        release_time = 0.3
        
        envelope = np.ones_like(t)
        
        # Attack
        attack_samples = int(attack_time * sample_rate)
        if attack_samples > 0:
            envelope[:attack_samples] = np.linspace(0, 1, attack_samples)
        
        # Decay
        decay_samples = int(decay_time * sample_rate)
        if decay_samples > 0 and attack_samples + decay_samples < len(envelope):
            envelope[attack_samples:attack_samples + decay_samples] = np.linspace(1, sustain_level, decay_samples)
        
        # Sustain
        sustain_start = attack_samples + decay_samples
        sustain_end = int((duration - release_time) * sample_rate)
        if sustain_end > sustain_start:
            envelope[sustain_start:sustain_end] = sustain_level
        
        # Release
        release_samples = int(release_time * sample_rate)
        if release_samples > 0 and sustain_end + release_samples <= len(envelope):
            envelope[sustain_end:sustain_end + release_samples] = np.linspace(sustain_level, 0, release_samples)
        
        # Apply envelope
        guitar_tone = harmonics * envelope
        
        # Add some subtle distortion for guitar character
        guitar_tone = np.tanh(guitar_tone * 1.5) * 0.7
        
        return guitar_tone
    
    def play_audio(self, audio_file):
        """Play the generated audio file"""
        try:
            pygame.mixer.music.load(audio_file)
            pygame.mixer.music.play()
            
            # Wait for playback to finish
            while pygame.mixer.music.get_busy():
                pygame.time.wait(100)
                
            print(f"Finished playing {audio_file}")
        except Exception as e:
            print(f"Error playing audio: {e}")
    
    def generate_and_play_beat(self, prompt="Generate a playful, upbeat MIDI beat"):
        """Complete pipeline: generate MIDI, convert to guitar, and play"""
        print("🎵 Generating playful MIDI beat with Tandem API...")
        midi_data = self.generate_midi_beat(prompt)
        
        print("🎸 Creating MIDI file...")
        midi_file = self.create_midi_file(midi_data)
        
        print("🎸 Converting to guitar sounds...")
        guitar_file = self.convert_midi_to_guitar(midi_file)
        
        print("🔊 Playing guitar beat...")
        self.play_audio(guitar_file)
        
        return {
            "midi_data": midi_data,
            "midi_file": midi_file,
            "guitar_file": guitar_file
        }

def main():
    """Main function to demonstrate the VirtualBand"""
    # You need to set your Tandem API key as an environment variable
    # or pass it directly to the constructor
    try:
        # Initialize VirtualBand
        band = VirtualBand()
        
        # Generate and play a beat
        result = band.generate_and_play_beat("Create a funky, upbeat guitar beat with some syncopation")
        
        print("\n✅ Beat generation and playback complete!")
        print(f"MIDI file saved as: {result['midi_file']}")
        print(f"Guitar audio saved as: {result['guitar_file']}")
        
    except ValueError as e:
        print(f"❌ Error: {e}")
        print("Please set your TANDEM_API_KEY environment variable")
        print("You can get an API key from: https://tandemn.com/")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    main()
