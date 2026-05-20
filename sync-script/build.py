"""
Genera GastApp-Sync.exe en la carpeta dist/
Uso: python build.py
"""
import subprocess, sys

cmd = [
    sys.executable, "-m", "PyInstaller",
    "--onefile",
    "--windowed",
    "--name", "GastApp-Sync",
    "--hidden-import", "openpyxl.cell._writer",
    "--hidden-import", "cryptography.hazmat.backends.openssl",
    "--hidden-import", "cryptography.hazmat.primitives.kdf.pbkdf2",
    "--collect-all", "supabase",
    "--collect-all", "gotrue",
    "--collect-all", "postgrest",
    "--collect-all", "realtime",
    "--collect-all", "storage3",
    "--collect-all", "httpx",
    "--collect-all", "httpcore",
    "--noconfirm",
    "sync.py",
]

# Agregar ícono solo si existe
from pathlib import Path
if Path("icon.ico").exists():
    cmd += ["--icon", "icon.ico"]

print("Construyendo GastApp-Sync.exe...")
print(" ".join(cmd))
result = subprocess.run(cmd)
sys.exit(result.returncode)
