import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { FaTrash, FaSpinner } from 'react-icons/fa';

function App() {
  const [role, setRole] = useState('');
  const [task, setTask] = useState('');
  const [example, setExample] = useState('no example');
  const [customExample, setCustomExample] = useState(''); 
  const [reasoning, setReasoning] = useState('no reasoning'); // Default to 'no reasoning'
  const [externalSource, setExternalSource] = useState('no');
  const [outputFormat, setOutputFormat] = useState('text'); // Default to 'text'
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [ragContext, setRagContext] = useState('');
  const [llmOption, setLlmOption] = useState('ollama');
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [aiConfigs, setAiConfigs] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [testResult, setTestResult] = useState('');
  const [isManualConfig, setIsManualConfig] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptFormat, setPromptFormat] = useState('instruction');

  // Tooltip component for technical terms
  const Tooltip = ({ term, description }) => (
    <span className="tooltip">
      {term}
      <span className="tooltip-text">{description}</span>
    </span>
  );

  // Define fetchModels, fetchSavedPrompts, fetchAiConfigs, and other functions (unchanged)
  const fetchModels = useCallback(async (llmType, apiKey) => {
    console.log('Fetching models with llmType:', llmType, 'apiKey:', apiKey ? apiKey.slice(0, 5) + '...' : 'none');
    setIsLoadingModels(true);
    try {
      const response = await fetch('http://localhost:5000/get_models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ llmOption: llmType, apiKey: apiKey || '' }),
      });
      const data = await response.json();
      setAvailableModels(data.models || []);
      if (data.models?.length > 0 && !selectedModel) {
        setSelectedModel(data.models[0]);
      }
      if (data.message.includes('failed')) {
        setTestResult(data.message);
      } else {
        setTestResult(`${llmType === 'ollama' ? 'Ollama' : 'OpenAI'} models loaded successfully`);
      }
    } catch (error) {
      setTestResult(`Error fetching models: ${error.message}`);
    } finally {
      setIsLoadingModels(false);
    }
  }, [selectedModel]);

  const fetchSavedPrompts = useCallback(() => {
    fetch('http://localhost:5000/saved_prompts')
      .then((res) => res.json())
      .then((data) => setSavedPrompts(data.prompts))
      .catch((err) => console.error('Error fetching prompts:', err));
  }, []);

  const fetchAiConfigs = useCallback(() => {
    fetch('http://localhost:5000/ai_configs')
      .then((res) => res.json())
      .then((data) => {
        setAiConfigs(data.configs);
        if (data.configs.length > 0 && !isManualConfig && !selectedConfig) {
          const firstConfig = data.configs[0];
          setSelectedConfig(firstConfig);
          setLlmOption(firstConfig.llm_type);
          setSelectedModel(firstConfig.model);
          const configApiKey = firstConfig.api_key || '';
          setApiKey(configApiKey);
          console.log('Loaded config apiKey:', configApiKey ? configApiKey.slice(0, 5) + '...' : 'none');
          fetchModels(firstConfig.llm_type, configApiKey);
        }
      })
      .catch((err) => console.error('Error fetching configs:', err));
  }, [isManualConfig, selectedConfig, fetchModels]);

  useEffect(() => {
    fetchSavedPrompts();
    fetchAiConfigs();
  }, [fetchSavedPrompts, fetchAiConfigs]);

  useEffect(() => {
    console.log('useEffect triggered with llmOption:', llmOption, 'apiKey:', apiKey ? apiKey.slice(0, 5) + '...' : 'none');
    if (llmOption === 'ollama') {
      fetchModels('ollama', '');
    } else if (llmOption === 'openai' && apiKey) {
      fetchModels('openai', apiKey);
    }
  }, [llmOption, apiKey, fetchModels]);

  const handleApiKeyChange = (e) => {
    const newApiKey = e.target.value || '';
    setApiKey(newApiKey);
    console.log('handleApiKeyChange new apiKey:', newApiKey ? newApiKey.slice(0, 5) + '...' : 'none');
    setTestResult('');
  };

  const testConnection = async () => {
    console.log('Testing connection with llmOption:', llmOption, 'apiKey:', apiKey ? apiKey.slice(0, 5) + '...' : 'none');
    if (llmOption === 'ollama') {
      try {
        const response = await fetch('http://localhost:5000/test_llama');
        const data = await response.json();
        setTestResult(data.message);
        if (data.message.includes('successful')) {
          fetchModels('ollama', '');
        }
      } catch (error) {
        setTestResult(`Test failed: ${error.message}`);
      }
    } else if (llmOption === 'openai' && apiKey) {
      try {
        const response = await fetch('http://localhost:5000/test_chatgpt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: apiKey }),
        });
        const data = await response.json();
        setTestResult(data.message);
        if (data.message.includes('successful')) {
          fetchModels('openai', apiKey);
        }
      } catch (error) {
        setTestResult(`Test failed: ${error.message}`);
      }
    } else {
      setTestResult('Please enter an API key for OpenAI.');
    }
  };

  const saveAiConfig = async () => {
    console.log('Saving config with llmOption:', llmOption, 'model:', selectedModel, 'apiKey:', apiKey ? apiKey.slice(0, 5) + '...' : 'none');
    if (!selectedModel) {
      setTestResult('Please select a model first');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/save_ai_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          llmOption,
          model: selectedModel,
          apiKey: llmOption === 'openai' ? apiKey : '',
        }),
      });
      const data = await response.json();
      if (data.message === 'AI config saved') {
        setIsManualConfig(false);
        fetchAiConfigs();
        setTestResult('Configuration saved successfully');
      }
    } catch (error) {
      setTestResult(`Failed to save config: ${error.message}`);
    }
  };

  const deletePrompt = async (promptId) => {
    try {
      const response = await fetch('http://localhost:5000/delete_prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: promptId }),
      });
      const data = await response.json();
      if (data.message === 'Prompt deleted successfully') {
        fetchSavedPrompts();
      }
    } catch (error) {
      console.error('Error deleting prompt:', error);
    }
  };

  const deleteAiConfig = async (configId) => {
    try {
      const response = await fetch('http://localhost:5000/delete_ai_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: configId }),
      });
      const data = await response.json();
      if (data.message === 'AI config deleted successfully') {
        fetchAiConfigs();
        if (selectedConfig?.id === configId) {
          setSelectedConfig(null);
          setIsManualConfig(true);
        }
      }
    } catch (error) {
      console.error('Error deleting config:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setGeneratedPrompt('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000000); // 5-minute timeout

    try {
      const promptData = {
        role,
        task,
        example: example === 'custom example' ? customExample : example,
        reasoning,
        externalSource,
        outputFormat,
        promptFormat,
        ragContext,
        llmOption: selectedConfig ? selectedConfig.llm_type : llmOption,
        apiKey: selectedConfig ? (selectedConfig.api_key || apiKey || '') : (apiKey || ''),
        selectedModel: selectedConfig ? selectedConfig.model : selectedModel,
        
      };

      console.log('Submitting with promptData:', promptData);

      if ((selectedConfig ? selectedConfig.llm_type : llmOption) === 'openai' && !promptData.apiKey.trim()) {
        setGeneratedPrompt('Error: Please provide a valid OpenAI API key');
        setIsGenerating(false);
        return;
      }

      const response = await fetch('http://localhost:5000/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promptData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setGeneratedPrompt(data.prompt || data.error || 'No response from server');
    } catch (error) {
      if (error.name === 'AbortError') {
        setGeneratedPrompt('Error: Request timed out (5m) - Try a simpler prompt or check your LLM instance');
      } else {
        setGeneratedPrompt(`Error: ${error.message}`);
      }
    } finally {
      setIsGenerating(false);
      clearTimeout(timeoutId);
    }
  };

  const savePrompt = async () => {
    if (!generatedPrompt) return;
    try {
      const response = await fetch('http://localhost:5000/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: generatedPrompt }),
      });
      const data = await response.json();
      if (data.message === 'Prompt saved successfully') {
        fetchSavedPrompts();
      }
    } catch (error) {
      console.error('Error saving prompt:', error);
    }
  };

  const handleConfigChange = (e) => {
    const configId = e.target.value;
    console.log('handleConfigChange with configId:', configId);
    if (configId === '') {
      setIsManualConfig(true);
      setSelectedConfig(null);
      return;
    }
    const config = aiConfigs.find((c) => c.id === parseInt(configId));
    if (config) {
      setSelectedConfig(config);
      setLlmOption(config.llm_type);
      setSelectedModel(config.model);
      const configApiKey = config.api_key || '';
      setApiKey(configApiKey);
      setIsManualConfig(false);
      console.log('Selected config apiKey:', configApiKey ? configApiKey.slice(0, 5) + '...' : 'none');
      fetchModels(config.llm_type, configApiKey);
    }
  };

  const toggleManualConfig = () => {
    console.log('Toggling to manual config');
    setIsManualConfig(true);
    setSelectedConfig(null);
    setApiKey('');
    setSelectedModel('');
    fetchModels(llmOption, '');
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2>AI Configuration</h2>
        <select
          value={selectedConfig?.id || ''}
          onChange={handleConfigChange}
          className="select-field"
        >
          <option value="">Select Saved Configuration</option>
          {aiConfigs.map((config) => (
            <option key={config.id} value={config.id}>
              {config.llm_type}: {config.model}
            </option>
          ))}
        </select>
        <button onClick={toggleManualConfig} className="toggle-manual-button">
          {selectedConfig ? 'Change Configuration' : 'New Configuration'}
        </button>
        {(isManualConfig || !selectedConfig) && (
          <div className="config-form">
            <select
              value={llmOption}
              onChange={(e) => setLlmOption(e.target.value)}
              className="select-field"
            >
              <option value="ollama">Ollama (Local)</option>
              <option value="openai">OpenAI (API Key)</option>
            </select>
            {llmOption === 'openai' && (
              <input
                type="password"
                placeholder="Enter OpenAI API Key"
                value={apiKey}
                onChange={handleApiKeyChange}
                className="input-field"
              />
            )}
            <div className="model-selection">
              {isLoadingModels ? (
                <p>Loading models...</p>
              ) : (
                availableModels.length > 0 && (
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="select-field"
                  >
                    <option value="">Select a model</option>
                    {availableModels.map((model, index) => (
                      <option key={index} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                )
              )}
            </div>
            <div className="connection-controls">
              <button onClick={testConnection} className="test-button">
                Test Connection
              </button>
              <button
                onClick={saveAiConfig}
                className="save-config-button"
                disabled={!selectedModel || (testResult && testResult.includes('failed'))}
              >
                Save Configuration
              </button>
            </div>
            {testResult && (
              <p className={testResult.includes('failed') ? 'error-text' : 'success-text'}>
                {testResult}
              </p>
            )}
          </div>
        )}
        <h3>Saved Prompts</h3>
        <ul className="prompt-list">
          {savedPrompts.map((prompt) => (
            <li key={prompt.id} className="prompt-item">
              <span className="prompt-content">
                {prompt.prompt.length > 100
                  ? `${prompt.prompt.slice(0, 100)}...`
                  : prompt.prompt}
              </span>

              <button
                className="delete-button"
                onClick={() => deletePrompt(prompt.id)}
                title="Delete prompt"
              >
                <FaTrash />
              </button>
            </li>
          ))}
        </ul>

        <h3>Saved AI Configurations</h3>
        <ul className="config-list">
          {aiConfigs.map((config) => (
            <li key={config.id} className="config-item">
              <span className="config-content">
                {config.llm_type}: {config.model}
              </span>
              <button
                className="delete-button"
                onClick={() => deleteAiConfig(config.id)}
                title="Delete configuration"
              >
                <FaTrash />
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <main className="main-window">
      <h1 class="main-heading">
        <span class="ilu-wrapper">
          <span class="bulb">💡</span>
          <span class="i-letter">I</span>
        </span>
        lu
        <span class="p-letter">P</span><span class="rest">rompt</span>
      </h1>



        <form onSubmit={handleSubmit} className="prompt-form">
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <input
              id="role"
              type="text"
              placeholder="e.g., teacher, assistant"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="task">Task</label>
            <input
              id="task"
              type="text"
              placeholder="e.g., explain, summarize"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="example">
              Include Examples in Prompt
              <Tooltip
                term="?"
                description="Examples help the AI understand your task better. Use few-shot (1 or more examples) or provide a custom one."
              />
            </label>
            <select
              id="example"
              value={example}
              onChange={(e) => setExample(e.target.value)}
              className="select-field"
            >
              <option value="no example">❌ No Example – Just describe the task</option>
              <option value="single example">✅ One Example – Guide the AI with a simple input-output pair</option>
              <option value="multiple examples">🧩 Few Examples – Great for complex or creative tasks</option>
              <option value="custom example">✍️ Custom Example – Provide your own task-specific example</option>
            </select>
          </div>

          {example === 'custom example' && (
            <div className="form-group">
              <label htmlFor="customExample">
                Custom Example Input
                <Tooltip
                  term="?"
                  description="Enter a sample input/output or task description that shows what kind of response you expect from the AI."
                />
              </label>
              <textarea
                id="customExample"
                placeholder="E.g. Input: 'Translate to French: Hello world' → Output: 'Bonjour le monde'"
                value={customExample}
                onChange={(e) => setCustomExample(e.target.value)}
                className="textarea-field"
                rows={4}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="reasoning">Reasoning Style</label>
            <select
              id="reasoning"
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              className="select-field"
            >
              <option value="no reasoning">None (Just do the task)</option>
              <option value="step-by-step thinking">
                Think Step-by-Step (Simple Reasoning)
              </option>
              <option value="tree-style thinking">
                Explore Multiple Ideas (Advanced Reasoning)
              </option>
              <option value="list-style thinking">
                Organize Thoughts as a List (Clear Structure)
              </option>
            </select>
            <div className="reasoning-tooltips">
              <Tooltip
                term="Step-by-Step"
                description="Chain of Thought (CoT): Break down the problem into small steps for better understanding."
              />
              <Tooltip
                term="Multiple Ideas"
                description="Tree of Thought (ToT): Explore different possible paths before deciding."
              />
              <Tooltip
                term="Structured List"
                description="List of Thought (LoT): Present your reasoning in a clear, numbered or bulleted format."
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="externalSource">
              Use External Knowledge Source (RAG)
              <Tooltip
                term="?"
                description="If enabled, the prompt will be structured to work with external data (e.g., documents, search results)."
              />
            </label>
            <select
              id="externalSource"
              value={externalSource}
              onChange={(e) => setExternalSource(e.target.value)}
              className="select-field"
            >
              <option value="no">No (Standard Prompt)</option>
              <option value="yes">Yes (Enable RAG support)</option>
            </select>
          </div>

          {externalSource === 'yes' && (
            <div className="form-group">
              <label htmlFor="ragContext">RAG Context or External Knowledge</label>
              <textarea
                id="ragContext"
                placeholder="Paste or describe any external information to include in the prompt..."
                value={ragContext}
                onChange={(e) => setRagContext(e.target.value)}
                className="textarea-field"
                rows={4}
              />
            </div>
          )}


          <div className="form-group">
            <label htmlFor="outputFormat">Output Format</label>
            <input
              id="outputFormat"
              type="text"
              placeholder="e.g., text, JSON, Markdown"
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="form-group">
          <label htmlFor="promptFormat">Prompt Format</label>
          <select
            id="promptFormat"
            value={promptFormat}
            onChange={(e) => setPromptFormat(e.target.value)}
            className="select-field"
          >
            <option value="instruction">Instruction (Direct tasks/rules)</option>  
            <option value="chat">Chat (Conversational/back-and-forth)</option>  
            <option value="bullet">Bullet (Lists/summaries)</option>  
            <option value="context-question">Context + Question (Detailed queries)</option>  
          </select>
        </div>
          <button
            type="submit"
            className="generate-button"
            disabled={!selectedModel || isGenerating}
          >
            {isGenerating ? (
              <>
                <FaSpinner className="spinner-icon" />
                Generating...
              </>
            ) : (
              'Generate Prompt'
            )}
          </button>
        </form>
        {generatedPrompt && (
          <div className="result-section">
            <h2>Generated Prompt</h2>
            <div className="prompt-text">{generatedPrompt}</div>
            <button
              onClick={savePrompt}
              className="save-button"
              disabled={!generatedPrompt}
            >
              Save Prompt
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
