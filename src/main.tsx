import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Initialize Sentry for error tracking and performance monitoring
import { initializeSentry } from "./lib/sentry";
initializeSentry();

const rootElement = document.getElementById("root")!;

// Prevent multiple root creation during development hot reloading
if (!rootElement.hasAttribute('data-react-root')) {
  rootElement.setAttribute('data-react-root', 'true');
  createRoot(rootElement).render(<App />);
}
