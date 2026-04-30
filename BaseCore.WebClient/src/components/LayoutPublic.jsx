import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

const LayoutPublic = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    if (window.initFashiTemplate) {
      setTimeout(() => {
        window.initFashiTemplate();
      }, 100);
    }
  }, [location.pathname]);

  return (
    <div className="layout-public">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
};

export default LayoutPublic;
