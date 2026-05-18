import os
from dotenv import load_dotenv
import google.generativeai as genai
import json
from pathlib import Path


def load_local_env():
    """Load simple KEY=VALUE pairs from backend/.env without extra dependencies."""
    env_path = Path(__file__).resolve().parents[1] / '.env'
    if not env_path.exists():
        return

    for line in env_path.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_local_env()

# Load environment variables from .env file
load_dotenv()

# Initialize Gemini API. The API key should be in environment variables.
api_key = os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_API_KEY')
if api_key and api_key != 'MOCK_KEY_FOR_LOCAL_DEV':
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.5-pro')
else:
    model = None


def get_all_columns_metadata(dataset_name, columns_summary):
    """Uses LLM to generate metadata for all columns in one API call to save tokens and time."""
    if not model:
        return {col['name']: f"Real AI desc for {col['name']} (Requires API key)" for col in columns_summary}

    prompt = f"""
    Analyze the following columns from dataset '{dataset_name}'.
    Columns data: {json.dumps(columns_summary)}
    Provide a concise, professional business description for each column (1 sentence max).
    Return ONLY a valid JSON object mapping column names to their descriptions. No markdown, no other text.
    Example format: {{"col_name": "description", "col2": "description"}}
    """
    try:
        response = model.generate_content(prompt)
        text = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(text)
    except Exception as e:
        print(f"AI Error: {e}")
        return {col['name']: "AI description failed." for col in columns_summary}


def generate_dataset_summary(dataset_name, columns_info):
    """Uses LLM to generate a summary for the entire dataset."""
    if not model:
        return f"Real AI summary for {dataset_name} (Requires GEMINI_API_KEY)"

    prompt = f"""
    Summarize the dataset '{dataset_name}'.
    Columns: {json.dumps(columns_info)}
    Provide a concise paragraph explaining the likely purpose of this dataset.
    """
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"AI Error: {str(e)}"


def analyze_query(dataset_name, columns_info, user_query):
    """Uses LLM to analyze query and produce answer with optional chart planning."""
    if not model:
        return {
            "answer": f"Mock AI answer for '{user_query}'",
            "pandas_code": None,
            "chart_type": None
        }

    prompt = f"""
    You are an advanced AI Data Analyst for DataMorphix.
    Analyze the user's query against the dataset '{dataset_name}'.
    
    COLUMNS SCHEMA:
    {json.dumps(columns_info, indent=2)}

    USER QUERY:
    "{user_query}"

    Your task is to:
    1. Formulate a direct business answer to the user's question.
    2. If the user is asking for a trend, comparison, breakdown, distribution, or specifically requests a graph/chart, write a single Python pandas expression that extracts the relevant data from a pandas DataFrame named 'df'.
       - The pandas expression MUST evaluate to a Pandas Series, DataFrame, or dictionary containing label-value pairs.
       - Example for "sales by city": df.groupby('City')['Sales'].sum().head(10).to_dict()
       - Example for "distribution of categories": df['Category'].value_counts().head(10).to_dict()
       - Example for "Null counts in columns": df.isnull().sum().to_dict()
       - Make sure you use the exact column names from the columns schema above. Case sensitivity matters!
       - The expression must NOT modify the dataframe (no in-place edits).
    
    Return ONLY a valid JSON object with the following keys. No markdown, no triple backticks, no other text.
    {{
      "answer": "A clear, professional, direct explanation of the insight.",
      "pandas_code": "The pandas python expression as a string (or null if no data extraction is needed)",
      "chart_type": "bar" | "line" | "pie" | "area" | null,
      "x_label": "Label for the independent variable / category axis (string or null)",
      "y_label": "Label for the dependent variable / value axis (string or null)"
    }}
    """
    try:
        response = model.generate_content(prompt)
        text = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(text)
    except Exception as e:
        print(f"Query AI Error: {e}")
        return {
            "answer": f"Sorry, I encountered an issue analyzing your query. Error: {str(e)}",
            "pandas_code": None,
            "chart_type": None
        }


def suggest_rename(column_name):
    """Suggest a clean, standard name for a single column."""
    if not model:
        return column_name
    prompt = f"Suggest a clean, standard snake_case name for the column: '{column_name}'. Reply with ONLY the name."
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception:
        return column_name


def get_all_rename_suggestions(column_names):
    """
    Uses LLM to suggest better names for all columns in one batched API call.
    Returns a dict mapping original_name -> suggested_name.
    """
    if not model:
        return {col: col for col in column_names}

    prompt = f"""
    Suggest clean, standardized snake_case column names for these columns: {json.dumps(column_names)}
    If the name is already clean and standard, keep it as-is.
    Return ONLY a valid JSON object mapping original names to suggested names. No markdown, no other text.
    Example: {{"cust_nm": "customer_name", "email": "email"}}
    """
    try:
        response = model.generate_content(prompt)
        text = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(text)
    except Exception as e:
        print(f"AI Rename Error: {e}")
        return {col: col for col in column_names}
