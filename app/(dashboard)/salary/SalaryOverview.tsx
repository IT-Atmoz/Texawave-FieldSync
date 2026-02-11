"use client";

import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { saveAs } from "file-saver";

interface SalaryOverviewProps {
  totalPayroll: number;
  paidCount: number;
  pendingCount: number;
  disputedCount: number;
}

const SalaryOverview: React.FC<SalaryOverviewProps> = ({
  totalPayroll,
  paidCount,
  pendingCount,
  disputedCount,
}) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = new Chart(chartRef.current, {
      type: "line",
      data: {
        labels: ["Paid", "Pending", "Disputed"],
        datasets: [
          {
            label: "Salary Status",
            data: [paidCount, pendingCount, disputedCount],
            borderColor: "#3B82F6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            pointBackgroundColor: ["#10B981", "#F59E0B", "#EF4444"],
            pointBorderColor: "#fff",
            pointRadius: 6,
            pointHoverRadius: 8,
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: { color: "#374151" },
          },
          tooltip: {
            enabled: true,
            backgroundColor: "#111827",
            titleColor: "#fff",
            bodyColor: "#D1D5DB",
          },
        },
        scales: {
          y: {
            ticks: {
              stepSize: 1,
              color: "#6B7280",
            },
          },
          x: {
            ticks: {
              color: "#6B7280",
            },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [paidCount, pendingCount, disputedCount]);

  const exportCSV = () => {
    const rows = [
      ["Metric", "Value"],
      ["Total Payroll", totalPayroll],
      ["Paid Salaries", paidCount],
      ["Pending Salaries", pendingCount],
      ["Disputed Salaries", disputedCount],
    ];

    const csvContent = rows.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "payroll-overview.csv");
  };

  return (
    <div className="bg-white rounded-xl shadow-xl p-6 sm:p-8 transition hover:shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 sm:mb-0">
          Payroll Overview
        </h2>
        <button
          onClick={exportCSV}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md transition"
        >
          Export as CSV
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-100 p-4 rounded-lg text-center shadow-sm hover:shadow-md transition">
          <p className="text-sm text-gray-600">Total Payroll</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">
            ₹{totalPayroll.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg text-center shadow-sm hover:shadow-md transition">
          <p className="text-sm text-gray-600">Paid Salaries</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{paidCount}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg text-center shadow-sm hover:shadow-md transition">
          <p className="text-sm text-gray-600">Pending Salaries</p>
          <p className="text-2xl font-bold text-yellow-700 mt-1">{pendingCount}</p>
        </div>
      </div>

      <div className="relative h-72 sm:h-96">
        <canvas ref={chartRef} />
      </div>
    </div>
  );
};

export default SalaryOverview;
