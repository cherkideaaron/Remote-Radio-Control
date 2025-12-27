# server.py - Combined Icom CI-V + Green Heron Rotator Control (with USB-D1 toggle!)
from flask import Flask, request, jsonify, Response
import os
import serial
import time
import atexit
import threading
from datetime import datetime

import numpy as np
import soundcard as sc
try:
    import sounddevice as sd
    SOUNDDEVICE_AVAILABLE = True
except ImportError:
    SOUNDDEVICE_AVAILABLE = False
    print("⚠️ sounddevice not available, falling back to soundcard")
from pydub import AudioSegment
from scipy.io import wavfile
from scipy.signal import resample

app = Flask(__name__)

# Enable CORS manually (works without flask-cors package)
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,ngrok-skip-browser-warning')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    # Handle ngrok warning bypass
    if request.headers.get('ngrok-skip-browser-warning'):
        response.headers.add('ngrok-skip-browser-warning', 'true')
    return response

# Handle OPTIONS requests for CORS preflight
@app.route("/<path:path>", methods=["OPTIONS"])
@app.route("/", methods=["OPTIONS"])
def options_handler(path=""):
    return "", 200

# ---------------------- CONFIGURATION ----------------------
RADIO_PORT = "COM4"
RADIO_BAUD = 9600
CI_V_TO = 0x98      # IC-7300 default
CI_V_FROM = 0xE0

ROTATOR_PORT = "COM5"
ROTATOR_BAUD = 4800

# Audio capture/output
SAMPLE_RATE = 44100
BLOCK_SIZE = 1024
CHANNELS = 2

# Radio transmission settings
RADIO_SAMPLE_RATE = 48000  # Target sample rate for radio (FS in the example)
RADIO_DEVICE_INDEX = 26    # Radio USB output device index (update this to match your setup)
RADIO_VOLUME_SCALE = 0.8   # Volume scaling for transmission (increased from 0.3)

# Storage locations (project root level)
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
RECORDINGS_DIR = os.path.join(PROJECT_ROOT, "recordings")
UPLOADS_DIR = os.path.join(PROJECT_ROOT, "uploads")

os.makedirs(RECORDINGS_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Simple login credentials (override via environment variables if desired)
ADMIN_EMAIL = os.getenv("ET3AA_EMAIL", "et3aastation@gmail.com")
ADMIN_PASSWORD = os.getenv("ET3AA_PASSWORD", "et3aa123")

# ---------------------- SERIAL CONNECTIONS ----------------------
radio_ser = None
rotator_ser = None
serial_lock = threading.Lock()

def init_serial_ports():
    global radio_ser, rotator_ser
    try:
        radio_ser = serial.Serial(RADIO_PORT, RADIO_BAUD, timeout=1)
        print(f"Radio connected → {RADIO_PORT} @ {RADIO_BAUD} baud")
    except serial.SerialException as e:
        print(f"ERROR: Could not open radio port:", e)
        radio_ser = None

    try:
        rotator_ser = serial.Serial(ROTATOR_PORT, ROTATOR_BAUD, timeout=1)
        print(f"Rotator connected → {ROTATOR_PORT} @ {ROTATOR_BAUD} baud")
    except serial.SerialException as e:
        print("ERROR: Could not open rotator port:", e)
        rotator_ser = None
try:
    init_serial_ports()
except Exception as e:
    print("Serial init failed:", e)

@atexit.register
def cleanup():
    for s, name in [(radio_ser, "Radio"), (rotator_ser, "Rotator")]:
        if s and s.is_open:
            s.close()
            print(f"{name} port closed.")


# ---------------------- AUDIO STREAMING ----------------------
def gen_audio():
    """
    Generator that finds the system loopback/monitor and streams raw PCM bytes.
    """
    default_speaker = sc.default_speaker()
    print(f"🔊 Default Speaker identified as: {default_speaker.name}")

    loopback_mic = None
    try:
        all_mics = sc.all_microphones(include_loopback=True)
        for mic in all_mics:
            if mic.name == default_speaker.name:
                loopback_mic = mic
                break
            if "loopback" in mic.name.lower() or "monitor" in mic.name.lower():
                loopback_mic = mic
                break

        if loopback_mic is None and len(all_mics) > 0:
            print("⚠️ Could not match speaker name exactly. Using the first available device.")
            loopback_mic = all_mics[0]
        if loopback_mic is None:
            print("❌ No loopback device found. Is your audio driver compatible?")
            return

        print(f"🎤 Recording from Loopback Device: {loopback_mic.name}")
        with loopback_mic.recorder(samplerate=SAMPLE_RATE, channels=CHANNELS, blocksize=BLOCK_SIZE) as mic:
            while True:
                data = mic.record(numframes=BLOCK_SIZE)
                audio_bytes = (data * 32767).astype(np.int16).tobytes()
                yield audio_bytes
    except Exception as e:
        print(f"❌ Error in audio capture: {e}")


@app.route("/stream.wav")
def stream_audio():
    def generate():
        # WAV header for 44.1kHz, 16-bit stereo PCM
        yield (
            b"RIFF"
            + b"\xff\xff\xff\xff"
            + b"WAVEfmt "
            + b"\x10\x00\x00\x00"
            + b"\x01\x00"
            + b"\x02\x00"
            + b"\x44\xac\x00\x00"
            + b"\x10\xb1\x02\x00"
            + b"\x04\x00"
            + b"\x10\x00"
            + b"data"
            + b"\xff\xff\xff\xff"
        )
        yield from gen_audio()

    return Response(generate(), mimetype="audio/wav")


playback_lock = threading.Lock()


def list_audio_devices():
    """Helper function to list all available audio devices. Call this to find your radio device index."""
    if SOUNDDEVICE_AVAILABLE:
        print("\n📋 Available Audio Devices:")
        print("=" * 60)
        devices = sd.query_devices()
        for i, device in enumerate(devices):
            if device['max_output_channels'] > 0:
                print(f"  [{i}] {device['name']}")
                print(f"      Channels: {device['max_output_channels']}, Sample Rate: {device['default_samplerate']} Hz")
        print("=" * 60)
        print(f"\n💡 Update RADIO_DEVICE_INDEX in kevin.py with the index of your radio device\n")
    else:
        print("⚠️ sounddevice not available, cannot list devices")


def _play_wav_to_output(wav_path: str):
    """Play the given WAV file to the radio device for transmission."""
    try:
        print(f"📢 Loading audio file: {wav_path}")
        
        # Load WAV file using scipy (like the working example)
        fs_wav, samples = wavfile.read(wav_path)
        print(f"   Original: {fs_wav} Hz, shape: {samples.shape}, dtype: {samples.dtype}")
        
        # Convert to float32 and normalize
        if samples.dtype == np.int16:
            samples = samples.astype(np.float32) / 32768.0
        elif samples.dtype == np.int32:
            samples = samples.astype(np.float32) / 2147483648.0
        else:
            samples = samples.astype(np.float32)
        
        # Take first channel if stereo (convert to mono)
        if samples.ndim > 1:
            samples = samples[:, 0]
            print(f"   Converted stereo to mono")
        
        # Resample to RADIO_SAMPLE_RATE if needed
        if fs_wav != RADIO_SAMPLE_RATE:
            num_samples = int(len(samples) * RADIO_SAMPLE_RATE / fs_wav)
            samples = resample(samples, num_samples)
            print(f"   Resampled from {fs_wav} Hz to {RADIO_SAMPLE_RATE} Hz")
        
        # Normalize and boost volume: find peak and scale up if needed
        peak = np.max(np.abs(samples))
        if peak > 0:
            # Normalize to use more of the available range, then apply volume scale
            # This boosts quiet files while preventing clipping
            normalization_factor = 0.95 / peak  # Leave 5% headroom
            samples = samples * normalization_factor * RADIO_VOLUME_SCALE
            print(f"   Normalized peak: {peak:.4f}, applied volume scale: {RADIO_VOLUME_SCALE}")
        else:
            print(f"   Warning: Audio is silent (peak = 0)")
        
        # Use sounddevice to play to specific radio device
        if SOUNDDEVICE_AVAILABLE:
            # Get device info to determine output channels
            try:
                info = sd.query_devices(RADIO_DEVICE_INDEX)
                out_channels = info['max_output_channels']
                print(f"   Radio device: {info['name']}, Output channels: {out_channels}")
                
                # Ensure samples match output channels
                if samples.ndim == 1 and out_channels > 1:
                    # Mono to multi-channel: duplicate the channel
                    samples = np.column_stack([samples] * out_channels)
                elif samples.ndim > 1 and samples.shape[1] != out_channels:
                    if out_channels == 1:
                        samples = samples[:, 0]
                    else:
                        # Use first channel and duplicate
                        samples = np.column_stack([samples[:, 0]] * out_channels)
                
                print(f"   Final audio shape: {samples.shape}, playing to radio device {RADIO_DEVICE_INDEX}...")
                
                # Play to radio device (this blocks until playback completes)
                sd.play(samples, samplerate=RADIO_SAMPLE_RATE, device=RADIO_DEVICE_INDEX)
                sd.wait()  # Wait until finished
                print(f"✅ Playback completed successfully")
            except Exception as sd_err:
                print(f"⚠️ Error with sounddevice, falling back to soundcard: {sd_err}")
                # Fallback to soundcard
                if samples.ndim == 1:
                    samples = samples.reshape((-1, 1))
                speaker = sc.default_speaker()
                print(f"   Using default speaker: {speaker.name}")
                speaker.play(samples, samplerate=RADIO_SAMPLE_RATE)
        else:
            # Fallback to soundcard if sounddevice not available
            if samples.ndim == 1:
                samples = samples.reshape((-1, 1))
            speaker = sc.default_speaker()
            print(f"   Using default speaker: {speaker.name}")
            speaker.play(samples, samplerate=RADIO_SAMPLE_RATE)
            print(f"✅ Playback completed successfully")
            
    except Exception as e:
        print(f"❌ Error during playback: {e}")
        import traceback
        traceback.print_exc()
        raise


def _play_and_cleanup(msg_path: str):
    """Background thread function to play audio with PTT control and clean up."""
    try:
        with playback_lock:
            if not os.path.exists(msg_path):
                print(f"⚠️ MSG.wav not found at {msg_path}, skipping playback")
                return
            
            # Get audio duration for logging
            try:
                sound = AudioSegment.from_file(msg_path)
                duration_ms = len(sound)
                duration_sec = duration_ms / 1000.0
                print(f"📻 Audio duration: {duration_sec:.2f} seconds")
            except Exception as e:
                print(f"⚠️ Could not determine audio duration: {e}")
                duration_sec = 0
            
            # Turn PTT ON before playback
            if radio_ser and radio_ser.is_open:
                try:
                    with serial_lock:
                        radio_ser.write(build_ptt_on_command())
                        time.sleep(0.1)  # Small delay to ensure command is processed
                    print("📻 PTT ON - Starting transmission...")
                except Exception as ptt_err:
                    print(f"⚠️ Warning: Could not turn PTT ON: {ptt_err}")
            else:
                print("⚠️ Warning: Radio not connected, skipping PTT control")
            
            # Play the audio (this blocks until playback completes)
            _play_wav_to_output(msg_path)
            
            # Turn PTT OFF after playback
            if radio_ser and radio_ser.is_open:
                try:
                    with serial_lock:
                        radio_ser.write(build_ptt_off_command())
                        time.sleep(0.1)  # Small delay to ensure command is processed
                    print("📻 PTT OFF - Transmission complete")
                except Exception as ptt_err:
                    print(f"⚠️ Warning: Could not turn PTT OFF: {ptt_err}")
            
            # Clean up MSG.wav after playback
            if os.path.exists(msg_path):
                os.remove(msg_path)
                print("🗑️ MSG.wav deleted after playback.")
    except Exception as e:
        print(f"❌ Error in background playback thread: {e}")
        import traceback
        traceback.print_exc()
        
        # Ensure PTT is turned OFF even if there's an error
        if radio_ser and radio_ser.is_open:
            try:
                with serial_lock:
                    radio_ser.write(build_ptt_off_command())
                    print("📻 PTT OFF (error recovery)")
            except Exception:
                pass
        
        # Best-effort cleanup
        try:
            if os.path.exists(msg_path):
                os.remove(msg_path)
        except Exception:
            pass


@app.route("/upload_recording", methods=["POST"])
def upload_recording():
    try:
        if "audio" not in request.files:
            return jsonify({"status": "error", "error": "No audio file"}), 400

        audio_file = request.files["audio"]
        if audio_file.filename == '':
            return jsonify({"status": "error", "error": "Empty file"}), 400

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        temp_path = os.path.join(UPLOADS_DIR, f"temp_{timestamp}.webm")
        msg_path = os.path.join(RECORDINGS_DIR, "MSG.wav")

        print(f"📥 Received audio upload: {audio_file.filename}, size: {request.content_length} bytes")
        audio_file.save(temp_path)
        print(f"   Saved temp file: {temp_path}")

        # Remove old MSG if present (before acquiring lock to avoid blocking)
        if os.path.exists(msg_path):
            print(f"   Removing old MSG.wav")
            try:
                os.remove(msg_path)
            except Exception as e:
                print(f"   Warning: Could not remove old MSG.wav: {e}")

        # Convert WebM to WAV
        print(f"   Converting WebM to WAV...")
        try:
            sound = AudioSegment.from_file(temp_path)
            sound.export(msg_path, format="wav")
            print(f"✔️ Saved recording to {msg_path}")
        except Exception as conv_err:
            print(f"❌ Conversion failed: {conv_err}")
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return jsonify({"status": "error", "error": f"Conversion failed: {str(conv_err)}"}), 500

        # Clean up temp file immediately
        if os.path.exists(temp_path):
            os.remove(temp_path)

        # Start playback in background thread (non-blocking)
        print(f"   Starting playback in background thread...")
        playback_thread = threading.Thread(target=_play_and_cleanup, args=(msg_path,), daemon=True)
        playback_thread.start()

        # Return immediately - playback happens in background
        return jsonify({"status": "ok", "message": "Audio received and queued for playback"})

    except Exception as e:
        error_msg = str(e)
        print(f"❌ Error in upload_recording: {error_msg}")
        import traceback
        traceback.print_exc()
        
        # Best-effort cleanup
        try:
            if 'msg_path' in locals() and os.path.exists(msg_path):
                os.remove(msg_path)
        except Exception:
            pass
        try:
            if 'temp_path' in locals() and os.path.exists(temp_path):
                os.remove(temp_path)
        except Exception:
            pass
        
        return jsonify({"status": "error", "error": error_msg}), 500

# ---------------------- CI-V HELPERS ----------------------
def extract_all_frames(buf: bytes):
    frames = []
    i = 0
    while i < len(buf) - 4:
        if buf[i:i+2] == b'\xFE\xFE':
            try:
                end = buf.index(b'\xFD', i+4)
                frames.append(buf[i:end+1])
                i = end + 1
            except ValueError:
                break
        else:
            i += 1
    return frames

# ---------------------- RADIO COMMANDS ----------------------
def freq_to_civ_bytes(freq_hz: int):
    s = str(freq_hz).zfill(10)
    pairs = [s[i:i+2] for i in range(0, 10, 2)]
    le_pairs = pairs[::-1]
    return [(int(p[0]) << 4) | int(p[1]) for p in le_pairs]

def build_set_freq_command(freq_hz: int):
    return bytes([0xFE, 0xFE, CI_V_TO, CI_V_FROM, 0x05] + freq_to_civ_bytes(freq_hz) + [0xFD])

def build_read_freq_command():
    return bytes([0xFE, 0xFE, CI_V_TO, CI_V_FROM, 0x03, 0xFD])

def decode_civ_freq(frame: bytes):
    if len(frame) < 11 or frame[4] != 0x03: return None
    digits = ''.join(f"{(b>>4)&0xF}{b&0xF}" for b in reversed(frame[5:10]))
    return int(digits)

# Mode names (without data variants — we build them dynamically)
MODE_NAMES = {
    0x00: "LSB", 0x01: "USB", 0x02: "AM", 0x03: "CW", 0x04: "RTTY",
    0x05: "FM", 0x06: "WFM", 0x07: "CW-R", 0x08: "RTTY-R", 0x17: "DV"
}
MODE_BYTES = {v: k for k, v in MODE_NAMES.items()}

BAND_TO_FREQ = {
    "160": 1900000, "80": 3750000, "40": 7150000, "30": 10120000,
    "20": 14230000, "17": 18130000, "15": 21300000,
    "12": 24950000, "10": 28300000, "6": 50125000
}

# Base mode commands
def build_set_mode_command(mode: int, filt: int = 1):
    return bytes([0xFE, 0xFE, CI_V_TO, CI_V_FROM, 0x06, mode, filt, 0xFD])

def build_read_mode_command():
    return bytes([0xFE, 0xFE, CI_V_TO, CI_V_FROM, 0x04, 0xFD])

# Data mode commands (0x1A 06)
def build_set_data_mode(val: int):
    return bytes([0xFE, 0xFE, CI_V_TO, CI_V_FROM, 0x1A, 0x06, val, 0xFD])

def build_read_data_mode():
    return bytes([0xFE, 0xFE, CI_V_TO, CI_V_FROM, 0x1A, 0x06, 0xFD])

def decode_data_mode(frame: bytes):
    if len(frame) >= 8 and frame[4] == 0x1A and frame[5] == 0x06:
        return frame[6]  # 0x00 = off, 0x01–0x03 = D1–D3
    return None


def read_mode_and_data_state():
    """
    Reads the current mode, filter, and data mode in one shot.
    Returns a dict or None on failure.
    """
    if not radio_ser:
        return None
    radio_ser.reset_input_buffer()
    radio_ser.write(build_read_mode_command())
    time.sleep(0.1)
    radio_ser.write(build_read_data_mode())
    time.sleep(0.25)
    resp = radio_ser.read(120)
    frames = extract_all_frames(resp)

    mode_frame = next((f for f in frames if len(f) >= 8 and f[4] == 0x04), None)
    data_frame = next((f for f in frames if len(f) >= 8 and f[4] == 0x1A and f[5] == 0x06), None)

    if not mode_frame:
        return None

    mode_byte, filt = mode_frame[5], mode_frame[6]
    base_name = MODE_NAMES.get(mode_byte, "Unknown")
    data_val = decode_data_mode(data_frame) if data_frame else 0

    mode_name = f"{base_name}-D{data_val}" if data_val else base_name
    filt_for_display = data_val if data_val else filt

    return {
        "mode_name": mode_name,
        "mode_byte": mode_byte,
        "filter": filt_for_display,
        "data_mode": data_val,
        "base_mode": base_name,
    }

# PTT
def build_ptt_on_command():
    return bytes([0xFE, 0xFE, CI_V_TO, CI_V_FROM, 0x1C, 0x00, 0x01, 0xFD])
def build_ptt_off_command():
    return bytes([0xFE, 0xFE, CI_V_TO, CI_V_FROM, 0x1C, 0x00, 0x00, 0xFD])

# ---------------------- ROTATOR COMMANDS (unchanged) ----------------------
CMD_CW   = b'AB1;'
CMD_CCW  = b'AA1;'
CMD_STOP = b';'

def send_rotator(cmd):
    if not rotator_ser or not rotator_ser.is_open:
        return {"status": "error", "message": "Rotator not available"}
    with serial_lock:
        try:
            rotator_ser.write(cmd)
            time.sleep(0.05)
            return {"status": "ok"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

# ---------------------- ENDPOINTS ----------------------
@app.route('/')
def index():
    return "<h1>Ham Shack Server Running – Radio + Rotator</h1>"

# === AUTH ===
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip()
    password = str(data.get("password", "")).strip()

    if not email or not password:
        return jsonify({"status": "error", "error": "Email and password required"}), 400

    if email.lower() == ADMIN_EMAIL.lower() and password == ADMIN_PASSWORD:
        return jsonify({"status": "OK"})

    return jsonify({"status": "error", "error": "Invalid credentials"}), 401

# === RADIO ===
@app.route("/frequency", methods=["GET"])
def get_frequency():
    if not radio_ser: return jsonify({"error": "Radio not open"}), 500
    radio_ser.reset_input_buffer()
    for _ in range(3):
        radio_ser.write(build_read_freq_command())
        time.sleep(0.25)
        resp = radio_ser.read(100)
        frames = [f for f in extract_all_frames(resp) if len(f) >= 11 and f[4] == 0x03]
        if frames:
            return jsonify({"frequency_hz": decode_civ_freq(frames[-1])})
    return jsonify({"error": "No freq response"}), 500

@app.route("/frequency", methods=["POST"])
def set_frequency():
    freq = int(request.get_json(silent=True).get("frequency_hz", 0))
    radio_ser.write(build_set_freq_command(freq))
    time.sleep(0.2)
    return jsonify({"status": "OK", "set_frequency_hz": freq})

@app.route("/mode", methods=["GET"])
def get_mode():
    if not radio_ser: return jsonify({"error": "Radio not open"}), 500
    state = read_mode_and_data_state()
    if not state:
        return jsonify({"error": "No mode response"}), 500
    return jsonify(state)

@app.route("/mode", methods=["POST"])
def set_mode():
    if not radio_ser: return jsonify({"error": "Radio not open"}), 500
    data = request.get_json(silent=True) or {}
    mode_input = data.get("mode")


    # Snapshot current combined state (used for both branches)
    state_snapshot = read_mode_and_data_state()
    current_data_mode = state_snapshot["data_mode"] if state_snapshot else 0
    current_filter = state_snapshot["filter"] if state_snapshot else 1
    current_mode_byte = state_snapshot["mode_byte"] if state_snapshot else None
    current_base_name = state_snapshot["base_mode"] if state_snapshot else None

    # Special "data" keyword → toggle data mode
    if isinstance(mode_input, str) and mode_input.strip().lower() == "data":
        # Read current combined state so the data button can augment the active mode.
        state = read_mode_and_data_state()
        if not state:
            return jsonify({"error": "Unable to read current mode"}), 500

        # Toggle data: off -> D1, on -> off
        new_data_mode = 0x00 if state["data_mode"] else 0x01

        # When enabling data, force filter to D1 (value 1); otherwise keep current filter.
        new_filter = new_data_mode if new_data_mode else state["filter"] or 1

        # Re-apply the base mode with the chosen filter, then set data flag.
        radio_ser.write(build_set_mode_command(state["mode_byte"], new_filter))
        time.sleep(0.1)
        radio_ser.write(build_set_data_mode(new_data_mode))
        time.sleep(0.2)

        combined_name = f"{state['base_mode']}-D{new_data_mode}" if new_data_mode else state["base_mode"]
        return jsonify({
            "status": "OK",
            "action": "data_mode_toggled",
            "mode_name": combined_name,
            "base_mode": state["base_mode"],
            "mode_byte": state["mode_byte"],
            "filter": new_filter,
            "data_mode": new_data_mode,
            "note": "Data button now ties to the active mode (e.g., USB-D1)"
        })

    # Normal mode change (accept string or int)
    if isinstance(mode_input, str):
        mode_byte = MODE_BYTES.get(mode_input.upper(), 0x01)
    else:
        mode_byte = int(mode_input or 1)

    # If data mode is currently active and caller did not specify a filter,
    # stick with the data filter (D1/2/3) so the combined mode persists visually.
    requested_filter = data.get("filter", None)
    if requested_filter is None and current_data_mode:
        filt = current_data_mode
    else:
        filt = int(requested_filter or 1)

    radio_ser.write(build_set_mode_command(mode_byte, filt))
    time.sleep(0.2)

    # If data was active, re-assert it so changing base mode keeps D1 on.
    if current_data_mode:
        radio_ser.write(build_set_data_mode(current_data_mode))
        time.sleep(0.1)
        combined_name = f"{MODE_NAMES.get(mode_byte, 'Unknown')}-D{current_data_mode}"
        return jsonify({
            "status": "OK",
            "mode_name": combined_name,
            "mode_byte": mode_byte,
            "filter": filt,
            "data_mode": current_data_mode,
            "base_mode": MODE_NAMES.get(mode_byte, "Unknown"),
            "note": "Mode changed while data on; kept data mode active"
        })

    return jsonify({
        "status": "OK",
        "mode_name": MODE_NAMES.get(mode_byte, "Unknown"),
        "mode_byte": mode_byte,
        "filter": filt
    })

@app.route("/ptt", methods=["GET"])
def get_ptt_status():
    radio_ser.write(bytes([0xFE, 0xFE, CI_V_TO, CI_V_FROM, 0x1C, 0x00, 0xFD]))
    time.sleep(0.2)
    resp = radio_ser.read(40)
    frame = next((f for f in extract_all_frames(resp) if f[4] == 0x1C), None)
    state = "TRANSMIT" if frame and len(frame) > 6 and frame[6] == 0x01 else "RECEIVE"
    return jsonify({"ptt_status": state})

@app.route("/ptt/on", methods=["POST"])
def ptt_on():
    secs = int(request.args.get("seconds", 5))
    radio_ser.write(build_ptt_on_command())
    time.sleep(secs)
    radio_ser.write(build_ptt_off_command())
    return jsonify({"status": "OK", "duration_sec": secs})

@app.route("/ptt/off", methods=["POST"])
def ptt_off():
    radio_ser.write(build_ptt_off_command())
    time.sleep(0.1)
    return jsonify({"status": "PTT OFF"})


@app.route("/band", methods=["POST"])
def set_band():
    band = str(request.get_json(silent=True).get("band", "")).strip()
    if band not in BAND_TO_FREQ:
        return jsonify({"error": f"Invalid band: {band}"}), 400
    freq = BAND_TO_FREQ[band]
    radio_ser.write(build_set_freq_command(freq))
    time.sleep(0.2)
    return jsonify({"status": "OK", "band": band, "frequency_hz": freq})

# === ROTATOR (completely unchanged) ===
@app.route('/rotate_cw', methods=['GET','POST'])
def rotate_cw():   return jsonify(send_rotator(CMD_CW))

@app.route('/rotate_ccw', methods=['GET','POST'])
def rotate_ccw():  return jsonify(send_rotator(CMD_CCW))

@app.route('/stop', methods=['GET','POST'])
def stop_rot():    return jsonify(send_rotator(CMD_STOP))

@app.route('/rotator/status', methods=['GET'])
def rotator_status():
    if not rotator_ser: return jsonify({"error": "Rotator not open"}), 500
    with serial_lock:
        rotator_ser.reset_input_buffer()
        rotator_ser.write(b'C2\r')
        time.sleep(0.1)
        resp = rotator_ser.read(100).decode('ascii', errors='ignore').strip()
        return jsonify({"position": resp or "no response"})

# ---------------------- DEBUG/HELPER ROUTES ----------------------
@app.route("/list_audio_devices", methods=["GET"])
def list_devices_endpoint():
    """Endpoint to list available audio devices."""
    if SOUNDDEVICE_AVAILABLE:
        devices = sd.query_devices()
        device_list = []
        for i, device in enumerate(devices):
            if device['max_output_channels'] > 0:
                device_list.append({
                    "index": i,
                    "name": device['name'],
                    "channels": device['max_output_channels'],
                    "sample_rate": device['default_samplerate']
                })
        return jsonify({"devices": device_list, "current_radio_index": RADIO_DEVICE_INDEX})
    else:
        return jsonify({"error": "sounddevice not available"}), 500

# ---------------------- START ----------------------
if __name__ == "__main__":
    print("Combined Radio + Rotator Server with USB-D1 toggle ready!")
    print(f"\n📻 Radio Transmission Settings:")
    print(f"   Radio Device Index: {RADIO_DEVICE_INDEX}")
    print(f"   Radio Sample Rate: {RADIO_SAMPLE_RATE} Hz")
    print(f"   Volume Scale: {RADIO_VOLUME_SCALE}")
    if SOUNDDEVICE_AVAILABLE:
        print(f"\n💡 To find your radio device index, visit: http://localhost:5000/list_audio_devices")
        print(f"   Or check the device list above when sounddevice is available.\n")
    else:
        print(f"\n⚠️ sounddevice not installed. Install it with: pip install sounddevice scipy")
        print(f"   Falling back to default speaker for audio playback.\n")
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)