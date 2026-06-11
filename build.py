import subprocess
import sys
from pathlib import Path

def build():
    print("Building DataMorphix standalone executable...")
    
    # Run PyInstaller with templates bundled
    # Separator is ';' on Windows
    cmd = [
        "pyinstaller",
        "--onefile",
        "--add-data", "templates;templates",
        "run_app.py"
    ]
    
    print(f"Running: {' '.join(cmd)}")
    res = subprocess.run(cmd, shell=True)
    if res.returncode == 0:
        print("\nSUCCESS: Standalone executable created in 'dist/' directory.")
    else:
        print("\nERROR: PyInstaller build failed.")
        sys.exit(res.returncode)

if __name__ == '__main__':
    build()
