// SegmentationProgressModal.jsx
import React from 'react';
import './SegmentationPopup.css';

const SegmentationProgressModal = ({ progress }) => {
  return (
    <div className="seg-modal-overlay">
      <div className="seg-modal-content">
        <h1>Segmentation 진행중...</h1>
        <p className="seg-desc">
          segmentation이 진행중입니다. 시간이 소요될 수 있으니 잠시만 기다려 주십시오.
        </p>
        <div className="seg-progress-bar">
          <div
            className="seg-progress"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="seg-progress-label">{progress}%</div>
      </div>
    </div>
  );
};

export default SegmentationProgressModal;
