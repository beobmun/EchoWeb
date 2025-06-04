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
  const [uploadType, setUploadType] = useState('zip');
  const [uploadProgress, setUploadProgress] = useState(0); // <- 기존(개별 progress)
  const [totalProgress, setTotalProgress] = useState(0);   // <- "전체단계" progress
  const [progressPhase, setProgressPhase] = useState(null); // 'upload', 'classify', null
  const [progressValue, setProgressValue] = useState(0);

  const [processLog, setProcessLog] = useState([]);
  const [isDone, setIsDone] = useState(false);
  const [showHomeButton, setShowHomeButton] = useState(false);
  const [triggerReset, setTriggerReset] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [selectedFile, setSelectedFile] = useState(""); // a4c 직접업로드용

  const [showSegPopup, setShowSegPopup] = useState(false);
  const [segVideoPath, setSegVideoPath] = useState('');
  const [finalResult, setFinalResult] = useState(null);

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
    setTotalProgress(0); // ← 전체 progress도 리셋!
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

    // 단계별 progress weight
    const PHASE = {
      upload: 0.5,    // 업로드: 50%
      unzip: 0.25,    // 압축해제: 25%
      classify: 0.25  // classification: 25%
    };

    try {
      if (isZip) {
        // (1) 업로드+압축해제
        setProgressPhase('upload');
        setProgressValue(0);

        const formData = new FormData();
        formData.append('file', file);
        const zipRes = await axios.post('/api/upload/zip', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgressValue(percent);
          },
        });
        // 압축해제 애니메이션 (업로드 끝나면 약 1~2초 간격으로 100까지)
        let decompress = progressValue;
        while (decompress < 100) {
        await new Promise(res => setTimeout(res, 80)); // 약간씩 느리게
        decompress += 5;
        setProgressValue(decompress > 100 ? 100 : decompress);
        } 
        setProgressValue(100);
        setProgressPhase(null);

        if (!zipRes.data.result) throw new Error('압축 해제 실패');
        setProcessLog((prev) => [...prev, '✅ 압축 해제 완료']);
        const unzipFiles = zipRes.data.unzip_files;

        // (2) 분류 단계로 진입!
        setProgressPhase('classify');
        setProgressValue(0);

        // classification 실제 요청 보내기
        setProcessLog((prev) => [...prev, 'A4C 분류 중...']);
        let progress = 0;
        const classifyResPromise = axios.post('/api/run/classification', { video_paths: zipRes.data.unzip_files });

        // 60초 정도에 맞춰서 천천히 100까지 올라가는 애니메이션
        for (let i = 0; i < 60; i++) {
          await new Promise(res => setTimeout(res, 1000)); // 1초에 1% 정도
          progress += 1.7; // 1분 동안 100%로 근접 (조절 가능)
          setProgressValue(progress > 100 ? 100 : progress);
        }
        const classifyRes = await classifyResPromise;
        setProgressValue(100);
        setProgressPhase(null);

        if (!classifyRes.data.result) throw new Error('A4C 분류 실패');
        setProcessLog((prev) => [...prev, '✅ A4C 추출 완료']);

        setIsDone(true);
        setFileList(classifyRes.data.video_paths);

      } else if (isVideo) {
        // (A4C 업로드는 업로드 단계만 bar)
        const formData = new FormData();
        formData.append('file', file);
        const vidRes = await axios.post('/api/upload/video', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
            setTotalProgress(percent); // 0~100%
          },
        });
        setTotalProgress(100);

        if (!vidRes.data.result) throw new Error('업로드 실패');
        setProcessLog((prev) => [...prev, '✅ 영상 업로드 완료']);

        setIsDone(true);
        setSelectedFile(vidRes.data.video_path);
      } else {
        throw new Error('지원하지 않는 파일 형식입니다.');
      }
    } catch (err) {
      setProcessLog((prev) => [...prev, '❌ 실패: ' + err.message]);
    }
  };

  // 다음 버튼 핸들러
  const handleNext = () => {
    const isZip = file?.name?.toLowerCase().endsWith('.zip');
    const isVideo = /\.(mp4|avi)$/i.test(file?.name);

    if (isZip) {
      navigate('/select', { state: { processLog, fileList } });
    } else if (isVideo) {
      // SegmentationPopup 띄우기
      setSegVideoPath(selectedFile);
      setShowSegPopup(true);
    }
  };

  // SegmentationPopup 완료 시 ResultPage로 이동
  const handleSegmentationComplete = ({ result, processLog: updatedLog }) => {
    setShowSegPopup(false);
    setFinalResult(result);
    // ResultPage로 이동, segmentation 결과, 로그 함께 전달
    navigate('/result', { state: { processLog: updatedLog, segmentationResult: result } });
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
        {progressPhase === 'upload' && (
          <div className="progress-bar">
            <div className="progress" style={{ width: `${progressValue}%` }}></div>
            <span>{Math.round(progressValue)}%</span>
            <span className="progress-label">업로드/압축해제 진행중...</span>
          </div>
        )}
        {progressPhase === 'classify' && (
          <div className="progress-bar">
            <div className="progress" style={{ width: `${progressValue}%` }}></div>
            <span>{Math.round(progressValue)}%</span>
            <span className="progress-label">A4C 분류 진행중...</span>
          </div>
        )}
        <button className="next-btn" disabled={!isDone} onClick={handleNext}>다음</button>
      </div>
      {showSegPopup && (
        <SegmentationPopup
          videoPath={segVideoPath}
          processLog={processLog}
          onComplete={handleSegmentationComplete}
        />
      )}
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
