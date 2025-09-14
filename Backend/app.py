from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import json
import tempfile
from werkzeug.utils import secure_filename
from ai_generated_music import ai_artist
from extra_functions import get_4_instruments, combine_wav_files
from mp3_to_midi import simple_mp3_to_midi
import uuid

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
BAND_FOLDER = 'band'
PUBLIC_AUDIO_FOLDER = '../Frontend/bandmate-builder/public/audio'
INTERMEDIATE_FOLDER = '../Frontend/bandmate-builder/public/intermediate'
ALLOWED_EXTENSIONS = {'mid', 'midi', 'wav', 'mp3'}

# Create directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(BAND_FOLDER, exist_ok=True)
os.makedirs(os.path.join(BAND_FOLDER, 'individual_ai_artists'), exist_ok=True)
os.makedirs(PUBLIC_AUDIO_FOLDER, exist_ok=True)
os.makedirs(INTERMEDIATE_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def clear_intermediate_folder():
    """Clear all files in the intermediate folder"""
    import shutil
    if os.path.exists(INTERMEDIATE_FOLDER):
        shutil.rmtree(INTERMEDIATE_FOLDER)
        os.makedirs(INTERMEDIATE_FOLDER, exist_ok=True)

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Upload user's MIDI file and get instrument type"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        instrument = request.form.get('instrument', 'piano')
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Please upload MIDI, WAV, or MP3 files.'}), 400
        
        # Generate unique session ID
        session_id = str(uuid.uuid4())
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, f"{session_id}_{filename}")
        file.save(file_path)
        
        # Check file type and convert if needed
        file_extension = filename.rsplit('.', 1)[1].lower()
        
        if file_extension in ['mp3', 'wav']:
            # Convert audio to MIDI
            print(f"Converting {file_extension} to MIDI...")
            midi_filename = f"{session_id}_converted.mid"
            user_midi_path = os.path.join(UPLOAD_FOLDER, midi_filename)
            
            try:
                simple_mp3_to_midi(file_path, user_midi_path)
                print(f"Successfully converted to MIDI: {user_midi_path}")
            except Exception as e:
                print(f"Error converting audio to MIDI: {e}")
                return jsonify({'error': f'Failed to convert audio to MIDI: {str(e)}'}), 500
            
            # Also convert to WAV and save to public folder for playback
            print(f"Converting {file_extension} to WAV for playback...")
            user_wav_filename = f"{session_id}_user_{instrument}.wav"
            user_wav_path = os.path.join(PUBLIC_AUDIO_FOLDER, user_wav_filename)
            
            try:
                import librosa
                import soundfile as sf
                
                # Load audio and convert to WAV
                y, sr = librosa.load(file_path, sr=22050)
                sf.write(user_wav_path, y, sr)
                print(f"Successfully converted to WAV: {user_wav_path}")
                
                # Store the WAV path for later use
                user_wav_url = f"/audio/{user_wav_filename}"
                
            except Exception as e:
                print(f"Error converting to WAV: {e}")
                user_wav_url = None
        else:
            # Assume it's already a MIDI file
            user_midi_path = file_path
            user_wav_url = None
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'file_path': user_midi_path,
            'instrument': instrument,
            'user_wav_url': user_wav_url
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-band', methods=['POST'])
def generate_band():
    """Generate 4 AI band members based on user's instrument"""
    try:
        data = request.get_json()
        user_instrument = data.get('instrument', 'piano')
        
        # Clear intermediate folder for new band
        clear_intermediate_folder()
        
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
        
        # Generate AI music with simple naming in intermediate folder
        output_wav = ai_artist(
            prompt_for_ai_artist=prompt,
            ai_artist_instrument=ai_instrument,
            users_midi=user_midi_content,
            users_instrument="user_instrument",
            session_id=session_id,
            use_intermediate_folder=True
        )
        
        # Return the public URL for the audio file
        audio_filename = os.path.basename(output_wav)
        public_audio_url = f"/intermediate/{audio_filename}"
        
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
        
        print(f"Received wav_files: {wav_files}")
        
        if not wav_files:
            return jsonify({'error': 'No WAV files provided'}), 400
        
        # Convert public URLs to actual file paths
        actual_file_paths = []
        for wav_file in wav_files:
            if wav_file.startswith('/intermediate/'):
                # Convert /intermediate/filename.wav to actual file path
                filename = wav_file.replace('/intermediate/', '')
                actual_path = os.path.join(INTERMEDIATE_FOLDER, filename)
                actual_file_paths.append(actual_path)
                print(f"Converted {wav_file} to {actual_path}")
            elif wav_file.startswith('/audio/'):
                # Convert /audio/filename.wav to actual file path
                filename = wav_file.replace('/audio/', '')
                actual_path = os.path.join(PUBLIC_AUDIO_FOLDER, filename)
                actual_file_paths.append(actual_path)
                print(f"Converted {wav_file} to {actual_path}")
            else:
                # Assume it's already a file path
                actual_file_paths.append(wav_file)
        
        print(f"Actual file paths: {actual_file_paths}")
        
        # Create combined output path in public folder
        output_path = os.path.join(PUBLIC_AUDIO_FOLDER, f"{session_id}_final_mix.wav")
        
        # Combine all WAV files
        combine_wav_files(actual_file_paths, output_path)
        
        # Return the public URL for the final mix
        final_mix_url = f"/audio/{session_id}_final_mix.wav"
        
        return jsonify({
            'success': True,
            'final_mix_path': final_mix_url
        })
    
    except Exception as e:
        print(f"Error in combine_music: {e}")
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
