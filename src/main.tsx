import React from "react";
import { createRoot, Root } from "react-dom/client";
import App from "./App";
import "./style.css";

let root: Root | null = null;

function mount() {
  const container = document.querySelector<HTMLDivElement>(
    ".mmm-reactweather-root"
  );
  if (!container) return;
  if (container.dataset.mounted) return;
  container.dataset.mounted = "true";
  root = createRoot(container);
  root.render(<App />);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}

// (Optional) hot module replacement support in dev
if (import.meta && import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (root) {
      root.unmount();
    }
  });
}
