"use client"

import { useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const projectStatusData = [
  { name: "Ongoing", value: 12, color: "#10b981" },
  { name: "On Hold", value: 5, color: "#f59e0b" },
  { name: "Completed", value: 8, color: "#3b82f6" },
]

const budgetData = [
  { name: "Commercial", budget: 1200000, actual: 1150000 },
  { name: "Residential", budget: 800000, actual: 850000 },
  { name: "Infrastructure", budget: 1500000, actual: 1600000 },
  { name: "Industrial", budget: 950000, actual: 900000 },
]

export function DashboardChart() {
  const [activeTab, setActiveTab] = useState("status")

  return (
    <Card className="border-0 shadow-none">
      <Tabs defaultValue="status" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="status">Project Status</TabsTrigger>
          <TabsTrigger value="budget">Budget Allocation</TabsTrigger>
        </TabsList>
        <TabsContent value="status" className="h-[300px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={projectStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {projectStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </TabsContent>
        <TabsContent value="budget" className="h-[300px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={budgetData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="budget" name="Budget" fill="#8884d8" />
              <Bar dataKey="actual" name="Actual" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
