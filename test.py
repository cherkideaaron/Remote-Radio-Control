# client.py
import requests
import time

# -------------------------------------------------
# UPDATE THIS WITH YOUR NGROK URL
# -------------------------------------------------
BASE_URL = "https://janett-hermetic-delightsomely.ngrok-free.dev"

# REQUIRED: Skip ngrok browser warning
HEADERS = {
    "ngrok-skip-browser-warning": "true"
}

# -----------------------------------------------------------------
# Helper functions with error handling
# -----------------------------------------------------------------
def get_frequency():
    r = requests.get(f"{BASE_URL}/frequency", headers=HEADERS, timeout=10)
    r.raise_for_status()
    return r.json()

def set_frequency(freq_hz: int):
    payload = {"frequency_hz": freq_hz}
    r = requests.post(f"{BASE_URL}/frequency", json=payload, headers=HEADERS, timeout=10)
    r.raise_for_status()
    return r.json()

def get_mode():
    r = requests.get(f"{BASE_URL}/mode", headers=HEADERS, timeout=10)
    r.raise_for_status()
    return r.json()

def set_mode(mode: int, filter_num: int = 1):
    payload = {"mode": mode, "filter": filter_num}
    r = requests.post(f"{BASE_URL}/mode", json=payload, headers=HEADERS, timeout=10)
    r.raise_for_status()
    return r.json()

def get_ptt():
    r = requests.get(f"{BASE_URL}/ptt", headers=HEADERS, timeout=10)
    r.raise_for_status()
    return r.json()

def ptt_on(seconds: int = 5):
    r = requests.post(f"{BASE_URL}/ptt/on", params={"seconds": seconds}, headers=HEADERS, timeout=10)
    r.raise_for_status()
    return r.json()

def ptt_off():
    r = requests.post(f"{BASE_URL}/ptt/off", headers=HEADERS, timeout=10)
    r.raise_for_status()
    return r.json()

def set_band(band: str):
    payload = {"band": band}
    r = requests.post(f"{BASE_URL}/band", json=payload, headers=HEADERS, timeout=10)
    r.raise_for_status()
    return r.json()


# ------------------------------
# Test Script
# ------------------------------
if __name__ == "__main__":
    try:
        print("Fetching frequency...")
        print(get_frequency())
        time.sleep(2)

        print("\nSetting frequency to 14.200 MHz...")
        print(set_frequency(14200000))
        time.sleep(2)

        print("\nReading mode...")
        print(get_mode())
        time.sleep(2)

        print("\nSetting USB mode...")
        print(set_mode(1))
        time.sleep(2)

        print("\nPTT status...")
        print(get_ptt())
        time.sleep(2)

        print("\nPTT ON for 2 sec...")
        print(ptt_on(2))
        time.sleep(2)

        print("\nPTT OFF...")
        print(ptt_off())
        time.sleep(2)

        print("\nSwitching to 20m band...")
        print(set_band("15"))

    except requests.exceptions.RequestException as e:
        print(f"\nCONNECTION ERROR: {e}")
        print("Check:")
        print("  1. Is server.py running?")
        print("  2. Is ngrok running? (ngrok http 5000)")
        print("  3. Is BASE_URL correct?")
        print("  4. Is radio powered on and CI-V enabled?")