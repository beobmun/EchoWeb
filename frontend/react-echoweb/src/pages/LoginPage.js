import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // 🔹 axios 추가
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();

  const validate = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('이메일 형식이 아닙니다.');
      valid = false;
    }

    if (!password) {
      setPasswordError('패스워드를 입력하세요.');
      valid = false;
    }

    return valid;
  };

  const handleSignupClick = (e) => {
    e.preventDefault();
    navigate('/signup');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const res = await axios.post('/api/auth/', {
        email: email,
        password: password
      });

      if (res.data.result === true) {
        alert('로그인 성공!');
        navigate('/upload'); // 🔹 로그인 성공 후 이동할 페이지
      } else {
        alert(res.data.message || '로그인 실패');
      }

    } catch (err) {
      console.error(err);
      alert('서버 오류로 로그인에 실패했습니다.');
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
