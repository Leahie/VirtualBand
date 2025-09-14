from pydub import AudioSegment
from cerebras.cloud.sdk import Cerebras

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
  mixed = AudioSegment.from_wav(list_of_wav_file_paths[0])

  # overlay all the wav file songs
  for f in list_of_wav_file_paths[1:]:
      track = AudioSegment.from_wav(f)
      mixed = mixed.overlay(track)

  # export the final mix
  mixed.export(overall_mix_save_path, format="wav")
  print(f"Congrats on your AI Band! Saved the piece at {overall_mix_save_path}")


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