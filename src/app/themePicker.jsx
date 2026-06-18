import React from "react";
import { THEMES, applyTheme, getActiveThemeId } from "./themes.js";
import { C, tx, mu } from "./ui.jsx";

export function ThemePicker(props) {
  var D = props.D;
  var st = React.useState(getActiveThemeId());
  var activeId = st[0];
  var setActiveId = st[1];

  function choose(id) {
    applyTheme(id);
    setActiveId(id);
  }

  var card = Object.assign({}, C(D), { padding: 22, marginBottom: 18 });
  var titleStyle = {
    fontSize: 15,
    fontWeight: 700,
    color: tx(D),
    marginBottom: 2,
  };
  var subStyle = { fontSize: 12, color: mu(D), marginBottom: 16 };
  var grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: 12,
  };

  return (
    <div style={card}>
      <h3 style={titleStyle}>Appearance</h3>
      <p style={subStyle}>
        Pick a colour theme to restyle the whole app instantly.
      </p>
      <div style={grid}>
        {THEMES.map(function (t) {
          var isActive = t.id === activeId;
          var tile = {
            cursor: "pointer",
            borderRadius: 14,
            padding: 12,
            border: isActive
              ? "2px solid " + t.accent
              : "1.5px solid " + (D ? "#2a2c4a" : "#e5e7eb"),
            background: D ? "#191a2b" : "#ffffff",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            transition: "transform .16s, box-shadow .2s, border-color .2s",
            boxShadow: isActive
              ? "0 8px 22px " + t.accent + "33"
              : "0 1px 2px rgba(15,23,41,.05)",
          };
          var swatch = {
            height: 56,
            borderRadius: 11,
            background: t.gradient,
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,.18)",
          };
          var row = {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 6,
          };
          var nameStyle = { fontSize: 13, fontWeight: 700, color: tx(D) };
          var tagStyle = { fontSize: 10.5, color: mu(D), fontWeight: 500 };
          var check = {
            width: 19,
            height: 19,
            borderRadius: 999,
            background: t.accent,
            color: "#ffffff",
            fontSize: 11,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          };
          return (
            <div
              key={t.id}
              style={tile}
              onClick={function () {
                choose(t.id);
              }}
              role="button"
              aria-pressed={isActive}
            >
              <div style={swatch} />
              <div style={row}>
                <div>
                  <div style={nameStyle}>{t.name}</div>
                  <div style={tagStyle}>{t.tagline}</div>
                </div>
                {isActive ? <div style={check}>✓</div> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
