// Sidebar.jsx — PrintStream OS rail
const Sidebar = ({ modules, active, onSelect }) => {
  return (
    <aside className="ps-sidebar">
      <div className="sb-brand">
        <img src="../../assets/logomark.svg" alt=""/>
        <div className="name">PRINT<em>STREAM</em></div>
      </div>

      <div className="sb-label">_modules;</div>
      {modules.map(m => (
        <div
          key={m.code}
          className={"sb-row " + (active === m.code ? "active" : "")}
          onClick={() => onSelect(m.code)}
        >
          <span className="code">{m.code}</span>
          <span>{m.name}</span>
          <span className={"dot status-" + m.status}></span>
        </div>
      ))}

      <div className="sb-label">_fleet;</div>
      <div className="sb-row"><span className="code">OPS</span><span>operators</span><span></span></div>
      <div className="sb-row"><span className="code">LOG</span><span>changelog</span><span></span></div>
      <div className="sb-row"><span className="code">CFG</span><span>firmware</span><span></span></div>

      <div className="sb-foot">
        ///rev.B;<br/>
        _handle_with_care;<br/>
        0472-2026
      </div>
    </aside>
  );
};

window.Sidebar = Sidebar;
