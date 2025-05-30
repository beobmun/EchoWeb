// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import SignupSuccessPage from './pages/SignupSuccessPage';
import UploadPage_API from './pages/UploadPage_API';
import VideoSelectPage_API from './pages/VideoSelectPage_API';
import ResultPage_API from './pages/ResultPage_API';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signup-success" element={<SignupSuccessPage />} />
        <Route path="/upload" element={<UploadPage_API />} />
        <Route path="/select" element={<VideoSelectPage_API />} />
        <Route path="/result" element={<ResultPage_API />} />
      </Routes>
    </Router>
  );
}

export default App;


// App.js
// import React from 'react';
// import { BrowserRouter } from 'react-router-dom';
// import VideoSelectPage from './pages/VideoSelectPage';

// function App() {
//   return (
//     <BrowserRouter>
//       <VideoSelectPage />
//     </BrowserRouter>
//   );
// }

// export default App;