import React from 'react';

export default function MacroRing({ protein, carbs, fat, size = 120 }) {
  // Calculate total and percentages
  const total = protein + carbs + fat;
  const proteinPercent = total > 0 ? (protein / total) * 100 : 0;
  const carbsPercent = total > 0 ? (carbs / total) * 100 : 0;
  const fatPercent = total > 0 ? (fat / total) * 100 : 0;

  // Calculate circle properties
  const strokeWidth = size * 0.15;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate stroke dash arrays for each segment
  const proteinDash = (proteinPercent / 100) * circumference;
  const carbsDash = (carbsPercent / 100) * circumference;
  const fatDash = (fatPercent / 100) * circumference;

  // Calculate rotation angles
  const proteinRotation = -90;
  const carbsRotation = -90 + (proteinPercent * 3.6);
  const fatRotation = -90 + ((proteinPercent + carbsPercent) * 3.6);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />

        {/* Protein segment (blue) */}
        {proteinPercent > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={strokeWidth}
            strokeDasharray={`${proteinDash} ${circumference}`}
            strokeLinecap="round"
            transform={`rotate(${proteinRotation} ${size / 2} ${size / 2})`}
          />
        )}

        {/* Carbs segment (amber) */}
        {carbsPercent > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={strokeWidth}
            strokeDasharray={`${carbsDash} ${circumference}`}
            strokeLinecap="round"
            transform={`rotate(${carbsRotation} ${size / 2} ${size / 2})`}
          />
        )}

        {/* Fat segment (rose) */}
        {fatPercent > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f43f5e"
            strokeWidth={strokeWidth}
            strokeDasharray={`${fatDash} ${circumference}`}
            strokeLinecap="round"
            transform={`rotate(${fatRotation} ${size / 2} ${size / 2})`}
          />
        )}
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xs font-medium text-slate-500">Macros</div>
          <div className="text-lg font-bold text-slate-900">{total.toFixed(0)}g</div>
        </div>
      </div>
    </div>
  );
}