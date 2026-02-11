"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function FieldSyncLoadingScreen() {
  const router = useRouter()
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 3.33
      })
    }, 100)

    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => router.push("/dashboard"), 500)
    }, 3000)

    return () => {
      clearInterval(interval)
      clearTimeout(timer)
    }
  }, [router])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden text-white px-6">
      {/* Gradient Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-700/30 via-black to-green-900/40 animate-pulse" />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-5xl mx-auto h-screen flex flex-col justify-center items-center text-center">

        {/* FSY Logo */}
        <div className="mb-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <Image
            src="https://texawave.com/wp-content/uploads/2025/11/Texawave_logo.png"
            alt="FieldSync Logo"
            width={64}
            height={64}
            className="h-16 w-auto drop-shadow-md opacity-90 animate-float"
          />
        </div>

        {/* Clicky Technologies */}
        <div className="mb-8 animate-scale-in" style={{ animationDelay: "0.4s" }}>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-green-400 drop-shadow-xl">
            Texawave
          </h2>
          <p className="text-sm text-gray-300 mt-1 italic tracking-wide">
            Innovating The Future
          </p>
        </div>

        {/* Title */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: "0.6s" }}>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-lime-400">
            FieldSync
          </h1>
          <p className="mt-2 text-base text-gray-300 font-medium">
            Premium Field Management Platform
          </p>
        </div>

        {/* Powered By */}
        <div className="mb-8 flex items-center space-x-6 text-gray-400 text-sm animate-fade-in" style={{ animationDelay: "0.8s" }}>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-sm shadow-sm" />
            <span className="font-medium">Built with Firebase</span>
          </div>
          <div className="w-px h-4 bg-gray-600" />
          <span className="font-medium text-lime-300">
            Powered by Texawave
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-10 w-full max-w-lg animate-fade-in" style={{ animationDelay: "1s" }}>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-lime-300 to-green-500 transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-400 font-medium">
            {Math.round(progress)}% Loading
          </div>
        </div>

        {/* Certifications */}
        <div className="absolute bottom-6 text-center text-sm text-gray-300 animate-fade-in" style={{ animationDelay: "1.4s" }}>
          <p className="font-semibold text-white">ISO 27001 | SOC 2 Certified</p>
          <p className="text-xs mt-1 text-lime-300">
            Your data is <span className="italic">encrypted, private & secure</span>
          </p>
        </div>
      </div>

      {/* Radial Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)`,
          backgroundSize: "60px 60px",
          opacity: 0.02
        }}
      />
    </div>
  )
}
