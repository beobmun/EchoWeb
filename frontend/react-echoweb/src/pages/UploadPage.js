// 4p UploadPage.jsx (React Component - 테스트 시나리오 분기 포함)
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import './UploadPage.css';

const UploadPage = () => {
  const TEST_MODE = true;
  const TEST_SCENARIO = { unzipSuccess: true, classifySuccess: true };

  const location = useLocation();
  const fromRetry = location.state?.fromRetry;
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [uploadType, setUploadType] = useState('zip');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processLog, setProcessLog] = useState([]);
  const [status, setStatus] = useState({ upload: null, unzip: null, classify: null });
  const [isDone, setIsDone] = useState(false);
  const [showHomeButton, setShowHomeButton] = useState(false);
  const [triggerReset, setTriggerReset] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (fromRetry || triggerReset) {
      resetState();
    }
  }, [fromRetry, triggerReset]);

  useEffect(() => {
    if (file && uploadProgress === 0) {
      autoUpload();
    }
  }, [file]);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(null);
      setTimeout(() => {
        resetState();
        setFile(selectedFile);
      }, 0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(null);
      setTimeout(() => {
        resetState();
        setFile(droppedFile);
      }, 0);
    }
  };

  const resetState = () => {
    setIsDone(false);
    setProcessLog([]);
    setStatus({ upload: null, unzip: null, classify: null });
    setUploadProgress(0);
    setShowHomeButton(false);
    setTriggerReset(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const autoUpload = async () => {
    setProcessLog((prev) => [...prev, '업로드 중...']);
    setStatus((prev) => ({ ...prev, upload: 'loading' }));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', uploadType);

    try {
      if (TEST_MODE) {
        await new Promise((res) => setTimeout(res, 1000));
        setUploadProgress(100);
        setStatus((prev) => ({ ...prev, upload: 'success' }));
        setProcessLog((prev) => [...prev, '✅ 업로드 완료 (테스트 모드)']);
      } else {
        const res = await axios.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          },
        });
        const { upload_id } = res.data;
        setStatus((prev) => ({ ...prev, upload: 'success' }));
        setProcessLog((prev) => [...prev, `✅ 업로드 완료 (ID: ${upload_id})`]);
      }

      if (uploadType === 'zip') {
        setProcessLog((prev) => [...prev, '압축 해제 중...']);
        if (TEST_MODE) {
          await new Promise((res) => setTimeout(res, 1000));
          if (TEST_SCENARIO.unzipSuccess) {
            setStatus((prev) => ({ ...prev, unzip: 'success' }));
            setProcessLog((prev) => [...prev, '✅ 압축 해제 완료 (테스트 모드)']);
          } else {
            throw new Error('압축 해제 실패 (테스트 모드)');
          }
        } else {
          const unzipRes = await axios.post('/api/unzip', { upload_id: 'UPLOAD_ID_SAMPLE' });
          if (unzipRes.data.success) {
            setStatus((prev) => ({ ...prev, unzip: 'success' }));
            setProcessLog((prev) => [...prev, '✅ 압축 해제 완료']);
          } else {
            throw new Error('압축 해제 실패');
          }
        }

        setProcessLog((prev) => [...prev, 'A4C 뷰 추출 중...']);
        if (TEST_MODE) {
          await new Promise((res) => setTimeout(res, 1000));
          if (TEST_SCENARIO.classifySuccess) {
            setStatus((prev) => ({ ...prev, classify: 'success' }));
            setProcessLog((prev) => [...prev, '✅ A4C 추출 완료 (테스트 모드)']);
          } else {
            throw new Error('A4C 추출 실패 (테스트 모드)');
          }
        } else {
          const classifyRes = await axios.post('/api/classify-a4c', { upload_id: 'UPLOAD_ID_SAMPLE' });
          if (classifyRes.data.success) {
            setStatus((prev) => ({ ...prev, classify: 'success' }));
            setProcessLog((prev) => [...prev, '✅ A4C 추출 완료']);
          } else {
            throw new Error('A4C 추출 실패');
          }
        }
      } else {
        setProcessLog((prev) => [...prev, 'A4C 판별 중...']);
        if (TEST_MODE) {
          await new Promise((res) => setTimeout(res, 1000));
          if (TEST_SCENARIO.classifySuccess) {
            setStatus((prev) => ({ ...prev, classify: 'success' }));
            setProcessLog((prev) => [...prev, '✅ A4C 영상 확인됨 (테스트 모드)']);
          } else {
            throw new Error('A4C 영상이 아님 (테스트 모드)');
          }
        } else {
          const checkRes = await axios.post('/api/check-a4c', { upload_id: 'UPLOAD_ID_SAMPLE' });
          if (checkRes.data.is_a4c) {
            setStatus((prev) => ({ ...prev, classify: 'success' }));
            setProcessLog((prev) => [...prev, '✅ A4C 영상 확인됨']);
          } else {
            throw new Error('A4C 영상이 아닙니다');
          }
        }
      }

      setIsDone(true);
    } catch (err) {
      console.error(err);
      setProcessLog((prev) => [...prev, '❌ 실패']);
      const retry = window.confirm(`오류 발생: ${err.message}\n다시 시도하시겠습니까?`);
      if (retry) {
        setTriggerReset(true);
      } else {
        setShowHomeButton(true);
      }
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
            ref={fileInputRef}
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

        <button className="next-btn" disabled={!isDone} onClick={() => navigate('/select', { state: { processLog } })}>다음</button>
      </div>

      <div className="process-log">
        <h3>Process Log</h3>
        <ul>
          {processLog.map((log, index) => <li key={index}>{log}</li>)}
        </ul>
        {showHomeButton && (
          <div style={{ textAlign: 'right', marginTop: '10px' }}>
            <button onClick={() => setTriggerReset(true)} style={{ fontSize: '14px', color: '#555', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>홈으로...</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
