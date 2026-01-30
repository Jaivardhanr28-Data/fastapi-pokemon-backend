// frontend/src/main.tsx - Application entry point
// This is the main entry file for the React application

// Import React's StrictMode component for highlighting potential problems in development
import { StrictMode } from 'react'
// Import createRoot from react-dom/client to create the root element for rendering
import { createRoot } from 'react-dom/client'
// Import global CSS styles that apply to the entire application
import './index.css'
// Import the main App component
import App from './App.tsx'

// Create a root element and render the App component
// - document.getElementById('root')! gets the root div from index.html (! asserts it's not null)
// - createRoot creates a React root for rendering
// - render() displays the component tree
createRoot(document.getElementById('root')!).render(
  // StrictMode is a development tool that helps identify potential issues
  // It activates additional checks and warnings for its descendants
  <StrictMode>
    {/* Render the main App component */}
    <App />
  </StrictMode>,
)
