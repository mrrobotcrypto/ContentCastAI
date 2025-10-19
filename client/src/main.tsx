import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global error handlers to catch unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
  event.preventDefault(); // Prevent the default error logging
});

window.addEventListener('error', (event) => {
  console.error('Global Error:', event.error);
  event.preventDefault();
});

// Prevent pull-to-refresh behavior on mobile
let touchStartY = 0;
document.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
}, { passive: false });

document.addEventListener('touchmove', (e) => {
  const touchY = e.touches[0].clientY;
  const touchDiff = touchY - touchStartY;
  
  // If at top of page and trying to scroll down, prevent default
  if (document.documentElement.scrollTop === 0 && touchDiff > 0) {
    e.preventDefault();
  }
}, { passive: false });

createRoot(document.getElementById("root")!).render(<App />);
