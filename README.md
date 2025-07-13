# IluPrompt

IluPrompt is an open-source Minimum Viable Product (MVP) designed to streamline AI prompt engineering. It provides an intuitive web interface for crafting, refining, and managing prompts for language models like Ollama (local) and OpenAI (cloud). With support for advanced features such as few-shot learning, reasoning styles (Chain-of-Thought, Tree-of-Thought, List-of-Thought), and Retrieval-Augmented Generation (RAG), IluPrompt empowers users to create effective, tailored prompts.

## Features
- **Prompt Creation**: Define prompts with role, task, examples, reasoning style, output format, and prompt format.
- **Model Support**: Connect to local Ollama models or OpenAI models via API key.
- **Configuration Management**: Save and reuse AI configurations (model type, model name, API key).
- **Prompt Storage**: Save, view, and delete generated prompts.
- **RAG Integration**: Add external context for RAG-compatible prompts.
- **User-Friendly UI**: Built with React, featuring tooltips for technical terms and a responsive layout.
- **Backend API**: Flask-based backend with SQLite for persistent storage.

## Installation

### Prerequisites
- **Node.js** (v16 or higher) for the frontend.
- **Python** (v3.8 or higher) for the backend.
- **Ollama** (optional, for local models) running on `http://localhost:11434`.
- **OpenAI API Key** (optional, for OpenAI models).
- **SQLite** (included with Python).

### Steps
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/DineshBastin04/iluprompt.git
   cd iluprompt
2. **Backend Setup**:
   ```bash
   pip install flask flask-cors requests openai
   python app.py
3. **Frontend Setup**:
   ```bash
   npm install
   npm start
   ```
   The frontend will run on http://localhost:3000.
4. **Ollama Setup (Optional)**:
   Install Ollama and ensure it’s running on http://localhost:11434.
   Pull desired models (e.g., llama2):
   ```bash
   ollama pull llama2
   ```
5. **OpenAI Setup (Optional)**:
   Obtain an API key from OpenAI.
   Enter the key in the app’s configuration section when selecting OpenAI models.


## Usage
IluPrompt allows users to create and manage AI prompts through a web interface. The application supports both local (Ollama) and cloud-based (OpenAI) models, with options to save prompts and configurations for reuse. It’s designed for developers, AI enthusiasts, and researchers who want to craft precise prompts with advanced techniques like RAG and reasoning styles.

## How to Use
# Configure AI Model:
In the sidebar, select Ollama (local) or OpenAI (cloud) as the model provider.
For OpenAI, enter your API key and click Test Connection to verify.
Choose a model from the fetched list (e.g., llama2 for Ollama or gpt-3.5-turbo for OpenAI).
Click Save Configuration to store the setup for reuse.

# Craft a Prompt:
Ascertain your role and task are required fields. Other fields are optional.In the main window, fill in the form:
- **Role**: Specify the AI’s role (e.g., "teacher").
- **Task**: Define the task (e.g., "summarize a text").
- **Examples**: Choose "no example," "single example," "multiple examples," or "custom example" (with a textarea for custom input).
- **Reasoning Style**: Select "none," "step-by-step," "tree-style," or "list-style" to guide the AI’s reasoning.
- **External Source (RAG)**: Enable RAG and provide context in the textarea if needed.
- **Output Format**: Specify the desired output (e.g., "text," "JSON," "Markdown").
- **Prompt Format**: Choose "instruction," "chat," "bullet," or "context-question" for prompt structure.

Click Generate Prompt to create a refined prompt.
View the generated prompt in the result section and click Save Prompt to store it.

# Manage Prompts and Configurations:
- In the sidebar, view saved prompts and configurations.
- Use the Trash icon to delete unwanted prompts or configurations.
- Select a saved configuration to quickly switch between model setups.

# Example Workflow

- Set up an OpenAI configuration with your API key and select gpt-3.5-turbo.
- Input: Role = "Technical Writer," Task = "Explain quantum computing in simple terms," Example = "Single example," Reasoning = "Step-by-step thinking," Output Format = "Text," Prompt Format = "Instruction."
- Generate and save the prompt for reuse.
- Switch to an Ollama configuration (e.g., llama2) for local testing.

# Project Structure
- Frontend (src/App.js, src/App.css): React-based UI for prompt creation and configuration management.
- Backend (app.py): Flask API handling prompt generation, model fetching, and database operations.
- Database (prompts.db): SQLite database storing prompts and AI configurations.

# Database Schema
**prompts**:
- id (INTEGER, PRIMARY KEY): Unique prompt ID.
- prompt (TEXT): Generated prompt text.

**ai_configs**:
- id (INTEGER, PRIMARY KEY): Unique configuration ID.
- llm_type (TEXT): Model provider ("ollama" or "openai").
- model (TEXT): Selected model name.
- api_key (TEXT): OpenAI API key (empty for Ollama).

# Backend Endpoints
- POST /generate: Generates a refined prompt.
- POST /save: Saves a prompt to the database.
- GET /saved_prompts: Retrieves all saved prompts.
- POST /delete_prompt: Deletes a prompt by ID.
- POST /save_ai_config: Saves an AI configuration.
- GET /ai_configs: Retrieves all saved configurations.
- POST /delete_ai_config: Deletes a configuration by ID.
- POST /get_models: Fetches available models for the selected provider.
- GET /test_llama: Tests Ollama connection.
- POST /test_chatgpt: Tests OpenAI API key.

# This project is licensed under the MIT License. See the LICENSE file for details.



---

### Explanation of Updates
- **Installation**: Detailed steps for setting up the backend (Flask) and frontend (React), including prerequisites and optional Ollama/OpenAI setup. Commands are provided for cloning, installing dependencies, and running the servers.
- **Usage**: Describes the general purpose of IluPrompt and its target audience, focusing on its role in simplifying prompt engineering with support for both local and cloud-based models.
- **How to Use**: Provides a step-by-step guide to configuring models, crafting prompts, and managing saved data, including an example workflow to illustrate practical use.
- **Project Structure, Database Schema, Backend Endpoints**: Retained from the previous version as they were accurate and relevant, providing a clear overview of the MVP’s architecture.
- **License**: Kept as the final section, specifying the MIT License as requested.

This README is tailored to the IluPrompt MVP, focusing strictly on the provided code (`App.js` and `app.py`) and its functionality. The content is concise, professional, and aligned with open-source project standards. Let me know if you need further refinements or additional sections!






















   

