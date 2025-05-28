// VideoSelectPage.jsx (5p)
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import SegmentationPopup from './SegmentationPopup';
import './VideoSelectPage.css';

const TEST_MODE = true; // true: 프론트 단독 테스트 / false: 백엔드 API 연동

const VideoSelectPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prevProcessLog = (location.state && location.state.processLog) || [];
  const [processLog, setProcessLog] = useState([...prevProcessLog]);
  const [videos, setVideos] = useState(location.state?.fileList ?? []);
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const previewTimer = useRef(null);

  // location.state.fileList가 바뀌면 업데이트
  useEffect(() => {
    if (location.state?.fileList) {
      setVideos(location.state.fileList);
    } else if (TEST_MODE) {
      setVideos([
        'A4C_001.mp4', 'A4C_002.mp4', 'A4C_003.mp4',
        'A4C_004.mp4', 'A4C_005.mp4', 'A4C_006.mp4',
        'A4C_007.mp4', 'A4C_008.mp4', 'A4C_009.mp4',
      ]);
    }
    // 👇 get은 사용하지 않음!
    // else { axios.get... }
  }, [location.state?.fileList]);

  // 3초 hover preview
  const handleHover = (filename) => {
    previewTimer.current = setTimeout(() => setPreview(filename), 3000);
  };
  const cancelHover = () => clearTimeout(previewTimer.current);

  // 영상 선택/선택취소 (ProcessLog도 관리)
  useEffect(() => {
    if (selected) {
      if (!processLog.includes('✅ A4C 영상 선택 완료!')) setProcessLog((prev) => [...prev, '✅ A4C 영상 선택 완료!']);
    } else {
      setProcessLog((prev) => prev.filter((l) => l !== '✅ A4C 영상 선택 완료!'));
    }
  }, [selected]);

  // 다음: segmentation 진행
  const handleNext = async () => {
    setShowModal(true); // 팝업 오픈
    setProgress(0);
    let currLog = processLog.slice();

    try {
      // 1. Segmentation 진행중...
      currLog.push('Segmentation 진행중...');
      setProcessLog([...currLog]);
      if (TEST_MODE) {
        // Progress bar 0~100%
        for (let i = 1; i <= 100; i += 10) {
          await new Promise((res) => setTimeout(res, 100));
          setProgress(i);
        }
        currLog.push('✅ Segmentation 완료!');
        setProcessLog([...currLog]);

        // 2. EF 계산중...
        currLog.push('EF 계산중...');
        setProcessLog([...currLog]);
        for (let i = 0; i < 5; i++) {
          await new Promise((res) => setTimeout(res, 200));
        }
        currLog.push('✅ EF 계산 완료!');
        setProcessLog([...currLog]);

      } else {
        // 실제 API 연동
        // 선택된 영상명 전송, 백엔드 segmentation 요청
        await axios.post('/api/a4c/segment', { filename: selected });
        // segmentation 진행 상황 가져오기, progress & log 상태 갱신
        let done = false, percent = 0;
        while (!done) {
          const { data } = await axios.get('/api/segment/progress');
          percent = data.progress; // 백엔드에서 {progress, message, step} 반환하도록 구현
          setProgress(percent);
          if (data.message && !currLog.includes(data.message)) {
            currLog.push(data.message);
            setProcessLog([...currLog]);
          }
          done = percent >= 100;
          await new Promise((res) => setTimeout(res, 400));
        }
        currLog.push('✅ Segmentation 완료!');
        setProcessLog([...currLog]);

        // EF 계산 시작/완료
        currLog.push('EF 계산중...');
        setProcessLog([...currLog]);
        await axios.post('/api/segmentation/ef');
        currLog.push('✅ EF 계산 완료!');
        setProcessLog([...currLog]);
      }

      // 3. 결과페이지로 자동 이동
      setTimeout(() => navigate('/result', { state: { processLog: currLog } }), 600);
    } catch (err) {
      setShowModal(false);
      alert('❌ Segmentation 실패 ' + (err.message || ''));
    }
  };

  return (
    <div className="video-select-container">
      <h1 className="title">Video Select</h1>
      <p className="subtitle">아래 분류된 A4C 영상 중 원하시는 영상을 하나만 선택해주세요.</p>
      <div className="video-grid">
        {videos.map((video, idx) => (
          <div
            key={idx}
            className={`video-card ${selected === video ? 'selected' : ''}`}
            onMouseEnter={() => handleHover(video)}
            onMouseLeave={cancelHover}
            onClick={(e) => {
              e.stopPropagation();
              setSelected(video === selected ? null : video);
              setPreview(null);
            }}
          >
            <div className="file-name">📄 {video}</div>
            <div className="play-icon">▶</div>
          </div>
        ))}
      </div>
      
      {/* 다음 버튼 */}
      <button className="next-btn" disabled={!selected} onClick={handleNext}>다음</button>

      {preview && (
        <div className="preview-modal" onClick={e => e.stopPropagation()}>
          <video src={`./videos/${preview}`} controls autoPlay loop />
        </div>
      )}

      {/* Process Log */}
      <div className="process-log">
        <h3>Process Log</h3>
        <ul>
          {processLog.map((log, idx) => (
            <li key={idx}>{log}</li>
          ))}
        </ul>
      </div>

      {/* Segmentation 진행중 모달 */}
      {showModal && <SegmentationPopup progress={progress} />}
    </div>
  );
};

export default VideoSelectPage;
