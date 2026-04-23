"use client";

import React from "react";

interface ProgressBarProps {
  totalChunks: number;
  usedChunks: number;
}

export default function ProgressBar({ totalChunks, usedChunks }: ProgressBarProps) {
  const percentage = totalChunks > 0 ? Math.round((usedChunks / totalChunks) * 100) : 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">
          {usedChunks} of {totalChunks} phrases used
        </span>
        <span className="text-sm font-bold text-[#4e342e]">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-gradient-to-r from-[#4e342e] to-amber-600 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
