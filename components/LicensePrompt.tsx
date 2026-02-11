"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Lock } from "lucide-react"

export default function LicensePrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [inputKey, setInputKey] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    const storedKey = localStorage.getItem("license_key")
    if (storedKey !== "ABC123") {
      setShowPrompt(true)
    }
  }, [])

  const handleVerify = () => {
    if (inputKey.trim() === "ABC123") {
      localStorage.setItem("license_key", "ABC123")
      setShowPrompt(false)
    } else {
      setError("Invalid License Key. Please try again.")
    }
  }

  if (!showPrompt) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md border-2 border-blue-500 shadow-2xl bg-white dark:bg-gray-900">
        <CardContent className="p-6">
          <div className="flex items-center mb-4 text-blue-600 dark:text-blue-400">
            <ShieldCheck className="h-6 w-6 mr-2" />
            <h2 className="text-xl font-semibold">License Activation</h2>
          </div>
          <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
            Please enter your license key to access this software.
          </p>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Enter license key"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleVerify} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Lock className="h-4 w-4 mr-1" /> Unlock
            </Button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
