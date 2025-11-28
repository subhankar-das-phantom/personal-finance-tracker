import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { TimeFilterProvider } from './context/TimeFilterContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <CurrencyProvider>
        <TimeFilterProvider>
          <App />
        </TimeFilterProvider>
      </CurrencyProvider>
    </AuthProvider>
  </StrictMode>
);
