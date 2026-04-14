import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Vite 진입점에서 단일 App 컴포넌트를 루트에 마운트한다.
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
