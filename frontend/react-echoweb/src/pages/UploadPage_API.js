// src/pages/UploadPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import SegmentationPopup from './SegmentationPopup';
import './UploadPage.css';

const UploadPage = () => {
  const location = useLocation();
  const fromRetry = location.state?.fromRetry;
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [uploadType, setUploadType] = useState('zip'); // 'zip' or 'a4c'
  const [uploadProgress, setUploadProgress] = useState(0);
  const processLogRef = useRef([]);
  const [processLog, setProcessLog] = useState([]);
  const [status, setStatus] = useState({ upload: null, unzip: null, classify: null });
  const [isDone, setIsDone] = useState(false);
  const [showHomeButton, setShowHomeButton] = useState(false);
  const [triggerReset, setTriggerReset] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [singleA4CPath, setSingleA4CPath] = useState('');
  const [showSegPopup, setShowSegPopup] = useState(false);
  const [segProgress, setSegProgress] = useState(0);

  const navigate = useNavigate();

  useEffect(() => { if (fromRetry || triggerReset) resetState(); }, [fromRetry, triggerReset]);
  useEffect(() => { if (file && uploadProgress === 0) autoUpload(); }, [file]);
  useEffect(() => { processLogRef.current = processLog; }, [processLog]);

  // 파일 업로드 핸들러 (중복업로드 허용)
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

  // 상태 초기화
  const resetState = () => {
    setIsDone(false);
    setProcessLog([]);
    setStatus({ upload: null, unzip: null, classify: null });
    setUploadProgress(0);
    setShowHomeButton(false);
    setTriggerReset(false);
    setShowSegPopup(false);
    setSegProgress(0);
    setFileList([]);
    setSingleA4CPath('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFile(null);
  };

  // 파일 업로드 → 분류 (실제 API 연동)
  const autoUpload = async () => {
    setProcessLog((prev) => [...prev, '업로드 중...']);
    setStatus((prev) => ({ ...prev, upload: 'loading' }));

    const formData = new FormData();
    formData.append('file', file);

    try {
      let uploadRes;
      if (uploadType === 'zip') {
        // ZIP 업로드+압축해제
        uploadRes = await axios.post('/api/upload/zip', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          },
        });
        if (!uploadRes.data.result) throw new Error('❌ 업로드/압축해제 실패');
        setStatus((prev) => ({ ...prev, upload: 'success', unzip: 'success' }));
        setProcessLog((prev) => [...prev, '✅ 업로드/압축해제 완료']);

        // 분류: 압축해제된 파일들을 API로 보냄
        setProcessLog((prev) => [...prev, 'A4C 뷰 추출 중...']);
        const classifyRes = await axios.post('/api/run/classification', {
          unzip_files: uploadRes.data.unzip_files,
        });
        if (!classifyRes.data.result) throw new Error('❌ A4C 추출 실패');
        setStatus((prev) => ({ ...prev, classify: 'success' }));
        setProcessLog((prev) => [...prev, '✅ A4C 추출 완료']);
        setFileList(classifyRes.data.file_path);
      } else {
        // A4C 영상 직접 업로드
        uploadRes = await axios.post('/api/upload/video', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          },
        });
        if (!uploadRes.data.result) throw new Error('❌ 업로드 실패');
        setStatus((prev) => ({ ...prev, upload: 'success' }));
        setProcessLog((prev) => [...prev, '✅ 업로드 완료']);

        // A4C 판별
        setProcessLog((prev) => [...prev, 'A4C 판별 중...']);
        const classifyRes = await axios.post('/api/run/classification', {
          unzip_files: [uploadRes.data.file_path],
        });
        if (!classifyRes.data.result) throw new Error('❌ A4C 판별 실패');
        setStatus((prev) => ({ ...prev, classify: 'success' }));
        setProcessLog((prev) => [...prev, '✅ A4C 영상 확인됨']);
        setSingleA4CPath(classifyRes.data.file_path[0]);
      }
      setIsDone(true);
    } catch (err) {
      console.error(err);
      setProcessLog((prev) => [...prev, '❌ 실패']);
      const retry = window.confirm(`오류 발생: ${err.message}\n다시 시도하시겠습니까?`);
      if (retry) setTriggerReset(true);
      else setShowHomeButton(true);
    }
  };

  // --- Segmentation (A4C 직접 업로드 → segmentation) ---
  const startSegmentation = async () => {
    setShowSegPopup(true);
    setSegProgress(0);
    setProcessLog((prev) => [...prev, 'Segmentation 진행중...']);

    try {
      // 실제 Segmentation 요청
      const segRes = await axios.post('/api/run/segmentation', {
        file_path: singleA4CPath,
      });

      if (!segRes.data.result) throw new Error('❌ Segmentation 실패');

      // 진행률 100%로 표기(실서비스는 실제 진행률 받을 수도 있음)
      setSegProgress(100);
      setProcessLog((prev) => [...prev, '✅ Segmentation 완료!']);
      setProcessLog((prev) => [...prev, 'EF 계산중...']);
      // EF계산이 별도면 여기서 추가 요청(아니면 sleep만)
      await new Promise((res) => setTimeout(res, 500));
      setProcessLog((prev) => [...prev, '✅ EF 계산 완료!']);

      setTimeout(() => {
        setShowSegPopup(false);
        // segmentation 결과 전체를 result페이지로 넘김
        navigate('/result', {
          state: {
            processLog: processLogRef.current,
            segmentationResult: segRes.data,
          }
        });
      }, 400);
    } catch (err) {
      setShowSegPopup(false);
      setProcessLog((prev) => [...prev, '❌ Segmentation 실패 or EF 계산 실패']);
      alert('서버 오류: ' + err.message);
    }
  };

  // 다음 버튼
  const handleNext = () => {
    if (uploadType === 'zip') {
      navigate('/select', { state: { processLog, fileList } });
    } else {
      startSegmentation();
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
        <button className="next-btn" disabled={!isDone} onClick={handleNext}>다음</button>
      </div>
      {/* === SegmentationProgressModal만 보여줌 === */}
      {showSegPopup && <SegmentationPopup progress={segProgress} />}
      {/* --- Process Log --- */}
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
