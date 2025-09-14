from pydub import AudioSegment
from cerebras.cloud.sdk import Cerebras
import os

# instrument name (string) to its allocating number
def instrument_name_to_number(instrument_name):
  # Condensed FluidR3_GM / General MIDI instrument map (practical subset)
  instruments = {
    "piano": 0,             # Acoustic Grand Piano
    "electric_piano": 4,    # Electric Piano 1
    "organ": 16,            # Drawbar Organ
    "acoustic_guitar": 24,  # Nylon/Acoustic Guitar family
    "electric_guitar": 27,  # Clean Electric Guitar (use 29/30 for overdrive/distortion if desired)
    "bass_acoustic": 32,    # Acoustic Bass
    "bass_electric": 33,    # Fingered Electric Bass
    "violin": 40,
    "cello": 42,
    "contrabass": 43,
    "harp": 46,
    "string_ensemble": 48,
    "flute": 73,
    "clarinet": 71,
    "sax": 65,              # Alto Sax (commonly useful)
    "trumpet": 56,
    "trombone": 57,
    "french_horn": 60,
    "pad": 88,              # Synth pad (for atmosphere / chords)
    "synth_lead": 80,
    "percussion_drums": -1  # special: use MIDI channel 9 (10th channel) for drums/percussion
  }
  choice = instrument_name.strip().lower()

  if choice not in instruments:
    return 0

  return instruments[choice]


# given array of multiple .wav file paths, combines it into one overall .wav file
def combine_wav_files(list_of_wav_file_paths, overall_mix_save_path):
  print(f"Starting audio combination with {len(list_of_wav_file_paths)} files:")
  for i, path in enumerate(list_of_wav_file_paths):
    print(f"  File {i+1}: {path} (exists: {os.path.exists(path)})")
  
  if not list_of_wav_file_paths:
    raise ValueError("No audio files provided for combining")
  
  # Check if all files exist
  missing_files = [f for f in list_of_wav_file_paths if not os.path.exists(f)]
  if missing_files:
    raise FileNotFoundError(f"Missing audio files: {missing_files}")
  
  try:
    # Load first file and handle different formats
    first_file = list_of_wav_file_paths[0]
    print(f"Loading first file: {first_file}")
    
    try:
      if first_file.lower().endswith('.mp3'):
        mixed = AudioSegment.from_mp3(first_file)
      elif first_file.lower().endswith('.wav'):
        mixed = AudioSegment.from_wav(first_file)
      else:
        # Try to load as audio file with pydub's generic loader
        mixed = AudioSegment.from_file(first_file)
    except Exception as format_error:
      print(f"Error loading with format-specific loader: {format_error}")
      print("Trying generic file loader...")
      try:
        mixed = AudioSegment.from_file(first_file)
      except Exception as generic_error:
        print(f"Generic loader also failed: {generic_error}")
        raise Exception(f"Could not load audio file {first_file}. This may be due to missing ffmpeg. Please ensure the file is a valid audio format.")
    
    print(f"First file loaded successfully. Duration: {len(mixed)}ms, Channels: {mixed.channels}, Sample rate: {mixed.frame_rate}")

    # If there's only one file, just export it directly
    if len(list_of_wav_file_paths) == 1:
      print("Only one file provided, exporting directly...")
      mixed = mixed.normalize()
      mixed.export(overall_mix_save_path, format="wav")
      print(f"Single file exported to: {overall_mix_save_path}")
      return

    # overlay all the other audio files
    for i, f in enumerate(list_of_wav_file_paths[1:], 2):
      print(f"Loading file {i}: {f}")
      try:
        if f.lower().endswith('.mp3'):
          try:
            track = AudioSegment.from_mp3(f)
          except Exception as mp3_error:
            print(f"MP3 loader failed for {f}: {mp3_error}")
            track = AudioSegment.from_file(f)
        elif f.lower().endswith('.wav'):
          track = AudioSegment.from_wav(f)
        else:
          # Try to load as audio file with pydub's generic loader
          track = AudioSegment.from_file(f)
        
        print(f"File {i} loaded. Duration: {len(track)}ms, Channels: {track.channels}, Sample rate: {track.frame_rate}")
        
        # Ensure both tracks have the same sample rate and channels
        if track.frame_rate != mixed.frame_rate:
          print(f"Converting sample rate from {track.frame_rate} to {mixed.frame_rate}")
          track = track.set_frame_rate(mixed.frame_rate)
        
        if track.channels != mixed.channels:
          print(f"Converting channels from {track.channels} to {mixed.channels}")
          if mixed.channels == 1:
            track = track.set_channels(1)
          else:
            track = track.set_channels(2)
        
        # Overlay the track
        mixed = mixed.overlay(track)
        print(f"File {i} overlayed successfully. New duration: {len(mixed)}ms")
      except Exception as e:
        print(f"Error loading file {f}: {e}")
        import traceback
        traceback.print_exc()
        continue

    # Normalize volume to prevent clipping
    print("Normalizing final mix...")
    mixed = mixed.normalize()
    
    # export the final mix
    print(f"Exporting final mix to: {overall_mix_save_path}")
    mixed.export(overall_mix_save_path, format="wav")
    print(f"Congrats on your AI Band! Saved the piece at {overall_mix_save_path}")
    print(f"Final mix stats - Duration: {len(mixed)}ms, Channels: {mixed.channels}, Sample rate: {mixed.frame_rate}")
    
  except Exception as e:
    print(f"Error in combine_wav_files: {e}")
    import traceback
    traceback.print_exc()
    raise


# get a list of 4 relevant instruments for the band
def get_4_instruments(user_instrument):
  client = Cerebras(api_key="csk-8yn4k9rwxtd5vnd659x83ycejcxx66m2j25xpyhyww9twf36")
  prompt = f'''You are a music arranger. The user will tell you the main instrument they are playing. 
  You must select exactly 4 other instruments from the provided list that would form a well-balanced band or ensemble with that instrument.

  Rules:
  - Only choose from the instrument options listed below.
  - Do not repeat the user's instrument.
  - Choose instruments that balance rhythm, harmony, and melody.
  - Output exactly 4 instruments in a comma-separated list, no extra text.

  Allowed instrument names:
  piano, electric_piano, organ, acoustic_guitar, electric_guitar,
  bass_acoustic, bass_electric, violin, cello, contrabass, harp,
  string_ensemble, flute, clarinet, sax, trumpet, trombone, french_horn,
  pad, synth_lead, percussion_drums

  Example:
  User instrument: guitar
  Output: bass_acoustic, percussion_drums, piano, trumpet

  User instrument: violin
  Output: cello, flute, piano, trombone

  Now respond for this input:
  User instrument: {user_instrument}'''

  response = client.chat.completions.create(
    messages=[{"role": "user", "content": prompt}],
    model="llama-4-scout-17b-16e-instruct",
  )

  text = response.choices[0].message.content
  print(f"The LLM chosen the following instruments for your band: {text}")
  instrument_list = [inst.strip() for inst in text.split(",")]
  return instrument_list