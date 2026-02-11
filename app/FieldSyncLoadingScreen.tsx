"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function FieldSyncLoadingScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
      router.push("/dashboard") // Redirect after 5 seconds
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="w-full h-screen bg-gradient-to-b from-green-600 to-green-400 flex flex-col items-center justify-center text-white px-4">
      {/* Logo */}
      <Image
        src="https://i.postimg.cc/LXK9dpW3/fsy-removebg-preview.png" // dummy image path
        alt="FieldSync Logo"
        width={96}
        height={96}
        className="mb-4 sm:w-24 sm:h-24 w-20 h-20"
      />

      {/* App Name */}
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">FieldSync</h1>

      {/* Powered by */}
      <div className="mt-6 flex flex-col items-center text-sm sm:text-base text-gray-200 space-y-1">
        <div className="flex items-center gap-2">
          <span>Powered by</span>
          <Image
            src="https://www.itatmoz.com/assets/itt-BVFsOHoy.png" // dummy Atmoz logo
            alt="IT Atmoz"
            width={100}
            height={20}
            className="object-contain h-5 w-auto"
          />
        </div>

        <div className="flex items-center gap-2">
          <span>Built using</span>
          <Image
            src="https://i.postimg.cc/K8c7hXTL/Chat-GPT-Image-Jul-2-2025-10-47-37-AM-removebg-preview.png" // dummy Firebase logo
            alt="Google Firebase"
            width={20}
            height={20}
            className="object-contain h-5 w-5"
          />
          <span>Google Firebase</span>
        </div>
      </div>

      {/* Loading animation */}
      <div className="mt-8">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>

      {/* Certifications */}
      <div className="absolute bottom-8 text-center text-sm text-gray-100">
        <p className="font-semibold">ISO 27001 | SOC 2</p>
        <p className="text-xs mt-1 text-gray-300">Your data is encrypted, private & secure</p>
      </div>
    </div>
  )
}
