import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SignupPage.css';

const TEST_MODE = false; // ✅ true면 테스트용, false면 실제 API 사용

const SignupPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [username, setUsername] = useState('');

  const [emailMsg, setEmailMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [verifyMsg, setVerifyMsg] = useState('');
  const [usernameMsg, setUsernameMsg] = useState('');

  const [isEmailValid, setIsEmailValid] = useState(null);
  const [isPwValid, setIsPwValid] = useState(null);
  const [isVerifyValid, setIsVerifyValid] = useState(null);
  const [isUsernameValid, setIsUsernameValid] = useState(null);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (pw) => /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{6,}/.test(pw);
  const validateUsername = (name) => /^[A-Za-z0-9]+$/.test(name);

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    if (!value) {
      setEmailMsg('');
      setIsEmailValid(null);
    } else if (!validateEmail(value)) {
      setEmailMsg('올바른 이메일 형식이 아닙니다.');
      setIsEmailValid(false);
    } else {
      setEmailMsg('사용 가능한 이메일입니다.');
      setIsEmailValid(true);
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);

    if (!value) {
      setPwMsg('');
      setIsPwValid(null);
    } else if (!validatePassword(value)) {
      setPwMsg('6자 이상, 소문자/대문자/숫자/특수문자 포함 필요');
      setIsPwValid(false);
    } else {
      setPwMsg('사용 가능한 비밀번호입니다.');
      setIsPwValid(true);
    }

    if (verifyPassword) {
      if (value === verifyPassword) {
        setVerifyMsg('비밀번호가 일치합니다.');
        setIsVerifyValid(true);
      } else {
        setVerifyMsg('비밀번호가 일치하지 않습니다.');
        setIsVerifyValid(false);
      }
    }
  };

  const handleVerifyChange = (e) => {
    const value = e.target.value;
    setVerifyPassword(value);

    if (!value) {
      setVerifyMsg('');
      setIsVerifyValid(null);
    } else if (value === password) {
      setVerifyMsg('비밀번호가 일치합니다.');
      setIsVerifyValid(true);
    } else {
      setVerifyMsg('비밀번호가 일치하지 않습니다.');
      setIsVerifyValid(false);
    }
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);

    if (!value) {
      setUsernameMsg('');
      setIsUsernameValid(null);
    } else if (!validateUsername(value)) {
      setUsernameMsg('사용자 이름은 영문만 가능합니다.');
      setIsUsernameValid(false);
    } else {
      setUsernameMsg('사용 가능한 사용자 이름입니다.');
      setIsUsernameValid(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEmailValid || !isPwValid || !isVerifyValid || !isUsernameValid) {
      alert('입력 형식을 다시 확인해주세요.');
      return;
    }

    if (TEST_MODE) {
      // ✅ 프론트 단독 테스트용: 바로 회원가입 성공 처리
      console.log('TEST_MODE 회원가입:', { email, password, username });
      navigate('/signup-success');
      return;
    }

    try {
      // ✅ 실제 API 연동
      const res = await axios.post('/api/auth/signup', {
        "email": email,
        "password": password,
        "username": username,
      });

      if (res.data.result === true) {
        navigate('/signup-success');
      } else {
        alert(res.data.message || '회원가입 실패');
      }
    } catch (err) {
      console.error(err);
      alert('서버 오류로 회원가입에 실패했습니다.');
    }
  };

  return (
    <div className="signup-container">
      <div className="top-right-login">
        이미 회원이신가요?
        <button className="login-btn" onClick={() => navigate('/')}>로그인</button>
      </div>
      <h1 className="signup-title">Create a new account</h1>
      <form className="signup-box" onSubmit={handleSubmit}>
        <label>Email</label>
        <input type="text" placeholder="Email" value={email} onChange={handleEmailChange} />
        {emailMsg && isEmailValid === true && <p className="success">{emailMsg}</p>}
        {emailMsg && isEmailValid === false && <p className="error">{emailMsg}</p>}

        <label>Password</label>
        <input type="password" placeholder="Password" value={password} onChange={handlePasswordChange} />
        {pwMsg && <p className={isPwValid ? 'success' : 'error'}>{pwMsg}</p>}

        <label>verify password</label>
        <input type="password" placeholder="Password" value={verifyPassword} onChange={handleVerifyChange} />
        {verifyMsg && <p className={isVerifyValid ? 'success' : 'error'}>{verifyMsg}</p>}

        <label>Username</label>
        <input type="text" placeholder="Username" value={username} onChange={handleUsernameChange} />
        {usernameMsg && <p className={isUsernameValid ? 'success' : 'error'}>{usernameMsg}</p>}

        <button type="submit" className="submit-btn">회원가입</button>
      </form>
    </div>
  );
};

export default SignupPage;
