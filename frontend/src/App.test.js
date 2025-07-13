import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Prompt Generator title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Prompt Generator/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders LLM selector options', () => {
  render(<App />);
  const llamaOption = screen.getByText(/Local LLaMA Model/i);
  const chatgptOption = screen.getByText(/ChatGPT \(API Key\)/i);
  expect(llamaOption).toBeInTheDocument();
  expect(chatgptOption).toBeInTheDocument();
});
