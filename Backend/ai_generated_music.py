from llm_generated_midi import llm_generated_midi
from midi_to_instrumental import midi_to_instrumental
from extra_functions import instrument_name_to_number

# generate instrumentals for one artist/instrument
def ai_artist(prompt_for_ai_artist, ai_artist_instrument, users_midi, users_instrument, session_id=None, is_regeneration=False):
  import os
  import time
  
  ai_artist_instrument_number = instrument_name_to_number(ai_artist_instrument)
  
  # Use unique MIDI file for regeneration to avoid conflicts
  if is_regeneration:
    timestamp = int(time.time() * 1000)
    midi_file = f"./band/midi_file_intermediate_{timestamp}.mid"
  else:
    midi_file = "./band/midi_file_intermediate.mid"
  
  # Save to public folder for direct serving
  if session_id:
    if is_regeneration:
      # Add timestamp for regenerated files to avoid caching issues
      timestamp = int(time.time() * 1000)  # milliseconds
      output_wav = f"../Frontend/bandmate-builder/public/audio/{session_id}_{ai_artist_instrument}_ai_artist_{timestamp}.wav"
      
      # Clean up old file if it exists
      old_file = f"../Frontend/bandmate-builder/public/audio/{session_id}_{ai_artist_instrument}_ai_artist.wav"
      if os.path.exists(old_file):
        try:
          os.remove(old_file)
          print(f"Removed old file: {old_file}")
        except Exception as e:
          print(f"Warning: Could not remove old file {old_file}: {e}")
    else:
      output_wav = f"../Frontend/bandmate-builder/public/audio/{session_id}_{ai_artist_instrument}_ai_artist.wav"
  else:
    output_wav = f"../Frontend/bandmate-builder/public/audio/{ai_artist_instrument}_ai_artist.wav"

  # Enhanced prompt for regeneration with more variation
  if is_regeneration:
    starting_prompt = f'''Please create NEW and DIFFERENT music according to the following description:
    {prompt_for_ai_artist}

    The target instrument that you be playing is: {ai_artist_instrument}

    IMPORTANT: This is a regeneration request, so please create something distinctly different from any previous attempts while still following the description. Add creative variations, different rhythms, or alternative musical approaches.

    Ensure it matches and goes well when played ALONGSIDE my own {users_instrument} music. Therefore should be nice and complement my piece, not overpowering. I played my {users_instrument} and the MIDI for it is as follow: {users_midi}.'''
  else:
    starting_prompt = f'''Please create music according to the following description:
    {prompt_for_ai_artist}

    The target instrument that you be playing is: {ai_artist_instrument}

    Ensure it matches and goes well when played ALONGSIDE my own {users_instrument} music. Therefore should be nice and complement my piece, not overpowering. I played my {users_instrument} and the MIDI for it is as follow: {users_midi}.'''
    
  llm_generated_midi(starting_prompt, midi_file, ai_artist_instrument)
  midi_to_instrumental(midi_file, output_wav, ai_artist_instrument_number)
  
  # Clean up temporary MIDI file for regeneration
  if is_regeneration and os.path.exists(midi_file):
    try:
      os.remove(midi_file)
      print(f"Cleaned up temporary MIDI file: {midi_file}")
    except Exception as e:
      print(f"Warning: Could not clean up MIDI file {midi_file}: {e}")

  return output_wav