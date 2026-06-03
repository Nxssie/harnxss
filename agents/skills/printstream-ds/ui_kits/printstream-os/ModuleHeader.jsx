// ModuleHeader.jsx
const ModuleHeader = ({ module: m, status, onCalibrate, calibrating }) => {
  const statusText = calibrating ? "_calibrating;" :
    status === "ok" ? "_calibrated;" :
    status === "warn" ? "_drift_detected;" : "ERR_01;";
  const statusColor = calibrating ? "var(--ps-iris-cyan)" :
    status === "ok" ? "var(--ps-signal-ok)" :
    status === "warn" ? "var(--ps-signal-caution)" :
    "var(--ps-signal-danger)";
  return (
    <div className="ps-mod-header">
      <div>
        <div className="eyebrow">
          <span>///module;</span>
          <span>_rev.B;</span>
          <span>_serial 0472-{m.code}-2026;</span>
          <span style={{color: statusColor, fontWeight: 600}}>{statusText}</span>
        </div>
        <div className="title">{m.displayName || m.name}</div>
        <div className="subtitle">{m.description}</div>
      </div>
      <div className="right">
        <div className="tag-code">{m.code};</div>
        <div className="barcode-strip"></div>
        <div>04/∞ · Δ 0.02mm</div>
        <div style={{display:"flex", gap:8, marginTop:6}}>
          <button className="ps-btn" onClick={onCalibrate} disabled={calibrating}>
            {calibrating ? "calibrating…" : "CALIBRATE;"}
          </button>
          <button className="ps-btn primary">DEPLOY;</button>
        </div>
      </div>
    </div>
  );
};
window.ModuleHeader = ModuleHeader;
