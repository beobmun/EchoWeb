// 5p VideoSelectPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './VideoSelectPage.css';

const VideoSelectPage = () => {
  const TEST_MODE = true;

  const navigate = useNavigate();
  const location = useLocation();
  // 4p에서 넘어온 processLog(배열) props
  const prevProcessLog = (location.state && location.state.processLog) || [];

  const [videos, setVideos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null);
  const [processLog, setProcessLog] = useState([...prevProcessLog]);
  const previewTimer = useRef(null);

  useEffect(() => {
    const fetchVideos = async () => {
      if (TEST_MODE) {
        setVideos([
          'A4C_001.mp4', 'A4C_002.mp4', 'A4C_003.mp4',
          'A4C_004.mp4', 'A4C_005.mp4', 'A4C_006.mp4',
          'A4C_007.mp4', 'A4C_008.mp4', 'A4C_009.mp4',
        ]);
      } else {
        try {
          const res = await axios.get('/api/a4c/list');
          setVideos(res.data.videos);
        } catch (err) {
          setProcessLog(logs => [...logs, "❌ 영상 목록 불러오기 실패"]);
        }
      }
    };

    fetchVideos();

    const handleOutsideClick = () => setPreview(null);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
    // eslint-disable-next-line
  }, []);

  // 영상 선택(혹은 취소) 시 ProcessLog 수정
  useEffect(() => {
    if (selected) {
      // 이미 추가되어 있으면 또 추가하지 않음
      if (!processLog.includes('✅ A4C영상 선택 완료!')) {
        setProcessLog(logs => [...logs, '✅ A4C영상 선택 완료!']);
      }
    } else {
      // 선택 취소 시 마지막 문구만 삭제
      setProcessLog(logs => {
        if (logs.length && logs[logs.length - 1] === '✅ A4C영상 선택 완료!') {
          return logs.slice(0, -1);
        }
        return logs;
      });
    }
    // eslint-disable-next-line
  }, [selected]);

  const handleHover = (filename) => {
    previewTimer.current = setTimeout(() => setPreview(filename), 3000);
  };

  const cancelHover = () => {
    clearTimeout(previewTimer.current);
  };

  const handleSelect = (filename) => {
    setSelected(filename === selected ? null : filename);
    setPreview(null);
  };

  const handleNext = async () => {
    try {
      if (!TEST_MODE) {
        // 백엔드에 선택 영상 전달
        const res = await axios.post('/api/a4c/select', {
          filename: selected,
        });

        if (!res.data.success) {
          setProcessLog((logs) => [...logs, "❌ 백엔드 선택 처리 실패"]);
          alert('백엔드에서 선택 처리 실패');
          return;
        }
      }

      // 다음 페이지 이동 (processLog도 함께 넘김)
      navigate('/result', { state: { processLog } });
    } catch (err) {
      setProcessLog((logs) => [...logs, "❌ 서버 오류로 선택 전송 실패"]);
      alert('서버 오류로 선택 전송 실패');
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
              handleSelect(video);
            }}
          >
            <div className="file-name">📄 {video}</div>
            <div className="play-icon">▶</div>
          </div>
        ))}
      </div>

      <button className="next-btn" disabled={!selected} onClick={handleNext}>다음</button>

      {preview && (
        <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
          <video src={`./videos/${preview}`} controls autoPlay loop />
        </div>
      )}

      {/* Process Log 그대로 표시 */}
      <div className="process-log">
        <h3>Process Log</h3>
        <ul>
          {processLog.map((log, i) => (
            <li key={i}>{log}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default VideoSelectPage;
