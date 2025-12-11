# client.py - Full Remote Shack Client (Radio + Antenna Rotator)
import requests
import time

# -------------------------------------------------
# UPDATE THIS WITH YOUR NGROK URL (or local IP)
# -------------------------------------------------
BASE_URL = "https://janett-hermetic-delightsomely.ngrok-free.dev"  # Change when ngrok changes


HEADERS = {
    "ngrok-skip-browser-warning": "true"   # Only needed for ngrok
}

# -----------------------------------------------------------------
# RADIO CONTROL FUNCTIONS
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


# -----------------------------------------------------------------
# ANTENNA ROTATOR CONTROL FUNCTIONS
# -----------------------------------------------------------------
def rotate_cw():
    r = requests.get(f"{BASE_URL}/rotate_cw", headers=HEADERS, timeout=10)
    r.raise_for_status()
    return r.json()

def rotate_ccw():
    r = requests.get(f"{BASE_URL}/rotate_ccw", headers=HEADERS, timeout=10)
    r.raise_for_status()
    return r.json()

def stop_rotation():
    r = requests.get(f"{BASE_URL}/stop", headers=HEADERS, timeout=10)
    r.raise_for_status()
    return r.json()

def get_rotator_status():
    r = requests.get(f"{BASE_URL}/rotator/status", headers=HEADERS, timeout=10)
    r.raise_for_status()
    return r.json()

# -----------------------------------------------------------------
# ANTENNA MOVEMENT TEST (CW 1 sec → CCW 1 sec)
# -----------------------------------------------------------------
def test_antenna_movement():
    print("\nANTENNA MOVEMENT TEST: Rotating CW for 1 second...")
    rotate_cw()
    time.sleep(1.0)
    print("Stopping...")
    stop_rotation()
    time.sleep(0.5)

    print("Now rotating CCW for 1 second...")
    rotate_ccw()
    time.sleep(1.0)
    print("Stopping and returning to center...")
    stop_rotation()
    time.sleep(0.5)

    print("Final rotator status:")
    print(get_rotator_status())

# ------------------------------
# FULL TEST SCRIPT
# ------------------------------
if __name__ == "__main__":
    try:
         # --- Radio Tests ---
        print("1. Reading current frequency...")
        print(get_frequency())

        time.sleep(2)
        print("\n2. Setting frequency to 14.200 MHz (20m calling)...")
        print(set_frequency(14200000))

        time.sleep(2)
        print("\n3. Current mode...")
        print(get_mode())

        time.sleep(2)
        print("\n4. Setting USB mode...")
        print(set_mode(17))

        time.sleep(2)
        print("\n5. PTT Status...")
        print(get_ptt())
        

        time.sleep(2)
        print("\n6. Transmitting 2-second carrier...")
        print(ptt_on(2))

        time.sleep(2)
        print("\n7. Going back to 10m band...")
        print(set_band("10"))

        # --- Antenna Rotator Tests ---
        time.sleep(3)
        print("\n" + "="*60)
        print("ANTENNA ROTATOR TESTS")
        print("="*60) 

        time.sleep(2)
        test_antenna_movement()

        print("\nAll tests completed successfully!")
        print("Your remote shack is fully operational!")

    except requests.exceptions.RequestException as e:
        print(f"\nCONNECTION ERROR: {e}")
        print("\nTroubleshooting:")
        print("   • Is server.py running on the shack PC?")
        print("   • Is ngrok running? → ngrok http 5000")
        print("   • Is BASE_URL correct and up to date?")
        print("   • Are both radio and rotator powered on and connected?")
    except KeyboardInterrupt:
        print("\nTest stopped by user.")