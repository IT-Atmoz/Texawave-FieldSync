"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ShieldCheck, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"

export function DashboardHeader() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null)

  useEffect(() => {
    setMounted(true)
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <header className="fixed top-0 z-20 flex h-14 w-full items-center justify-between gap-4 border-b bg-background dark:bg-gray-900 dark:border-gray-700 px-4 sm:px-6 md:pl-72">
      
      {/* Left: Logo */}
      <div className="hidden md:block">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="text-lg text-black dark:text-white">Field Sync</span>
        </Link>
      </div>

      {/* Center: Security Badge */}
      <div className="flex flex-1 items-center justify-center">
        <motion.div
          className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900 dark:text-green-100"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ShieldCheck className="h-4 w-4" />
          </motion.span>
          <motion.span
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="hidden sm:inline"
          >
            ISO 27001, 27017, 27018, 27701 & SOC 2,3 Certified (Built using Google Firebase)
          </motion.span>
          <motion.span
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="inline sm:hidden"
          >
            Firebase Secured
          </motion.span>
        </motion.div>
      </div>

      {/* Right: Theme Toggle & Help */}
      <div className="flex items-center gap-2">
{/*         {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="hover:bg-muted dark:hover:bg-gray-800"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 text-yellow-400" />
            ) : (
              <Moon className="h-5 w-5 text-gray-800" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        )} */}
        <Link href="/help">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full text-sm font-medium border-muted-foreground dark:border-gray-600 dark:text-white hover:bg-muted dark:hover:bg-gray-800 transition"
          >
            Help
          </Button>
        </Link>
      </div>
    </header>
  )
}
