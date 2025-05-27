// // src/App.js
// import React from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// import LoginPage from './pages/LoginPage';
// import SignupPage from './pages/SignupPage';
// import SignupSuccessPage from './pages/SignupSuccessPage';
// import UploadPage from './pages/UploadPage';

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<LoginPage />} />
//         <Route path="/signup" element={<SignupPage />} />
//         <Route path="/signup-success" element={<SignupSuccessPage />} />
//         <Route path="/upload" element={<UploadPage />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;


// App.js
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import VideoSelectPage from './pages/VideoSelectPage';

function App() {
  return (
    <BrowserRouter>
      <VideoSelectPage />
    </BrowserRouter>
  );
}

export default App;