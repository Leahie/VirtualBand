# BandForge - AI Band Builder Setup

## Overview

BandForge is a full-stack application that allows users to upload their MIDI recordings and create AI-powered band members to accompany their music.

## Architecture

- **Frontend**: React + TypeScript + Vite (bandmate-builder)
- **Backend**: Flask + Python (Backend/)
- **AI Music Generation**: Cerebras Cloud SDK
- **Audio Processing**: FluidSynth, Mido, Pydub

## Setup Instructions

### 1. Backend Setup

```bash
cd Backend

# Install Python dependencies
pip install -r requirements_flask.txt

# Make sure you have the FluidR3_GM.sf2 soundfont file in the Backend directory
# (This should already be present from your previous setup)

# Start the Flask server
python run_server.py
```

The backend will be available at `http://localhost:5000`

### 2. Frontend Setup

```bash
cd Frontend/bandmate-builder

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

### POST /api/upload

Upload user's MIDI file and specify instrument

- **Body**: FormData with `file` and `instrument`
- **Response**: `{session_id, instrument, file_path}`

### POST /api/generate-band

Generate 4 complementary AI band members

- **Body**: `{instrument: string}`
- **Response**: `{band_instruments: string[]}`

### POST /api/generate-ai-music

Generate music for a specific AI band member

- **Body**: `{session_id, ai_instrument, prompt, user_midi_path}`
- **Response**: `{output_wav: string}`

### POST /api/combine-music

Combine all AI band members' music

- **Body**: `{session_id, wav_files: string[]}`
- **Response**: `{final_mix_path: string}`

### GET /api/audio/<filename>

Serve generated audio files

## User Workflow

1. **Upload**: User uploads MIDI file and selects their instrument
2. **Band Generation**: AI selects 4 complementary band members
3. **Music Creation**: User gives instructions to each AI musician
4. **Individual Playback**: Each AI musician's music can be played individually
5. **Final Mix**: All music is combined into one final piece

## File Structure

```
VirtualBand/
├── Backend/
│   ├── app.py                 # Flask API server
│   ├── run_server.py          # Server startup script
│   ├── ai_generated_music.py  # AI music generation
│   ├── midi_to_instrumental.py # MIDI to audio conversion
│   ├── extra_functions.py     # Utility functions
│   ├── llm_generated_midi.py  # LLM MIDI generation
│   └── FluidR3_GM.sf2        # Soundfont file
├── Frontend/
│   └── bandmate-builder/
│       ├── src/
│       │   ├── pages/
│       │   │   ├── Dashboard.tsx    # Main dashboard
│       │   │   └── BandBuilder.tsx  # Band creation workflow
│       │   └── components/
│       │       └── UploadModal.tsx  # File upload modal
│       └── package.json
└── SETUP.md
```

## Features

- ✅ **MIDI Upload**: Support for MIDI, WAV, MP3 files
- ✅ **Instrument Selection**: Choose from 10+ instruments
- ✅ **AI Band Generation**: Automatically selects 4 complementary musicians
- ✅ **Individual AI Musicians**: Each can be prompted and controlled separately
- ✅ **Real-time Audio**: Play individual AI musician tracks
- ✅ **Final Mix**: Combine all tracks into one cohesive piece
- ✅ **Modern UI**: Beautiful, responsive interface with dark mode

## Troubleshooting

### Backend Issues

- Ensure FluidR3_GM.sf2 is in the Backend directory
- Check that all Python dependencies are installed
- Verify Cerebras API key is valid

### Frontend Issues

- Make sure backend is running on port 5000
- Check browser console for CORS errors
- Verify all npm dependencies are installed

### Audio Issues

- Ensure soundfont file is present and accessible
- Check that generated WAV files are being created
- Verify audio file permissions

## Development

To run in development mode:

1. Start backend: `cd Backend && python run_server.py`
2. Start frontend: `cd Frontend/bandmate-builder && npm run dev`
3. Open browser to `http://localhost:5173`

The frontend will automatically proxy API requests to the backend.
