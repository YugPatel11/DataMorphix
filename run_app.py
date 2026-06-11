import os
import sys
import webbrowser
from pathlib import Path

# Add root directory to path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'datamorphix.settings')

import django
django.setup()

from django.core.management import execute_from_command_line
from waitress import serve
from datamorphix.wsgi import application

def main():
    print("Initializing DataMorphix database migrations...")
    try:
        # Run migrations on start automatically
        execute_from_command_line(["manage.py", "migrate", "--noinput"])
    except Exception as e:
        print(f"Migration error: {e}")

    # Launch browser automatically
    url = "http://localhost:8000"
    print(f"Launching browser to {url}...")
    webbrowser.open(url)

    # Start WSGI waitress server
    print("Starting waitress server on http://localhost:8000...")
    serve(application, host="127.0.0.1", port=8000)

if __name__ == '__main__':
    main()
