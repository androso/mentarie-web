"use client";

import React from "react";

interface WaveAnimationProps {
  animationState: "idle" | "listening" | "speaking";
  waveRef: React.RefObject<HTMLDivElement | null>;
}

export const WaveAnimation: React.FC<WaveAnimationProps> = ({
  animationState,
  waveRef,
}) => {
  return (
    <div className="w-64 h-64 relative">
      <div className="absolute inset-0 rounded-full border border-indigo-100"></div>
      <div
        ref={waveRef}
        className={`absolute inset-0 rounded-full overflow-hidden ${
          animationState === "idle"
            ? "opacity-80"
            : animationState === "listening"
            ? "opacity-90 scale-105"
            : "opacity-100 scale-110"
        } transition-all duration-300`}
      >
        <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-indigo-400 transform-gpu">
          <div className="absolute -top-10 left-0 right-0 h-16 animate-wave">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1440 320"
              className="absolute bottom-0 w-full"
            >
              <path
                fill="currentColor"
                fillOpacity="1"
                className="text-indigo-400"
                d="M0,160L34.3,165.3C68.6,171,137,181,206,170.7C274.3,160,343,128,411,122.7C480,117,549,139,617,133.3C685.7,128,754,96,823,106.7C891.4,117,960,171,1029,197.3C1097.1,224,1166,224,1234,208C1302.9,192,1371,160,1406,144L1440,128L1440,320L1405.7,320C1371.4,320,1303,320,1234,320C1165.7,320,1097,320,1029,320C960,320,891,320,823,320C754.3,320,686,320,617,320C548.6,320,480,320,411,320C342.9,320,274,320,206,320C137.1,320,69,320,34,320L0,320Z"
              ></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
