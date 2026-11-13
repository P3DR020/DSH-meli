import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

// Ponto de entrada do React: conecta App ao elemento #root de index.html.
// StrictMode ajuda a detectar efeitos sem limpeza em desenvolvimento; por isso
// timers e demais recursos criados em hooks devem sempre ter sua limpeza.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
