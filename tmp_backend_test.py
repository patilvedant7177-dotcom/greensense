import os
import subprocess
import time
import urllib.request
import urllib.error
import json

py = os.path.join(os.getcwd(), 'backend', '.venv', 'Scripts', 'python.exe')
cmd = [py, '-m', 'uvicorn', 'backend.main:app', '--host', '127.0.0.1', '--port', '8008', '--log-level', 'warning']
proc = subprocess.Popen(cmd, cwd=os.getcwd(), stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
try:
    time.sleep(4)
    for path in ['/health', '/api/solar?lat=19.076&lon=72.8777', '/api/weather?lat=19.076&lon=72.8777']:
        url = 'http://127.0.0.1:8008' + path
        try:
            with urllib.request.urlopen(url, timeout=10) as resp:
                print(path, resp.status, resp.read(300).decode('utf-8', errors='ignore'))
        except urllib.error.HTTPError as err:
            body = err.read().decode('utf-8', errors='ignore')
            print(path, 'HTTPError', err.code)
            print(body)
        except Exception as e:
            print(path, 'ERR', type(e).__name__, e)
finally:
    proc.terminate()
    proc.wait(timeout=5)
