"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, User, Key } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showDemoCredentials, setShowDemoCredentials] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Detect system theme
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    setIsDarkMode(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches)
    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [])

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      router.push("/dashboard")
    }
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const apiUrl = 'https://fieldsyncer.vercel.app'
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Login failed")
      }

      localStorage.removeItem("token")
      localStorage.removeItem("user")
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      toast.success("Login successful!", {
        style: {
          background: isDarkMode ? "#1f2937" : "#ffffff",
          color: isDarkMode ? "#ffffff" : "#1f2937",
          border: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
        },
      })
      router.push("/dashboard")
    } catch (error) {
      console.error("Login error:", error)
      toast.error(error instanceof Error ? error.message : "Login failed. Please try again.", {
        style: {
          background: isDarkMode ? "#1f2937" : "#ffffff",
          color: isDarkMode ? "#ffffff" : "#1f2937",
          border: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoClick = async () => {
    setFormData({
      email: "admin",
      password: "admin",
    })

    setIsLoading(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: "admin", password: "admin" }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Login failed")
      }

      localStorage.removeItem("token")
      localStorage.removeItem("user")
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      toast.success("Login successful!", {
        style: {
          background: isDarkMode ? "#1f2937" : "#ffffff",
          color: isDarkMode ? "#ffffff" : "#1f2937",
          border: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
        },
      })
      router.push("/dashboard")
    } catch (error) {
      console.error("Demo login error:", error)
      toast.error(error instanceof Error ? error.message : "Demo login failed. Please try again.", {
        style: {
          background: isDarkMode ? "#1f2937" : "#ffffff",
          color: isDarkMode ? "#ffffff" : "#1f2937",
          border: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 3D floating element variants
  const floatVariants = {
    animate: (i: number) => ({
      y: [0, -20, 0],
      x: [0, 10, 0],
      rotate: [0, 15, -15, 0],
      scale: [1, 1.1, 1],
      opacity: [0.3, 0.5, 0.3],
      transition: {
        duration: 5 + i,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
        delay: i * 0.5,
      },
    }),
  }

  // Demo card animation variants
  const demoCardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.3 } },
  }

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}>
      {/* 3D Floating Construction Elements */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              custom={i}
              variants={floatVariants}
              animate="animate"
              initial={{ opacity: 0, scale: 0.5 }}
              style={{
                left: `${Math.random() * 90 + 5}%`,
                top: `${Math.random() * 90 + 5}%`,
              }}
            >
              <svg
                className={`h-20 w-20 ${isDarkMode ? "text-indigo-400/30" : "text-indigo-600/30"} drop-shadow-lg`}
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{
                  filter: `drop-shadow(0 0 10px ${isDarkMode ? "rgba(129, 140, 248, 0.3)" : "rgba(79, 70, 229, 0.3)"})`,
                }}
              >
                <path
                  d={
                    i % 3 === 0
                      ? "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                      : i % 3 === 1
                      ? "M22 11V3h-7v3H9V3H2v8h7V8h6v3h7z"
                      : "M3 18h18v-6H3v6zm0-8h18V6H3v4z"
                  }
                />
              </svg>
            </motion.div>
          ))}
        </AnimatePresence>
        <div className={`absolute inset-0 ${isDarkMode ? "bg-gray-900/60" : "bg-gray-100/60"}`} />
      </div>

      {/* Animated Card */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-4 sm:px-0"
      >
        <Card
          className={`w-full bg-${isDarkMode ? "gray-800/95" : "white/95"} backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden border ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          } transition-all duration-300 hover:shadow-3xl`}
        >
          <CardHeader
            className={`space-y-2 p-8 bg-gradient-to-r ${
              isDarkMode ? "from-gray-800 to-gray-700" : "from-indigo-600 to-purple-600"
            } text-${isDarkMode ? "white" : "white"}`}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex items-center space-x-3"
            >
              <svg className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <CardTitle className="text-4xl font-extrabold tracking-tight">FieldSync</CardTitle>
            </motion.div>
            <CardDescription
              className={`${isDarkMode ? "text-gray-300" : "text-indigo-100"} text-base font-medium`}
            >
              Sign in to manage your construction projects
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 p-8">
              <div className="space-y-3">
                <Label
                  htmlFor="email"
                  className={`text-sm font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}
                >
                  Email or Username
                </Label>
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <Input
                    id="email"
                    name="email"
                    type="text"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={`border ${
                      isDarkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-200 bg-white text-gray-900"
                    } focus:ring-2 focus:ring-indigo-500 transition-all duration-200 rounded-xl py-3 text-base shadow-sm hover:shadow-md`}
                    placeholder="Enter your email or username"
                  />
                </motion.div>
              </div>
              <div className="space-y-3">
                <Label
                  htmlFor="password"
                  className={`text-sm font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}
                >
                  Password
                </Label>
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                  className="relative"
                >
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`border ${
                      isDarkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-200 bg-white text-gray-900"
                    } focus:ring-2 focus:ring-indigo-500 transition-all duration-200 rounded-xl py-3 text-base shadow-sm hover:shadow-md pr-12`}
                    placeholder="Enter your password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={`absolute right-0 top-0 h-full px-4 py-2 hover:bg-transparent ${
                      isDarkMode ? "text-gray-400 hover:text-indigo-400" : "text-gray-500 hover:text-indigo-600"
                    } transition-colors duration-200`}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                    <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                  </Button>
                </motion.div>
              </div>
            </CardContent>
            <CardFooter className="p-8 pt-0 space-y-4">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                className="w-full"
              >
                <Button
                  type="submit"
                  className={`w-full ${
                    isDarkMode ? "bg-indigo-500 hover:bg-indigo-600" : "bg-indigo-600 hover:bg-indigo-700"
                  } text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-base`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.6 }}
                className="w-full"
              >
                <Button
                  type="button"
                  variant="outline"
                  className={`w-full ${
                    isDarkMode
                      ? "bg-gray-700 text-white border-gray-600 hover:bg-gray-600 hover:text-indigo-400"
                      : "bg-white text-indigo-600 border-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                  } font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-base`}
                  onClick={handleDemoClick}
                >
                  Try Demo
                </Button>
              </motion.div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>

      {/* Demo Credentials Card */}
      <AnimatePresence>
        {showDemoCredentials && (
          <motion.div
            variants={demoCardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute z-20 top-4 right-4 w-full max-w-sm"
          >
            <Card
              className={`bg-${isDarkMode ? "gray-800/95" : "white/95"} backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden border ${
                isDarkMode ? "border-gray-700" : "border-gray-200"
              } transition-all duration-300 hover:shadow-3xl`}
            >
              <CardHeader
                className={`bg-gradient-to-r ${
                  isDarkMode ? "from-gray-800 to-gray-700" : "from-indigo-600 to-purple-600"
                } text-${isDarkMode ? "white" : "white"} p-6`}
              >
                <CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <User className="h-6 w-6" />
                  Demo Credentials
                </CardTitle>
                <CardDescription
                  className={`${isDarkMode ? "text-gray-300" : "text-indigo-100"} text-sm font-medium`}
                >
                  Use these to explore FieldSync
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <User className={`h-5 w-5 ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`} />
                  <div>
                    <Label className={`text-sm font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                      Username
                    </Label>
                    <p className={`text-base ${isDarkMode ? "text-white" : "text-gray-900"} font-medium`}>admin</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Key className={`h-5 w-5 ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`} />
                  <div>
                    <Label className={`text-sm font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                      Password
                    </Label>
                    <p className={`text-base ${isDarkMode ? "text-white" : "text-gray-900"} font-medium`}>admin</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Button
                  variant="ghost"
                  className={`w-full ${
                    isDarkMode ? "text-gray-300 hover:text-indigo-400" : "text-gray-600 hover:text-indigo-600"
                  } font-semibold rounded-xl transition-all duration-300`}
                  onClick={() => setShowDemoCredentials(false)}
                >
                  Close
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
