from ai_generated_music import ai_artist
from extra_functions import combine_wav_files, get_4_instruments

if __name__ == "__main__":
  users_instrument = "piano"
  users_midi = '''
[
  {
    "name": 85,
    "duration": 0.2,
    "start": 0.0
  },
  {
    "name": 89,
    "duration": 0.1,
    "start": 0.3
  },
  {
    "name": 93,
    "duration": 0.2,
    "start": 0.6
  },
  {
    "name": 92,
    "duration": 0.1,
    "start": 1.0
  },
  {
    "name": 88,
    "duration": 0.2,
    "start": 1.2
  },
  {
    "name": 84,
    "duration": 0.1,
    "start": 1.5
  },
  {
    "name": 81,
    "duration": 0.2,
    "start": 1.8
  },
  {
    "name": 80,
    "duration": 0.1,
    "start": 2.2
  },
  {
    "name": 83,
    "duration": 0.2,
    "start": 2.5
  },
  {
    "name": 86,
    "duration": 0.1,
    "start": 3.0
  },
  {
    "name": 87,
    "duration": 0.2,
    "start": 3.2
  },
  {
    "name": 90,
    "duration": 0.1,
    "start": 3.6
  },
  {
    "name": 91,
    "duration": 0.2,
    "start": 4.0
  },
  {
    "name": 82,
    "duration": 0.1,
    "start": 4.5
  }
]
  '''

  # ai_artist_instrument = input("Which instrument is this AI Artist an Expert at (piano, guitar, violin, trumpet, drums, ...)? ")
  instruments = get_4_instruments(users_instrument)
  list_of_wav_file_paths = []
  overall_mix_save_path = "./band/overall_ai_band.wav"

  for ai_artist_instrument in instruments:
    prompt_for_ai_artist = input(f"Instruct how this {ai_artist_instrument} AI Artist should play: ")
    list_of_wav_file_paths.append(ai_artist(prompt_for_ai_artist, ai_artist_instrument, users_midi, users_instrument))

  combine_wav_files(list_of_wav_file_paths, overall_mix_save_path)