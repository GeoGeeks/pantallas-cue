import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const IDLE_TIMEOUT_MS = 120000;
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "touchstart", "keydown", "scroll"];

export function useIdleRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/") return;

    let timeoutId = setTimeout(() => navigate("/"), IDLE_TIMEOUT_MS);

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => navigate("/"), IDLE_TIMEOUT_MS);
    };

    ACTIVITY_EVENTS.forEach((eventName) =>
      window.addEventListener(eventName, resetTimer),
    );

    return () => {
      clearTimeout(timeoutId);
      ACTIVITY_EVENTS.forEach((eventName) =>
        window.removeEventListener(eventName, resetTimer),
      );
    };
  }, [location.pathname, navigate]);
}
