// src/pages/UploadPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import './UploadPage.css';

const UploadPage = () => {
  // 🔹 테스트/실서비스 분기
  const TEST_MODE = true;
  const TEST_SCENARIO = { unzipSuccess: true, classifySuccess: true };

  const location = useLocation();
  const fromRetry = location.state?.fromRetry;
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [uploadType, setUploadType] = useState('zip'); // 'zip' or 'a4c'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processLog, setProcessLog] = useState([]);
  const [status, setStatus] = useState({ upload: null, unzip: null, classify: null });
  const [isDone, setIsDone] = useState(false);
  const [showHomeButton, setShowHomeButton] = useState(false);
  const [triggerReset, setTriggerReset] = useState(false);

  // Segmentation popup state
  const [showSegPopup, setShowSegPopup] = useState(false);
  const [segProgress, setSegProgress] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    if (fromRetry || triggerReset) {
      resetState();
    }
    // eslint-disable-next-line
  }, [fromRetry, triggerReset]);

  useEffect(() => {
    if (file && uploadProgress === 0) {
      autoUpload();
    }
    // eslint-disable-next-line
  }, [file]);

  // 파일 선택/드래그 드롭 핸들러
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(null); // 동일 파일 반복 업로드 위해
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
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFile(null);
  };

  // 파일 업로드/판별/분류 등 API 연동 또는 테스트 로직
  const autoUpload = async () => {
    setProcessLog((prev) => [...prev, '업로드 중...']);
    setStatus((prev) => ({ ...prev, upload: 'loading' }));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', uploadType);

    try {
      if (TEST_MODE) {
        await new Promise((res) => setTimeout(res, 700));
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

      // ZIP 업로드와 A4C 직접 업로드 분기
      if (uploadType === 'zip') {
        setProcessLog((prev) => [...prev, '압축 해제 중...']);
        if (TEST_MODE) {
          await new Promise((res) => setTimeout(res, 700));
          if (TEST_SCENARIO.unzipSuccess) {
            setStatus((prev) => ({ ...prev, unzip: 'success' }));
            setProcessLog((prev) => [...prev, '✅ 압축 해제 완료 (테스트 모드)']);
          } else throw new Error('압축 해제 실패 (테스트 모드)');
        } else {
          const unzipRes = await axios.post('/api/unzip', { upload_id: 'UPLOAD_ID_SAMPLE' });
          if (unzipRes.data.success) {
            setStatus((prev) => ({ ...prev, unzip: 'success' }));
            setProcessLog((prev) => [...prev, '✅ 압축 해제 완료']);
          } else throw new Error('압축 해제 실패');
        }
        setProcessLog((prev) => [...prev, 'A4C 뷰 추출 중...']);
        if (TEST_MODE) {
          await new Promise((res) => setTimeout(res, 700));
          if (TEST_SCENARIO.classifySuccess) {
            setStatus((prev) => ({ ...prev, classify: 'success' }));
            setProcessLog((prev) => [...prev, '✅ A4C 추출 완료 (테스트 모드)']);
          } else throw new Error('A4C 추출 실패 (테스트 모드)');
        } else {
          const classifyRes = await axios.post('/api/classify-a4c', { upload_id: 'UPLOAD_ID_SAMPLE' });
          if (classifyRes.data.success) {
            setStatus((prev) => ({ ...prev, classify: 'success' }));
            setProcessLog((prev) => [...prev, '✅ A4C 추출 완료']);
          } else throw new Error('A4C 추출 실패');
        }
      } else {
        // A4C 영상 직접 업로드 - 판별만 진행
        setProcessLog((prev) => [...prev, 'A4C 판별 중...']);
        if (TEST_MODE) {
          await new Promise((res) => setTimeout(res, 900));
          if (TEST_SCENARIO.classifySuccess) {
            setStatus((prev) => ({ ...prev, classify: 'success' }));
            setProcessLog((prev) => [...prev, '✅ A4C 영상 확인됨']);
          } else throw new Error('A4C 영상이 아님 (테스트 모드)');
        } else {
          const checkRes = await axios.post('/api/check-a4c', { upload_id: 'UPLOAD_ID_SAMPLE' });
          if (checkRes.data.is_a4c) {
            setStatus((prev) => ({ ...prev, classify: 'success' }));
            setProcessLog((prev) => [...prev, '✅ A4C 영상 확인됨']);
          } else throw new Error('A4C 영상이 아닙니다');
        }
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

  // 세그멘테이션 팝업 띄우고, 진행 bar/로그 추가 → 완료시 result로 이동
  const startSegmentation = async () => {
    setShowSegPopup(true);
    setSegProgress(0);

    setProcessLog((prev) => [...prev, 'Segmentation 진행중...']);
    for (let i = 0; i <= 100; i += 8) {
      setSegProgress(i);
      await new Promise((res) => setTimeout(res, 90));
    }
    setSegProgress(100);
    setProcessLog((prev) => [...prev, '✅ Segmentation 완료!']);

    setProcessLog((prev) => [...prev, 'EF 계산중...']);
    await new Promise((res) => setTimeout(res, 700));
    setProcessLog((prev) => [...prev, '✅ EF 계산 완료!']);

    setTimeout(() => {
      setShowSegPopup(false);
      navigate('/result');
    }, 700);
  };

  // 다음 버튼 클릭 핸들러 (zip/a4c 별 분기)
  const handleNext = () => {
    // zip은 /select로, a4c는 segmentation 진행
    if (uploadType === 'zip') {
      // ZIP파일 → 분류(5p)로 이동(이동시 로그도 전달)
      navigate('/select', { state: { processLog } });
    } else {
      // A4C영상 직접 업로드 → segmentation 바로 시작
      startSegmentation();
    }
  };

  // 팝업 오버레이에서 이벤트 전파 방지
  const stopPropagation = (e) => e.stopPropagation();

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

      {/* --- Segmentation 팝업 : 진행 bar만 보여주기 --- */}
      {showSegPopup && (
        <div className="popup-overlay" onClick={stopPropagation}>
          <div className="popup-content" onClick={stopPropagation}>
            <h1 style={{ fontSize: 42, fontWeight: 800, marginBottom: 15 }}>Segmentation 진행중...</h1>
            <p style={{ color: '#aaa' }}>segmentation이 진행중입니다. 시간이 소요될 수 있으니 잠시만 기다려 주십시오.</p>
            <div style={{ margin: '40px 0 16px' }}>
              <div style={{ background: '#eaeaea', borderRadius: 12, height: 20, width: 420, position: 'relative' }}>
                <div style={{
                  height: '100%',
                  width: `${segProgress}%`,
                  background: '#5073ec',
                  borderRadius: 12,
                  transition: 'width 0.2s',
                  position: 'absolute', left: 0, top: 0
                }} />
                <span style={{
                  position: 'absolute', right: 20, top: '2px', color: '#222', fontWeight: 600, fontSize: 17
                }}>{segProgress}%</span>
              </div>
            </div>
            {/* 여기엔 로그 X! */}
          </div>
        </div>
      )}

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
