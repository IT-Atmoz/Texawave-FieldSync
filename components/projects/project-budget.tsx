"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface BudgetCategory {
  name: string
  allocated: number
  spent: number
}

export function ProjectBudget({ projectId, budget }: { projectId: string; budget: number }) {
  const [budgetData, setBudgetData] = useState<BudgetCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalSpent, setTotalSpent] = useState(0)

  useEffect(() => {
    const fetchBudgetData = async () => {
      try {
        // In a real app, this would fetch from the API
        // const data = await fetchWithAuth(`http://localhost:5000/api/projects/${projectId}/budget`)
        // setBudgetData(data.categories)
        // setTotalSpent(data.totalSpent)

        // For demo purposes, we'll use mock data
        const mockData = [
          {
            name: "Materials",
            allocated: budget * 0.4,
            spent: budget * 0.35,
          },
          {
            name: "Labor",
            allocated: budget * 0.3,
            spent: budget * 0.28,
          },
          {
            name: "Equipment",
            allocated: budget * 0.15,
            spent: budget * 0.12,
          },
          {
            name: "Permits",
            allocated: budget * 0.05,
            spent: budget * 0.05,
          },
          {
            name: "Miscellaneous",
            allocated: budget * 0.1,
            spent: budget * 0.07,
          },
        ]

        setBudgetData(mockData)
        setTotalSpent(mockData.reduce((acc, item) => acc + item.spent, 0))
      } catch (error) {
        console.error("Error fetching budget data:", error)
        toast.error("Failed to load budget data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBudgetData()
  }, [projectId, budget])

  const percentSpent = (totalSpent / budget) * 100

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
          <CardDescription>Track your project budget and expenses</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Budget</span>
                  <span className="text-xl font-bold">${budget.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Spent</span>
                  <span className="text-xl font-bold">${totalSpent.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Remaining</span>
                  <span className="text-xl font-bold">${(budget - totalSpent).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{percentSpent.toFixed(1)}%</span>
                </div>
                <Progress value={percentSpent} className="h-2" />
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Budget Breakdown</h3>
                <div className="space-y-2">
                  {budgetData.map((category) => (
                    <div key={category.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{category.name}</span>
                        <span>
                          ${category.spent.toLocaleString()} / ${category.allocated.toLocaleString()}
                        </span>
                      </div>
                      <Progress value={(category.spent / category.allocated) * 100} className="h-1" />
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Add Expense
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Budget Chart</CardTitle>
          <CardDescription>Visual representation of budget allocation and spending</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={budgetData}
                  margin={{
                    top: 20,
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
                  <Bar dataKey="allocated" name="Allocated" fill="#8884d8" />
                  <Bar dataKey="spent" name="Spent" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
