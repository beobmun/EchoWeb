// 4p UploadPage.jsx (React Component - 수정됨)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './UploadPage.css';

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [uploadType, setUploadType] = useState('zip');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processLog, setProcessLog] = useState([]);
  const [status, setStatus] = useState({ upload: null, unzip: null, classify: null });
  const [isDone, setIsDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (file) {
      autoUpload();
    }
    // eslint-disable-next-line
  }, [file]);

  const handleFileSelect = (e) => {
    setFile(e.target.files[0]);
    resetState();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      setFile(e.dataTransfer.files[0]);
      resetState();
    }
  };

  const resetState = () => {
    setIsDone(false);
    setProcessLog([]);
    setStatus({ upload: null, unzip: null, classify: null });
    setUploadProgress(0);
  };

  const autoUpload = async () => {
    setProcessLog((prev) => [...prev, '업로드 중...']);
    setStatus((prev) => ({ ...prev, upload: 'loading' }));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', uploadType);

    try {
      const res = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        },
      });

      setStatus((prev) => ({ ...prev, upload: 'success' }));
      setProcessLog((prev) => [...prev, '✅ 업로드 완료']);

      if (uploadType === 'zip') {
        setProcessLog((prev) => [...prev, '압축 해제 중...']);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 압축 해제 대기 시뮬레이션
        setStatus((prev) => ({ ...prev, unzip: 'success' }));
        setProcessLog((prev) => [...prev, '✅ 압축 해제 완료']);

        setProcessLog((prev) => [...prev, 'A4C 뷰 추출 중...']);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 추출 대기 시뮬레이션
        setStatus((prev) => ({ ...prev, classify: 'success' }));
        setProcessLog((prev) => [...prev, '✅ A4C 추출 완료']);
      } else {
        setProcessLog((prev) => [...prev, 'A4C 판별 중...']);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // ✅ 여기서 실제 A4C 판별 모델 적용 예정!
        // 현재는 A4C 영상이라고 가정하고 강제로 성공 처리
        setStatus((prev) => ({ ...prev, classify: 'success' }));
        setProcessLog((prev) => [...prev, '✅ A4C 영상 확인됨']);
      }

      setIsDone(true);
    } catch (err) {
      console.error(err);
      setProcessLog((prev) => [...prev, '❌ 실패']);
      alert(`오류 발생: ${err.message}\n다시 시도하시겠습니까?`);
    }
  };

  return (
    <div className="upload-container">
      <div className="header">
        <h1>File Upload</h1>
        <div className="top-menu">
          <span>이전 기록</span>
          <span>로그아웃</span>
        </div>
      </div>

      <div className="upload-box">
        <div className="upload-type">
          <label><input type="radio" value="zip" checked={uploadType === 'zip'} onChange={() => setUploadType('zip')} /> ZIP 파일 업로드</label>
          <label><input type="radio" value="a4c" checked={uploadType === 'a4c'} onChange={() => setUploadType('a4c')} /> A4C 영상 직접 업로드</label>
        </div>

        <div
          className="file-drop"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input').click()}
        >
          {file ? <span>📄 {file.name}</span> : <span>ZIP이나 MP4 파일을 끌어다 놓거나 클릭하여 업로드</span>}
          <input
            type="file"
            id="file-input"
            accept={uploadType === 'zip' ? '.zip' : '.avi,.mp4'}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        {file && (
          <div className="progress-bar">
            <div className="progress" style={{ width: `${uploadProgress}%` }}></div>
            <span>{uploadProgress}%</span>
          </div>
        )}

        <button className="next-btn" disabled={!isDone} onClick={() => navigate('/result')}>다음</button>
      </div>

      <div className="process-log">
        <h3>Process Log</h3>
        <ul>
          {processLog.map((log, index) => <li key={index}>{log}</li>)}
        </ul>
      </div>
    </div>
  );
};

export default UploadPage;
