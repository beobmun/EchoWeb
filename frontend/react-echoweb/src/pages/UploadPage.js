import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import SegmentationPopup from './SegmentationPopup'; // 팝업 컴포넌트
import './UploadPage.css';

const UploadPage = () => {
  const TEST_MODE = true;
  const TEST_SCENARIO = { unzipSuccess: true, classifySuccess: true, segSuccess: true };
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

  // Segmentation modal
  const [showModal, setShowModal] = useState(false);
  const [segProgress, setSegProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (fromRetry || triggerReset) resetState();
  }, [fromRetry, triggerReset]);

  useEffect(() => {
    if (file && uploadProgress === 0) autoUpload();
  }, [file]);

  // 파일 선택/초기화
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
    setShowModal(false);
    setSegProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 자동 업로드 로직 (zip: 기존과 동일, a4c: 판별 후 segmentation→result)
  const autoUpload = async () => {
    setProcessLog((prev) => [...prev, '업로드 중...']);
    setStatus((prev) => ({ ...prev, upload: 'loading' }));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', uploadType);

    try {
      let upload_id = 'UPLOAD_ID_SAMPLE';

      // 1. 업로드
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
        upload_id = res.data.upload_id;
        setStatus((prev) => ({ ...prev, upload: 'success' }));
        setProcessLog((prev) => [...prev, `✅ 업로드 완료 (ID: ${upload_id})`]);
      }

      // 2. 분기
      if (uploadType === 'zip') {
        // 기존 ZIP 업로드 경로 (압축해제, 추출, 다음)
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
          const unzipRes = await axios.post('/api/unzip', { upload_id });
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
          const classifyRes = await axios.post('/api/classify-a4c', { upload_id });
          if (classifyRes.data.success) {
            setStatus((prev) => ({ ...prev, classify: 'success' }));
            setProcessLog((prev) => [...prev, '✅ A4C 추출 완료']);
          } else {
            throw new Error('A4C 추출 실패');
          }
        }
        setIsDone(true); // 다음 버튼 활성화 (select로 이동)

      } else {
        // A4C 영상 직접 업로드: A4C 판별 -> 성공 시 segmentation → result 바로 이동
        setProcessLog((prev) => [...prev, 'A4C 판별 중...']);
        let isA4c = false;
        if (TEST_MODE) {
          await new Promise((res) => setTimeout(res, 1000));
          isA4c = TEST_SCENARIO.classifySuccess;
        } else {
          const checkRes = await axios.post('/api/check-a4c', { upload_id });
          isA4c = checkRes.data.is_a4c;
        }

        if (!isA4c) {
          throw new Error('A4C 영상이 아닙니다');
        }
        setStatus((prev) => ({ ...prev, classify: 'success' }));
        setProcessLog((prev) => [...prev, '✅ A4C 영상 확인됨']);

        // Segmentation 즉시 시작 (팝업/진행 상황/완료시 result로 이동)
        setTimeout(() => startSegmentation(upload_id), 300);
        return; // 아래 setIsDone은 zip에서만!
      }
    } catch (err) {
      console.error(err);
      setProcessLog((prev) => [...prev, '❌ 실패']);
      const retry = window.confirm(`오류 발생: ${err.message}\n다시 시도하시겠습니까?`);
      if (retry) setTriggerReset(true);
      else setShowHomeButton(true);
    }
  };

  // Segmentation + EF 계산 (팝업, log 갱신, 완료시 result 이동)
  const startSegmentation = async (upload_id) => {
    setShowModal(true);
    setSegProgress(0);
    let currLog = [...processLog, 'Segmentation 진행중...'];
    setProcessLog(currLog);

    try {
      if (TEST_MODE) {
        // Progress (가짜)
        for (let i = 1; i <= 100; i += 10) {
          await new Promise((res) => setTimeout(res, 120));
          setSegProgress(i);
        }
        currLog.push('Segmentation 완료!');
        setProcessLog([...currLog]);
        // EF 계산
        currLog.push('EF 계산중...');
        setProcessLog([...currLog]);
        for (let i = 0; i < 5; i++) await new Promise((res) => setTimeout(res, 200));
        currLog.push('EF 계산 완료!');
        setProcessLog([...currLog]);
      } else {
        // 실제 API
        await axios.post('/api/a4c/segmentation', { upload_id });
        let done = false, percent = 0;
        while (!done) {
          const { data } = await axios.get('/api/segmentation/progress');
          percent = data.progress;
          setSegProgress(percent);
          if (data.message && !currLog.includes(data.message)) {
            currLog.push(data.message);
            setProcessLog([...currLog]);
          }
          done = percent >= 100;
          await new Promise((res) => setTimeout(res, 400));
        }
        currLog.push('Segmentation 완료!');
        setProcessLog([...currLog]);
        // EF 계산
        currLog.push('EF 계산중...');
        setProcessLog([...currLog]);
        await axios.get('/api/segmentation/ef');
        currLog.push('EF 계산 완료!');
        setProcessLog([...currLog]);
      }
      setTimeout(() => {
        setShowModal(false);
        navigate('/result', { state: { processLog: currLog } });
      }, 600);
    } catch (err) {
      setShowModal(false);
      alert('Segmentation 실패! ' + (err.message || ''));
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
            <input type="radio" value="zip" checked={uploadType === 'zip'} onChange={() => setUploadType('zip')} /> ZIP 파일 업로드
          </label>
          <label>
            <input type="radio" value="a4c" checked={uploadType === 'a4c'} onChange={() => setUploadType('a4c')} /> A4C 영상 직접 업로드
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
        <button className="next-btn" disabled={!isDone} onClick={() => navigate('/select', { state: { processLog } })}>
          다음
        </button>
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
      {showModal && <SegmentationPopup progress={segProgress} />}
    </div>
  );
};

export default UploadPage;
