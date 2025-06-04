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
        // 1. 업로드 단계 (progress: 0~50%)
        const formData = new FormData();
        formData.append('file', file);
        const zipRes = await axios.post('/api/upload/zip', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent); // (옵션, 숨길 수도 있음)
            setTotalProgress(percent * PHASE.upload); // 0~50%
          },
        });
        setTotalProgress(50);

        if (!zipRes.data.result) throw new Error('압축 해제 실패');
        setProcessLog((prev) => [...prev, '✅ 압축 해제 완료']);
        const unzipFiles = zipRes.data.unzip_files;

        // 2. 압축해제 단계 (progress: 50~75% 애니메이션)
        let unzipProg = 51;
        while (unzipProg <= 75) {
          setTotalProgress(unzipProg);
          await new Promise(res => setTimeout(res, 12)); // 빠르게 효과
          unzipProg += 3;
        }
        setTotalProgress(75);

        // 3. classification 단계 (progress: 75~100% 애니메이션)
        setProcessLog((prev) => [...prev, 'A4C 분류 중...']);
        let classifyProg = 76;
        // classification api 진짜 요청
        const classifyResPromise = axios.post('/api/run/classification', { video_paths: unzipFiles });

        // 애니메이션: 분류가 느릴때 체감 효과
        while (classifyProg < 100) {
          setTotalProgress(classifyProg);
          await new Promise(res => setTimeout(res, 22));
          classifyProg += 2;
        }
        // classification 결과 받기
        const classifyRes = await classifyResPromise;
        setTotalProgress(100);

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
        {file && (
          <div className="progress-bar">
            <div className="progress" style={{ width: `${uploadProgress}%` }}></div>
            <span>{Math.round(totalProgress)}%</span>
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
