import mido
import fluidsynth
import numpy as np
from scipy.io.wavfile import write
from cerebras.cloud.sdk import Cerebras
import re
import json


def llm_generated_midi(starting_prompt, output_midi_file, instrument_name):
    client = Cerebras(api_key="csk-8yn4k9rwxtd5vnd659x83ycejcxx66m2j25xpyhyww9twf36")

    # determine channel based on instrument
    if "drum" in instrument_name.lower() or "percussion" in instrument_name.lower():
        channel = 9
    else:
        channel = 0

    # prompt
    generatePrompt = f"""{starting_prompt}

    You should generate a midi formatted json output of the following format, make sure that it has a reasonable TIME LENGTH (around 5 seconds):

    Your response must strictly be in the following format (each object representing a musical note):
    [
    {{
        "name": [an integer, 0 - 127, be sure not exceed this range, and focus most of your answers outside the extremes],
        "duration": [a floating point value],
        "start": [a floating point value]
    }},
    {{
        //same as above...
    }}
    ]

    Your output must contain this array with the json formatted output and the json alone, under no circumstances should extra characters or confirmations be added. Also make sure that the json outputted will be complete, and no curly braces, strings, or brackets remain hanging. Ensure that is a valid array with the json items inside and that is the ONLY thing outputted"""

    response = client.chat.completions.create(
        messages=[{"role": "user", "content": generatePrompt}],
        model="llama-4-scout-17b-16e-instruct",
    )

    # extracting the content from the llm's response
    text = response.choices[0].message.content
    print("LLM Response:")
    print(text)

    try:
        json_match = re.search(r'\[.*\]', text, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
            notes = json.loads(json_str)
            print(f"Successfully parsed {len(notes)} notes")
        else:
            raise ValueError("No JSON array found in response")
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Failed to parse JSON: {e}")
        print("Using fallback data")
        notes = [
            {"name": 60, "duration": 1.0, "start": 0.0},
            {"name": 64, "duration": 1.0, "start": 1.0},
            {"name": 67, "duration": 1.0, "start": 2.0},
            {"name": 60, "duration": 3.0, "start": 5.0},
            {"name": 64, "duration": 1.0, "start": 10.0},
            {"name": 67, "duration": 1.0, "start": 12.0},
            {"name": 60, "duration": 1.0, "start": 13.0},
            {"name": 64, "duration": 2.0, "start": 16.0},
            {"name": 67, "duration": 1.0, "start": 19.0}
        ]

    # create MIDI
    tempo = 120

    mid = mido.MidiFile()
    track = mido.MidiTrack()
    mid.tracks.append(track)
    track.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(tempo)))

    # Sort notes by start time to ensure proper timing
    notes.sort(key=lambda x: float(x["start"]))
    
    current_time = 0
    ticks_per_quarter = 480
    
    for note_data in notes:
        note_name = int(note_data["name"])
        # Clamp note to valid MIDI range
        note_name = max(0, min(127, note_name))
        
        duration = float(note_data["duration"])
        start_time = float(note_data["start"])
        
        start_ticks = int(start_time * ticks_per_quarter)
        duration_ticks = int(duration * ticks_per_quarter)
        
        # Calculate delta time from current position
        delta_time = max(0, start_ticks - current_time)
        
        # Add note on message
        track.append(mido.Message('note_on', channel=channel, note=note_name, velocity=80, time=delta_time))
        current_time = start_ticks
        
        # Add note off message
        track.append(mido.Message('note_off', channel=channel, note=note_name, velocity=0, time=duration_ticks))
        current_time += duration_ticks

    mid.save(output_midi_file)


# for user to test it
if __name__ == "__main__":
    user_input = input("What music do you want? ")
    user_instrument = input("What is the instrument playing it (guitar, trumpet, ...)? ")
    llm_generated_midi(user_input, user_instrument, "./songs/llm_song.mid")

