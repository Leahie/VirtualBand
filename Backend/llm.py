import os
from cerebras.cloud.sdk import Cerebras

client = Cerebras(api_key="csk-8yn4k9rwxtd5vnd659x83ycejcxx66m2j25xpyhyww9twf36")

prompt = "What is the best way to learn python?"

chat_completion = client.chat.completions.create(
  messages=[{"role": "user", "content": prompt}],
  model="llama-4-scout-17b-16e-instruct",
)

print(chat_completion.choices[0].message.content)