// App.jsx — composition
const { useState, useEffect, useMemo } = React;

const MODULES = [
  { code: "B11", name: "XXXY / usp",    displayName: "XXXY", description: "_noise_disabled; _steady_aim; ///handle_with_care;", status: "ok" },
  { code: "B15", name: "XXXY / deagle", displayName: "RX-04", description: "high-caliber module · pearlescent shell · rev.B", status: "ok" },
  { code: "B45", name: "scope / awp",   displayName: "—scope_", description: "long-range optics — _steady_aim; 0.35ms latency", status: "warn" },
  { code: "B02", name: "beacon",        displayName: "BEACON", description: "dormant · awaiting handshake", status: "err" },
  { code: "B09", name: "barcode_gen",   displayName: "0472-BC", description: "stripe-generator · rev.A", status: "ok" },
];

const initialLog = [
  { type: "out", text: "printstream v1.4.0 — rev.B" },
  { type: "out", text: "loading module B11…" },
  { type: "ok",  text: "ok; handshake accepted" },
  { type: "cmd", text: "calibrate --tol=0.02" },
  { type: "out", text: "calibrating…" },
  { type: "ok",  text: "_calibrated; Δ 0.02mm" },
  { type: "cmd", text: "telemetry --stream" },
  { type: "out", text: "stream_rate=0.35ms packets=1.4K/s" },
];

const App = () => {
  const [active, setActive] = useState("B11");
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const [status, setStatus] = useState("ok");
  const [tick, setTick] = useState(0);
  const [log, setLog] = useState(initialLog);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "`" || e.key === "~") setTerminalOpen(o => !o); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const module = useMemo(() => MODULES.find(m => m.code === active) || MODULES[0], [active]);

  const runCalibrate = () => {
    if (calibrating) return;
    setCalibrating(true);
    setLog(l => [...l, { type: "cmd", text: `calibrate --module=${active}` }, { type: "out", text: "calibrating…" }]);
    setTimeout(() => {
      setCalibrating(false);
      setStatus("ok");
      setLog(l => [...l, { type: "ok", text: "_calibrated; Δ 0.02mm" }]);
    }, 2000);
  };

  useEffect(() => { setStatus(module.status); }, [active]);

  return (
    <div className="ps-app">
      <Sidebar modules={MODULES} active={active} onSelect={setActive}/>
      <TopBar serial={`0472-${active}-2026`} terminalOpen={terminalOpen} onTerminal={() => setTerminalOpen(o => !o)}/>

      <main className="ps-main">
        <ModuleHeader module={module} status={status} onCalibrate={runCalibrate} calibrating={calibrating}/>

        <TelemetryGrid tick={tick} calibrating={calibrating}/>

        <div className="ps-grid-2">
          <ReticleCard title="_spec_sheet;" code={`${active}; rev.B`}>
            <div className="ps-spec">
              <div className="row"><span className="k">_serial;</span><span className="v">0472-{active}-2026</span><span className="u">id</span></div>
              <div className="row"><span className="k">_firmware;</span><span className="v">v1.4.0-rev.B</span><span className="u">build</span></div>
              <div className="row"><span className="k">_tolerance;</span><span className="v">0.02</span><span className="u">mm</span></div>
              <div className="row"><span className="k">_noise_floor;</span><span className="v">−42</span><span className="u">dB</span></div>
              <div className="row"><span className="k">_stream_rate;</span><span className="v">0.35</span><span className="u">ms</span></div>
              <div className="row"><span className="k">_last_ping;</span><span className="v">just now</span><span className="u">ts</span></div>
            </div>
          </ReticleCard>

          <ReticleCard dark title="_calibration;" code="live">
            <div className={"ps-progress " + (calibrating ? "shim" : "")}>
              <div className="row"><span>progress</span><span>{calibrating ? "running…" : "complete"}</span></div>
              <div className="track"><div className="fill" style={{width: calibrating ? "62%" : "100%"}}></div></div>
              <div className="row" style={{color:"var(--ps-pearl-300)"}}><span>Δ 0.02mm</span><span>04/∞</span></div>
            </div>
            <div style={{height:14}}/>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <span style={{fontFamily:"var(--ps-font-mono)",fontSize:10,letterSpacing:".14em",padding:"4px 8px",border:"1px solid #fff",color:"#fff"}}>_noise_disabled;</span>
              <span style={{fontFamily:"var(--ps-font-mono)",fontSize:10,letterSpacing:".14em",padding:"4px 8px",border:"1px solid rgba(255,255,255,.25)",color:"var(--ps-pearl-200)"}}>_steady_aim;</span>
              <span style={{fontFamily:"var(--ps-font-mono)",fontSize:10,letterSpacing:".14em",padding:"4px 8px",border:"1px solid rgba(255,255,255,.25)",color:"var(--ps-pearl-200)"}}>///handle_with_care;</span>
            </div>
          </ReticleCard>
        </div>

        <ReticleCard title="_changelog;" code={`${active}; last 5`}>
          <div className="ps-spec">
            {[
              ["12:04:22", "_calibrated;", "Δ 0.02mm"],
              ["12:01:08", "_stream_started;", "0.35ms"],
              ["11:58:44", "_firmware_loaded;", "v1.4.0"],
              ["11:58:40", "_handshake_accepted;", "ok"],
              ["11:58:38", "_boot;", "rev.B"],
            ].map(([t, k, v], i) => (
              <div className="row" key={i}>
                <span className="k">{t}</span>
                <span className="v">{k}</span>
                <span className="u">{v}</span>
              </div>
            ))}
          </div>
        </ReticleCard>
      </main>

      <ActionBar/>

      <Terminal open={terminalOpen} onClose={() => setTerminalOpen(false)} log={log}/>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
