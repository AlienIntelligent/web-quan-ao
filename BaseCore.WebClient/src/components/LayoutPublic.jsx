import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

const LayoutPublic = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    const init = () => {
      if (window.initFashiTemplate && typeof jQuery !== 'undefined') {
        window.initFashiTemplate();
      }
    };
    
    // Give some time for all scripts to be ready
    const timer = setTimeout(init, 300);
    return () => clearTimeout(timer);
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
