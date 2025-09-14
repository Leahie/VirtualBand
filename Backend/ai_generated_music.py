from llm_generated_midi import llm_generated_midi
from midi_to_instrumental import midi_to_instrumental
from extra_functions import instrument_name_to_number

# generate instrumentals for one artist/instrument
def ai_artist(prompt_for_ai_artist, ai_artist_instrument, users_midi, users_instrument, session_id=None, use_intermediate_folder=False):
  ai_artist_instrument_number = instrument_name_to_number(ai_artist_instrument)
  midi_file = "./band/midi_file_intermediate.mid"
  
  # Choose output folder based on use_intermediate_folder flag
  if use_intermediate_folder:
    # Use intermediate folder with simple naming
    output_wav = f"../Frontend/bandmate-builder/public/intermediate/{ai_artist_instrument}.wav"
  else:
    # Save to public folder for direct serving
    if session_id:
      output_wav = f"../Frontend/bandmate-builder/public/audio/{session_id}_{ai_artist_instrument}_ai_artist.wav"
    else:
      output_wav = f"../Frontend/bandmate-builder/public/audio/{ai_artist_instrument}_ai_artist.wav"

  starting_prompt = f'''Please create music according to the following description:
  {prompt_for_ai_artist}

  The target instrument that you be playing is: {ai_artist_instrument}

  Ensure it matches and goes well when played ALONGSIDE my own {users_instrument} music. Therefore should be nice and complement my piece, not overpowering. I played my {users_instrument} and the MIDI for it is as follow: {users_midi}.'''
    
  llm_generated_midi(starting_prompt, midi_file, ai_artist_instrument)
  midi_to_instrumental(midi_file, output_wav, ai_artist_instrument_number)

  return output_wav