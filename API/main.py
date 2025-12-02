from pydub import AudioSegment
import asyncio
import websockets
import requests
import json
import wave
import base64
import os
import sys
import ssl
import certifi

# Configure stdout to use UTF-8 to avoid UnicodeEncodeError on Windows consoles
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    # If reconfigure is not available, ignore and rely on PYTHONIOENCODING
    pass

# Disable SSL certificate verification
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# === STEP 1: Convert audio to Gladia-compatible format ===
CONVERTED_AUDIO = "input.wav"

def preprocess_audio(input_file):
    audio = AudioSegment.from_file(input_file)
    audio = audio.set_channels(1)
    audio = audio.set_frame_rate(16000)
    audio = audio.set_sample_width(2)
    audio.export(CONVERTED_AUDIO, format="wav")

# === STEP 2: Initiate Gladia session with Translation Enabled ===
# Reads API key from environment if available, otherwise falls back to the default
GLADIA_API_KEY = os.getenv("GLADIA_API_KEY", "c3d87f5d-c8d4-4c13-b349-cb5237d64e4d") 

def initiate_session(target_language='en'):
    url = "https://api.gladia.io/v2/live"
    headers = {"Content-Type": "application/json", "X-Gladia-Key": GLADIA_API_KEY}
    body = {
        "encoding": "wav/pcm", "sample_rate": 16000, "bit_depth": 16, "channels": 1,
        "language_config": {"languages": ["ta"], "code_switching": False},
        "realtime_processing": {
            "translation": True,
            "translation_config": {
                "target_languages": [target_language]
            }
        }
    }
    response = requests.post(url, headers=headers, json=body, verify=False)
    response.raise_for_status()
    data = response.json()
    return data["id"], data["url"]

# === STEP 3: Read audio in chunks ===
def get_audio_chunks(file_path, chunk_size=1024):
    with wave.open(file_path, 'rb') as wf:
        while True:
            data = wf.readframes(chunk_size)
            if not data: break
            yield data

# === STEP 4: Stream audio and get the final translation ===
async def stream_audio(session_id, session_url, file_path):
    # Disable SSL verification for WebSocket connection
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    
    async with websockets.connect(session_url, ssl=ssl_context) as ws:
        for chunk in get_audio_chunks(file_path):
            message = {"type": "audio_chunk", "data": {"chunk": base64.b64encode(chunk).decode("utf-8")}}
            await ws.send(json.dumps(message))
            await asyncio.sleep(0.03)

        await ws.send(json.dumps({"type": "stop_recording"}))

        try:
            while True:
                response = await ws.recv()
                message = json.loads(response)
                if message["type"] == "post_processing_result":
                    break
        except websockets.ConnectionClosedOK:
            pass

    result_url = f"https://api.gladia.io/v2/live/{session_id}"
    final_response = requests.get(result_url, headers={"X-Gladia-Key": GLADIA_API_KEY}, verify=False)
    final_response.raise_for_status()
    result_data = final_response.json()

    # --- THIS IS THE FINAL, CORRECTED PARSING LOGIC ---
    try:
        # Navigate the correct path: result -> translation -> results[0] -> full_transcript
        full_translation = result_data['result']['translation']['results'][0]['full_transcript']
    except (KeyError, IndexError):
        # This will be the fallback if the path doesn't exist for any reason
        full_translation = "Translation not available."

    print(full_translation)

# === MAIN ENTRY ===
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python main.py <input_audio_file> [target_language]")
        sys.exit(1)

    input_audio_file = sys.argv[1]
    target_language = sys.argv[2] if len(sys.argv) > 2 else 'en'

    preprocess_audio(input_audio_file)

    session_id, session_url = initiate_session(target_language)
    asyncio.run(stream_audio(session_id, session_url, CONVERTED_AUDIO))
