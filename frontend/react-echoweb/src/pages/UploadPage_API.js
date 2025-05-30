// src/pages/UploadPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import './UploadPage.css';

const UploadPage = () => {
  const location = useLocation();
  const fromRetry = location.state?.fromRetry;
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [uploadType, setUploadType] = useState('zip'); // 'zip' or 'a4c'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processLog, setProcessLog] = useState([]);
  const [isDone, setIsDone] = useState(false);
  const [showHomeButton, setShowHomeButton] = useState(false);
  const [triggerReset, setTriggerReset] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [selectedFile, setSelectedFile] = useState(""); // a4c 직접업로드용


  const navigate = useNavigate();

  useEffect(() => {
    if (fromRetry || triggerReset) resetState();
    // eslint-disable-next-line
  }, [fromRetry, triggerReset]);

  useEffect(() => {
    if (file && uploadProgress === 0) autoUpload();
    // eslint-disable-next-line
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
    setUploadProgress(0);
    setShowHomeButton(false);
    setTriggerReset(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFile(null);
  };

const autoUpload = async () => {
  setProcessLog((prev) => [...prev, '업로드 중...']);

  // 파일 확장자 체크
  const isZip = file?.name?.toLowerCase().endsWith('.zip');
  const isVideo = /\.(mp4|avi)$/i.test(file?.name);

  try {
    if (isZip) {
      // (1) zip 파일 업로드 및 압축해제
      const formData = new FormData();
      formData.append('file', file);
      const zipRes = await axios.post('/api/upload/zip', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        },
      });
      if (!zipRes.data.result) throw new Error('압축 해제 실패');
      setProcessLog((prev) => [...prev, '✅ 압축 해제 완료']);
      const unzipFiles = zipRes.data.unzip_files;

      // (2) 분류(classification) - 여러 영상
      setProcessLog((prev) => [...prev, 'A4C 분류 중...']);
      const classifyRes = await axios.post('/api/run/classification', { file_path: unzipFiles });
      if (!classifyRes.data.result) throw new Error('A4C 분류 실패');
      setProcessLog((prev) => [...prev, '✅ A4C 추출 완료']);

      setIsDone(true);
      setFileList(classifyRes.data.file_path); // 여러 개
    } else if (isVideo) {
      // (1) 영상 파일 업로드만 진행!
      const formData = new FormData();
      formData.append('file', file);
      const vidRes = await axios.post('/api/upload/video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        },
      });
      if (!vidRes.data.result) throw new Error('업로드 실패');
      setProcessLog((prev) => [...prev, '✅ 영상 업로드 완료']);

      setIsDone(true);
      setSelectedFile(vidRes.data.file_path); // 바로 file_path(str) 저장!
      // ⛔️ 아래 classification 관련 코드는 삭제!
    } else {
      throw new Error('지원하지 않는 파일 형식입니다.');
    }
  } catch (err) {
    setProcessLog((prev) => [...prev, '❌ 실패: ' + err.message]);
    // ...에러 처리 로직(생략)
  }
};

// 다음 버튼 핸들러
const handleNext = () => {
  const isZip = file?.name?.toLowerCase().endsWith('.zip');
  const isVideo = /\.(mp4|avi)$/i.test(file?.name);

  if (isZip) {
    navigate('/select', { state: { processLog, fileList } }); // 여러개 선택
  } else if (isVideo) {
    navigate('/result', { state: { processLog, selectedFile } }); // 바로 결과
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
          <label>
            <input type="radio" value="zip" checked={uploadType === 'zip'} onChange={() => setUploadType('zip')} />
            ZIP 파일 업로드
          </label>
          <label>
            <input type="radio" value="a4c" checked={uploadType === 'a4c'} onChange={() => setUploadType('a4c')} />
            A4C 영상 직접 업로드
          </label>
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
            accept={uploadType === 'zip' ? '.zip' : '.mp4'}
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
        <button className="next-btn" disabled={!isDone} onClick={handleNext}>다음</button>
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
