"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Building2,
  FileStack,
  Calendar,
  MapPin,
  MessageSquare,
  Brush,
  File,
  ChevronDown,
  ClipboardList,
  Clock,
  CreditCard,
  Workflow,
  FileText,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Map,
  UserCog,
  Menu,
  Package,
  Settings,
  Truck,
  ReceiptText,
  Users,
  Car,
  X,
  Clipboard,
  Briefcase
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface SidebarItem {
  title: string
  icon: React.ElementType
  href?: string
  submenu?: {
    title: string
    href: string
  }[]
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "Projects",
    icon: Building2,
    href: "/projects",
  },
  {
    title: "Invoice",
    icon: BarChart3,
    href: "/finance/invoices",
  },
  //   {
  //   title: "Subcontractor Billing",
  //   icon: ReceiptText,
  //   href: "/subcontractor",
  // },
  {
    title: "Employees",
    icon: Users,
    href: "/employees",
  },
  {
    title: "Attendance",
    icon: Clock,
    href: "/attendance",
  },
  {
    title: "PayRoll",
    icon: CreditCard,
    href: "/salary",
  },
  {
    title: "Tasks",
    icon: ClipboardList,
    href: "/tasks",
  },
  {
    title: "Shifts Management",
    icon: Briefcase,
    href: "/shifts",
  },
  {
    title: "Leaves",
    icon: Calendar,
    href: "/leaves",
  },
  {
    title: "Materials",
    icon: Package,
    href: "/materials",
    submenu: [
      {
        title: "Requests",
        href: "/materials/requests",
      },
      {
        title: "Inventory",
        href: "/materials/inventory",
      },
      {
        title: "Spending",
        href: "/materials/spending",
      },
    ],
  },
  {
    title: "Documents",
    icon: FileStack,
    href: "/documents",
  },
  {
    title: "Drawings",
    icon: Brush,
    href: "/drawings",
  },
  {
    title: "Reports",
    icon: FileText,
    href: "/reports",
  },
  {
    title: "Chat Employees",
    icon: MessageSquare,
    href: "/chats",
  },
  {
    title: "Location Tracking",
    icon: MapPin,
    href: "/location",
  },
  // {
  //   title: "Work History",
  //   icon: Workflow,
  //   href: "/history",
  // },
  {
    title: "Employee Details",
    icon: UserCog,
    href: "/employeedetails",
  },
  {
    title: "Driver Details",
    icon: Car,
    href: "/driverdetails",
    submenu: [
      { title: "Add Driver", href: "/driverdetails/add-driver" },
      { title: "Add Vehicle", href: "/driverdetails/add-vechile" },
      { title: "Assign Delivery", href: "/driverdetails/pending-requests" },
      { title: "Track Driver", href: "/driverdetails/track-driver" },
          { title: "Verify deliveries", href: "/driverdetails/verify" },
        { title: "History", href: "/driverdetails/history" },
    ],
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1024) {
        setIsOpen(false)
      } else {
        setIsOpen(true)
      }
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  return (
    <>
      {isMobile && (
        <Button
          variant="outline"
          size="icon"
          className="fixed left-4 top-4 z-50 lg:hidden dark:bg-gray-800 dark:text-white dark:border-gray-600"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-white dark:bg-gray-900 dark:border-gray-700 transition-transform duration-300 ease-in-out",
          isMobile && !isOpen ? "-translate-x-full" : "translate-x-0",
        )}
      >
        <div className="flex h-14 items-center border-b px-4 dark:border-gray-700">
          <Link href="/dashboard" className="flex items-center gap-3 font-semibold">
            <img
              src="https://i.postimg.cc/LXK9dpW3/fsy-removebg-preview.png"
              alt="FieldSync Logo"
              className="h-6 w-6 object-contain"
            />
            <span className="text-lg text-black dark:text-white">Field Sync</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <div key={item.title} className="py-1">
                {item.submenu ? (
                  <Collapsible className="w-full">
                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-muted dark:hover:bg-gray-800">
                      <div className="flex items-center">
                        <item.icon className="mr-3 h-5 w-5 text-muted-foreground dark:text-gray-300" />
                        <span className="truncate text-muted-foreground dark:text-gray-300">{item.title}</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground dark:text-gray-300" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="ml-9 mt-1 space-y-1">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.title}
                          href={subItem.href}
                          className={cn(
                            "block rounded-md px-3 py-2 text-sm hover:bg-muted dark:hover:bg-gray-800",
                            pathname === subItem.href
                              ? "bg-primary/10 font-medium text-primary dark:bg-primary/20 dark:text-white"
                              : "text-muted-foreground dark:text-gray-300",
                          )}
                        >
                          {subItem.title}
                        </Link>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <Link
                    href={item.href || "#"}
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-muted dark:hover:bg-gray-800",
                      pathname === item.href ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-white" : "text-muted-foreground dark:text-gray-300",
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5 dark:text-gray-300" />
                    <span className="truncate">{item.title}</span>
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="border-t p-4 dark:border-gray-700">
          <Button
            variant="outline"
            className="w-full justify-start dark:bg-gray-800 dark:text-white dark:border-gray-600"
            onClick={() => {
              localStorage.removeItem("token")
              localStorage.removeItem("user")
              window.location.href = "/login"
            }}
          >
            <LogOut className="mr-2 h-4 w-4 dark:text-gray-300" />
            <span>Log Out</span>
          </Button>
        </div>
      </aside>

      {isMobile && isOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 dark:bg-black/70 lg:hidden" onClick={() => setIsOpen(false)} aria-hidden="true" />
      )}
    </>
  )
}
