// VideoSelectPage.jsx (5p)
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import SegmentationPopup from './SegmentationPopup';
import './VideoSelectPage.css';

const VideoSelectPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prevProcessLog = (location.state && location.state.processLog) || [];
  const fileList = location.state?.fileList || []; // UploadPage에서 넘어온 파일 목록

  const [processLog, setProcessLog] = useState([...prevProcessLog]);
  const [videos, setVideos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [segResult, setSegResult] = useState(null); // segmentation API 결과 저장
  const previewTimer = useRef(null);

  // 파일 목록 세팅
  useEffect(() => {
    setVideos(fileList);
  }, [fileList]);

  // 3초 hover preview
  const handleHover = (filename) => {
    previewTimer.current = setTimeout(() => setPreview(filename), 3000);
  };
  const cancelHover = () => clearTimeout(previewTimer.current);

  // 영상 선택/취소 → ProcessLog 상태관리
  useEffect(() => {
    if (selected) {
      if (!processLog.includes('✅ A4C 영상 선택 완료!'))
        setProcessLog((prev) => [...prev, '✅ A4C 영상 선택 완료!']);
    } else {
      setProcessLog((prev) => prev.filter((l) => l !== '✅ A4C 영상 선택 완료!'));
    }
    // eslint-disable-next-line
  }, [selected]);

  // 다음: segmentation 진행
  const handleNext = async () => {
    setShowModal(true); // 팝업 오픈
    setProgress(0);
    let currLog = [...processLog];

    try {
      // 1. Segmentation 진행중...
      currLog.push('Segmentation 진행중...');
      setProcessLog([...currLog]);

      // Segmentation 요청 (파일 경로/파일명 넘기기)
      const segRes = await axios.post('/api/run/segmentation', {
        file_path: selected,
      });

      // 진행률 100% 표기 (실제 진행률 API 있다면 polling으로)
      setProgress(100);

      if (!segRes.data.result) throw new Error('Segmentation 실패');
      setSegResult(segRes.data);

      currLog.push('✅ Segmentation 완료!');
      setProcessLog([...currLog]);

      // 2. EF 계산중 (백엔드가 segmentation에서 이미 EF까지 리턴하면 생략)
      currLog.push('EF 계산중...');
      setProcessLog([...currLog]);
      // 보통 segmentation에서 EF까지 같이 오므로 딜레이만 (API 별도면 추가 호출)
      await new Promise((res) => setTimeout(res, 400));
      currLog.push('✅ EF 계산 완료!');
      setProcessLog([...currLog]);

      // 3. 결과페이지로 이동 (segResult 전체, 로그 포함)
      setTimeout(() => {
        setShowModal(false);
        navigate('/result', {
          state: {
            processLog: currLog,
            segmentationResult: segRes.data // origin_video_path, segmented_video_path, areas, es/ed, ef 등
          }
        });
      }, 600);
    } catch (err) {
      setShowModal(false);
      alert('❌ Segmentation 실패: ' + (err.message || ''));
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
