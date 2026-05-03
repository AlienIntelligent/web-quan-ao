import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import $ from "jquery";
window.jQuery = window.$ = $;
import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/css/font-awesome.min.css";
import "./assets/css/themify-icons.css";
import "./assets/css/elegant-icons.css";
import "./assets/css/owl.carousel.min.css";
import "./assets/css/nice-select.css";
import "./assets/css/jquery-ui.min.css";
import "./assets/css/slicknav.min.css";
import "./assets/css/style.css"; // CSS riêng của Fashi
import "./assets/css/admin-custom.css"; // Tùy chỉnh Admin

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
