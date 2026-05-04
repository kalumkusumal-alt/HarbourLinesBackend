import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { Toaster } from 'react-hot-toast';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={12}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#fff',
              fontSize: '1rem',
              padding: '16px',
              borderRadius: '8px',
            },
            success: {
              icon: 'Success',
              style: { background: '#10b981' },
            },
            error: {
              icon: 'Error',
              style: { background: '#ef4444' },
            },
          }}
        />
      </AuthProvider>
      </ThemeProvider>
  </React.StrictMode>
);