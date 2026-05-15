import os
import google.generativeai as genai
import json

# Initialize Gemini API. The API key should be in environment variables.
api_key = os.environ.get('GEMINI_API_KEY', 'MOCK_KEY_FOR_LOCAL_DEV')
if api_key != 'MOCK_KEY_FOR_LOCAL_DEV':
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.5-flash')
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
    """Uses LLM to answer user queries about the dataset."""
    if not model:
        return f"Real AI answer for '{user_query}' (Requires GEMINI_API_KEY)"
    
    prompt = f"""
    Dataset: {dataset_name}
    Dictionary: {json.dumps(columns_info)}
    User Question: {user_query}
    Provide a helpful, precise answer based ONLY on the provided dictionary.
    """
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"AI Error: {str(e)}"

def suggest_rename(column_name):
    if not model:
        return column_name
    prompt = f"Suggest a clean, standard snake_case name for the column: '{column_name}'. Reply with ONLY the name."
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except:
        return column_name
