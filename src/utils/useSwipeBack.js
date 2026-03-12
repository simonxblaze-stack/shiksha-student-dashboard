import { useSwipeable } from "react-swipeable";
import { useLocation, useNavigate } from "react-router-dom";

export default function useSwipeBack(options = {}) {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    disabled = false,
    minSwipeDistance = 80,
    edgeOnly = true,
    edgeSize = 28,
    mobileMaxWidth = 768,
    preventScrollOnSwipe = false,
    blockedRoutes = ["/"],
  } = options;

  const handlers = useSwipeable({
    onSwipedRight: (eventData) => {
      if (disabled) return;

      // only mobile/tablet-small screens
      if (window.innerWidth > mobileMaxWidth) return;

      // block swipe-back on specific routes
      if (blockedRoutes.includes(location.pathname)) return;

      // only allow swipe from left edge
      if (edgeOnly && eventData.initial[0] > edgeSize) return;

      // avoid accidental tiny swipe
      if (Math.abs(eventData.deltaX) < minSwipeDistance) return;

      // ignore mostly vertical movement
      if (Math.abs(eventData.deltaY) > Math.abs(eventData.deltaX)) return;

      navigate(-1);
    },

    delta: 10,
    trackTouch: true,
    trackMouse: false,
    preventScrollOnSwipe,
  });

  return handlers;
}