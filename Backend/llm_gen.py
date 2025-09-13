import mido
import fluidsynth
import numpy as np
from scipy.io.wavfile import write
from cerebras.cloud.sdk import Cerebras
import re

# Get user input
user_input = input("What music do you want? ")

# Get MIDI from LLM
client = Cerebras(api_key="csk-8yn4k9rwxtd5vnd659x83ycejcxx66m2j25xpyhyww9twf36")
response = client.chat.completions.create(
    messages=[{"role": "user", "content": f"Create a MIDI song for: {user_input}. Return ONLY: tempo,channel,note,velocity,time,channel,note,velocity,time... (example: 120,0,60,80,0,0,64,70,480,0,67,75,960')"}],
    model="llama-4-scout-17b-16e-instruct",
)

# Extract numbers from response
text = response.choices[0].message.content
print(text)
numbers = re.findall(r'\d+', text)

# Use extracted numbers or fallback
if len(numbers) >= 4:
    tempo = int(numbers[0])
    midi_data = numbers[1:]
else:
    # Fallback
    print("fail")
    tempo = 120
    midi_data = [0, 60, 80, 0, 0, 64, 70, 480, 0, 67, 75, 960]  # channel, note, velocity, time

# Create MIDI
mid = mido.MidiFile()
track = mido.MidiTrack()
mid.tracks.append(track)
track.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(tempo)))

# Add MIDI events
for i in range(0, len(midi_data), 4):
    if i + 3 < len(midi_data):
        channel = int(midi_data[i])
        note = int(midi_data[i+1])
        velocity = int(midi_data[i+2])
        time = int(midi_data[i+3])
        
        track.append(mido.Message('note_on', channel=channel, note=note, velocity=velocity, time=time))
        track.append(mido.Message('note_off', channel=channel, note=note, velocity=0, time=time))

mid.save("song.mid")

# Convert to WAV
fs = fluidsynth.Synth(samplerate=44100)
fs.start()
sfid = fs.sfload("FluidR3_GM.sf2")

# Set instruments for different channels
fs.program_select(0, sfid, 0, 0)  # Piano
fs.program_select(1, sfid, 0, 24)  # Guitar
fs.program_select(9, sfid, 128, 0)  # Drums

audio_data = []
for msg in mido.MidiFile("song.mid").play():
    if not msg.is_meta:
        if msg.type == "note_on":
            fs.noteon(msg.channel, msg.note, msg.velocity)
        elif msg.type == "note_off":
            fs.noteoff(msg.channel, msg.note)
    samples = fs.get_samples(1024)
    audio_data.extend(samples)

fs.delete()

audio_np = np.int16(np.array(audio_data) * 32767)
write("song.wav", 44100, audio_np)

print("Done! song.mid and song.wav created")