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

  const TEST_MODE = true; // ✅ true면 테스트용, false면 실제 API 사용

  if (TEST_MODE) {
    // ✅ 테스트 모드: 강제 로그인 성공 처리
    alert('로그인 성공! (테스트용)');
    navigate('/upload');
    return;
  }

  // ✅ 실제 API 호출 모드
  try {
    const res = await axios.post('/api/auth/', {
      email: email,
      password: password
    });

    if (res.data.result === true) {
      alert('로그인 성공!');
      navigate('/upload');
    } else {
      alert(res.data.message || '회원 정보가 없거나 잘못된 비밀번호입니다.');
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
