import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import SimpleLogIn from './components/SimpleLogIn.tsx';

function WebLogin(){
  const [canPass, setCanPass] = useState(false);
  return (
    canPass? <App />
      : <SimpleLogIn
      onLogin={() => setCanPass(true)}
      />
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WebLogin />
  </StrictMode>
);
