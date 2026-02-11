// User types
export interface User {
  _id: string
  name: string
  email: string
  role: "admin" | "engineer" | "worker" | "accountant" | "client"
}

// Project types
export interface Project {
  _id: string
  name: string
  description: string
  location: string
  budget: number
  manager: string
  status: "ongoing" | "hold" | "completed"
  startDate: string | Date
  endDate?: string | Date | null
  image?: string
  tasks?: string[]
  employees?: string[]
  createdAt?: string
  updatedAt?: string
}

// Employee types
export interface Employee {
  _id: string
  name: string
  position: string
  email: string
  phone?: string
  address?: string
  branch: string
  role: "admin" | "engineer" | "worker" | "accountant"
  joinDate: string | Date
  salary: number
  status: "active" | "inactive"
  photo?: string
  projects?: string[]
  user?: string
  createdAt?: string
  updatedAt?: string
}

// Task types
export interface Task {
  _id: string
  title: string
  description?: string
  projectId: string
  assignedTo?: string
  status: "not_started" | "in_progress" | "completed"
  priority: "low" | "medium" | "high"
  startDate?: string | Date
  dueDate?: string | Date
  completed: boolean
  completedAt?: string | Date
  createdAt?: string
  updatedAt?: string
}

// Dashboard types
export interface DashboardStats {
  activeProjects: number
  totalEmployees: number
  sitesWithActiveWorkers: number
  pendingRequests: number
}

export interface Activity {
  id: string
  type: "project" | "task" | "material" | "attendance" | "report"
  action: string
  user: {
    name: string
    avatar?: string
  }
  target: string
  timestamp: string
}
