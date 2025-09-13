import mido
import fluidsynth
import numpy as np
from scipy.io.wavfile import write

# Input files
midi_file = "simple.mid"            # your MIDI file
soundfont = "FluidR3_GM.sf2"       # General MIDI soundfont
output_wav = "output.wav"          # result

# Instrument options (General MIDI program numbers)
instruments = {
    "piano": 0,      # Acoustic Grand Piano
    "guitar": 24,    # Nylon Guitar
    "violin": 40,    # Violin
    "trumpet": 56,   # Trumpet
    "drums": 0       # handled separately (channel 9)
}

# Ask user
print("Choose an instrument: piano, guitar, violin, trumpet, drums")
choice = input("Instrument: ").strip().lower()

if choice not in instruments:
    raise ValueError(f"Invalid choice: {choice}")

# Initialize FluidSynth
fs = fluidsynth.Synth(samplerate=44100)
fs.start()

# Load soundfont
sfid = fs.sfload(soundfont)

# If drums, use channel 9 (10th channel)
if choice == "drums":
    channel = 9
    fs.program_select(channel, sfid, 128, 0)  # Bank 128 = Percussion
else:
    channel = 0
    program = instruments[choice]
    fs.program_select(channel, sfid, 0, program)

# Load MIDI
mid = mido.MidiFile(midi_file)

# Collect audio samples
audio_data = []
sample_rate = 44100
buffer_size = 1024

# Use mido's built-in timing system - this is the key fix!
for msg in mid.play():
    if not msg.is_meta:
        if msg.type == "note_on":
            fs.noteon(channel, msg.note, msg.velocity)
        elif msg.type == "note_off":
            fs.noteoff(channel, msg.note)

    # Render audio in chunks - this maintains proper timing
    samples = fs.get_samples(buffer_size)
    audio_data.extend(samples)

# Add some silence at the end to let notes decay
decay_samples = int(2 * sample_rate)  # 2 seconds of decay
for _ in range(0, decay_samples, buffer_size):
    samples = fs.get_samples(buffer_size)
    audio_data.extend(samples)

fs.delete()

# Convert to numpy array with proper scaling to avoid clipping
audio_np = np.array(audio_data, dtype=np.float32)
# Normalize to prevent clipping
max_val = np.max(np.abs(audio_np))
if max_val > 0:
    audio_np = audio_np / max_val * 0.8  # Scale to 80% to avoid clipping

# Convert to 16-bit integer
audio_int16 = np.int16(audio_np * 32767)
write(output_wav, sample_rate, audio_int16)

print(f"✅ Done! Saved {choice} version to {output_wav}")
print(f"Audio length: {len(audio_int16) / sample_rate:.2f} seconds")