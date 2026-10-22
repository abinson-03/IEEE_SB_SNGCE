import React, { useRef, useState, useEffect } from "react";
import "./StatCounter.css";

/**
 * StatCounter
 * Animates a number from 0 → target using requestAnimationFrame.
 * Animation triggers only when the element enters the viewport
 * (IntersectionObserver) — fires once per page load.
 *
 * Props:
 *   target  {number}  The final count value
 *   label   {string}  Label shown below the number
 *   icon    {string}  Emoji / text icon
 *   suffix  {string}  Optional suffix (e.g. "+")
 */
const DURATION_MS = 1800;

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

const StatCounter = ({ target = 0, label, icon, suffix = "+" }) => {
  const [count, setCount] = useState(target);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  // Trigger animation when element enters viewport, with fallback timer
  useEffect(() => {
    // Immediate fallback: ensure started is true after a short delay in case IntersectionObserver doesn't fire
    const fallbackTimer = setTimeout(() => {
      setStarted(true);
    }, 400);

    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setStarted(true);
      return () => clearTimeout(fallbackTimer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);

    return () => {
      clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, []);

  // Run the count animation once started
  useEffect(() => {
    if (!started || target === 0) {
      setCount(target);
      return;
    }
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / DURATION_MS, 1);
      setCount(Math.floor(easeOut(progress) * target));
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setCount(target);
      }
    };

    const animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [started, target]);

  // Display count, or target as fallback if count is 0
  const displayVal = count > 0 ? count : target;

  return (
    <div className="stat-counter" ref={ref}>
      <span className="stat-counter__icon" aria-hidden="true">{icon}</span>
      <span className="stat-counter__number">
        {displayVal.toLocaleString()}{target > 0 ? suffix : ""}
      </span>
      <span className="stat-counter__label">{label}</span>
    </div>
  );
};

export default StatCounter;
