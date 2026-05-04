import urllib.request
import json

try:
    req = urllib.request.Request("http://127.0.0.1:5000/api/sample-data")
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print(f"API Returned: {data}")
except Exception as e:
    print(f"Error calling API: {e}")
