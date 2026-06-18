import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App.jsx";
import "./app/theme.css";
import { initTheme } from "./app/themes.js";

// Apply the saved colour theme before first paint.
initTheme();

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
