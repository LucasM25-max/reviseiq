import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error: error };
  }
  componentDidCatch(error, info) {
    try {
      console.error(
        "[ReviseIQ ErrorBoundary]",
        error,
        info && info.componentStack,
      );
    } catch (_) {}
  }
  handleReset() {
    try {
      if (typeof this.props.onReset === "function") this.props.onReset();
    } catch (_) {}
    this.setState({ error: null });
  }
  render() {
    if (this.state.error) {
      const D = this.props.D;
      const wrap = {
        maxWidth: 560,
        margin: "40px auto",
        padding: "28px 26px",
        borderRadius: 18,
        background: D ? "#13131f" : "#ffffff",
        border: "1px solid " + (D ? "#262844" : "#ece9f7"),
        boxShadow: "0 10px 34px rgba(91,84,240,0.12)",
        textAlign: "center",
        fontFamily: "'IBM Plex Sans', sans-serif",
      };
      const icon = { fontSize: 38, marginBottom: 10 };
      const title = {
        fontSize: 18,
        fontWeight: 800,
        color: D ? "#e8ecf4" : "#1f2937",
        marginBottom: 8,
      };
      const body = {
        fontSize: 14,
        lineHeight: 1.6,
        color: D ? "#9aa3b2" : "#6b7280",
        marginBottom: 18,
      };
      const detail = {
        fontSize: 12,
        fontFamily: "'IBM Plex Mono', monospace",
        color: "#d6336c",
        background: D ? "#1b1530" : "#fdf2f6",
        border: "1px solid " + (D ? "#3a2a4d" : "#f6d6e2"),
        borderRadius: 10,
        padding: "10px 12px",
        marginBottom: 18,
        wordBreak: "break-word",
        textAlign: "left",
        whiteSpace: "pre-wrap",
      };
      const btn = {
        display: "inline-block",
        padding: "11px 22px",
        borderRadius: 12,
        border: "none",
        cursor: "pointer",
        fontWeight: 700,
        fontSize: 14,
        color: "#fff",
        background: "linear-gradient(135deg,#5b54f0,#8b5cf6)",
      };
      const err = this.state.error;
      const msg =
        (err && (err.message || String(err))) || "Unknown error";
      return (
        <div style={wrap}>
          <div style={icon}>🧩</div>
          <div style={title}>
            {this.props.label || "This screen hit a snag"}
          </div>
          <div style={body}>
            Something went wrong while loading this view. Your progress is
            safe — head back and try again.
          </div>
          <div style={detail}>{msg}</div>
          <button style={btn} onClick={() => this.handleReset()}>
            {this.props.resetLabel || "Go back"}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
