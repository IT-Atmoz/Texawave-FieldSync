"use client"

import { useEffect, useRef, useState } from "react"

interface Site {
  id: string
  name: string
  location: {
    lat: number
    lng: number
  }
  activeWorkers: number
}

export function DashboardMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [sites, setSites] = useState<Site[]>([
    {
      id: "1",
      name: "Skyline Tower",
      location: { lat: 40.7128, lng: -74.006 },
      activeWorkers: 24,
    },
    {
      id: "2",
      name: "Riverside Mall",
      location: { lat: 40.7282, lng: -73.794 },
      activeWorkers: 18,
    },
    {
      id: "3",
      name: "Green Valley Apartments",
      location: { lat: 40.6782, lng: -73.944 },
      activeWorkers: 12,
    },
  ])

  useEffect(() => {
    // This would normally load the Google Maps API and initialize the map
    // For this demo, we'll just show a placeholder
    const loadMap = () => {
      if (mapRef.current) {
        // Placeholder for map initialization
        console.log("Map would be initialized here with sites:", sites)
      }
    }

    loadMap()
  }, [sites])

  return (
    <div ref={mapRef} className="relative h-full w-full rounded-md bg-muted">
      <div className="flex h-full flex-col items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Google Maps integration would display active sites here</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {sites.length} active sites with {sites.reduce((acc, site) => acc + site.activeWorkers, 0)} workers
          </p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-24 w-24"
          >
            <path d="M12 2a8 8 0 0 0-8 8c0 1.892.402 3.13 1.5 4.5L12 22l6.5-7.5c1.098-1.37 1.5-2.608 1.5-4.5a8 8 0 0 0-8-8z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
      </div>
    </div>
  )
}
