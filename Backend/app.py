from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route('testing', methods=['POST'])
def first_api():
    # Check if the Gemini model was initialized successfully
    return {"hello: hi"}