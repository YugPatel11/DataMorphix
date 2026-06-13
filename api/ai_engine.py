"""
DataMorphix AI Engine
=====================
Multi-model, multi-key Gemini integration with automatic key rotation
AND automatic PII masking for every AI request.

Credit-efficiency model assignment:
  MODEL_NANO  = gemini-2.5-flash   → Bulk simple tasks (descriptions, renames)
  MODEL_FLASH = gemini-2.5-flash   → Analytics planning, query analysis, summaries
  MODEL_SMART = gemini-2.5-flash   → Complex reasoning (modification code)

Key rotation: on ResourceExhausted / 429, advance atomically to next key.
PII masking:  every outbound prompt is pre-masked; every inbound result is restored.
All analytics results are returned in a single batched AI call (no per-item calls).
"""

import os
import json
import threading
from pathlib import Path


# ── Load .env ────────────────────────────────────────────────────────────────

def _load_local_env():
    env_path = Path(__file__).resolve().parents[1] / 'backend' / '.env'
    if not env_path.exists():
        env_path = Path(__file__).resolve().parents[1] / '.env'
        if not env_path.exists():
            return
    for line in env_path.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_local_env()


# ── Import Gemini SDK ─────────────────────────────────────────────────────────

try:
    from google import genai
    _GENAI_AVAILABLE = True
except ImportError:
    _GENAI_AVAILABLE = False


# ── Import PII Masking Service ────────────────────────────────────────────────

try:
    from . import pii_masking as _pii
    _PII_AVAILABLE = True
    print("[AI Engine] PII masking service loaded.")
except ImportError:
    _PII_AVAILABLE = False
    print("[AI Engine] WARNING: PII masking service not found — running unmasked.")


# ── Model Names ───────────────────────────────────────────────────────────────
# Credit tiers:
#   NANO  → cheapest, used for bulk simple tasks (column descriptions, renames)
#   FLASH → balanced quality/cost, used for summaries, analytics plans, queries
#   SMART → same model but reserved for future pro upgrade if needed
#
# NOTE: gemini-2.0-flash-lite is free-tier quota exhausted on all keys.
#       Using gemini-2.5-flash for all tiers (free tier, generous quota).

MODEL_NANO    = 'gemini-3.1-flash-lite'   # Bulk descriptions & renames
MODEL_SUMMARY = 'gemini-2.5-flash'        # Dataset summaries
MODEL_QUERY   = 'gemini-3-flash'          # User queries
MODEL_PLAN    = 'gemini-3.5-flash'        # Adaptive analytics plans
MODEL_SMART   = 'gemma-4-31b'             # Code generation (slow, use sparingly)


# ── API Key Pool ──────────────────────────────────────────────────────────────

def _collect_api_keys():
    """Collect all non-empty API keys from env (KEY_1..KEY_5 + legacy)."""
    raw = []
    for i in range(1, 6):
        k = os.getenv(f'GEMINI_API_KEY_{i}', '').strip()
        if k and k not in ('MOCK_KEY_FOR_LOCAL_DEV', ''):
            raw.append(k)
    # Legacy single key fallback
    legacy = os.getenv('GEMINI_API_KEY', '').strip()
    if legacy and legacy not in ('MOCK_KEY_FOR_LOCAL_DEV', '') and legacy not in raw:
        raw.insert(0, legacy)
    return raw


_API_KEYS = _collect_api_keys()
_key_index = 0
_key_lock  = threading.Lock()


def _get_client():
    """Return a Gemini Client for the currently active API key."""
    if not _GENAI_AVAILABLE or not _API_KEYS:
        return None
    return genai.Client(api_key=_API_KEYS[_key_index])


def _rotate_key():
    """Advance to the next API key (thread-safe). Returns True if rotated."""
    global _key_index
    with _key_lock:
        if len(_API_KEYS) <= 1:
            return False
        next_idx = (_key_index + 1) % len(_API_KEYS)
        if next_idx == _key_index:
            return False
        _key_index = next_idx
        print(f"[AI Engine] Rotated to API key index {_key_index}")
        return True


def _call_with_rotation(model: str, prompt: str, max_attempts: int = None) -> str | None:
    """
    Call Gemini with automatic key rotation on quota/rate-limit errors.
    Returns the response text or None on total failure.
    """
    if not _GENAI_AVAILABLE or not _API_KEYS:
        return None

    attempts = max_attempts or len(_API_KEYS)
    tried = set()

    for _ in range(attempts):
        with _key_lock:
            current = _key_index

        if current in tried:
            break
        tried.add(current)

        try:
            client = _get_client()
            response = client.models.generate_content(model=model, contents=prompt)
            return response.text
        except Exception as e:
            err_str = str(e).lower()
            # Quota / rate limit / auth errors → rotate key
            if any(x in err_str for x in ('quota', '429', 'resource_exhausted',
                                            'rate', 'limit', 'exhausted')):
                print(f"[AI Engine] Key {current} quota hit: {e}")
                rotated = _rotate_key()
                if not rotated:
                    print("[AI Engine] No more keys to rotate to.")
                    return None
            else:
                # Non-quota error (bad prompt, network, model unavailable, etc.)
                print(f"[AI Engine] Non-quota error on model '{model}': {e}")
                return None

    print("[AI Engine] All keys exhausted.")
    return None


def _parse_json_response(text: str) -> dict | list | None:
    """Strip markdown fences and parse JSON from model response."""
    if not text:
        return None
    cleaned = text.replace('```json', '').replace('```', '').strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Try to extract first JSON block
        import re
        match = re.search(r'(\{[\s\S]*\}|\[[\s\S]*\])', cleaned)
        if match:
            try:
                return json.loads(match.group(1))
            except Exception:
                pass
    return None


# ── Public AI Functions ───────────────────────────────────────────────────────

def get_all_columns_metadata(dataset_name: str, columns_summary: list) -> dict:
    """
    Batch describe all columns in ONE call using the NANO model.
    PII columns are masked before the prompt and restored in the result.
    Returns dict: {col_name: description}
    """
    if not _API_KEYS:
        return {col['name']: "Description unavailable (no API key)." for col in columns_summary}

    # ── PII masking ──
    if _PII_AVAILABLE:
        masked_cols, mapping_id = _pii.mask_columns_info(dataset_name, columns_summary)
        pii_cols = _pii.pii_summary(columns_summary)
        if pii_cols:
            print(f"[AI Engine] Masked {len(pii_cols)} PII column(s) for descriptions call.")
    else:
        masked_cols, mapping_id = columns_summary, None

    # Compact prompt — fewer tokens = cheaper
    compact_cols = [{'n': c['name'], 't': c['type'],
                     's': c.get('samples', [])[:2]} for c in masked_cols]

    prompt = (
        f"Dataset: '{dataset_name}'. Describe each column concisely (max 12 words each).\n"
        f"Columns: {json.dumps(compact_cols)}\n"
        'Return ONLY valid JSON: {"col_name": "description"}. No markdown.'
    )

    text = _call_with_rotation(MODEL_NANO, prompt)
    result = _parse_json_response(text)

    if isinstance(result, dict):
        # ── Restore original column names for PII-masked columns ──
        if _PII_AVAILABLE and mapping_id:
            result = _pii.restore_columns_info(result, mapping_id)
        return result

    return {col['name']: "Description unavailable." for col in columns_summary}


def generate_dataset_summary(dataset_name: str, columns_info: list) -> str:
    """Generate a concise dataset summary using FLASH model. PII schema is masked."""
    if not _API_KEYS:
        return "AI summary unavailable (no API key configured)."

    # ── PII masking ──
    if _PII_AVAILABLE:
        masked_cols, mapping_id = _pii.mask_schema_for_ai(columns_info)
    else:
        masked_cols, mapping_id = columns_info, None

    # Send only column names and types to save tokens
    schema = [{'name': c['name'], 'type': c['type']} for c in masked_cols]
    prompt = (
        f"Summarize dataset '{dataset_name}' in 2-3 sentences for a business audience.\n"
        f"Schema: {json.dumps(schema)}\n"
        "Be specific and insightful. Plain text, no markdown."
    )

    text = _call_with_rotation(MODEL_SUMMARY, prompt)
    if not text:
        return "AI summary could not be generated."

    # ── Restore any placeholder tokens in summary text ──
    if _PII_AVAILABLE and mapping_id:
        text = _pii.restore_text(text, mapping_id)

    return text.strip()


def analyze_query(dataset_name: str, columns_info: list, user_query: str) -> dict:
    """
    Analyze a natural language query using FLASH model.
    Schema is PII-masked before sending; response is restored.
    Returns answer + optional pandas_code + chart_type.
    """
    if not _API_KEYS:
        return {"answer": "AI unavailable. No API key.", "pandas_code": None, "chart_type": None}

    # ── PII masking ──
    if _PII_AVAILABLE:
        masked_cols, mapping_id = _pii.mask_schema_for_ai(columns_info)
    else:
        masked_cols, mapping_id = columns_info, None

    schema = [{'name': c['name'], 'type': c['type'],
               'desc': (c.get('description') or '')[:60],
               'sample': c.get('sample_values', [])[:2]} for c in masked_cols]

    prompt = f"""You are a senior data analyst for DataMorphix.
Dataset: '{dataset_name}'
Schema: {json.dumps(schema, indent=2)}
User query: "{user_query}"

Tasks:
1. Give a direct business answer (2-4 sentences).
2. If query needs data visualization, write a pandas expression on DataFrame 'df' that returns a dict.
   Examples:
   - Value counts: df['Col'].value_counts().head(10).to_dict()
   - Group sum: df.groupby('Cat')['Num'].sum().head(10).to_dict()
   - Nulls: df.isnull().sum().to_dict()
   Use exact column names. Expression must NOT modify df.

Return ONLY valid JSON (no markdown):
{{"answer":"...","pandas_code":"expression or null","chart_type":"bar"|"line"|"pie"|"doughnut"|null,"x_label":"...","y_label":"..."}}"""

    text = _call_with_rotation(MODEL_QUERY, prompt)
    result = _parse_json_response(text)

    if isinstance(result, dict):
        # Restore any PII column placeholders in the answer text and code
        if _PII_AVAILABLE and mapping_id:
            if result.get('answer'):
                result['answer'] = _pii.restore_text(result['answer'], mapping_id)
            if result.get('pandas_code'):
                result['pandas_code'] = _pii.restore_text(result['pandas_code'], mapping_id)
        return result

    return {"answer": "Query analysis failed. Please try again.", "pandas_code": None, "chart_type": None}


def get_all_rename_suggestions(column_names: list) -> dict:
    """
    Batch rename suggestions in ONE call using cheapest NANO model.
    PII column names are masked before sending.
    Returns dict: {original: suggested}
    """
    if not _API_KEYS:
        return {col: col for col in column_names}

    # ── PII masking ──
    if _PII_AVAILABLE:
        masked_names, mapping_id = _pii.mask_column_names(column_names)
        if any(n != o for n, o in zip(masked_names, column_names)):
            print(f"[AI Engine] Masked column names for rename suggestions call.")
    else:
        masked_names, mapping_id = column_names, None

    prompt = (
        f"Suggest clean snake_case names for these columns: {json.dumps(masked_names)}\n"
        "Keep already clean names as-is.\n"
        'Return ONLY valid JSON: {"original": "suggested"}. No markdown.'
    )

    text = _call_with_rotation(MODEL_NANO, prompt)
    result = _parse_json_response(text)

    if isinstance(result, dict):
        # ── Restore PII column names ──
        if _PII_AVAILABLE and mapping_id:
            result = _pii.restore_rename_suggestions(result, mapping_id)
        return result

    return {col: col for col in column_names}


def generate_modification_code(dataset_name: str, columns_info: list, instruction: str) -> str:
    """
    Generate pandas modification code using SMART model (best reasoning).
    Schema is PII-masked. Returns raw Python code string.
    """
    if not _API_KEYS:
        return ""

    # ── PII masking ──
    if _PII_AVAILABLE:
        masked_cols, mapping_id = _pii.mask_schema_for_ai(columns_info)
    else:
        masked_cols, mapping_id = columns_info, None

    schema = [{'name': c['name'], 'type': c['type']} for c in masked_cols]
    prompt = f"""Write Python pandas code to modify DataFrame 'df' for dataset '{dataset_name}'.
Schema: {json.dumps(schema, indent=2)}
Instruction: "{instruction}"

Rules:
- Only valid pandas code. No imports. Assume df is loaded.
- Use in-place operations: df['col'] = ..., df.drop(..., inplace=True), etc.
- Return raw code only. No markdown, no backticks, no explanations."""

    text = _call_with_rotation(MODEL_SMART, prompt)
    if not text:
        return ""

    # ── Restore any PII placeholders in generated code ──
    if _PII_AVAILABLE and mapping_id:
        text = _pii.restore_text(text, mapping_id)

    # Strip any accidental markdown fences
    lines = [l for l in text.splitlines() if not l.strip().startswith('```')]
    return '\n'.join(lines).strip()


def generate_adaptive_analytics_plan(dataset_name: str, columns_info: list) -> list:
    """
    Generate an adaptive analytics plan using FLASH model.
    Schema is PII-masked before sending. Results are restored.

    Analyzes the dataset schema and returns 6-10 relevant analysis items,
    each containing: title, analysis_type, pandas_code, chart_type, insight.

    This is a SINGLE batched AI call — no per-chart follow-up calls.
    Results are meant to be cached in the DB to avoid recomputation.
    """
    if not _API_KEYS:
        return []

    # ── PII masking ──
    if _PII_AVAILABLE:
        masked_cols, mapping_id = _pii.mask_schema_for_ai(columns_info)
        pii_detected = _pii.pii_summary(columns_info)
        if pii_detected:
            print(f"[AI Engine] Masked {len(pii_detected)} PII column(s) for analytics plan.")
    else:
        masked_cols, mapping_id = columns_info, None

    # Build a rich but compact schema for the AI
    schema_compact = []
    for c in masked_cols:
        entry = {'name': c['name'], 'type': c['type']}
        stats = c.get('advanced_stats', {})
        if stats:
            if 'mean' in stats:
                entry['stats'] = {
                    'min': round(stats.get('min', 0), 2),
                    'max': round(stats.get('max', 0), 2),
                    'mean': round(stats.get('mean', 0), 2)
                }
            elif 'top_values' in stats:
                top = stats['top_values']
                entry['top_cats'] = list(top.keys())[:5]
        entry['nulls'] = c.get('nulls', 0)
        entry['uniques'] = c.get('uniques', 0)
        schema_compact.append(entry)

    prompt = f"""You are a senior data analyst. Analyze the schema of dataset '{dataset_name}' and design the most relevant analytical visualizations.

SCHEMA:
{json.dumps(schema_compact, indent=2)}

TASK: Generate 6-8 unique, insightful analyses that are SPECIFICALLY tailored to this dataset.
Choose analysis types based on what columns exist:
- Numeric columns → distributions, outliers, correlations
- Categorical columns → frequency, top-N breakdown
- Date/time columns → trends over time
- Boolean/flag columns → ratio charts
- Mixed → category-vs-numeric comparisons

For each analysis item:
1. Write a pandas expression (on df) that returns a dict of {{label: value}} pairs.
2. Pick the best chart type: "bar", "line", "pie", "doughnut", "area", "scatter", "horizontal_bar"
3. Write a 1-sentence professional insight describing what this chart reveals.

IMPORTANT:
- Use EXACT column names from the schema above.
- pandas_code must evaluate to a dict or call .to_dict().
- Keep expressions concise. Use .head(15) for large cardinality.
- Never use columns that don't exist in the schema.

Return ONLY valid JSON array. No markdown. Example format:
[
  {{
    "title": "Age Distribution",
    "analysis_type": "distribution",
    "pandas_code": "df['age'].value_counts().sort_index().head(20).to_dict()",
    "chart_type": "bar",
    "x_label": "Age",
    "y_label": "Count",
    "insight": "The age distribution shows a right skew with most users between 25-35."
  }}
]"""

    text = _call_with_rotation(MODEL_PLAN, prompt)
    result = _parse_json_response(text)

    if isinstance(result, list):
        # ── Restore PII column name placeholders inside pandas_code and titles ──
        if _PII_AVAILABLE and mapping_id:
            for item in result:
                if isinstance(item, dict):
                    if item.get('pandas_code'):
                        item['pandas_code'] = _pii.restore_text(item['pandas_code'], mapping_id)
                    if item.get('title'):
                        item['title'] = _pii.restore_text(item['title'], mapping_id)
                    if item.get('insight'):
                        item['insight'] = _pii.restore_text(item['insight'], mapping_id)
                    if item.get('x_label'):
                        item['x_label'] = _pii.restore_text(item['x_label'], mapping_id)
                    if item.get('y_label'):
                        item['y_label'] = _pii.restore_text(item['y_label'], mapping_id)

        # Validate each item has required fields
        valid = []
        required = {'title', 'pandas_code', 'chart_type', 'insight'}
        for item in result:
            if isinstance(item, dict) and required.issubset(item.keys()):
                valid.append(item)
        return valid

    return []
