"""
GastApp Sync — Sincronización bidireccional Excel ↔ Supabase
=============================================================
Uso:
    python sync.py              # Lanza la GUI y sincroniza
    python sync.py --wizard     # Fuerza el wizard de primera configuración

Empaquetar a .exe:
    pyinstaller --onefile --windowed --name "GastApp-Sync" --icon=icon.ico sync.py
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import shutil
import sys
import tkinter as tk
from datetime import datetime
from pathlib import Path
from tkinter import filedialog, messagebox, scrolledtext, ttk
from typing import Any, TypedDict

import openpyxl
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
from supabase import create_client, Client

# ─────────────────────────────────────────────────────────────
# Tipos
# ─────────────────────────────────────────────────────────────

class ExpenseRow(TypedDict):
    categoria: str
    subcategoria: str
    fecha: str          # "YYYY-MM-DD"
    detalle: str
    importe: float
    origen: str
    hash_unico: str


class Config(TypedDict):
    supabase_url: str
    supabase_key: str
    excel_path: str
    encrypted_token: str    # token de sesión cifrado con Fernet
    salt: str               # salt hex para PBKDF2


# ─────────────────────────────────────────────────────────────
# Configuración de logging
# ─────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("gastapp-sync")

CONFIG_FILE = Path(__file__).parent / "config.json"
CATEGORIA_VALIDAS = {"Casa", "Hijo 1", "Hijo 2", "Hijo 3", "Yo", "Otros"}

# Mapeo nombre de pestaña → número de mes
MONTH_TABS: dict[str, int] = {
    "01 Enero": 1, "02 Febrero": 2, "03 Marzo": 3,
    "04 Abril": 4, "05 Mayo": 5, "06 Junio": 6,
    "07 Julio": 7, "08 Agosto": 8, "09 Septiembre": 9,
    "10 Octubre": 10, "11 Noviembre": 11, "12 Diciembre": 12,
}


# ─────────────────────────────────────────────────────────────
# Utilidades de cifrado
# ─────────────────────────────────────────────────────────────

def _derive_key(password: str, salt: bytes) -> bytes:
    """Deriva una clave Fernet de 32 bytes a partir de la contraseña usando PBKDF2."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=390_000,
    )
    return base64.urlsafe_b64encode(kdf.derive(password.encode()))


def encrypt_token(token: str, password: str) -> tuple[str, str]:
    """
    Cifra el token de sesión con Fernet (clave derivada del password).
    Retorna (token_cifrado_b64, salt_hex).
    """
    salt = os.urandom(16)
    key = _derive_key(password, salt)
    fernet = Fernet(key)
    encrypted = fernet.encrypt(token.encode())
    return base64.urlsafe_b64encode(encrypted).decode(), salt.hex()


def decrypt_token(encrypted_b64: str, salt_hex: str, password: str) -> str:
    """Descifra el token de sesión."""
    salt = bytes.fromhex(salt_hex)
    key = _derive_key(password, salt)
    fernet = Fernet(key)
    encrypted = base64.urlsafe_b64decode(encrypted_b64.encode())
    return fernet.decrypt(encrypted).decode()


# ─────────────────────────────────────────────────────────────
# Hash (mismo algoritmo que el frontend — SHA-256 sobre campos concatenados)
# ─────────────────────────────────────────────────────────────

def generate_hash(row: ExpenseRow) -> str:
    """
    Genera el mismo hash que el frontend:
    SHA-256(categoria|subcategoria|fecha|detalle|importe)
    """
    raw = "|".join([
        row["categoria"],
        row["subcategoria"],
        row["fecha"],
        row.get("detalle") or "",
        str(row["importe"]),
    ])
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


# ─────────────────────────────────────────────────────────────
# Config: lectura y wizard de primera configuración
# ─────────────────────────────────────────────────────────────

def load_config() -> Config | None:
    """Lee config.json. Retorna None si no existe."""
    if not CONFIG_FILE.exists():
        return None
    with open(CONFIG_FILE, encoding="utf-8") as f:
        return json.load(f)  # type: ignore[return-value]


def save_config(cfg: Config) -> None:
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2, ensure_ascii=False)


def run_wizard() -> Config:
    """
    Wizard de primera configuración en consola.
    Solicita URL de Supabase, anon key, email, password y ruta del Excel.
    Guarda el token cifrado en config.json (NUNCA la contraseña).
    """
    print("\n=== GastApp Sync — Primera configuración ===\n")
    supabase_url = input("URL de Supabase (ej: https://xxxx.supabase.co): ").strip()
    supabase_key = input("Anon Key de Supabase: ").strip()
    email = input("Email de tu cuenta GastApp: ").strip()
    password = input("Contraseña (no se guardará en texto plano): ")

    # Elegir Excel con diálogo de archivo
    root = tk.Tk()
    root.withdraw()
    excel_path = filedialog.askopenfilename(
        title="Seleccioná el archivo gastos.xlsx",
        filetypes=[("Excel files", "*.xlsx *.xlsm")],
    )
    root.destroy()

    if not excel_path:
        print("❌ No se seleccionó ningún archivo Excel. Saliendo.")
        sys.exit(1)

    # Autenticar y cifrar token
    print("\n🔐 Autenticando con Supabase...")
    client: Client = create_client(supabase_url, supabase_key)
    response = client.auth.sign_in_with_password({"email": email, "password": password})

    if not response.session:
        print("❌ No se pudo autenticar. Verificá tus credenciales.")
        sys.exit(1)

    access_token = response.session.access_token
    encrypted_token, salt = encrypt_token(access_token, password)

    cfg: Config = {
        "supabase_url": supabase_url,
        "supabase_key": supabase_key,
        "excel_path": excel_path,
        "encrypted_token": encrypted_token,
        "salt": salt,
    }
    save_config(cfg)
    print(f"✅ Configuración guardada en {CONFIG_FILE}")
    return cfg


# ─────────────────────────────────────────────────────────────
# Lectura del Excel
# ─────────────────────────────────────────────────────────────

def _parse_date(cell_value: Any) -> str | None:
    """
    Convierte el valor de celda de fecha en string "YYYY-MM-DD".
    Acepta objetos datetime, date, y strings en formato DD/MM/YYYY.
    """
    if cell_value is None:
        return None
    if isinstance(cell_value, datetime):
        return cell_value.strftime("%Y-%m-%d")
    if hasattr(cell_value, "strftime"):       # date
        return cell_value.strftime("%Y-%m-%d")
    if isinstance(cell_value, str):
        for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
            try:
                return datetime.strptime(cell_value.strip(), fmt).strftime("%Y-%m-%d")
            except ValueError:
                continue
    return None


def _is_total_row(cells: list[Any]) -> bool:
    """
    Heurística para detectar filas de totales/resumen:
    - La celda de CATEGORÍA está vacía, es 'TOTAL', o empieza con 'Total'.
    """
    cat = cells[0]
    if cat is None:
        return True
    cat_str = str(cat).strip()
    return cat_str == "" or cat_str.upper().startswith("TOTAL")


def read_excel(excel_path: str) -> list[ExpenseRow]:
    """
    Lee todas las pestañas mensuales del Excel en modo read-only.
    Retorna una lista de ExpenseRow con hash_unico ya calculado.

    Estructura esperada de cada pestaña:
        Columna A: CATEGORÍA
        Columna B: SUBCATEGORÍA
        Columna C: FECHA
        Columna D: DETALLE
        Columna E: IMPORTE

    Las primeras filas de encabezado se detectan automáticamente
    buscando la fila donde la celda A contiene "CATEGORÍA" (case-insensitive).
    """
    wb = openpyxl.load_workbook(excel_path, read_only=True, data_only=True)
    rows: list[ExpenseRow] = []

    for sheet_name, month_num in MONTH_TABS.items():
        if sheet_name not in wb.sheetnames:
            logger.debug("Pestaña '%s' no encontrada, omitiendo.", sheet_name)
            continue

        ws = wb[sheet_name]
        all_rows = list(ws.iter_rows(values_only=True))
        if not all_rows:
            continue

        # Detectar fila de encabezado
        header_idx = 0
        for i, row in enumerate(all_rows):
            if row[0] and str(row[0]).strip().upper() in ("CATEGORÍA", "CATEGORIA", "CATEGORY"):
                header_idx = i + 1     # datos comienzan en la fila siguiente
                break

        for raw_row in all_rows[header_idx:]:
            cells = list(raw_row)
            if len(cells) < 5:
                continue
            if _is_total_row(cells):
                continue

            categoria = str(cells[0]).strip() if cells[0] else ""
            subcategoria = str(cells[1]).strip() if cells[1] else ""
            fecha_raw = cells[2]
            detalle = str(cells[3]).strip() if cells[3] else ""
            importe_raw = cells[4]

            # Validaciones mínimas
            if categoria not in CATEGORIA_VALIDAS:
                continue
            if not subcategoria:
                continue

            fecha = _parse_date(fecha_raw)
            if not fecha:
                logger.warning("Fecha inválida en pestaña '%s': %r — fila omitida.", sheet_name, fecha_raw)
                continue

            try:
                importe = float(str(importe_raw).replace(",", ".").replace("$", "").strip())
            except (ValueError, TypeError):
                logger.warning("Importe inválido: %r — fila omitida.", importe_raw)
                continue

            expense: ExpenseRow = {
                "categoria": categoria,
                "subcategoria": subcategoria,
                "fecha": fecha,
                "detalle": detalle,
                "importe": importe,
                "origen": "excel",
                "hash_unico": "",   # se completa abajo
            }
            expense["hash_unico"] = generate_hash(expense)
            rows.append(expense)

    wb.close()
    logger.info("Excel leído: %d filas de datos encontradas.", len(rows))
    return rows


# ─────────────────────────────────────────────────────────────
# Supabase: autenticación y CRUD
# ─────────────────────────────────────────────────────────────

def get_supabase_client(cfg: Config, password: str) -> Client:
    """
    Crea el cliente Supabase y establece la sesión usando el token cifrado.
    Si el token expiró, reautentica con email/password y actualiza config.json.
    """
    client: Client = create_client(cfg["supabase_url"], cfg["supabase_key"])

    try:
        token = decrypt_token(cfg["encrypted_token"], cfg["salt"], password)
        client.auth.set_session(token, token)   # access_token, refresh_token
        logger.info("Sesión restaurada desde token cifrado.")
    except Exception as exc:
        logger.warning("Token expirado o inválido (%s). Reautenticando...", exc)
        email = input("Email (para reautenticar): ").strip()
        response = client.auth.sign_in_with_password({"email": email, "password": password})
        if not response.session:
            raise RuntimeError("No se pudo reautenticar con Supabase.") from exc
        new_token = response.session.access_token
        enc, salt = encrypt_token(new_token, password)
        cfg["encrypted_token"] = enc
        cfg["salt"] = salt
        save_config(cfg)
        logger.info("Token renovado y guardado.")

    return client


def fetch_cloud_expenses(client: Client) -> list[dict[str, Any]]:
    """Descarga todos los gastos del usuario desde Supabase (RLS filtra automáticamente)."""
    result = client.table("expenses").select("*").execute()
    data: list[dict[str, Any]] = result.data or []
    logger.info("Nube: %d gastos descargados.", len(data))
    return data


def upload_expenses(client: Client, rows: list[ExpenseRow]) -> int:
    """
    Sube filas al servidor en lotes de 100.
    Usa upsert con on_conflict=hash_unico para idempotencia.
    Retorna la cantidad de filas subidas exitosamente.
    """
    if not rows:
        return 0

    uploaded = 0
    batch_size = 100
    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        result = client.table("expenses").upsert(
            [dict(r) for r in batch],
            on_conflict="hash_unico",
        ).execute()
        uploaded += len(result.data or [])

    logger.info("Subidos a la nube: %d gastos.", uploaded)
    return uploaded


# ─────────────────────────────────────────────────────────────
# Escritura en Excel
# ─────────────────────────────────────────────────────────────

def _month_from_date(date_str: str) -> int:
    """Extrae el mes (1-12) de un string "YYYY-MM-DD"."""
    return int(date_str[5:7])


def _tab_name_for_month(month: int) -> str | None:
    """Retorna el nombre de la pestaña para el mes dado."""
    for name, m in MONTH_TABS.items():
        if m == month:
            return name
    return None


def _find_total_row(ws: openpyxl.worksheet.worksheet.Worksheet) -> int:
    """
    Busca la última fila de datos y retorna el índice (1-based) de la fila
    de totales (la primera fila en blanco en columna A después de los datos,
    o la fila con 'TOTAL' en columna A).
    Retorna ws.max_row + 1 si no se encuentra.
    """
    for row_idx in range(1, ws.max_row + 1):
        val = ws.cell(row=row_idx, column=1).value
        if val is None:
            continue
        if str(val).strip().upper().startswith("TOTAL"):
            return row_idx
    return ws.max_row + 1


def backup_excel(excel_path: str) -> str:
    """
    Crea una copia de seguridad del Excel con sufijo de timestamp.
    Retorna la ruta del backup.
    """
    src = Path(excel_path)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    dst = src.parent / f"{src.stem}_backup_{ts}{src.suffix}"
    shutil.copy2(src, dst)
    logger.info("Backup creado: %s", dst)
    return str(dst)


def write_expenses_to_excel(excel_path: str, rows: list[dict[str, Any]]) -> int:
    """
    Inserta filas de gastos en las pestañas mensuales correctas del Excel.

    Proceso:
      1. Primero hace backup del archivo original.
      2. Abre en modo escritura.
      3. Para cada gasto, detecta la pestaña por el mes de 'fecha'.
      4. Inserta ANTES de la fila de totales, copiando el estilo de la fila anterior.
      5. Guarda el archivo.

    Retorna la cantidad de filas escritas.
    """
    if not rows:
        return 0

    backup_excel(excel_path)

    wb = openpyxl.load_workbook(excel_path)
    written = 0

    # Agrupar por pestaña
    by_tab: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        month = _month_from_date(row["fecha"])
        tab = _tab_name_for_month(month)
        if not tab:
            logger.warning("No se encontró pestaña para el mes %d, fila omitida.", month)
            continue
        if tab not in wb.sheetnames:
            logger.warning("Pestaña '%s' no existe en el Excel, fila omitida.", tab)
            continue
        by_tab.setdefault(tab, []).append(row)

    for tab_name, tab_rows in by_tab.items():
        ws = wb[tab_name]
        total_row_idx = _find_total_row(ws)

        for row_data in tab_rows:
            # Insertar una fila antes de la fila de totales
            ws.insert_rows(total_row_idx)

            # Determinar estilo a copiar (fila anterior a la de totales)
            source_row = total_row_idx - 1

            values = [
                row_data.get("categoria", ""),
                row_data.get("subcategoria", ""),
                row_data.get("fecha", ""),
                row_data.get("detalle", ""),
                row_data.get("importe", 0),
            ]

            for col, val in enumerate(values, start=1):
                new_cell = ws.cell(row=total_row_idx, column=col, value=val)
                # Copiar estilo de la fila de referencia
                src_cell = ws.cell(row=source_row, column=col)
                if src_cell.has_style:
                    from copy import copy
                    new_cell.font = copy(src_cell.font)
                    new_cell.border = copy(src_cell.border)
                    new_cell.fill = copy(src_cell.fill)
                    new_cell.number_format = src_cell.number_format
                    new_cell.alignment = copy(src_cell.alignment)

            total_row_idx += 1    # La fila de totales se desplazó una posición
            written += 1
            logger.info("Insertado en '%s' fila %d: %s / %s / %s",
                        tab_name, total_row_idx - 1,
                        row_data.get("categoria"), row_data.get("subcategoria"),
                        row_data.get("fecha"))

    wb.save(excel_path)
    wb.close()
    logger.info("Excel guardado con %d filas nuevas.", written)
    return written


# ─────────────────────────────────────────────────────────────
# Algoritmo de merge bidireccional
# ─────────────────────────────────────────────────────────────

class SyncResult:
    def __init__(self) -> None:
        self.uploaded: int = 0
        self.downloaded: int = 0
        self.conflicts: int = 0
        self.errors: list[str] = []


def sync(
    cfg: Config,
    client: Client,
    log_callback: "Callable[[str], None] | None" = None,
) -> SyncResult:
    """
    Sincronización bidireccional:
      - Solo en nube  → descargar al Excel
      - Solo en Excel → subir a la nube
      - En ambos      → ignorar (ya sincronizado)
    """
    result = SyncResult()

    def log(msg: str) -> None:
        logger.info(msg)
        if log_callback:
            log_callback(msg)

    # 1. Leer Excel
    log("📖 Leyendo Excel...")
    try:
        excel_rows = read_excel(cfg["excel_path"])
    except Exception as exc:
        result.errors.append(f"Error leyendo Excel: {exc}")
        log(f"❌ Error leyendo Excel: {exc}")
        return result

    set_excel: dict[str, ExpenseRow] = {r["hash_unico"]: r for r in excel_rows}

    # 2. Leer nube
    log("☁️  Consultando Supabase...")
    try:
        cloud_rows = fetch_cloud_expenses(client)
    except Exception as exc:
        result.errors.append(f"Error consultando Supabase: {exc}")
        log(f"❌ Error consultando Supabase: {exc}")
        return result

    set_cloud: dict[str, dict[str, Any]] = {r["hash_unico"]: r for r in cloud_rows}

    # 3. Calcular diferencias
    only_in_cloud = [r for h, r in set_cloud.items() if h not in set_excel]
    only_in_excel = [r for h, r in set_excel.items() if h not in set_cloud]

    log(f"🔍 Solo en nube: {len(only_in_cloud)} | Solo en Excel: {len(only_in_excel)} | En ambos: {len(set_excel) & len(set_cloud)}")

    # 4. Subir los que solo están en Excel
    if only_in_excel:
        log(f"⬆️  Subiendo {len(only_in_excel)} gastos a la nube...")
        try:
            result.uploaded = upload_expenses(client, list(only_in_excel))  # type: ignore[arg-type]
        except Exception as exc:
            result.errors.append(f"Error subiendo a Supabase: {exc}")
            log(f"❌ Error subiendo: {exc}")

    # 5. Escribir al Excel los que solo están en la nube
    if only_in_cloud:
        log(f"⬇️  Escribiendo {len(only_in_cloud)} gastos en el Excel...")
        try:
            result.downloaded = write_expenses_to_excel(cfg["excel_path"], only_in_cloud)
        except Exception as exc:
            result.errors.append(f"Error escribiendo en Excel: {exc}")
            log(f"❌ Error escribiendo en Excel: {exc}")

    log("✅ Sincronización completada.")
    return result


# ─────────────────────────────────────────────────────────────
# GUI Tkinter
# ─────────────────────────────────────────────────────────────

class SyncApp(tk.Tk):
    def __init__(self, cfg: Config) -> None:
        super().__init__()
        self.cfg = cfg
        self.client: Client | None = None
        self.sync_result: SyncResult | None = None

        self.title("GastApp Sync")
        self.resizable(False, False)
        self.geometry("580x480")
        self._setup_ui()
        self._apply_theme()

    def _apply_theme(self) -> None:
        bg = "#1E1E2E"
        fg = "#CDD6F4"
        self.configure(bg=bg)
        style = ttk.Style(self)
        style.theme_use("clam")
        style.configure("TButton", background="#4F6AF5", foreground="white",
                        font=("Inter", 10, "bold"), padding=8)
        style.configure("TProgressbar", troughcolor=bg, background="#4F6AF5")
        style.configure("TLabel", background=bg, foreground=fg)
        style.configure("TFrame", background=bg)

    def _setup_ui(self) -> None:
        pad = {"padx": 16, "pady": 8}

        # Cabecera
        header = tk.Label(
            self, text="GastApp — Sincronización",
            font=("Inter", 16, "bold"), fg="#CDD6F4", bg="#1E1E2E"
        )
        header.pack(**pad, anchor="w")

        excel_label = tk.Label(
            self,
            text=f"📄 Excel: {Path(self.cfg['excel_path']).name}",
            font=("Inter", 9), fg="#89B4FA", bg="#1E1E2E"
        )
        excel_label.pack(anchor="w", padx=16)

        # Campo de contraseña
        pw_frame = tk.Frame(self, bg="#1E1E2E")
        pw_frame.pack(fill="x", **pad)
        tk.Label(pw_frame, text="Contraseña:", font=("Inter", 10),
                 fg="#CDD6F4", bg="#1E1E2E").pack(side="left")
        self.pw_var = tk.StringVar()
        pw_entry = tk.Entry(pw_frame, textvariable=self.pw_var, show="•",
                            width=30, font=("Inter", 10),
                            bg="#313244", fg="#CDD6F4", insertbackground="#CDD6F4",
                            relief="flat")
        pw_entry.pack(side="left", padx=8)
        pw_entry.focus_set()

        # Botón sincronizar
        self.btn_sync = tk.Button(
            self, text="▶  Sincronizar", command=self._start_sync,
            font=("Inter", 11, "bold"), bg="#4F6AF5", fg="white",
            activebackground="#3D57E0", activeforeground="white",
            relief="flat", padx=16, pady=8, cursor="hand2"
        )
        self.btn_sync.pack(**pad)

        # Barra de progreso
        self.progress = ttk.Progressbar(self, mode="indeterminate", length=540)
        self.progress.pack(**pad)

        # Log scrolleable
        log_frame = tk.Frame(self, bg="#1E1E2E")
        log_frame.pack(fill="both", expand=True, padx=16, pady=(0, 8))
        self.log_text = scrolledtext.ScrolledText(
            log_frame, height=12, font=("Cascadia Code", 9),
            bg="#181825", fg="#A6E3A1", insertbackground="#CDD6F4",
            relief="flat", wrap="word", state="disabled"
        )
        self.log_text.pack(fill="both", expand=True)

        # Botón "Abrir Excel" (inicialmente oculto)
        self.btn_open = tk.Button(
            self, text="📂  Abrir Excel", command=self._open_excel,
            font=("Inter", 10, "bold"), bg="#313244", fg="#CDD6F4",
            activebackground="#45475A", relief="flat", padx=12, pady=6,
            cursor="hand2"
        )

    def _log(self, msg: str) -> None:
        """Agrega una línea al log con timestamp."""
        self.log_text.configure(state="normal")
        ts = datetime.now().strftime("%H:%M:%S")
        self.log_text.insert("end", f"[{ts}] {msg}\n")
        self.log_text.see("end")
        self.log_text.configure(state="disabled")

    def _start_sync(self) -> None:
        password = self.pw_var.get()
        if not password:
            messagebox.showwarning("Contraseña", "Ingresá tu contraseña para continuar.")
            return

        self.btn_sync.configure(state="disabled")
        self.progress.start(10)
        self._log("🔐 Autenticando...")
        self.after(50, lambda: self._do_sync(password))

    def _do_sync(self, password: str) -> None:
        try:
            self.client = get_supabase_client(self.cfg, password)
            self._log("✅ Autenticación exitosa.")
        except Exception as exc:
            self._log(f"❌ Error de autenticación: {exc}")
            self.progress.stop()
            self.btn_sync.configure(state="normal")
            messagebox.showerror("Error", f"No se pudo autenticar:\n{exc}")
            return

        self._log("🔄 Iniciando sincronización bidireccional...")
        try:
            result = sync(self.cfg, self.client, log_callback=self._log)
            self.sync_result = result
        except Exception as exc:
            self._log(f"❌ Error inesperado: {exc}")
            self.progress.stop()
            self.btn_sync.configure(state="normal")
            return

        self.progress.stop()
        self.btn_sync.configure(state="normal")

        # Resumen final
        self._log("─" * 50)
        self._log(f"✅ {result.uploaded} gastos subidos a la nube")
        self._log(f"✅ {result.downloaded} gastos descargados al Excel")
        self._log(f"⚠️  {result.conflicts} conflictos ignorados")
        if result.errors:
            for err in result.errors:
                self._log(f"❌ {err}")

        # Mostrar botón "Abrir Excel"
        self.btn_open.pack(padx=16, pady=(0, 12))

    def _open_excel(self) -> None:
        import subprocess
        excel_path = self.cfg["excel_path"]
        if sys.platform == "win32":
            os.startfile(excel_path)  # type: ignore[attr-defined]
        elif sys.platform == "darwin":
            subprocess.run(["open", excel_path], check=False)
        else:
            subprocess.run(["xdg-open", excel_path], check=False)


# ─────────────────────────────────────────────────────────────
# Punto de entrada
# ─────────────────────────────────────────────────────────────

def main() -> None:
    force_wizard = "--wizard" in sys.argv

    cfg = load_config()
    if cfg is None or force_wizard:
        cfg = run_wizard()

    # Verificar que el Excel sigue existiendo
    if not Path(cfg["excel_path"]).exists():
        print(f"❌ No se encontró el archivo Excel: {cfg['excel_path']}")
        print("Ejecutá con --wizard para reconfigurar.")
        sys.exit(1)

    app = SyncApp(cfg)
    app.mainloop()


if __name__ == "__main__":
    main()


# ─────────────────────────────────────────────────────────────
# Instrucción de empaquetado con PyInstaller
# ─────────────────────────────────────────────────────────────
#
# Generá el .exe portable con este comando (desde la carpeta sync-script/):
#
#   pyinstaller --onefile --windowed --name "GastApp-Sync" --icon=icon.ico sync.py
#
# Flags:
#   --onefile   → un único ejecutable sin carpetas adicionales
#   --windowed  → no abre ventana de consola (modo GUI puro)
#   --name      → nombre del ejecutable resultante
#   --icon      → ícono .ico del ejecutable (opcional, debe existir el archivo)
#
# El .exe resultante queda en dist/GastApp-Sync.exe
# Puede ejecutarse en cualquier PC Windows sin Python instalado.
