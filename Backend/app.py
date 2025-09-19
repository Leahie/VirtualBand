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
import fal_client
from cerebras.cloud.sdk import Cerebras

# Set up FAL API key
os.environ['FAL_KEY'] = 'ce89aa96-02f9-46e6-92c8-c9c1dee07bc8:4bb0be63422148ab16dbf9307a80f26c'

# Set up Cerebras client
cerebras_client = Cerebras(api_key="csk-8yn4k9rwxtd5vnd659x83ycejcxx66m2j25xpyhyww9twf36")

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

@app.route('/api/test-fal', methods=['GET'])
def test_fal():
    """Test FAL API connection"""
    try:
        if not os.getenv('FAL_KEY'):
            return jsonify({
                'success': False,
                'error': 'FAL_KEY environment variable not set',
                'message': 'Please set your fal.ai API key as FAL_KEY environment variable'
            }), 500
        
        # Test with a simple prompt
        result = fal_client.submit(
            "fal-ai/recraft/v3/text-to-image",
            arguments={
                "prompt": "a simple test image",
                "image_size": "square_hd",
                "style": "digital_illustration/cover"
            }
        )
        
        result_data = result.get()
        
        if 'images' in result_data and len(result_data['images']) > 0:
            return jsonify({
                'success': True,
                'message': 'FAL API connection successful',
                'test_image_url': result_data['images'][0]['url']
            })
        else:
            return jsonify({
                'success': False,
                'error': 'No image generated in test',
                'result': result_data
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'FAL API test failed: {str(e)}'
        }), 500

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

def extract_midi_notes(midi_file_path):
    """Extract note data from MIDI file for album cover generation"""
    try:
        import mido
        mid = mido.MidiFile(midi_file_path)
        
        notes_data = []
        current_time = 0
        tempo = 500000  # Default tempo
        
        # Get tempo from MIDI
        for track in mid.tracks:
            for msg in track:
                if msg.type == 'set_tempo':
                    tempo = msg.tempo
                    break
        
        # Extract notes from all tracks
        for track in mid.tracks:
            track_time = 0
            active_notes = {}  # Track note_on events to calculate duration
            
            for msg in track:
                if not msg.is_meta:
                    current_time_seconds = mido.tick2second(track_time, mid.ticks_per_beat, tempo)
                    
                    if msg.type == 'note_on' and msg.velocity > 0:
                        active_notes[msg.note] = current_time_seconds
                    elif (msg.type == 'note_off' or (msg.type == 'note_on' and msg.velocity == 0)) and msg.note in active_notes:
                        start_time = active_notes[msg.note]
                        duration = current_time_seconds - start_time
                        notes_data.append({
                            "name": msg.note,
                            "duration": round(duration, 2),
                            "start": round(start_time, 2)
                        })
                        del active_notes[msg.note]
                
                track_time += msg.time
        
        # Sort by start time and return first 8-10 notes for the prompt
        notes_data.sort(key=lambda x: x["start"])
        return notes_data[:10]  # Limit to first 10 notes
        
    except Exception as e:
        print(f"Error extracting MIDI notes: {e}")
        # Return fallback notes if extraction fails
        return [
            {"name": 60, "duration": 1.0, "start": 0.0},
            {"name": 64, "duration": 0.5, "start": 0.0},
            {"name": 67, "duration": 1.0, "start": 1.5}
        ]

@app.route('/api/parse-overall-direction', methods=['POST'])
def parse_overall_direction():
    try:
        data = request.get_json()
        overall_prompt = data.get('overall_prompt', '')
        band_members = data.get('band_members', [])
        
        if not overall_prompt or not band_members:
            return jsonify({'success': False, 'error': 'Missing overall prompt or band members'})
        
        # Create a prompt for the AI to parse the overall direction
        instruments = [member['instrument'] for member in band_members if not member['instrument'].startswith('Your ')]
        
        parsing_prompt = f"""
You are a professional music conductor and arranger. Follow the external clients input and create UNIQUE, SPECIFIC instructions for each instrument on the style to play (that work together harmoniously).

External clients input: "{overall_prompt}"

Available Instruments: {', '.join(instruments)}

CRITICAL: Follow the instructions/general idea of the external clients input. You can aapt very slightly to ensure they complement each others. Analyze the clients input and assign specific musical roles

You MUST return ONLY a valid JSON object in this exact format:
{{
    "individual_prompts": [
        {{"instrument": "piano", "prompt": "specific unique instruction for piano"}},
        {{"instrument": "guitar", "prompt": "specific unique instruction for guitar"}},
        {{"instrument": "drums", "prompt": "specific unique instruction for drums"}},
        {{"instrument": "bass", "prompt": "specific unique instruction for bass"}}
    ]
}}

Examples of GOOD specific instructions:
- Piano: "Play staccato eighth note chords in the upper register, emphasizing syncopated rhythms"
- Guitar: "Provide sustained power chords with palm muting, creating a driving rhythm foundation"  
- Drums: "Focus on snare backbeat with subtle hi-hat variations, maintaining steady 4/4 time"
- Bass: "Play walking bass lines with quarter note pulse, connecting chord changes smoothly"

DO NOT repeat the same instruction for multiple instruments. Each must be unique and instrument-specific.
"""

        # Use Cerebras API to parse the direction
        try:
            # Call Cerebras to parse the direction
            response = cerebras_client.chat.completions.create(
                model="llama3.1-70b",
                messages=[
                    {"role": "system", "content": "You are a professional music conductor and arranger. You analyze overall musical directions and create specific, unique instructions for each instrument. Always respond with valid JSON only."},
                    {"role": "user", "content": parsing_prompt}
                ],
                temperature=0.3,  # Lower temperature for more consistent JSON output
                max_tokens=1500
            )
            
            # Parse the AI response
            ai_response = response.choices[0].message.content.strip()
            print(f"Cerebras response: {ai_response}")
            
            # Clean up the response to extract JSON
            import re
            # Remove any markdown formatting
            ai_response = re.sub(r'```json\s*', '', ai_response)
            ai_response = re.sub(r'```\s*$', '', ai_response)
            
            # Try to extract JSON from the response
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                try:
                    parsed_response = json.loads(json_match.group())
                    individual_prompts = parsed_response.get('individual_prompts', [])
                    
                    # Validate that we have prompts for the available instruments
                    if len(individual_prompts) == 0:
                        raise ValueError("No individual prompts generated")
                        
                    # Ensure each prompt is unique and instrument-specific
                    validated_prompts = []
                    for prompt_data in individual_prompts:
                        if prompt_data.get('instrument') in instruments:
                            validated_prompts.append(prompt_data)
                    
                    individual_prompts = validated_prompts if validated_prompts else create_fallback_prompts(overall_prompt, instruments)
                    
                except json.JSONDecodeError as e:
                    print(f"JSON decode error: {e}")
                    individual_prompts = create_fallback_prompts(overall_prompt, instruments)
            else:
                print("No JSON found in response")
                individual_prompts = create_fallback_prompts(overall_prompt, instruments)
                
        except Exception as cerebras_error:
            print(f"Cerebras error, using fallback: {cerebras_error}")
            individual_prompts = create_fallback_prompts(overall_prompt, instruments)
        
        return jsonify({
            'success': True,
            'individual_prompts': individual_prompts
        })
        
    except Exception as e:
        print(f"Error parsing overall direction: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)})

def create_fallback_prompts(overall_prompt, instruments):
    """Create fallback prompts with instrument-specific roles if AI parsing fails"""
    prompts = []
    
    # Analyze overall prompt for keywords
    prompt_lower = overall_prompt.lower()
    
    # Define instrument roles based on common musical arrangements
    instrument_roles = {
        'piano': {
            'fast': 'Play rapid arpeggios and melodic runs in the upper register',
            'slow': 'Play sustained chords and gentle melodic lines',
            'energetic': 'Play staccato chords with syncopated rhythms',
            'calm': 'Play soft, flowing melodies with light accompaniment',
            'default': 'Provide harmonic foundation with chord progressions and melodic embellishments'
        },
        'guitar': {
            'fast': 'Play quick strumming patterns or fingerpicked melodies',
            'slow': 'Play sustained power chords or gentle fingerpicking',
            'energetic': 'Play driving rhythm chords with palm muting',
            'calm': 'Play soft arpeggios or gentle chord progressions',
            'default': 'Provide rhythmic and harmonic support with chord strumming'
        },
        'drums': {
            'fast': 'Play rapid hi-hat patterns with driving kick and snare',
            'slow': 'Play steady, simple beats with emphasis on groove',
            'energetic': 'Play powerful backbeats with dynamic fills',
            'calm': 'Play soft, subtle rhythms with brushes or light sticks',
            'default': 'Maintain steady rhythm with backbeat emphasis on 2 and 4'
        },
        'bass': {
            'fast': 'Play walking bass lines with quick note changes',
            'slow': 'Play sustained root notes with occasional melodic movement',
            'energetic': 'Play punchy, rhythmic bass lines that drive the beat',
            'calm': 'Play smooth, flowing bass lines with gentle movement',
            'default': 'Provide rhythmic and harmonic foundation with root note emphasis'
        },
        'violin': {
            'fast': 'Play rapid melodic passages and virtuosic runs',
            'slow': 'Play sustained, lyrical melodies with expressive bowing',
            'energetic': 'Play dynamic melodies with strong bow attacks',
            'calm': 'Play gentle, flowing melodies with soft dynamics',
            'default': 'Provide melodic lines and harmonic support'
        },
        'saxophone': {
            'fast': 'Play quick melodic lines and jazz-style runs',
            'slow': 'Play smooth, sustained melodies with vibrato',
            'energetic': 'Play bold, powerful melodic statements',
            'calm': 'Play soft, breathy tones with gentle phrasing',
            'default': 'Provide melodic solos and harmonic support'
        }
    }
    
    # Determine overall mood/tempo from prompt
    mood = 'default'
    if any(word in prompt_lower for word in ['fast', 'quick', 'rapid', 'energetic']):
        mood = 'fast' if any(word in prompt_lower for word in ['fast', 'quick', 'rapid']) else 'energetic'
    elif any(word in prompt_lower for word in ['slow', 'gentle', 'calm', 'soft']):
        mood = 'slow' if any(word in prompt_lower for word in ['slow']) else 'calm'
    elif any(word in prompt_lower for word in ['energetic', 'powerful', 'driving']):
        mood = 'energetic'
    
    # Generate specific prompts for each instrument
    for instrument in instruments:
        instrument_lower = instrument.lower()
        
        # Check if instrument is specifically mentioned in prompt
        if instrument_lower in prompt_lower:
            # Extract context around the instrument mention
            words = prompt_lower.split()
            for i, word in enumerate(words):
                if instrument_lower in word:
                    # Get surrounding context
                    start = max(0, i-3)
                    end = min(len(words), i+5)
                    context = ' '.join(words[start:end])
                    prompt = f"Based on '{context}', play accordingly with {instrument} characteristics"
                    break
            else:
                # Use role-based prompt
                roles = instrument_roles.get(instrument_lower, instrument_roles['default'])
                if isinstance(roles, dict):
                    prompt = roles.get(mood, roles['default'])
                else:
                    prompt = roles
        else:
            # Use role-based prompt for the determined mood
            roles = instrument_roles.get(instrument_lower)
            if roles and isinstance(roles, dict):
                prompt = roles.get(mood, roles['default'])
            else:
                prompt = f"Complement the overall direction with {instrument} in a {mood} style"
        
        prompts.append({
            'instrument': instrument,
            'prompt': prompt
        })
    
    return prompts

@app.route('/api/generate-album-cover', methods=['POST'])
def generate_album_cover():
    """Generate an AI album cover using Recraft V3 with MIDI-based prompts"""
    try:
        data = request.get_json()
        session_id = data.get('session_id', '')
        user_midi_path = data.get('user_midi_path', '')
        custom_prompt = data.get('prompt', '')
        
        if not session_id and not custom_prompt:
            return jsonify({'error': 'Session ID or custom prompt is required'}), 400
        
        # Check if FAL_KEY is set
        if not os.getenv('FAL_KEY'):
            return jsonify({
                'error': 'FAL_KEY environment variable not set. Please set your fal.ai API key as FAL_KEY environment variable.'
            }), 500
        
        # Build the prompt based on available data
        if custom_prompt:
            # Use custom prompt if provided
            final_prompt = custom_prompt
        else:
            # Generate MIDI-based prompt
            if user_midi_path and os.path.exists(user_midi_path):
                # Extract MIDI notes from user's file
                midi_notes = extract_midi_notes(user_midi_path)
                
                # Format notes for the prompt
                notes_str = ", ".join([f'{{ "name": {note["name"]}, "duration": {note["duration"]}, "start": {note["start"]} }}' for note in midi_notes])
                
                # Create the dynamic prompt
                final_prompt = f"""Extract the overall vibe from my songs beat (midi format) below: {notes_str}. I am a popular music artist. Generate a cool album cover that looks aesthetic and matches my songs overall vibe."""
            else:
                # Fallback prompt if no MIDI file
                final_prompt = "Generate a cool aesthetic album cover for a popular music artist with a modern, vibrant style."
        
        # Generate album cover using Recraft V3
        print(f"Generating album cover with prompt: {final_prompt}")
        
        try:
            result = fal_client.submit(
                "fal-ai/recraft/v3/text-to-image",
                arguments={
                    "prompt": final_prompt,
                    "image_size": "square_hd",
                    "style": "digital_illustration/cover",
                    "enable_safety_checker": True
                }
            )
            
            print(f"Submitted request, getting result...")
            # Get the result
            result_data = result.get()
            print(f"Result data: {result_data}")
            
            if 'images' in result_data and len(result_data['images']) > 0:
                image_url = result_data['images'][0]['url']
                print(f"Generated image URL: {image_url}")
                
                return jsonify({
                    'success': True,
                    'image_url': image_url,
                    'message': 'Album cover generated successfully',
                    'prompt_used': final_prompt
                })
            else:
                print(f"No images in result: {result_data}")
                return jsonify({'error': 'No image generated in response'}), 500
                
        except Exception as api_error:
            print(f"FAL API error: {str(api_error)}")
            return jsonify({'error': f'FAL API error: {str(api_error)}'}), 500
    
    except Exception as e:
        print(f"Error generating album cover: {str(e)}")
        return jsonify({'error': f'Failed to generate album cover: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
