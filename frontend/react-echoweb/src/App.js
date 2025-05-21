// App.js
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import UploadPage from './pages/UploadPage';

function App() {
  return (
    <BrowserRouter>
      <UploadPage />
    </BrowserRouter>
  );
}

export default App;
