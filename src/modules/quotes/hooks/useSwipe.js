import { useRef } from "react";

const minimumSwipeDistance = 52;

export default function useSwipe({ onSwipeLeft, onSwipeRight }) {
    const touchStartX = useRef(null);

    return {
        onTouchEnd: (event) => {
            if (touchStartX.current === null) {
                return;
            }

            const distance = event.changedTouches[0].clientX - touchStartX.current;
            touchStartX.current = null;

            if (Math.abs(distance) < minimumSwipeDistance) {
                return;
            }

            if (distance < 0) {
                onSwipeLeft?.();
            } else {
                onSwipeRight?.();
            }
        },
        onTouchStart: (event) => {
            touchStartX.current = event.touches[0].clientX;
        },
    };
}
