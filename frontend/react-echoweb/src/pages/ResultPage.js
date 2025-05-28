// src/pages/ResultPage.jsx
import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js'; // npm install react-plotly.js plotly.js
import axios from 'axios'; // 🔹 axios 추가
import { useLocation } from 'react-router-dom';
import './ResultPage.css';

const TEST_MODE = true;

const ResultPage = () => {
  const location = useLocation();
  // 이전 페이지에서 받은 로그
  const processLog = location.state?.processLog || [];

  // 상태값
  const [origVid, setOrigVid] = useState(null);   // 원본 영상/이미지 src
  const [segVid, setSegVid] = useState(null);     // 분할 영상/이미지 src
  const [graphData, setGraphData] = useState(null); // 차트 데이터
  const [edv, setEDV] = useState(null);           // End Diastolic Volume
  const [esv, setESV] = useState(null);           // End Systolic Volume
  const [ef, setEF] = useState(null);             // EF 계산 값

  useEffect(() => {
    const fetchData = async () => {
      if (TEST_MODE) {
        // 예시 이미지/그래프/EF
        setOrigVid('/sample/original_a4c.png');   // public 폴더에 예시 이미지
        setSegVid('/sample/segmentation_a4c.png');
        setGraphData({
          x: Array.from({length: 55}, (_, i) => i),
          y: [
            64000, 63500, 63000, 62000, 61000, 60000, 61000, 62000, 63000, 64000,
            65000, 65500, 66000, 65800, 65500, 65200, 64900, 64500, 64100, 64000,
            63800, 63600, 63300, 63000, 62800, 62700, 62600, 62500, 62400, 66000, // EDV=66000(30frame), ESV=60000(9frame)
            65800, 65500, 65200, 64900, 64600, 64400, 64100, 63800, 63500, 63200,
            62900, 62600, 62400, 62200, 62000, 61800, 61500, 61300, 61100, 60900,
            60800, 60700, 60600, 60500, 60400,
          ],
          edvIdx: 30, // x[30], y[30]
          esvIdx: 9,  // x[9],  y[9]
        });
        setEDV(66000);
        setESV(60000);
        setEF(60);
      } else {
        // 실제 백엔드 연동
        const res = await axios.get('/api/result');
        setOrigVid(res.data.original_url);
        setSegVid(res.data.segmentation_url);
        setGraphData(res.data.graph);
        setEDV(res.data.edv);
        setESV(res.data.esv);
        setEF(res.data.ef);
      }
    };
    fetchData();
  }, []);

  // 차트 옵션
  const makePlot = () => {
    if (!graphData) return null;
    const { x, y, edvIdx, esvIdx } = graphData;
    return (
      <Plot
        data={[
          {
            x, y,
            type: 'scatter',
            mode: 'lines',
            name: 'area',
            line: { color: '#325adf', width: 2 }
          },
          {
            x: [x[edvIdx]], y: [y[edvIdx]],
            mode: 'markers',
            marker: { color: 'blue', size: 10 },
            name: 'EDV'
          },
          {
            x: [x[esvIdx]], y: [y[esvIdx]],
            mode: 'markers',
            marker: { color: 'red', size: 10 },
            name: 'ESV'
          }
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
              <img src={origVid} alt="Original" />
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <b style={{ fontSize: 22 }}>Segmentation Result</b>
            <div className="imgbox">
              <img src={segVid} alt="Segmentation" />
            </div>
          </div>
        </div>
        <div className="result-right">
          {makePlot()}
          <div className="ef-area">
            <div className="ef-label"><b>EF Calculated</b></div>
            <div className="ef-value">{ef !== null ? <b style={{ fontSize: 40, color: "#113be8" }}>{ef}%</b> : '--'}</div>
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
