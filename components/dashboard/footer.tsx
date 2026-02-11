"use client"

import Link from "next/link"
import { ShieldCheck } from "lucide-react"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full border-t bg-background dark:bg-gray-900 dark:border-gray-700 px-4 py-6 sm:px-6 md:pl-72 text-sm text-muted-foreground">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        
        {/* Left: Legal Notice */}
        <div className="text-center sm:text-left">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            © {currentYear} Clicky Technologies. All rights reserved. FieldSync is a proprietary software product.
            Unauthorized reproduction, redistribution, or resale is strictly prohibited.
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-500 italic">
            Licensed for use only by authorized clients under direct agreement with Clicky Technologies.
          </p>
        </div>

        {/* Right: Certification Badge */}
        <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-xs font-medium">
            ISO 27001 & SOC 2 Secured
          </span>
        </div>
      </div>
    </footer>
  )
}
