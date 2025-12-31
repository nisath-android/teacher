import React from 'react';
import { PresentationProvider } from './hooks/usePresentation';
import Editor from './components/Editor';
import './index.css';

function App() {
  return (
    <PresentationProvider>
      <div className="app-container">
        <Editor />
      </div>
    </PresentationProvider>
  );
}

export default App;
