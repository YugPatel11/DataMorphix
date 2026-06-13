"""
DataMorphix PII Masking Service
================================
Detects and masks Personally Identifiable Information (PII) before any data
is sent to the AI (Gemini). Original values are stored in a secure server-side
mapping and NEVER transmitted to the AI or frontend.

Detection strategy:
  1. Column-name heuristics (regex on column name)
  2. Value-pattern sampling (regex on sample cell values)

Supported PII categories:
  - Email, Phone, Aadhaar, PAN, Name, Address/Location,
    Bank/Account/IFSC, Credit Card, SSN, Passport, DOB, IP address, URL

Usage (automatic — called inside ai_engine.py):
  masked_cols, mapping_id = mask_columns_info(dataset_name, cols_info)
  ...AI call with masked_cols...
  original_cols = restore_columns_info(masked_cols_result, mapping_id)
"""

import re
import uuid
import time
import threading
from typing import Any

# ── Thread-safe in-memory mapping store ───────────────────────────────────────
# { mapping_id: { "created": timestamp, "map": { placeholder: original } } }
_MAPPING_STORE: dict[str, dict] = {}
_STORE_LOCK = threading.Lock()
_MAPPING_TTL_SECONDS = 1800  # 30 minutes


def _cleanup_expired():
    """Remove expired mappings from the store (non-blocking)."""
    now = time.time()
    with _STORE_LOCK:
        expired = [k for k, v in _MAPPING_STORE.items()
                   if now - v["created"] > _MAPPING_TTL_SECONDS]
        for k in expired:
            del _MAPPING_STORE[k]


def _store_mapping(mapping: dict) -> str:
    """Persist a placeholder→original mapping and return its ID."""
    _cleanup_expired()
    mid = str(uuid.uuid4())
    with _STORE_LOCK:
        _MAPPING_STORE[mid] = {"created": time.time(), "map": mapping}
    return mid


def _get_mapping(mapping_id: str) -> dict:
    """Retrieve a mapping by ID. Returns {} if expired/missing."""
    with _STORE_LOCK:
        entry = _MAPPING_STORE.get(mapping_id)
    if entry is None:
        return {}
    return entry["map"]


# ── PII Detection Rules ────────────────────────────────────────────────────────

# (category_tag, column_name_regex, value_regex_or_None)
_PII_RULES = [
    ("EMAIL",    re.compile(r"e[\-_]?mail", re.I),
                 re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}", re.I)),

    ("PHONE",    re.compile(r"(phone|mobile|contact|tel|fax|whatsapp)", re.I),
                 re.compile(r"[\+]?[\s\-]?(\(?\d{2,4}\)?[\s\-]?)?\d{6,10}")),

    ("AADHAAR",  re.compile(r"(aadhaar|aadhar|adhaar|uid_?num)", re.I),
                 re.compile(r"\b[2-9]\d{11}\b")),

    ("PAN",      re.compile(r"\bpan\b", re.I),
                 re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b")),

    ("NAME",     re.compile(r"(full[\-_]?name|first[\-_]?name|last[\-_]?name|"
                             r"surname|given[\-_]?name|middle[\-_]?name|"
                             r"customer[\-_]?name|employee[\-_]?name|"
                             r"patient[\-_]?name|user[\-_]?name(?!_id))", re.I),
                 None),  # name detection relies on column name alone

    ("ADDRESS",  re.compile(r"(address|addr|street|locality|landmark|"
                             r"pincode|zip[\-_]?code|city|state|district|"
                             r"country|location|residence|flat[\-_]?no|"
                             r"house[\-_]?no|village|taluka|tehsil)", re.I),
                 None),

    ("DOB",      re.compile(r"(dob|date[\-_]?of[\-_]?birth|birthdate|"
                             r"birth[\-_]?day|age[\-_]?date)", re.I),
                 None),

    ("BANK",     re.compile(r"(account[\-_]?num|bank[\-_]?acc|iban|"
                             r"ifsc|micr|bsb|routing[\-_]?num|"
                             r"sort[\-_]?code)", re.I),
                 re.compile(r"\b[A-Z]{4}0[A-Z0-9]{6}\b|"          # IFSC
                             r"\b\d{9,18}\b")),                     # Account number

    ("CARD",     re.compile(r"(credit[\-_]?card|debit[\-_]?card|card[\-_]?num"
                             r"|cc[\-_]?num|cvv|card[\-_]?no)", re.I),
                 re.compile(r"\b(?:\d{4}[\s\-]?){3}\d{4}\b")),

    ("SSN",      re.compile(r"(ssn|social[\-_]?security|national[\-_]?id"
                             r"|sin[\-_]?num)", re.I),
                 re.compile(r"\b\d{3}[\-\s]\d{2}[\-\s]\d{4}\b")),

    ("PASSPORT", re.compile(r"passport", re.I),
                 re.compile(r"\b[A-Z][0-9]{7}\b")),

    ("IP",       re.compile(r"ip[\-_]?(address|addr)?", re.I),
                 re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")),

    ("URL",      re.compile(r"(website|url|link|webpage|web[\-_]?addr)", re.I),
                 re.compile(r"https?://[^\s]+")),

    ("ID",       re.compile(r"(employee[\-_]?id|emp[\-_]?id|staff[\-_]?id|"
                             r"customer[\-_]?id|user[\-_]?id|patient[\-_]?id|"
                             r"member[\-_]?id|national[\-_]?id|voter[\-_]?id|"
                             r"license[\-_]?num|dl[\-_]?num|registration[\-_]?num)", re.I),
                 None),
]


def detect_pii_columns(cols_info: list) -> dict[str, str]:
    """
    Detect which columns contain PII.

    Returns: { col_name: pii_category }
    """
    detected: dict[str, str] = {}

    for col in cols_info:
        col_name: str = col.get("name", "")
        samples: list = col.get("samples", [])

        for (tag, name_rx, val_rx) in _PII_RULES:
            # 1. Column-name heuristic
            if name_rx.search(col_name):
                detected[col_name] = tag
                break

            # 2. Value-pattern sampling (only if value regex provided)
            if val_rx and samples:
                matches = sum(
                    1 for s in samples[:5]
                    if val_rx.search(str(s))
                )
                if matches >= min(2, len(samples)):
                    detected[col_name] = tag
                    break

    return detected


# ── Column-info masking ────────────────────────────────────────────────────────

def mask_columns_info(dataset_name: str, cols_info: list) -> tuple[list, str]:
    """
    Mask PII-sensitive column names and sample values in cols_info.

    Returns:
        masked_cols_info  — safe list to send to AI
        mapping_id        — opaque ID to retrieve the reverse mapping
    """
    pii_cols = detect_pii_columns(cols_info)
    if not pii_cols:
        # Nothing to mask — use a sentinel mapping_id so restore is a no-op
        return cols_info, _store_mapping({})

    placeholder_map: dict[str, Any] = {}   # placeholder → original
    col_name_map:   dict[str, str]  = {}   # original_col_name → placeholder_col_name
    counters: dict[str, int] = {}

    masked_cols = []
    for col in cols_info:
        col_name = col.get("name", "")
        tag = pii_cols.get(col_name)

        if tag:
            # Generate a unique column-name placeholder
            counters[tag] = counters.get(tag, 0) + 1
            ph_name = f"[PII_{tag}_{counters[tag]}]"
            col_name_map[col_name] = ph_name
            placeholder_map[ph_name] = col_name   # for restoration

            # Mask sample values
            masked_samples = [f"[PII_{tag}_VAL]"] * len(col.get("samples", []))

            # Build masked copy of the column dict
            masked_col = {k: v for k, v in col.items()}
            masked_col["name"] = ph_name
            masked_col["samples"] = masked_samples

            # Also mask top_values keys/values inside advanced_stats
            adv = masked_col.get("advanced_stats", {})
            if "top_values" in adv:
                masked_col["advanced_stats"] = {
                    "top_values": {f"[PII_{tag}_VAL_{i}]": cnt
                                   for i, (_, cnt) in
                                   enumerate(adv["top_values"].items())}
                }

            masked_cols.append(masked_col)
            print(f"[PII Masking] Masked column '{col_name}' -> '{ph_name}' ({tag})")
        else:
            masked_cols.append(col)

    # Store: both placeholder→original AND the col_name_map for restoring AI result keys
    full_map = {**placeholder_map, "__col_name_map__": col_name_map}
    mapping_id = _store_mapping(full_map)
    return masked_cols, mapping_id


def restore_columns_info(ai_result: dict, mapping_id: str) -> dict:
    """
    Restore original column names in the AI result dict.
    The AI result is typically { masked_col_name: description }.

    Returns: { original_col_name: description }
    """
    if not mapping_id:
        return ai_result

    full_map = _get_mapping(mapping_id)
    if not full_map:
        return ai_result

    col_name_map: dict = full_map.get("__col_name_map__", {})
    if not col_name_map:
        return ai_result

    # Reverse: placeholder → original
    reverse_map = {v: k for k, v in col_name_map.items()}

    restored = {}
    for key, value in ai_result.items():
        original_key = reverse_map.get(key, key)
        restored[original_key] = value
    return restored


def restore_rename_suggestions(ai_result: dict, mapping_id: str) -> dict:
    """
    Restore original column names in rename suggestion dicts.
    ai_result: { masked_name: suggested_name }
    """
    return restore_columns_info(ai_result, mapping_id)


# ── Column-name-list masking (for rename suggestions) ─────────────────────────

def mask_column_names(column_names: list) -> tuple[list, str]:
    """
    Mask a plain list of column names for the rename-suggestion call.

    Returns:
        masked_names — list with PII names replaced by placeholders
        mapping_id   — opaque ID for restoration
    """
    cols_info = [{"name": n, "samples": []} for n in column_names]
    masked_info, mapping_id = mask_columns_info("_rename_", cols_info)
    masked_names = [c["name"] for c in masked_info]
    return masked_names, mapping_id


# ── Free-text restoration ──────────────────────────────────────────────────────

def restore_text(text: str, mapping_id: str) -> str:
    """
    Replace any placeholder tokens in a free-text AI response
    with the original values.
    """
    if not mapping_id or not text:
        return text

    full_map = _get_mapping(mapping_id)
    if not full_map:
        return text

    restored = text
    for placeholder, original in full_map.items():
        if placeholder == "__col_name_map__":
            continue
        if isinstance(original, str) and placeholder in restored:
            restored = restored.replace(placeholder, original)
    return restored


# ── Schema masking (for summary / analytics) ──────────────────────────────────

def mask_schema_for_ai(cols_info: list) -> tuple[list, str]:
    """
    Alias for mask_columns_info — used when sending schema to AI for
    summary generation or analytics planning.
    """
    return mask_columns_info("_schema_", cols_info)


# ── Public helper: is this dataset PII-sensitive? ─────────────────────────────

def has_pii(cols_info: list) -> bool:
    """Returns True if any column is detected as PII-sensitive."""
    return bool(detect_pii_columns(cols_info))


def pii_summary(cols_info: list) -> dict[str, str]:
    """Returns a dict of {column_name: pii_category} for all PII columns."""
    return detect_pii_columns(cols_info)
