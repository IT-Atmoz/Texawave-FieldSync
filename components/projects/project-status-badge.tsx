import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ProjectStatusBadgeProps {
  status: string
  size?: "default" | "lg"
}

export function ProjectStatusBadge({ status, size = "default" }: ProjectStatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case "ongoing":
        return "bg-green-50 text-green-700 border-green-200 hover:bg-green-50"
      case "hold":
        return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50"
      case "completed":
        return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-50"
    }
  }

  return (
    <Badge variant="outline" className={cn(getStatusStyles(), size === "lg" && "px-3 py-1 text-sm")}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}
