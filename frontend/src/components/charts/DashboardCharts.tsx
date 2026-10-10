"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";

interface DashboardChartsProps {
  statusData: { name: string; count: number; color: string }[];
  priorityData: { name: string; count: number; color: string }[];
}

export function DashboardCharts({ statusData, priorityData }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Tasks by Status Chart */}
      <div className="p-5 rounded-2xl bg-editor border border-divider shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-carbon">Tasks by Status</h3>
            <p className="text-xs text-muted">Current distribution across workflow stages</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="name"
                stroke="#686D64"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#DAD8CE" }}
              />
              <YAxis
                stroke="#686D64"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#DAD8CE" }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FCFBF7",
                  border: "1px solid #DAD8CE",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  color: "#232722",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {statusData.map((entry, index) => (
                  <Cell key={`status-cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tasks by Priority Distribution */}
      <div className="p-5 rounded-2xl bg-editor border border-divider shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-carbon">Priority Breakdown</h3>
            <p className="text-xs text-muted">Risk and urgency allocation</p>
          </div>
        </div>

        <div className="h-64 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FCFBF7",
                  border: "1px solid #DAD8CE",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  color: "#232722",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
                }}
              />
              <Pie
                data={priorityData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
              >
                {priorityData.map((entry, index) => (
                  <Cell key={`prio-cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-2">
          {priorityData.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5 text-xs text-muted font-medium">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.name} ({item.count})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
