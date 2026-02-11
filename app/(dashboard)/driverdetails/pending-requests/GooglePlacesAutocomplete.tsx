"use client";
import React, { useRef, useState, useEffect } from "react";

interface Suggestion {
  description: string;
  place_id: string;
  types: string[];
}

interface Props {
  label: string;
  value: string;
  onChange: (val: string) => void;
  city: string;
  pincode: string;
  type: "route" | "sublocality";
}

const GooglePlacesAutocomplete: React.FC<Props> = ({
  label,
  value,
  onChange,
  city,
  pincode,
  type,
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // Initialize Google Maps services
  useEffect(() => {
    if (window.google && window.google.maps) {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
      geocoderRef.current = new google.maps.Geocoder();
    } else {
      console.error("Google Maps JavaScript API not loaded");
    }
  }, []);

  // Handle input change and fetch suggestions
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    onChange(input);
    setSuggestions([]);
    if (!input || !city || !pincode || !autocompleteServiceRef.current || !geocoderRef.current) {
      setShowDropdown(false);
      return;
    }
    setShowDropdown(true);

    try {
      // Geocode city and pincode to get coordinates for location bias
      const geocodeResult = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoderRef.current!.geocode({ address: `${city}, ${pincode}, India` }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results) {
            resolve(results);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });

      const location = geocodeResult[0]?.geometry.location;
      if (!location) {
        setShowDropdown(false);
        return;
      }

      // Fetch autocomplete suggestions
      const request: google.maps.places.AutocompletionRequest = {
        input,
        types: [type === "route" ? "geocode" : "(regions)"],
        componentRestrictions: { country: "in" },
        location: location,
        radius: 2000,
      };

      autocompleteServiceRef.current.getPlacePredictions(request, (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          const filtered = predictions.filter((p) =>
            type === "route"
              ? p.types.includes("route") || p.types.includes("street_address")
              : p.types.includes("sublocality") || p.types.includes("neighborhood") || p.types.includes("locality")
          );
          setSuggestions(filtered);
        } else {
          setSuggestions([]);
        }
      });
    } catch (err) {
      console.error("Places API error:", err);
      setShowDropdown(false);
    }
  };

  const handleSelect = (desc: string) => {
    onChange(desc);
    setSuggestions([]);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <input
        value={value}
        onChange={handleChange}
        onFocus={() => city && pincode && setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        placeholder={`Enter ${type === "route" ? "street" : "area"} name`}
        className="w-full min-w-[200px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400"
      />
      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full max-w-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
          {suggestions.map((s) => (
            <li
              key={s.place_id}
              onClick={() => handleSelect(s.description)}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 text-black dark:text-white text-sm"
            >
              {s.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GooglePlacesAutocomplete;
