"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Toaster } from "sonner"

import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import Footer from "@/components/dashboard/footer" // ✅ Imported Footer

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    const user = localStorage.getItem("user")

    if (!token || !user) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      router.push("/login")
    } else {
      try {
        const tokenParts = token.split(".")
        if (tokenParts.length !== 3) throw new Error("Invalid token")

        JSON.parse(user)
        setIsAuthenticated(true)
      } catch (error) {
        console.error("Invalid auth data:", error)
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        router.push("/login")
      }
    }

    setIsLoading(false)
  }, [pathname, router])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300">
      <DashboardHeader />
      <div className="flex flex-1">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto p-4 pt-16 md:p-6 md:pl-72 bg-muted/10 dark:bg-muted/20">
          {children}
        </main>
      </div>
      <Footer /> {/* ✅ Footer added here */}
      <Toaster position="top-right" />
    </div>
  )
}
