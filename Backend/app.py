from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import json
import tempfile
from werkzeug.utils import secure_filename
from ai_generated_music import ai_artist
from extra_functions import get_4_instruments, combine_wav_files
import uuid

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
BAND_FOLDER = 'band'
PUBLIC_AUDIO_FOLDER = '../Frontend/bandmate-builder/public/audio'
ALLOWED_EXTENSIONS = {'mid', 'midi', 'wav', 'mp3'}

# Create directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(BAND_FOLDER, exist_ok=True)
os.makedirs(os.path.join(BAND_FOLDER, 'individual_ai_artists'), exist_ok=True)
os.makedirs(PUBLIC_AUDIO_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Upload user's MIDI file and get instrument type"""
    try:
        print(f"Upload request received. Files: {list(request.files.keys())}")
        print(f"Form data: {dict(request.form)}")
        
        if 'file' not in request.files:
            print("Error: No file in request")
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        instrument = request.form.get('instrument', 'piano')
        
        print(f"File: {file.filename}, Instrument: {instrument}")
        
        if file.filename == '':
            print("Error: Empty filename")
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            print(f"Error: Invalid file type: {file.filename}")
            return jsonify({'error': 'Invalid file type. Please upload MIDI, WAV, or MP3 files.'}), 400
        
        # Generate unique session ID
        session_id = str(uuid.uuid4())
        print(f"Generated session ID: {session_id}")
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, f"{session_id}_{filename}")
        print(f"Saving file to: {file_path}")
        file.save(file_path)
        
        user_audio_url = None
        
        # Handle audio files for playback
        if filename.lower().endswith(('.mp3', '.wav')):
            print(f"Processing audio file: {filename}")
            
            # Convert to WAV if it's MP3 for consistent playback
            if filename.lower().endswith('.mp3'):
                try:
                    from pydub import AudioSegment
                    print("Converting MP3 to WAV...")
                    audio = AudioSegment.from_mp3(file_path)
                    wav_filename = f"{session_id}_user_audio.wav"
                    wav_path = os.path.join(PUBLIC_AUDIO_FOLDER, wav_filename)
                    audio.export(wav_path, format="wav")
                    user_audio_url = f"/audio/{wav_filename}"
                    print(f"MP3 converted to WAV: {wav_path}")
                except Exception as e:
                    print(f"Error converting MP3: {e}")
                    # Fallback: just copy the file
                    public_filename = f"{session_id}_user_audio.mp3"
                    public_file_path = os.path.join(PUBLIC_AUDIO_FOLDER, public_filename)
                    import shutil
                    shutil.copy2(file_path, public_file_path)
                    user_audio_url = f"/audio/{public_filename}"
                    
            elif filename.lower().endswith('.wav'):
                print("Copying WAV file...")
                public_filename = f"{session_id}_user_audio.wav"
                public_file_path = os.path.join(PUBLIC_AUDIO_FOLDER, public_filename)
                import shutil
                shutil.copy2(file_path, public_file_path)
                user_audio_url = f"/audio/{public_filename}"
                print(f"WAV copied: {public_file_path}")
        
        # For now, we'll assume it's already a MIDI file
        # In a real implementation, you'd convert audio to MIDI here
        user_midi_path = file_path
        
        response_data = {
            'success': True,
            'session_id': session_id,
            'file_path': user_midi_path,
            'instrument': instrument,
            'user_audio_url': user_audio_url
        }
        
        print(f"Upload successful. Response: {response_data}")
        return jsonify(response_data)
    
    except Exception as e:
        print(f"Upload error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-band', methods=['POST'])
def generate_band():
    """Generate 4 AI band members based on user's instrument"""
    try:
        data = request.get_json()
        user_instrument = data.get('instrument', 'piano')
        
        # Get 4 complementary instruments
        band_instruments = get_4_instruments(user_instrument)
        
        return jsonify({
            'success': True,
            'band_instruments': band_instruments
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-ai-music', methods=['POST'])
def generate_ai_music():
    """Generate music for a specific AI band member"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        ai_instrument = data.get('ai_instrument')
        prompt = data.get('prompt', 'Create complementary music')
        user_midi_path = data.get('user_midi_path')
        
        if not all([session_id, ai_instrument, user_midi_path]):
            return jsonify({'error': 'Missing required parameters'}), 400
        
        # For now, just use a placeholder for user MIDI content
        # In a real implementation, you'd analyze the MIDI file
        user_midi_content = f"User's {ai_instrument} music"
        
        # Generate AI music
        output_wav = ai_artist(
            prompt_for_ai_artist=prompt,
            ai_artist_instrument=ai_instrument,
            users_midi=user_midi_content,
            users_instrument="user_instrument",
            session_id=session_id
        )
        
        # Return the public URL for the audio file
        audio_filename = os.path.basename(output_wav)
        public_audio_url = f"/audio/{audio_filename}"
        
        return jsonify({
            'success': True,
            'output_wav': public_audio_url,
            'ai_instrument': ai_instrument
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/combine-music', methods=['POST'])
def combine_music():
    """Combine all AI band members' music with user's music"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        wav_files = data.get('wav_files', [])
        user_audio_url = data.get('user_audio_url')
        
        print(f"=== COMBINE MUSIC REQUEST ===")
        print(f"Session ID: {session_id}")
        print(f"Received wav_files: {wav_files}")
        print(f"User audio URL: {user_audio_url}")
        
        if not wav_files and not user_audio_url:
            return jsonify({'error': 'No audio files provided for combining'}), 400
        
        # Convert public URLs to actual file paths
        actual_file_paths = []
        
        # Process AI-generated files
        for wav_file in wav_files:
            if wav_file.startswith('/audio/'):
                # Convert /audio/filename.wav to actual file path
                filename = wav_file.replace('/audio/', '')
                actual_path = os.path.join(PUBLIC_AUDIO_FOLDER, filename)
                if os.path.exists(actual_path):
                    actual_file_paths.append(actual_path)
                    print(f"✓ Added AI file: {actual_path}")
                else:
                    print(f"✗ AI file not found: {actual_path}")
            else:
                # Assume it's already a file path
                if os.path.exists(wav_file):
                    actual_file_paths.append(wav_file)
                    print(f"✓ Added direct path: {wav_file}")
                else:
                    print(f"✗ Direct path not found: {wav_file}")
        
        # Add user's audio file if provided
        if user_audio_url and user_audio_url.startswith('/audio/'):
            user_filename = user_audio_url.replace('/audio/', '')
            user_actual_path = os.path.join(PUBLIC_AUDIO_FOLDER, user_filename)
            if os.path.exists(user_actual_path):
                actual_file_paths.append(user_actual_path)
                print(f"✓ Added user audio: {user_actual_path}")
            else:
                print(f"✗ User audio file not found: {user_actual_path}")
                # List files in the directory for debugging
                try:
                    files_in_dir = os.listdir(PUBLIC_AUDIO_FOLDER)
                    print(f"Files in {PUBLIC_AUDIO_FOLDER}: {files_in_dir}")
                except Exception as e:
                    print(f"Error listing directory: {e}")
        
        if not actual_file_paths:
            return jsonify({'error': 'No valid audio files found for combining'}), 400
        
        print(f"Final file list for mixing ({len(actual_file_paths)} files): {actual_file_paths}")
        
        # Create combined output path in public folder
        output_path = os.path.join(PUBLIC_AUDIO_FOLDER, f"{session_id}_final_mix.wav")
        print(f"Output path: {output_path}")
        
        # Combine all audio files
        combine_wav_files(actual_file_paths, output_path)
        
        # Verify the output file was created
        if os.path.exists(output_path):
            file_size = os.path.getsize(output_path)
            print(f"✓ Final mix created successfully: {output_path} ({file_size} bytes)")
        else:
            raise Exception("Final mix file was not created")
        
        # Return the public URL for the final mix
        final_mix_url = f"/audio/{session_id}_final_mix.wav"
        
        return jsonify({
            'success': True,
            'final_mix_path': final_mix_url,
            'files_combined': len(actual_file_paths)
        })
    
    except Exception as e:
        print(f"Error in combine_music: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/audio/<path:filename>')
def serve_audio(filename):
    """Serve audio files with proper headers"""
    try:
        # Check in both band folder and individual_ai_artists subfolder
        file_path = os.path.join(BAND_FOLDER, filename)
        if not os.path.exists(file_path):
            file_path = os.path.join(BAND_FOLDER, 'individual_ai_artists', filename)
        
        if os.path.exists(file_path):
            return send_file(
                file_path, 
                as_attachment=False,
                mimetype='audio/wav',
                headers={
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            )
        else:
            return jsonify({'error': f'Audio file not found: {filename}'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'BandForge API is running'})

@app.route('/api/test-audio', methods=['GET'])
def test_audio():
    """Test audio generation and serving"""
    try:
        # Generate a simple test audio file
        from midi_to_instrumental import midi_to_instrumental
        import tempfile
        import os
        
        # Create a simple test MIDI file
        test_midi_path = os.path.join(BAND_FOLDER, 'test.mid')
        test_wav_path = os.path.join(PUBLIC_AUDIO_FOLDER, 'test_audio.wav')
        
        # Generate test audio
        midi_to_instrumental(test_midi_path, test_wav_path, 0)  # Piano
        
        if os.path.exists(test_wav_path):
            return jsonify({
                'success': True, 
                'message': 'Test audio generated successfully',
                'audio_url': '/audio/test_audio.wav'
            })
        else:
            return jsonify({'error': 'Failed to generate test audio'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
