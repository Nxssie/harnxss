// ReticleCard.jsx
const ReticleCard = ({ title, code, dark, children }) => (
  <div className={"ps-rcard" + (dark ? " dark" : "")}>
    <span className="rc-corner tl"></span>
    <span className="rc-corner tr"></span>
    <span className="rc-corner bl"></span>
    <span className="rc-corner br"></span>
    <div className="rc-head">
      <b>{title}</b>
      <span>{code}</span>
    </div>
    {children}
  </div>
);
window.ReticleCard = ReticleCard;
