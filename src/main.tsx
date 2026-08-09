
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  // Prevent the mouse wheel from changing the value of a focused number input.
  // Blurring on wheel lets the page keep scrolling normally without nudging the field.
  document.addEventListener(
    "wheel",
    () => {
      const active = document.activeElement;
      if (active instanceof HTMLInputElement && active.type === "number") {
        active.blur();
      }
    },
    { passive: true }
  );

  createRoot(document.getElementById("root")!).render(<App />);
