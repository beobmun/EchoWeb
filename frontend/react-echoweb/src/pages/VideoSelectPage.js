// 5p VideoSelectPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './VideoSelectPage.css';

const VideoSelectPage = () => {
  const TEST_MODE = true; // ✅ true: 프론트 단독 테스트 / false: 백엔드 API 연동

  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null);
  const previewTimer = useRef(null);

  useEffect(() => {
    const fetchVideos = async () => {
      if (TEST_MODE) {
        // ✅ 테스트용 A4C 영상 리스트
        setVideos([
          'A4C_001.mp4', 'A4C_002.mp4', 'A4C_003.mp4',
          'A4C_004.mp4', 'A4C_005.mp4', 'A4C_006.mp4',
          'A4C_007.mp4', 'A4C_008.mp4', 'A4C_009.mp4',
        ]);
      } else {
        // ✅ 실제 백엔드에서 A4C 영상 목록 불러오기 API
        try {
          const res = await axios.get('/api/a4c/list');
          setVideos(res.data.videos);
        } catch (err) {
          console.error('영상 목록 불러오기 실패:', err);
        }
      }
    };

    fetchVideos();

    const handleOutsideClick = () => setPreview(null);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

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
        // ✅ 선택된 영상 파일명을 백엔드로 전송
        const res = await axios.post('/api/a4c/select', {
          filename: selected,
        });

        if (!res.data.success) {
          alert('백엔드에서 선택 처리 실패');
          return;
        }
      }

      console.log('선택된 영상:', selected); // 테스트용 출력
      navigate('/result');
    } catch (err) {
      console.error(err);
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

      {preview && (
        <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
          <video src={`./videos/${preview}`} controls autoPlay loop />
        </div>
      )}

      <button className="next-btn" disabled={!selected} onClick={handleNext}>다음</button>
    </div>
  );
};

export default VideoSelectPage;
