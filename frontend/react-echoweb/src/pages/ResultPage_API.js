// src/pages/ResultPage.jsx
import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import './ResultPage.css';

const ResultPage = () => {
  const location = useLocation();
  // 이전 페이지에서 받은 로그와 선택파일 경로
  const processLog = location.state?.processLog || [];
  const segmentationResult = location.state?.segmentationResult || {};

  // 상태값
  const [origVid, setOrigVid] = useState('');
  const [segVid, setSegVid] = useState('');
  const [areas, setAreas] = useState([]);
  const [esPoints, setEsPoints] = useState([]);
  const [edPoints, setEdPoints] = useState([]);
  const [esFramePath, setEsFramePath] = useState([]);
  const [edFramePath, setEdFramePath] = useState([]);
  const [ef, setEF] = useState(null);

  // Hover Preview State
  const [hoverPreview, setHoverPreview] = useState(null);

  const videoPath = typeof selectedFile === 'string'
  ? selectedFile.replace(/"/g, '')
  : selectedFile;

  // 데이터 불러오기
  useEffect(() => {
    if (segmentationResult && segmentationResult.origin_video_path) {
      setOrigVid(segmentationResult.origin_video_path);
      setSegVid(segmentationResult.segmented_video_path);
      setAreas(segmentationResult.areas || []);
      setEsPoints(segmentationResult.es_points || []);
      setEdPoints(segmentationResult.ed_points || []);
      setEsFramePath(segmentationResult.es_frames_path || []);
      setEdFramePath(segmentationResult.ed_frames_path || []);
      setEF(segmentationResult.ef);
    }
  }, [segmentationResult]);

  // 차트 옵션/데이터 (ESV=빨간점, EDV=파란점, hover preview 연동)
  const makePlot = () => {
    if (!areas.length) return null;
    // frame 번호: 0 ~ areas.length-1
    return (
      <Plot
        data={[
          {
            x: areas.map((_, idx) => idx),
            y: areas,
            type: 'scatter',
            mode: 'lines',
            name: 'LV area',
            line: { color: '#325adf', width: 2 }
          },
          // EDV(파란점, 여러개 가능)
          ...(edPoints.length
            ? [{
                x: edPoints,
                y: edPoints.map(i => areas[i]),
                mode: 'markers',
                marker: { color: 'blue', size: 12 },
                name: 'EDV',
                customdata: edFramePath,
                hoverinfo: 'skip', // 기본 hover X (커스텀 프리뷰)
              }]
            : []),
          // ESV(빨간점, 여러개 가능)
          ...(esPoints.length
            ? [{
                x: esPoints,
                y: esPoints.map(i => areas[i]),
                mode: 'markers',
                marker: { color: 'red', size: 12 },
                name: 'ESV',
                customdata: esFramePath,
                hoverinfo: 'skip',
              }]
            : []),
        ]}
        layout={{
          autosize: true,
          width: 650, height: 300,
          margin: { l: 50, r: 20, t: 40, b: 50 },
          title: { text: 'Left Ventricular Area Variation', font: { size: 18 } },
          xaxis: { title: 'Frame' },
          yaxis: { title: 'Area', showgrid: false },
          legend: { x: 0.92, y: 0.98, font: { size: 13 } }
        }}
        config={{ displayModeBar: false }}
        style={{ borderRadius: 10 }}
        // 점 hover 시 커스텀 preview 처리
        onHover={(event) => {
          // 마커에만 반응 (curveNumber: 1(EDV) or 2(ESV)), pointNumber: index in ed/esPoints
          const p = event?.points?.[0];
          if (!p) return;
          const isEDV = p.curveNumber === 1;
          const isESV = p.curveNumber === 2;
          if (isEDV && edFramePath[p.pointIndex]) setHoverPreview({ type: 'EDV', img: edFramePath[p.pointIndex] });
          if (isESV && esFramePath[p.pointIndex]) setHoverPreview({ type: 'ESV', img: esFramePath[p.pointIndex] });
        }}
        onUnhover={() => setHoverPreview(null)}
      />
    );
  };

  return (
    <div className="result-container">
      <h1 className="title">Result</h1>
      <div className="result-card">
        <div className="result-left">
          <div>
            <b style={{ fontSize: 22 }}>Original Video</b>
            <div className="imgbox">
              {origVid ? <video src={origVid} controls width="250" /> : <div className="img-placeholder" />}
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <b style={{ fontSize: 22 }}>Segmentation video</b>
            <div className="imgbox">
              {segVid ? <video src={segVid} controls width="250" /> : <div className="img-placeholder" />}
            </div>
          </div>
        </div>
        <div className="result-right">
          {makePlot()}
          <div className="ef-area">
            <div className="ef-label"><b>EF Calculated</b></div>
            <div className="ef-value">{ef !== null ? <b style={{ fontSize: 40, color: "#113be8" }}>{Number(ef).toFixed(2)}%</b> : '--'}</div>
          </div>
        </div>
      </div>
      {/* 점 hover 시 프레임 이미지 프리뷰 */}
      {hoverPreview && (
        <div className="frame-preview-modal">
          <img src={hoverPreview.img} alt={`${hoverPreview.type} Frame Preview`} style={{ width: 320, borderRadius: 10, boxShadow: '0 2px 10px #8885' }} />
          <div style={{ textAlign: 'center', marginTop: 5 }}>{hoverPreview.type} 프레임 preview</div>
        </div>
      )}
      {/* Process Log */}
      <div className="process-log" style={{ marginTop: 40 }}>
        <h3>Process Log</h3>
        <ul>
          {(processLog || []).map((log, i) => <li key={i}>{log}</li>)}
        </ul>
      </div>
    </div>
  );
};

export default ResultPage;
