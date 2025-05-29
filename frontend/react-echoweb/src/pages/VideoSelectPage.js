// src/pages/VideoSelectPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './VideoSelectPage.css';

const VideoSelectPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 4p에서 받은 데이터
  const prevProcessLog = (location.state && location.state.processLog) || [];
  const fileList = (location.state && location.state.fileList) || [];

  const [processLog, setProcessLog] = useState([...prevProcessLog]);
  const [videos, setVideos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null);
  const previewTimer = useRef(null);

  // fileList를 곧바로 setVideos (mount될 때 1회만)
  useEffect(() => {
    setVideos(fileList);
  }, [fileList]);

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
    // eslint-disable-next-line
  }, [selected]);

  // "다음" 버튼 클릭 시
  const handleNext = () => {
    // ResultPage에 선택한 영상 경로 + 로그 넘김
    navigate('/result', { state: { processLog, selectedFile: selected } });
  };

  return (
    <div className="video-select-container">
      <h1 className="title">Video Select</h1>
      <p className="subtitle">아래 분류된 A4C 영상 중 원하시는 영상을 하나만 선택해주세요.</p>
      <div className="video-grid">
        {videos.length === 0 && <div>불러온 영상이 없습니다.</div>}
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

      {/* 영상 preview */}
      {preview && (
        <div className="preview-modal" onClick={e => e.stopPropagation()}>
          <video src={preview} controls autoPlay loop />
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
    </div>
  );
};

export default VideoSelectPage;
