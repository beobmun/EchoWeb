import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SignupSuccessPage.css';

const SignupSuccessPage = () => {
  const navigate = useNavigate();
  const handleLoginRedirect = () => {
    // TODO: 로그인 페이지로 이동
    navigate('/'); // 또는 react-router-dom 사용 시 navigate('/login')
  };

  return (
    <div className="success-container">
      <h1 className="success-title">회원가입이 완료되었습니다.</h1>
      <p className="success-subtext">
        저희 사이트에 가입해주셔서 감사합니다. 로그인 하시어 다양한 기능을 사용해보시길 바랍니다. 감사합니다.
      </p>
      <button className="success-btn" onClick={handleLoginRedirect}>로그인</button>
    </div>
  );
};

export default SignupSuccessPage;
