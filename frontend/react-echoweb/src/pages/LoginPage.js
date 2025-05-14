import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 추가
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate(); // 훅으로 이동 함수 받기

  const validate = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');

    // 이메일 유효성 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('이메일 형식이 아닙니다.');
      valid = false;
    }

    // 비밀번호 비었는지 확인
    if (!password) {
      setPasswordError('패스워드를 입력하세요.');
      valid = false;
    }

    return valid;
  };

  const handleSignupClick = () => {
    navigate('/signup'); // 2p로 이동
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (validate()) {
      // TODO: 서버에 로그인 요청 (axios 등)
      console.log('로그인 시도:', email, password);
    }
  };

  return (
    <div className="login-container">
      <h1 className="title">Echocardiography Segmentation</h1>
      <form className="login-box" onSubmit={handleLogin}>
        <label>ID</label>
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {emailError && <p className="error">{emailError}</p>}

        <label>Password</label>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {passwordError && <p className="error">{passwordError}</p>}

        <button type="submit">로그인</button>
        <div className="signup-text">
          아직 회원이 아니신가요?
          <a href="/signup" className="signup-btn-inline" onClick={handleSignupClick}>회원가입</a>
        </div>



      </form>
    </div>
  );
};

export default LoginPage;
