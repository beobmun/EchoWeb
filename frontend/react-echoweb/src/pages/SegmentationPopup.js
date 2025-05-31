// SegmentationPopup.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './SegmentationPopup.css';

const SegmentationPopup = ({ videoPath, processLog, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [localLog, setLocalLog] = useState([...processLog]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!videoPath) return;

    const runSegmentation = async () => {
      try {
        setLocalLog((prev) => [...prev, 'Segmentation 진행중...']);
        setProgress(10); // 시작
        // 실제 segmentation GET 요청
        const res = await axios.get('/api/run/segmentation', {
          params: { video_path: videoPath }
        });
        setProgress(100);
        setLocalLog((prev) => [...prev, '✅ Segmentation 완료!', 'EF 계산중...']);
        setTimeout(() => {
          setLocalLog((prev) => [...prev, '✅ EF 계산 완료!']);
          // 완료 후 부모에 결과/최신로그 전달
          setTimeout(() => {
            onComplete({
              result: res.data, // segmentation 결과 통째로 넘김
              processLog: [...localLog, '✅ EF 계산 완료!'],
            });
          }, 500);
        }, 500);
      } catch (err) {
        setError('Segmentation 실패: ' + (err?.response?.data?.detail || err.message));
        setLocalLog((prev) => [...prev, '❌ Segmentation 실패']);
      }
    };

    runSegmentation();
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
        <div className="seg-progress-label">{progress}%</div>
        {error && <div className="seg-error">{error}</div>}
      </div>
    </div>
  );
};

export default SegmentationPopup;
