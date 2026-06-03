// Terminal.jsx
const Terminal = ({ open, onClose, log }) => (
  <div className={"ps-terminal" + (open ? " open" : "")}>
    <div className="th">
      <span>///terminal — {log.length} lines</span>
      <button onClick={onClose}>close;</button>
    </div>
    <div className="tbody">
      {log.map((l, i) => (
        <div key={i} className={l.type}>
          {l.type === "cmd" ? "$ " : "  "}{l.text}
        </div>
      ))}
    </div>
    <div className="prompt">
      <span>stream --module=B11 --rev=B</span>
      <span className="cursor"></span>
    </div>
  </div>
);
window.Terminal = Terminal;
