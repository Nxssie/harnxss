// TelemetryGrid.jsx
const Sparkline = ({ data, width = 160, height = 28 }) => {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg className="ps-sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <line className="grid" x1="0" y1={height/2} x2={width} y2={height/2}/>
      <polyline points={pts}/>
    </svg>
  );
};

const TelemetryTile = ({ label, value, unit, meta, data, shim }) => (
  <div className={"ps-tele" + (shim ? " shim" : "")}>
    <div className="label">{label}</div>
    <div className="value">{value}<span className="unit">{unit}</span></div>
    <Sparkline data={data}/>
    <div className="meta"><span>{meta}</span><span>60s</span></div>
  </div>
);

const TelemetryGrid = ({ tick, calibrating }) => {
  // generate pseudo-random but stable sparkline data
  const gen = (seed, base, amp) => Array.from({length: 40}, (_, i) =>
    base + Math.sin(i * 0.3 + seed + tick * 0.1) * amp + Math.cos(i * 0.7 + seed) * amp * 0.4
  );
  return (
    <div className="ps-tele-grid">
      <TelemetryTile label="_stream_rate;" value="0.35" unit="ms" meta="Δ -0.02" data={gen(1, 0.35, 0.04)} shim={calibrating}/>
      <TelemetryTile label="_tolerance;"   value="0.02" unit="mm" meta="_steady;"   data={gen(2, 0.02, 0.005)}/>
      <TelemetryTile label="_noise;"       value="−42"  unit="dB" meta="_disabled;" data={gen(3, -42, 2)}/>
      <TelemetryTile label="_packets;"     value="1.4K" unit="/s" meta="04/∞"       data={gen(4, 1400, 120)}/>
    </div>
  );
};
window.TelemetryGrid = TelemetryGrid;
