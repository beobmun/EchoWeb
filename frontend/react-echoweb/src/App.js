// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import Signup_LiveValidationPage from './pages/Signup_LiveValidationPage';
import SignupSuccessPage from './pages/SignupSuccessPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<Signup_LiveValidationPage />} />
        <Route path="/signup-success" element={<SignupSuccessPage />} />
      </Routes>
    </Router>
  );
}

export default App;


// // App.js
// import React from 'react';
// import { BrowserRouter } from 'react-router-dom';
// import UploadPage from './pages/UploadPage';

// function App() {
//   return (
//     <BrowserRouter>
//       <UploadPage />
//     </BrowserRouter>
//   );
// }

// export default App;
