import React, { useEffect, useState} from 'react';
import axios from 'axios';
import './SegmentationPopup.css';

const SegmentationPopup = ({ videoPath, processLog, onComplete }) => {
  const [progress, setProgress] = useState(10);
  const [localLog, setLocalLog] = useState([...processLog]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!videoPath) return;

    let timer;
    let isDone = false;
    let fakeProgress = 0;

    // 1. 진행률 애니메이션 (0~95% 까지 천천히 증가)
    const startFakeProgress = () => {
      timer = setInterval(() => {
        // 마지막 95%에서 멈춤
        if (fakeProgress < 95) {
          // 점점 느리게 (가속감 줘도 OK)
          fakeProgress += (fakeProgress < 60 ? 1.5 : 0.7);
          setProgress(Math.min(fakeProgress, 95));
        }
      }, 80);
    };

    // 2. Segmentation 실제 요청
    const runSegmentation = async () => {
      let nextLog = [...processLog]; // 항상 append 용으로 직접 관리!

      try {
        nextLog.push('Segmentation 진행중...');
        setLocalLog([...nextLog]);
        setProgress(5);
        startFakeProgress();

        const res = await axios.get('/api/run/segmentation', {
          params: { video_path: videoPath }
        });

        isDone = true;  // 백엔드 결과 도착
        // 100%로 채우고, 로그 추가
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
        isDone = true;
        nextLog.push('❌ Segmentation 실패');
        setError('Segmentation 실패: ' + (err?.response?.data?.detail || err.message));
        setLocalLog([...nextLog]);
      }
    };

    runSegmentation();

    return () => {
      clearInterval(timer);
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
