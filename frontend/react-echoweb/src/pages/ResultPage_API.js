// src/pages/ResultPage.jsx
import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { useLocation } from 'react-router-dom';
import './ResultPage.css';

const ResultPage = () => {
  const location = useLocation();
  // 4p/5p에서 받은 log, segmentation 결과
  const processLog = location.state?.processLog || [];
  const seg = location.state?.segmentationResult;

  // 상태값
  const [previewImg, setPreviewImg] = useState(null);

  // 필수 데이터 파싱
  const originVideo = seg?.origin_video_path;
  const segVideo = seg?.segmented_video_path;
  const areaArr = seg?.areas || [];
  const esIdxArr = seg?.es_points || []; // esv 프레임 인덱스 배열
  const edIdxArr = seg?.ed_points || []; // edv 프레임 인덱스 배열
  const esFrameImgArr = seg?.es_frames_path || []; // esv seg 프레임 이미지 배열
  const edFrameImgArr = seg?.ed_frames_path || [];
  const ef = seg?.ef;

  // 그래프용 x/y축
  const xArr = Array.from({length: areaArr.length}, (_, i) => i);
  const yArr = areaArr;

  // Hover handler - 마우스 올리면 seg 프레임 미리보기
  const handleEdvHover = (i) => setPreviewImg(edFrameImgArr[i]);
  const handleEsvHover = (i) => setPreviewImg(esFrameImgArr[i]);
  const handlePreviewOut = () => setPreviewImg(null);

  // Plotly 그래프 데이터
  const plotData = [
    // 좌심실 area line
    {
      x: xArr,
      y: yArr,
      type: 'scatter',
      mode: 'lines',
      name: 'area',
      line: { color: '#325adf', width: 2 },
    },
    // EDV 파란점 (여러 개 가능)
    ...(edIdxArr || []).map((idx, i) => ({
      x: [xArr[idx]], y: [yArr[idx]],
      mode: 'markers',
      marker: { color: 'blue', size: 14, symbol: 'circle' },
      name: 'EDV',
      customdata: [i],
      hovertemplate: 'EDV (파란점): %{y}<extra></extra>',
    })),
    // ESV 빨간점 (여러 개 가능)
    ...(esIdxArr || []).map((idx, i) => ({
      x: [xArr[idx]], y: [yArr[idx]],
      mode: 'markers',
      marker: { color: 'red', size: 14, symbol: 'circle' },
      name: 'ESV',
      customdata: [i],
      hovertemplate: 'ESV (빨간점): %{y}<extra></extra>',
    })),
  ];

  // Plotly에서 hover event 활용: preview 띄우기
  const handlePointHover = (event) => {
    if (!event?.points?.length) return;
    const point = event.points[0];
    if (point.curveNumber === 1) { // 첫 번째 edv
      const i = point.customdata[0];
      handleEdvHover(i);
    }
    if (point.curveNumber === 2) { // 첫 번째 esv
      const i = point.customdata[0];
      handleEsvHover(i);
    }
  };
  const handlePointOut = () => setPreviewImg(null);

  return (
    <div className="result-container">
      <h1 className="title">Result</h1>
      <div className="result-card">
        <div className="result-left">
          <div>
            <b style={{ fontSize: 22 }}>Original Video</b>
            <div className="imgbox">
              {/* 영상이면 video, 이미지면 img */}
              {
                originVideo?.endsWith('.mp4')
                  ? <video src={originVideo} controls style={{ width: "100%" }} />
                  : <img src={originVideo} alt="Original" />
              }
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <b style={{ fontSize: 22 }}>Segmented Video</b>
            <div className="imgbox">
              {
                segVideo?.endsWith('.mp4')
                  ? <video src={segVideo} controls style={{ width: "100%" }} />
                  : <img src={segVideo} alt="Segmentation" />
              }
            </div>
          </div>
        </div>
        <div className="result-right">
          <div style={{ position: "relative" }}>
            <Plot
              data={plotData}
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
              onHover={handlePointHover}
              onUnhover={handlePointOut}
            />
            {/* Hover 시 프레임 이미지 미리보기 */}
            {previewImg && (
              <div className="preview-img-pop" style={{
                position: "absolute", left: 320, top: 30, zIndex: 99,
                background: "#fff", boxShadow: "0 2px 12px #0002", padding: 7, borderRadius: 8,
              }}>
                <img src={previewImg} alt="frame" width={170} />
              </div>
            )}
          </div>
          <div className="ef-area">
            <div className="ef-label"><b>EF Calculated</b></div>
            <div className="ef-value">{ef !== undefined && ef !== null
              ? <b style={{ fontSize: 40, color: "#113be8" }}>{Math.round(ef)}%</b>
              : '--'}
            </div>
          </div>
        </div>
      </div>

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
