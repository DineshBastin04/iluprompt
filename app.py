from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import openai
import requests
from openai import OpenAI, OpenAIError, APIConnectionError
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Initialize SQLite DB
def init_db():
    conn = sqlite3.connect('prompts.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS prompts
                 (id INTEGER PRIMARY KEY, prompt TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS ai_configs
                 (id INTEGER PRIMARY KEY, llm_type TEXT, model TEXT, api_key TEXT)''')
    conn.commit()
    conn.close()

# Fetch Ollama models
def get_ollama_models():
    try:
        url = "http://localhost:11434/api/tags"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        models = [model['name'] for model in data.get('models', [])]
        return models, None
    except requests.RequestException as e:
        return [], f"Failed to fetch Ollama models: {str(e)}"

# List OpenAI models
def list_available_models(api_key):
    if not api_key or not api_key.strip():
        return [], "Invalid or missing API key"
    try:
        client = OpenAI(api_key=api_key)
        models = client.models.list()
        model_list = [model.id for model in models.data if hasattr(model, 'id') and isinstance(model.id, str)]
        return model_list, None
    except OpenAIError as e:
        logger.error(f"OpenAI API Error: {str(e)}")
        return [], f"OpenAI API Error: {str(e)}"
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return [], f"Unexpected error: {str(e)}"

# Generate refined prompt using LLM
# Generate refined prompt using LLM
def generate_refined_prompt(llm_type, model, api_key, role, task, example, reasoning, external_source, output_format, prompt_format):
    external_source_instruction = ""
    if external_source.lower() == "yes":
        external_source_instruction = "Include placeholders or structure that allows retrieved knowledge to be inserted. Make it compatible with Retrieval-Augmented Generation (RAG) use cases."
    prompt_template = f"""
    You are an expert prompt engineer. Create a clear, concise, and well-structured prompt based on the following user input:
    - Role: {role}
    - Task: {task}
    - Example: {example}
    - Reasoning Style: {reasoning}
    - External Source: {external_source}
    - Desired Output Format: {output_format}
    - Prompt Format: {prompt_format}

    {external_source_instruction}
    Ensure proper grammar and an appropriate tone (adjusted based on the specified role or any mentioned style). Incorporate the reasoning style (e.g., include “Let's think step by step” if Chain-of-Thought is requested). Use any provided examples or external context to clarify the task. 

    Structure the generated prompt according to the selected Prompt Format: **{prompt_format}**, and ensure its final output is formatted as: **{output_format}**. 

    Avoid model-specific references so the prompt remains compatible with any AI model.

    Refined Prompt:
    """


    if llm_type == 'ollama':
        try:
            response = requests.post(
                "http://localhost:11434/api/chat",
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt_template}],
                    "stream": False,
                    "options": {"temperature": 0.7, "num_ctx": 2048}
                },
                timeout=300
            )
            response.raise_for_status()
            return response.json().get('message', {}).get('content', '').strip()
        except requests.exceptions.Timeout:
            return "Error: Ollama request timed out (5m)"
        except requests.exceptions.RequestException as e:
            logger.error(f"Ollama connection failed: {str(e)}")
            return f"Error: Ollama connection failed - {str(e)}"
    elif llm_type == 'openai':
        if not api_key or not api_key.strip():
            return "Error: Please provide a valid OpenAI API key"
        try:
            client = OpenAI(api_key=api_key, timeout=30)
            logger.debug(f"Generating prompt with API key: {api_key[:5]}...")
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are an expert prompt engineer."},
                    {"role": "user", "content": prompt_template}
                ],
                timeout=30
            )
            refined_prompt = response.choices[0].message.content.strip()
            return refined_prompt
        except APIConnectionError as e:
            logger.error(f"OpenAI Connection Error: {str(e)}")
            return f"OpenAI Connection Error: {str(e)}"
        except OpenAIError as e:
            logger.error(f"OpenAI API Error: {str(e)}")
            return f"OpenAI API Error: {str(e)}"
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return f"Unexpected error: {str(e)}"
# API Routes
@app.route('/generate', methods=['POST'])
def generate_prompt():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        if not data.get('role') or not data.get('task'):
            return jsonify({'error': 'Role and task are required'}), 400

        refined_prompt = generate_refined_prompt(
            data.get('llmOption', 'ollama'),
            data.get('selectedModel', 'default'),
            data.get('apiKey', ''),
            data.get('role', ''),
            data.get('task', ''),
            data.get('example', 'no example'),
            data.get('reasoning', 'step-by-step thinking'),
            data.get('externalSource', 'no'),
            data.get('outputFormat', 'text'),
            data.get('promptFormat', 'instruction')
        )

        if refined_prompt.startswith('Error'):
            return jsonify({'error': refined_prompt}), 500

        return jsonify({'prompt': refined_prompt})

    except Exception as e:
        logger.error(f"Server Error: {str(e)}")
        return jsonify({'error': f"Server Error: {str(e)}"}), 500

@app.route('/save', methods=['POST'])
def save_prompt():
    data = request.get_json()
    prompt = data.get('prompt', '')
    conn = sqlite3.connect('prompts.db')
    c = conn.cursor()
    c.execute("INSERT INTO prompts (prompt) VALUES (?)", (prompt,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Prompt saved successfully'})

@app.route('/saved_prompts', methods=['GET'])
def get_saved_prompts():
    conn = sqlite3.connect('prompts.db')
    c = conn.cursor()
    c.execute("SELECT id, prompt FROM prompts")
    prompts = [{'id': row[0], 'prompt': row[1]} for row in c.fetchall()]
    conn.close()
    return jsonify({'prompts': prompts})

@app.route('/delete_prompt', methods=['POST'])
def delete_prompt():
    data = request.get_json()
    prompt_id = data.get('id')
    if not prompt_id:
        return jsonify({'message': 'Prompt ID is required'}), 400
    conn = sqlite3.connect('prompts.db')
    c = conn.cursor()
    c.execute("DELETE FROM prompts WHERE id = ?", (prompt_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Prompt deleted successfully'})

@app.route('/save_ai_config', methods=['POST'])
def save_ai_config():
    data = request.get_json()
    llm_type = data.get('llmOption', 'ollama')
    model = data.get('model', 'default')
    api_key = data.get('apiKey', '')
    conn = sqlite3.connect('prompts.db')
    c = conn.cursor()
    c.execute("INSERT INTO ai_configs (llm_type, model, api_key) VALUES (?, ?, ?)", (llm_type, model, api_key))
    conn.commit()
    conn.close()
    return jsonify({'message': 'AI config saved'})

@app.route('/ai_configs', methods=['GET'])
def get_ai_configs():
    conn = sqlite3.connect('prompts.db')
    c = conn.cursor()
    c.execute("SELECT id, llm_type, model, api_key FROM ai_configs")
    configs = [{'id': row[0], 'llm_type': row[1], 'model': row[2], 'api_key': row[3]} for row in c.fetchall()]

    conn.close()
    return jsonify({'configs': configs})

@app.route('/delete_ai_config', methods=['POST'])
def delete_ai_config():
    data = request.get_json()
    config_id = data.get('id')
    if not config_id:
        return jsonify({'message': 'Config ID is required'}), 400
    conn = sqlite3.connect('prompts.db')
    c = conn.cursor()
    c.execute("DELETE FROM ai_configs WHERE id = ?", (config_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'AI config deleted successfully'})

@app.route('/get_models', methods=['POST'])
def get_models():
    data = request.get_json()
    llm_type = data.get('llmOption', 'ollama')
    api_key = data.get('apiKey', '')

    if llm_type == 'openai':
        if not api_key or not api_key.strip():
            return jsonify({'models': [], 'message': 'Invalid or missing API key'})
        models, error = list_available_models(api_key)
        if error:
            return jsonify({'models': [], 'message': error})
        return jsonify({'models': models, 'message': 'Connection successful'})

    elif llm_type == 'ollama':
        models, error = get_ollama_models()
        if error:
            return jsonify({'models': [], 'message': error})
        return jsonify({'models': models, 'message': 'Connection successful'})

@app.route('/test_llama', methods=['GET'])
def test_llama():
    models, error = get_ollama_models()
    if error:
        return jsonify({'message': f'Test failed: {error}'})
    return jsonify({'message': 'Ollama connection successful'})

@app.route('/test_chatgpt', methods=['POST'])
def test_chatgpt():
    data = request.get_json()
    api_key = data.get('api_key', '')
    if not api_key or not api_key.strip():
        return jsonify({'message': 'Invalid or missing API key'})
    try:
        client = OpenAI(api_key=api_key)
        client.models.list()  # Basic test
        # Additional test to ensure the key can generate content
        client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Test message"}],
            max_tokens=1
        )
        return jsonify({'message': 'OpenAI connection successful'})
    except APIConnectionError as e:
        logger.error(f"OpenAI Connection Error: {str(e)}")
        return jsonify({'message': f"Test failed: Connection error - {str(e)}"})
    except OpenAIError as e:
        logger.error(f"OpenAI API Error: {str(e)}")
        return jsonify({'message': f"Test failed: API error - {str(e)}"})
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({'message': f"Test failed: {str(e)}"})

if __name__ == '__main__':
    init_db()
    app.run(debug=True)