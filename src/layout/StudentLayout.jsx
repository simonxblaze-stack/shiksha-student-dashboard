import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import useSwipeBack from "../utils/useSwipeBack";
import "../styles/studentLayout.css";

export default function StudentLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  const swipeHandlers = useSwipeBack({
    disabled: menuOpen,
    minSwipeDistance: 80,
    edgeOnly: true,
    edgeSize: 28,
    mobileMaxWidth: 768,
    blockedRoutes: ["/"],
    preventScrollOnSwipe: false,
  });

  return (
    <div className="studentLayout" {...swipeHandlers}>
      {menuOpen && (
        <div
          className="mobileOverlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div
        className={`studentLayout__sidebar ${
          menuOpen ? "showSidebar" : ""
        }`}
      >
        <Sidebar setMenuOpen={setMenuOpen} />
      </div>

      <div className="studentLayout__right">
        <Header
          toggleMenu={() => setMenuOpen(!menuOpen)}
          menuOpen={menuOpen}
        />
        <div className="studentLayout__page">
          <Outlet />
        </div>
      </div>
    </div>
  );
}