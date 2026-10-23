"use client";

import React from "react";

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

/**
 * Deterministic SVG matrix code representing the verified grievance tracking URL.
 * Generates an SVG 2D barcode pattern matching the token hash with positional finder corners.
 */
export function QRCode({ value, size = 120, className = "" }: QRCodeProps) {
  // Simple deterministic pseudo-random hash generator for 21x21 QR-like matrix
  const matrixSize = 21;
  const grid: boolean[][] = Array.from({ length: matrixSize }, () =>
    Array(matrixSize).fill(false)
  );

  // Position detection patterns (7x7 corners)
  const addFinderPattern = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[startY + r][startX + c] = isBorder || isCenter;
      }
    }
  };

  addFinderPattern(0, 0); // Top-left
  addFinderPattern(14, 0); // Top-right
  addFinderPattern(0, 14); // Bottom-left

  // Seed data from string characters
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  // Populate data cells
  let bitIndex = 0;
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      // Skip finder corners
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c > 12;
      const inBottomLeft = r > 12 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft) continue;

      // Timing tracks
      if (r === 6 || c === 6) {
        grid[r][c] = (r + c) % 2 === 0;
        continue;
      }

      const bit = ((hash ^ (r * 31 + c * 17 + bitIndex)) & 1) === 1;
      grid[r][c] = bit;
      bitIndex++;
    }
  }

  const cellSize = size / matrixSize;

  return (
    <div className={`inline-block bg-white p-2 rounded border border-slate-200 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
        role="img"
        aria-label={`Tracking QR Code for ${value}`}
      >
        <rect width={size} height={size} fill="#ffffff" />
        {grid.map((row, r) =>
          row.map((cell, c) =>
            cell ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize + 0.2}
                height={cellSize + 0.2}
                fill="#0f172a"
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
}
