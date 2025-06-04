import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './SegmentationPopup.css';

const SegmentationPopup = ({ videoPath, processLog, onComplete }) => {
  const [progress, setProgress] = useState(10);
  const [localLog, setLocalLog] = useState([...processLog]);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!videoPath) return;

    let running = true;

    // 1. Progress 애니메이션 (진짜 완료 전까지 95%까지 천천히 올림)
    timerRef.current = setInterval(() => {
      setProgress(prev => {
        if (!running) return prev;
        // 95%까지만 서서히 상승
        if (prev < 95) {
          // 속도 조절: 진행될수록 느려지게
          const next = prev + Math.max(0.3, 2 - prev / 80);
          return Math.min(next, 95);
        }
        return prev;
      });
    }, 80);

    // 2. Segmentation 실제 요청
    const runSegmentation = async () => {
      let nextLog = [...processLog]; // 항상 append 용으로 직접 관리!

      try {
        nextLog.push('Segmentation 진행중...');
        setLocalLog([...nextLog]);
        const res = await axios.get('/api/run/segmentation', {
          params: { video_path: videoPath }
        });
        running = false; // 진행 중지
        clearInterval(timerRef.current);
        setProgress(100);
        nextLog.push('✅ Segmentation 완료!', 'EF 계산중...');
        setLocalLog([...nextLog]);
        setTimeout(() => {
          nextLog.push('✅ EF 계산 완료!');
          setLocalLog([...nextLog]);
          setTimeout(() => {
            onComplete({
              result: res.data,
              processLog: nextLog, // 가장 최신 상태로!
            });
          }, 500);
        }, 500);
      } catch (err) {
        running = false;
        clearInterval(timerRef.current);
        setProgress(100);
        nextLog.push('❌ Segmentation 실패');
        setError('Segmentation 실패: ' + (err?.response?.data?.detail || err.message));
        setLocalLog([...nextLog]);
      }
    };

    runSegmentation();

    return () => {
      running = false;
      clearInterval(timerRef.current);
    };
    // eslint-disable-next-line
  }, [videoPath]);

  return (
    <div className="seg-modal-overlay">
      <div className="seg-modal-content">
        <h1>Segmentation 진행중...</h1>
        <p className="seg-desc">Segmentation이 진행중입니다. 시간이 소요될 수 있으니 잠시만 기다려 주십시오.</p>
        <div className="seg-progress-bar">
          <div className="seg-progress" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="seg-progress-label">{Math.round(progress)}%</div>
        {error && <div className="seg-error">{error}</div>}
      </div>
    </div>
  );
};

export default SegmentationPopup;
