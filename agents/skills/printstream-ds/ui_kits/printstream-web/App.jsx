const Nav = () => (
  <nav className="psw-nav">
    <div className="brand">
      <img src="../../assets/logomark.svg" alt=""/>
      <span className="wordmark">PRINT<em>STREAM</em></span>
    </div>
    <div className="links">
      <a>_modules;</a><a>_calibrate;</a><a>_docs;</a><a>_changelog;</a>
    </div>
    <button className="cta">DEPLOY;</button>
  </nav>
);

const Hero = () => (
  <section className="psw-hero">
    <div className="eyebrow">
      <span>///rev.B;</span>
      <span>_handle_with_care;</span>
      <span>2026.04</span>
    </div>
    <h1>Print<em>.</em><br/>Stream<em>.</em><br/>Hold<em>.</em></h1>
    <p className="lede">
      A monochromatic instrument system. Extreme contrast, pearlescent detail, and a
      terminal-language UI that rewards a second look.
    </p>
    <div className="ctas">
      <button className="btn primary">DEPLOY;</button>
      <button className="btn">_read_spec;</button>
    </div>

    <div className="spec-rail">
      <div className="row"><span className="k">_stream;</span><span>0.35ms</span></div>
      <div className="row"><span className="k">_tol;</span><span>Δ 0.02mm</span></div>
      <div className="row"><span className="k">_noise;</span><span>−42dB</span></div>
      <div className="row"><span className="k">_rev;</span><span>B</span></div>
      <div className="row"><span className="k">_serial;</span><span>0472-2026</span></div>
    </div>
  </section>
);

const MODULES = [
  { code: "B11", tag: "usp",    display: "XX", em: "XY", name: "XXXY",    desc: "_noise_disabled; _steady_aim; primary sidearm module." },
  { code: "B15", tag: "deagle", display: "RX", em: "04", name: "RX-04",   desc: "high-caliber shell · pearlescent plate · rev.B hardware." },
  { code: "B45", tag: "awp",    display: "—",  em: "↗", name: "—scope_", desc: "long-range optical array · 0.35ms sync · field-rated." },
  { code: "B02", tag: "beacon", display: "◇",  em: "",  name: "BEACON",  desc: "handshake beacon · low-power · perimeter units." },
  { code: "B09", tag: "print",  display: "04", em: "72", name: "0472",    desc: "barcode generator · stripe print-head · rev.A." },
  { code: "B22", tag: "grip",   display: "·",  em: "·", name: "HANDLE",  desc: "rubberized grip module · micro-texture map v2." },
];

const ModuleGrid = () => (
  <section className="psw-modules">
    <div className="head">
      <h2>_modules;</h2>
      <span className="meta">6 / ∞ · rev.B · 2026.04</span>
    </div>
    <div className="grid">
      {MODULES.map(m => (
        <div className="psw-mcard" key={m.code}>
          <div className="head"><b>{m.code};</b><span>_{m.tag};</span></div>
          <div className="glyph">
            <span className="big">{m.display}<em>{m.em}</em></span>
          </div>
          <div className="name">{m.name}</div>
          <div className="desc">{m.desc}</div>
          <div className="foot">
            <span className="bc"></span>
            <span>_view;</span>
          </div>
        </div>
      ))}
    </div>
  </section>
);

const SpecSlab = () => (
  <section className="psw-slab">
    <div className="head"><span>///specification;</span><span>rev.B · 2026.04</span></div>
    <h2>Minimalism you can read<em>.</em> Complexity you can feel<em>.</em></h2>
    <div className="grid">
      <div className="stat"><div className="label">_stream_rate;</div><div className="value">0.35</div><div className="unit">ms · end-to-end</div></div>
      <div className="stat"><div className="label">_tolerance;</div><div className="value">0.02</div><div className="unit">mm · Δ typical</div></div>
      <div className="stat"><div className="label">_noise_floor;</div><div className="value">−42</div><div className="unit">dB · a-weighted</div></div>
      <div className="stat"><div className="label">_modules;</div><div className="value">∞</div><div className="unit">_handle_with_care;</div></div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="psw-footer">
    <div className="bc"></div>
    <div className="rows">
      <span>///printstream rev.B · 0472-2026</span>
      <span>
        <a>_modules;</a> &nbsp; <a>_docs;</a> &nbsp; <a>_changelog;</a> &nbsp; <a>_legal;</a>
      </span>
      <span>_handle_with_care;</span>
    </div>
  </footer>
);

const App = () => (
  <div className="psw">
    <Nav/><Hero/><ModuleGrid/><SpecSlab/><Footer/>
  </div>
);

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
