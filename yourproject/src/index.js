
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Navigate, Routes } from "react-router-dom";

// styles
import "assets/css/bootstrap.min.css";
import "assets/scss/paper-kit.scss";
import "assets/demo/demo.css";
import "assets/demo/react-demo.css";
// pages
import LandingPage from "views/LandingPage.js";
// others

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter>
    <Routes>
       <Route path="/" element={<LandingPage />} />
       <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
