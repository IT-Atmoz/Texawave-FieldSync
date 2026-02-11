"use client";

import React from "react";

interface SalaryAnalyticsProps {
  departmentSalaries: { department: string; totalSalary: number }[];
}

const SalaryAnalytics: React.FC<SalaryAnalyticsProps> = ({ departmentSalaries }) => {
  if (!departmentSalaries || departmentSalaries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 text-center text-gray-600">
        No data available for analytics
      </div>
    );
  }

  // Graph dimensions
  const graphWidth = 600;
  const graphHeight = 300;
  const margin = { top: 20, right: 20, bottom: 60, left: 60 };
  const innerWidth = graphWidth - margin.left - margin.right;
  const innerHeight = graphHeight - margin.top - margin.bottom;

  // Calculate max salary for scaling
  const maxSalary = Math.max(...departmentSalaries.map((d) => d.totalSalary), 1);
  const barWidth = innerWidth / departmentSalaries.length - 10; // 10px gap between bars

  // Y-axis ticks (5 levels)
  const yTicks = Array.from({ length: 5 }, (_, i) => (maxSalary * i) / 4);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Department Salary Analytics</h2>
      <div className="h-64 overflow-x-auto">
        <svg width={graphWidth} height={graphHeight}>
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Y-axis */}
            <line x1="0" y1="0" x2="0" y2={innerHeight} stroke="#000" />
            {yTicks.map((tick, i) => (
              <g key={i}>
                <line x1="-5" y1={innerHeight - (tick / maxSalary) * innerHeight} x2="0" y2={innerHeight - (tick / maxSalary) * innerHeight} stroke="#000" />
                <text x="-50" y={innerHeight - (tick / maxSalary) * innerHeight + 5} fontSize="12" textAnchor="end">
                  ₹{tick.toLocaleString("en-IN")}
                </text>
              </g>
            ))}
            <text x="-30" y="-10" fontSize="12" textAnchor="middle">Total Salary (₹)</text>

            {/* X-axis */}
            <line x1="0" y1={innerHeight} x2={innerWidth} y2={innerHeight} stroke="#000" />
            {departmentSalaries.map((d, i) => (
              <g key={i}>
                <text
                  x={(i + 0.5) * (barWidth + 10)}
                  y={innerHeight + 20}
                  fontSize="12"
                  textAnchor="middle"
                  transform={`rotate(45, ${(i + 0.5) * (barWidth + 10)}, ${innerHeight + 20})`}
                >
                  {d.department}
                </text>
              </g>
            ))}
            <text x={innerWidth / 2} y={innerHeight + 50} fontSize="12" textAnchor="middle">Department</text>

            {/* Bars */}
            {departmentSalaries.map((d, i) => {
              const barHeight = (d.totalSalary / maxSalary) * innerHeight;
              return (
                <g key={i}>
                  <rect
                    x={i * (barWidth + 10)}
                    y={innerHeight - barHeight}
                    width={barWidth}
                    height={barHeight}
                    fill="#3B82F6"
                  />
                  <text
                    x={i * (barWidth + 10) + barWidth / 2}
                    y={innerHeight - barHeight - 5}
                    fontSize="10"
                    textAnchor="middle"
                    fill="#000"
                  >
                    ₹{d.totalSalary.toLocaleString("en-IN")}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};

export default SalaryAnalytics;
