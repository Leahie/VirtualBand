# VirtualBand - MIDI to Instrumental Sound Converter

A powerful Python-based system for converting MIDI files into realistic instrumental sounds, particularly guitar, piano, bass, and other instruments.

## Features

- **Multiple Synthesis Methods**: Basic waveform synthesis and high-quality SoundFont-based synthesis
- **Instrument Support**: Guitar, Piano, Bass, Synth with realistic timbres
- **Guitar Effects**: Clean, Distortion, Overdrive, Chorus, Reverb
- **REST API**: Easy-to-use Flask API for web integration
- **MIDI Analysis**: Extract detailed information from MIDI files
- **Multiple Output Formats**: WAV, MP3, and other audio formats

## Installation

1. **Clone or download the project**
2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Optional: Install high-quality synthesis tools** (for best results):
   
   **Windows:**
   - Download FluidSynth from: https://github.com/FluidSynth/fluidsynth/releases
   - Or install TiMidity++: https://sourceforge.net/projects/timidity/
   
   **Linux:**
   ```bash
   sudo apt-get install fluidsynth timidity
   ```
   
   **macOS:**
   ```bash
   brew install fluidsynth timidity
   ```

4. **Optional: Download SoundFonts** (for realistic instruments):
   - Download a General MIDI SoundFont (.sf2 file)
   - Recommended: FluidR3_GM.sf2 or similar
   - Place in a `soundfonts/` directory

## Quick Start

### 1. Basic Usage (Python)

```python
from midi_processor import MIDIProcessor

# Initialize processor
processor = MIDIProcessor()

# Convert MIDI to guitar audio
audio_data = processor.convert_midi_to_audio("song.mid", "wav", "guitar")

# Save the result
processor.save_audio_file(audio_data, "guitar_output.wav")
```

### 2. Advanced Usage with Effects

```python
from soundfont_synthesizer import SoundFontSynthesizer

# Initialize synthesizer
synthesizer = SoundFontSynthesizer()

# Convert with guitar distortion effect
audio_data = synthesizer.convert_midi_to_instrument(
    "song.mid", 
    instrument_type="guitar", 
    effect_type="distortion",
    output_format="wav"
)

# Save the result
with open("distorted_guitar.wav", "wb") as f:
    f.write(audio_data)
```

### 3. API Usage

Start the Flask server:
```bash
cd Backend
python app.py
```

The server will start on `http://localhost:5000`

#### Convert MIDI to Instrumental Audio

**POST** `/convert-midi`

Form data:
- `midi_file`: MIDI file to convert
- `instrument_type`: "guitar", "piano", "bass", or "synth" (optional, default: "guitar")
- `effect_type`: "clean", "distortion", "overdrive", "chorus", "reverb" (optional, default: "clean")
- `synthesis_method`: "basic" or "soundfont" (optional, default: "basic")
- `output_format`: "wav", "mp3" (optional, default: "wav")

Example using curl:
```bash
curl -X POST http://localhost:5000/convert-midi \
  -F "midi_file=@song.mid" \
  -F "instrument_type=guitar" \
  -F "effect_type=distortion" \
  -o output.wav
```

#### Analyze MIDI File

**POST** `/analyze-midi`

Form data:
- `midi_file`: MIDI file to analyze

Returns JSON with MIDI information including instruments, notes, duration, etc.

#### Get Supported Instruments

**GET** `/supported-instruments`

Returns JSON with available instruments, effects, and system capabilities.

#### Health Check

**GET** `/health`

Returns system status and available synthesis tools.

## API Examples

### JavaScript/Fetch API

```javascript
// Convert MIDI file
const formData = new FormData();
formData.append('midi_file', midiFile);
formData.append('instrument_type', 'guitar');
formData.append('effect_type', 'overdrive');

fetch('http://localhost:5000/convert-midi', {
    method: 'POST',
    body: formData
})
.then(response => response.blob())
.then(audioBlob => {
    // Handle the audio file
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();
});
```

### Python Requests

```python
import requests

# Convert MIDI
with open('song.mid', 'rb') as f:
    files = {'midi_file': f}
    data = {
        'instrument_type': 'guitar',
        'effect_type': 'distortion',
        'synthesis_method': 'soundfont'
    }
    
    response = requests.post('http://localhost:5000/convert-midi', 
                           files=files, data=data)
    
    if response.status_code == 200:
        with open('output.wav', 'wb') as out:
            out.write(response.content)
```

## Supported Instruments

- **Guitar**: Acoustic and electric guitar sounds with effects
- **Piano**: Acoustic and electric piano timbres
- **Bass**: Acoustic and electric bass sounds
- **Synth**: Synthesizer sounds

## Available Effects

### Guitar Effects
- **Clean**: Natural, unprocessed guitar sound
- **Distortion**: Heavy distortion for rock/metal
- **Overdrive**: Warm, tube-like overdrive
- **Chorus**: Modulated, shimmering effect
- **Reverb**: Spatial reverb effect

### Other Instruments
- **Piano**: Clean, Reverb
- **Bass**: Clean, Distortion
- **Synth**: Clean, Reverb

## Synthesis Methods

### Basic Synthesis
- Uses mathematical waveform generation
- Fast processing
- Good for testing and basic needs
- No external dependencies

### SoundFont Synthesis
- Uses high-quality SoundFont samples
- Realistic instrument sounds
- Requires FluidSynth or TiMidity++
- Supports advanced effects

## Testing

Run the test script to verify installation:

```bash
cd Backend
python test.py
```

This will:
1. Create sample MIDI files
2. Test basic conversion
3. Test SoundFont conversion (if available)
4. Generate sample audio files
5. Display system capabilities

## Troubleshooting

### Common Issues

1. **"No module named 'mido'" error**:
   ```bash
   pip install mido
   ```

2. **"FluidSynth not found" error**:
   - Install FluidSynth or TiMidity++ (see Installation section)
   - Or use `synthesis_method="basic"` for basic synthesis

3. **"No soundfont available" error**:
   - Download a .sf2 SoundFont file
   - Place it in the project directory or specify path

4. **Audio quality issues**:
   - Use SoundFont synthesis for better quality
   - Ensure you have a good quality SoundFont file
   - Try different effect settings

### Performance Tips

- Use basic synthesis for faster processing
- Use SoundFont synthesis for better quality
- Larger MIDI files may take longer to process
- Consider using MP3 output for smaller file sizes

## File Structure

```
VirtualBand/
├── Backend/
│   ├── app.py                    # Flask API server
│   ├── midi_processor.py         # Basic MIDI conversion
│   ├── soundfont_synthesizer.py  # Advanced SoundFont synthesis
│   └── test.py                   # Test script
├── Frontend/                     # (Your frontend code)
├── requirements.txt              # Python dependencies
└── README.md                     # This file
```

## Contributing

Feel free to contribute by:
- Adding new instruments
- Implementing new effects
- Improving synthesis quality
- Adding frontend interfaces
- Optimizing performance

## License

This project is open source. Feel free to use and modify as needed.
