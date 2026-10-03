import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/600.css";
import App from "./App";
import "./styles.css";
import "./refinements.css";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
