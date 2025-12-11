import requests
import sounddevice as sd
import numpy as np
import queue
import threading

url = "http://100.120.209.106:5000/audio"
fs = 48000
channels = 1
output_device_index = 3
chunk_size = 16384  # larger buffer
volume_gain = 4.0
audio_q = queue.Queue(maxsize=20)  # buffer queue

# ---------------- Thread to fetch audio ----------------
def fetch_audio():
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        for chunk in r.iter_content(chunk_size=chunk_size):
            if not chunk:
                continue
            data = np.frombuffer(chunk, dtype=np.int16).astype(np.float32)/32768.0
            data *= volume_gain
            audio_q.put(data)

# ---------------- OutputStream callback ----------------
def callback(outdata, frames, time, status):
    try:
        data = audio_q.get_nowait()
        if len(data) < frames:
            outdata[:len(data), 0] = data
            outdata[len(data):, 0] = 0
        else:
            outdata[:, 0] = data[:frames]
    except queue.Empty:
        outdata.fill(0)  # silence if no data

# ---------------- Start playback ----------------
threading.Thread(target=fetch_audio, daemon=True).start()

with sd.OutputStream(
    samplerate=fs,
    channels=channels,
    device=output_device_index,
    dtype='float32',
    callback=callback,
    blocksize=1024
):
    print("Playing audio...")
    threading.Event().wait()  # keep main thread alive
