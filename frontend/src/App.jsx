import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import WebhooksPage from './pages/WebhooksPage';

function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <nav style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
             <h1 style={{ margin: 0 }}>Payment Gateway</h1>
        </nav>
        
        <Routes>
          <Route path="/" element={<WebhooksPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
