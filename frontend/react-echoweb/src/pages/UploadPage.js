// src/pages/UploadPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import SegmentationPopup from './SegmentationPopup'; // 추가!
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
  const processLogRef = useRef([]);
  const [processLog, setProcessLog] = useState([]);
  const [status, setStatus] = useState({ upload: null, unzip: null, classify: null });
  const [isDone, setIsDone] = useState(false);
  const [showHomeButton, setShowHomeButton] = useState(false);
  const [triggerReset, setTriggerReset] = useState(false);

  // Segmentation Modal
  const [showSegPopup, setShowSegPopup] = useState(false);
  const [segProgress, setSegProgress] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    if (fromRetry || triggerReset) resetState();
    // eslint-disable-next-line
  }, [fromRetry, triggerReset]);

  useEffect(() => {
    if (file && uploadProgress === 0) autoUpload();
    // eslint-disable-next-line
  }, [file]);

  useEffect(() => {
    processLogRef.current = processLog;
  }, [processLog]);

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
    setShowSegPopup(false);
    setSegProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFile(null);
  };

  // 파일 업로드 & 판별/분류
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
        // 실제 업로드 API
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

      // 업로드 방식 분기
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
        // A4C 영상 직접 업로드
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

  // --- Segmentation 진행 (SegmentationProgressModal 사용) ---
  const startSegmentation = async () => {
    setShowSegPopup(true);
    setSegProgress(0);
    setProcessLog((prev) => [...prev, 'Segmentation 진행중...']);

    if (TEST_MODE) {
      // (테스트 시나리오) 프론트 단독 - fake 진행 bar
      for (let i = 0; i <= 100; i += 8) {
        setSegProgress(i);
        await new Promise((res) => setTimeout(res, 80));
      }
      setSegProgress(100);
      setProcessLog((prev) => [...prev, '✅ Segmentation 완료!']);

      setProcessLog((prev) => [...prev, 'EF 계산중...']);
      await new Promise((res) => setTimeout(res, 700));
      setProcessLog((prev) => [...prev, '✅ EF 계산 완료!']);

      setTimeout(() => {
        setShowSegPopup(false);
        navigate('/result', { state: { processLog: processLogRef.current } });
      }, 400);
    } else {
      try {
        // (API 백엔드 연동 시나리오)
        // 1. segmentation 시작 요청 (예: POST /api/segment)
        // 업로드한 파일 id 혹은 경로, 필요한 경우 백엔드에 전달
        // 예시: const { uploadedFileId } = ...;

        // Segmentation 진행 상태를 polling 또는 websocket으로 받아야 실제 진행률 구현이 가능.
        // 여기선 polling 예시 (실제 API 설계에 따라 달라짐)
        const segmentRes = await axios.post('/api/segment', {
          // 예시: file_id: uploadedFileId
        });

        if (!segmentRes.data.success) throw new Error('Segmentation 실패');

        // 진행률 받기(polling 예시, 실제 API에 따라 달라짐)
        let progress = 0;
        while (progress < 100) {
          const { data } = await axios.get('/api/segment/progress', {
            // params: { file_id: uploadedFileId }
          });
          progress = data.progress; // (예: 0~100)
          setSegProgress(progress);
          await new Promise((res) => setTimeout(res, 200)); // polling 간격
        }
        setSegProgress(100);
        setProcessLog((prev) => [...prev, '✅ Segmentation 완료!']);

        // EF 계산 요청
        setProcessLog((prev) => [...prev, 'EF 계산중...']);
        const efRes = await axios.post('/api/calculate-ef', {
          // 예시: file_id: uploadedFileId
        });
        if (!efRes.data.success) throw new Error('EF 계산 실패');
        setProcessLog((prev) => [...prev, '✅ EF 계산 완료!']);

        setTimeout(() => {
          setShowSegPopup(false);
          // 반드시 최신 log를 넘겨야 함!
          navigate('/result', { state: { processLog: processLogRef.current } });
        }, 400);

      } catch (err) {
        setShowSegPopup(false);
        setProcessLog((prev) => [...prev, '❌ Segmentation 실패 또는 EF 계산 실패']);
        alert('서버 오류: ' + err.message);
      }
    }
  };

  // 다음 버튼
  const handleNext = () => {
    if (uploadType === 'zip') {
      navigate('/select', { state: { processLog } });
    } else {
      // A4C 영상 직접 업로드는 segmentation 바로 시작
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
