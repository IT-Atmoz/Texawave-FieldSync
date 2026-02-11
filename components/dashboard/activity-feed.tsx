"use client"

import { useEffect, useState } from "react"
import { Building2, Calendar, CheckCircle, Clock, FileText, Package } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Activity {
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

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // In a real app, this would fetch from the API
        // const data = await fetchWithAuth("http://localhost:5000/api/activities")
        // setActivities(data)

        // For demo purposes, we'll use mock data
        setActivities([
          {
            id: "1",
            type: "project",
            action: "created",
            user: {
              name: "John Doe",
              avatar: "",
            },
            target: "Skyline Tower",
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          },
          {
            id: "2",
            type: "task",
            action: "completed",
            user: {
              name: "Jane Smith",
              avatar: "",
            },
            target: "Foundation inspection",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          },
          {
            id: "3",
            type: "material",
            action: "requested",
            user: {
              name: "Mike Johnson",
              avatar: "",
            },
            target: "Cement (200 bags)",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
          },
          {
            id: "4",
            type: "attendance",
            action: "checked in",
            user: {
              name: "Sarah Williams",
              avatar: "",
            },
            target: "Riverside Mall site",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
          },
          {
            id: "5",
            type: "report",
            action: "submitted",
            user: {
              name: "Robert Brown",
              avatar: "",
            },
            target: "Daily progress report",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          },
        ])
      } catch (error) {
        console.error("Error fetching activities:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivities()
  }, [])

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "project":
        return <Building2 className="h-4 w-4" />
      case "task":
        return <CheckCircle className="h-4 w-4" />
      case "material":
        return <Package className="h-4 w-4" />
      case "attendance":
        return <Clock className="h-4 w-4" />
      case "report":
        return <FileText className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const activityTime = new Date(timestamp)
    const diffMs = now.getTime() - activityTime.getTime()
    const diffMins = Math.round(diffMs / 60000)

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`
    }

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
    }

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4">
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted"></div>
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={activity.user.avatar || "/placeholder.svg"} alt={activity.user.name} />
            <AvatarFallback>{getInitials(activity.user.name)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1 flex-1">
            <p className="text-sm">
              <span className="font-medium">{activity.user.name}</span>{" "}
              <span className="text-muted-foreground">{activity.action}</span>{" "}
              <span className="font-medium">{activity.target}</span>
            </p>
            <div className="flex items-center text-xs text-muted-foreground">
              {getActivityIcon(activity.type)}
              <span className="ml-1 capitalize">{activity.type}</span>
              <span className="mx-1">•</span>
              <span>{getTimeAgo(activity.timestamp)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
