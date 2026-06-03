// TopBar.jsx
const TopBar = ({ serial, onTerminal, terminalOpen }) => (
  <header className="ps-topbar">
    <div className="tb-serial">///{serial};</div>
    <div className="tb-search">
      <span style={{opacity:.5}}>&gt;</span>
      <input placeholder="search_modules;" defaultValue=""/>
      <span style={{opacity:.4}}>⌘K</span>
    </div>
    <div className="tb-actions">
      <span className="tb-chip">_ping;</span>
      <span className="tb-chip">_sync;</span>
      <span className={"tb-chip " + (terminalOpen ? "active" : "")} onClick={onTerminal}>
        _terminal;
      </span>
    </div>
  </header>
);
window.TopBar = TopBar;
