"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Circle, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface Task {
  _id: string
  title: string
  completed: boolean
  projectId: string
}

export function ProjectTaskList({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [isAddingTask, setIsAddingTask] = useState(false)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // In a real app, this would fetch from the API
        // const data = await fetchWithAuth(`http://localhost:5000/api/projects/${projectId}/tasks`)
        // setTasks(data)

        // For demo purposes, we'll use mock data
        setTasks([
          {
            _id: "1",
            title: "Complete foundation work",
            completed: true,
            projectId,
          },
          {
            _id: "2",
            title: "Install electrical wiring",
            completed: false,
            projectId,
          },
          {
            _id: "3",
            title: "Finish plumbing installation",
            completed: false,
            projectId,
          },
          {
            _id: "4",
            title: "Paint interior walls",
            completed: false,
            projectId,
          },
        ])
      } catch (error) {
        console.error("Error fetching tasks:", error)
        toast.error("Failed to load tasks")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [projectId])

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return

    setIsAddingTask(true)
    try {
      // In a real app, this would send to the API
      // const data = await fetchWithAuth(`http://localhost:5000/api/projects/${projectId}/tasks`, {
      //   method: "POST",
      //   body: JSON.stringify({ title: newTaskTitle }),
      // })

      // For demo purposes, we'll create a mock task
      const newTask = {
        _id: Date.now().toString(),
        title: newTaskTitle,
        completed: false,
        projectId,
      }

      setTasks([...tasks, newTask])
      setNewTaskTitle("")
      toast.success("Task added successfully")
    } catch (error) {
      console.error("Error adding task:", error)
      toast.error("Failed to add task")
    } finally {
      setIsAddingTask(false)
    }
  }

  const handleToggleTask = async (taskId: string) => {
    try {
      const updatedTasks = tasks.map((task) => {
        if (task._id === taskId) {
          return { ...task, completed: !task.completed }
        }
        return task
      })

      setTasks(updatedTasks)

      // In a real app, this would update the API
      // await fetchWithAuth(`http://localhost:5000/api/tasks/${taskId}`, {
      //   method: "PATCH",
      //   body: JSON.stringify({ completed: !tasks.find(t => t._id === taskId)?.completed }),
      // })
    } catch (error) {
      console.error("Error toggling task:", error)
      toast.error("Failed to update task")
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      setTasks(tasks.filter((task) => task._id !== taskId))

      // In a real app, this would delete from the API
      // await fetchWithAuth(`http://localhost:5000/api/tasks/${taskId}`, {
      //   method: "DELETE",
      // })

      toast.success("Task deleted successfully")
    } catch (error) {
      console.error("Error deleting task:", error)
      toast.error("Failed to delete task")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Tasks</CardTitle>
        <CardDescription>Manage and track project tasks</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a new task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddTask()
                  }
                }}
              />
              <Button onClick={handleAddTask} disabled={isAddingTask || !newTaskTitle.trim()}>
                {isAddingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
            <div className="space-y-2">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <div key={task._id} className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleToggleTask(task._id)}
                      >
                        {task.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </Button>
                      <span className={task.completed ? "text-muted-foreground line-through" : ""}>{task.title}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteTask(task._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="flex h-20 flex-col items-center justify-center rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">No tasks yet</p>
                  <p className="text-xs text-muted-foreground">Add a task to get started</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t bg-muted/50 px-6 py-3">
        <div className="flex w-full justify-between text-sm">
          <span className="text-muted-foreground">
            {tasks.filter((task) => task.completed).length} of {tasks.length} tasks completed
          </span>
          <span className="font-medium">
            {Math.round((tasks.filter((task) => task.completed).length / tasks.length) * 100) || 0}% complete
          </span>
        </div>
      </CardFooter>
    </Card>
  )
}
