"use client";
import React, { useState, useEffect, useRef } from "react";
import { ref, get, set, push, onValue, remove, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { Send, Check, ChevronDown, ChevronUp, RotateCcw, AlertCircle, CheckCircle, Trash2, Edit, Save, X, FileText, Plus, Download } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "@/lib/utils";

// Button Variants
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-shadow",
        destructive: "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transition-shadow",
        outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm hover:shadow-md transition-shadow",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 shadow-sm hover:shadow-md transition-shadow",
        ghost: "hover:bg-gray-100 hover:text-gray-900",
        link: "text-indigo-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Button Component
const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? "span" : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

// Input Component
const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400 shadow-sm hover:shadow-md",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

// Select Components
const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;
const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-12 w-full items-center justify-between rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white shadow-sm hover:shadow-md transition-shadow",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton ref={ref} className={cn("flex cursor-default items-center justify-center py-1", className)} {...props}>
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton ref={ref} className={cn("flex cursor-default items-center justify-center py-1", className)} {...props}>
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;
const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-white text-gray-800 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:bg-gray-800 dark:text-white dark:border-gray-700",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;
const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-indigo-100 focus:text-indigo-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-gray-700 dark:focus:text-white hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;
const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-gray-200 dark:bg-gray-600", className)} {...props} />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// Google Places Autocomplete Component
interface Suggestion {
  description: string;
  place_id: string;
  types: string[];
}
interface GooglePlacesAutocompleteProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  city: string;
  pincode: string;
  type: "route" | "sublocality";
}
const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
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
  useEffect(() => {
    if (window.google && window.google.maps) {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
      geocoderRef.current = new google.maps.Geocoder();
    } else {
      console.error("Google Maps JavaScript API not loaded");
    }
  }, []);
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
        className="w-full min-w-[200px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 shadow-sm hover:shadow-md transition-shadow"
      />
      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full max-w-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
          {suggestions.map((s) => (
            <li
              key={s.place_id}
              onClick={() => handleSelect(s.description)}
              className="px-3 py-2 cursor-pointer hover:bg-indigo-50 dark:hover:bg-gray-700 text-black dark:text-white text-sm transition-colors"
            >
              {s.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Work Interface
interface Work {
  id: string;
  name: string;
  streetName: string;
  areaName: string;
  pincode: string;
  city: string;
  accepted: boolean;
  status: string;
  assignedAt: number;
  assignedDay: string;
}
interface AssignWorkModalProps {
  onWorkAssigned?: () => void;
}
export const AssignWorkModal = ({ onWorkAssigned }: AssignWorkModalProps) => {
  const [usernames, setUsernames] = useState<string[]>([]);
  const [usernameToUidMap, setUsernameToUidMap] = useState<{ [key: string]: string }>({});
  const [selectedUsername, setSelectedUsername] = useState<string>("");
  const [workName, setWorkName] = useState<string>("");
  const [streetName, setStreetName] = useState<string>("");
  const [areaName, setAreaName] = useState<string>("");
  const [pincode, setPincode] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [notification, setNotification] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [editingWorkId, setEditingWorkId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    streetName: "",
    areaName: "",
    pincode: "",
    city: "",
  });
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const adminId = "admin";
  // Fetch Users
  useEffect(() => {
    const fetchUsernames = async () => {
      const usersRef = ref(database, "users");
      const snapshot = await get(usersRef);
      if (snapshot.exists()) {
        const users = snapshot.val();
        const usernamesList: string[] = [];
        const usernameMap: { [key: string]: string } = {};
        for (const uid in users) {
          const username = users[uid].username;
          if (username && username.trim() !== "") {
            usernamesList.push(username);
            usernameMap[username] = uid;
          }
        }
        const uniqueUsernames = [...new Set(usernamesList)];
        setUsernames(uniqueUsernames);
        setUsernameToUidMap(usernameMap);
        if (uniqueUsernames.length > 0) {
          setSelectedUsername(uniqueUsernames[0]);
        }
      }
    };
    fetchUsernames();
  }, []);
  // Fetch Works
  useEffect(() => {
    if (selectedUsername) {
      const userId = usernameToUidMap[selectedUsername];
      if (userId) {
        const worksRef = ref(database, `users/${userId}/works`);
        const unsubscribe = onValue(worksRef, (snapshot) => {
          if (snapshot.exists()) {
            const worksData = snapshot.val();
            const worksList = Object.entries(worksData).map(([id, work]: [string, any]) => ({
              id,
              name: work.name || "",
              streetName: work.streetName || "",
              areaName: work.areaName || "",
              pincode: work.pincode || "",
              city: work.city || "",
              accepted: work.accepted || false,
              status: work.status || "pending",
              assignedAt: work.assignedAt || 0,
              assignedDay: work.assignedDay || "",
            }));
            setWorks(worksList);
          } else {
            setWorks([]);
          }
        });
        return () => unsubscribe();
      }
    }
  }, [selectedUsername, usernameToUidMap]);
  // Notification Timeout
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  // Handle Assign Work
  const handleAssignWork = async () => {
    if (!selectedUsername || !workName || !streetName || !areaName || !pincode || !city) {
      setNotification({ message: "Please fill all fields", type: "error" });
      return;
    }
    const userId = usernameToUidMap[selectedUsername];
    if (!userId) {
      setNotification({ message: "User not found", type: "error" });
      return;
    }
    const workData: any = {
      name: workName,
      streetName,
      areaName,
      pincode,
      city,
      accepted: false,
      status: "pending",
      assignedAt: Date.now(),
      assignedDay: new Date().toLocaleDateString("en-US", { weekday: "long" }),
    };
    const worksRef = ref(database, `users/${userId}/works`);
    const newWorkRef = push(worksRef);
    await set(newWorkRef, workData);
    setNotification({ message: "Work assigned successfully", type: "success" });
    setTimeout(() => {
      if (onWorkAssigned) onWorkAssigned();
      resetForm();
      setShowAssignmentForm(false);
    }, 1500);
  };
  // Handle Edit Start
  const handleEditStart = (work: Work) => {
    setEditingWorkId(work.id);
    setEditForm({
      name: work.name,
      streetName: work.streetName,
      areaName: work.areaName,
      pincode: work.pincode,
      city: work.city,
    });
  };
  // Handle Edit Save
  const handleEditSave = async (workId: string) => {
    if (!editForm.name || !editForm.streetName || !editForm.areaName || !editForm.pincode || !editForm.city) {
      setNotification({ message: "All fields are required", type: "error" });
      return;
    }
    const userId = usernameToUidMap[selectedUsername];
    if (!userId) {
      setNotification({ message: "User not found", type: "error" });
      return;
    }
    const workRef = ref(database, `users/${userId}/works/${workId}`);
    try {
      await update(workRef, {
        name: editForm.name,
        streetName: editForm.streetName,
        areaName: editForm.areaName,
        pincode: editForm.pincode,
        city: editForm.city,
      });
      setEditingWorkId(null);
      setNotification({ message: "Work updated successfully", type: "success" });
    } catch (error) {
      console.error("Error updating work:", error);
      setNotification({ message: "Failed to update work", type: "error" });
    }
  };
  // Handle Edit Cancel
  const handleEditCancel = () => {
    setEditingWorkId(null);
    setEditForm({ name: "", streetName: "", areaName: "", pincode: "", city: "" });
  };
  // Handle Delete Work
  const handleDeleteWork = async (workId: string) => {
    const userId = usernameToUidMap[selectedUsername];
    if (!userId) {
      setNotification({ message: "User not found", type: "error" });
      return;
    }
    const workRef = ref(database, `users/${userId}/works/${workId}`);
    try {
      await remove(workRef);
      setNotification({ message: "Work deleted successfully", type: "success" });
    } catch (error) {
      console.error("Error deleting work:", error);
      setNotification({ message: "Failed to delete work", type: "error" });
    }
  };
  // Handle Export CSV
  const handleExportCSV = () => {
    if (!selectedUsername || works.length === 0) {
      setNotification({ message: "No works to export", type: "error" });
      return;
    }
    const csvHeaders = ["Work Name", "Street Name", "Area Name", "Pincode", "City", "Status", "Assigned Day"];
    const csvRows = works.map((work) => [
      work.name,
      work.streetName,
      work.areaName,
      work.pincode,
      work.city,
      work.status,
      work.assignedDay,
    ]);
    const csvContent = [csvHeaders, ...csvRows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${selectedUsername}_works.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setNotification({ message: "CSV exported successfully", type: "success" });
  };
  // Reset Form
  const resetForm = () => {
    setWorkName("");
    setStreetName("");
    setAreaName("");
    setPincode("");
    setCity("");
  };
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 min-h-screen p-6 md:p-8 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Notification */}
        {notification && (
          <div
            className={cn(
              "fixed bottom-4 right-4 p-4 rounded-lg text-white font-medium shadow-xl animate-slide-in-right transition-all duration-300",
              notification.type === "success" ? "bg-gradient-to-r from-green-500 to-green-600" : "bg-gradient-to-r from-red-500 to-red-600"
            )}
          >
            {notification.message}
          </div>
        )}
        {/* Header and New Assignment Button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Work Assignments
          </h2>
          <Button
            onClick={() => setShowAssignmentForm(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-shadow"
          >
            <Plus className="h-4 w-4 mr-2" /> New Assignment
          </Button>
        </div>
        {/* User Selection and Export */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6 border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="w-full md:w-auto flex-1">
            <Select onValueChange={setSelectedUsername} value={selectedUsername}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {usernames.map((username) => (
                  <SelectItem key={username} value={username}>
                    {username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleExportCSV}
            variant="secondary"
            className="w-full md:w-auto bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transition-shadow"
          >
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
        {/* Assignment Form (Modal) */}
        {showAssignmentForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 transform transition-all duration-300 scale-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-3">
                  <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Assign New Work
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowAssignmentForm(false);
                    resetForm();
                  }}
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-300" />
                </Button>
              </div>
              <div className="space-y-4">
                <Select onValueChange={setSelectedUsername} value={selectedUsername}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {usernames.map((username) => (
                      <SelectItem key={username} value={username}>
                        {username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="text"
                  placeholder="Work Name"
                  value={workName}
                  onChange={(e) => setWorkName(e.target.value)}
                  className="w-full"
                />
                <Input
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full"
                />
                <Input
                  type="text"
                  placeholder="Pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full"
                />
                <GooglePlacesAutocomplete
                  label="Area Name"
                  value={areaName}
                  onChange={setAreaName}
                  city={city}
                  pincode={pincode}
                  type="sublocality"
                />
                <GooglePlacesAutocomplete
                  label="Street Name"
                  value={streetName}
                  onChange={setStreetName}
                  city={city}
                  pincode={pincode}
                  type="route"
                />
                <div className="flex justify-end gap-3">
                  <Button
                    onClick={handleAssignWork}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-shadow"
                  >
                    <Save className="h-4 w-4 mr-2" /> Assign Work
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAssignmentForm(false);
                      resetForm();
                    }}
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <X className="h-4 w-4 mr-2" /> Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Works Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-3">
              <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              Assigned Works for {selectedUsername}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-700">
                <tr>
                  {["Work Name", "Street Name", "Area Name", "Pincode", "City", "Status", "Assigned Day", "Action"].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {works.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No works assigned
                    </td>
                  </tr>
                ) : (
                  works.map((work, index) => (
                    <tr key={work.id} className={cn("hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors", index % 2 === 0 ? "bg-gray-50 dark:bg-gray-900" : "")}>
                      <td className="px-6 py-4 whitespace-normal break-words text-gray-800 dark:text-white">
                        {editingWorkId === work.id ? (
                          <Input
                            value={editForm.name}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                            className="w-full"
                          />
                        ) : (
                          work.name
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-normal break-words text-gray-800 dark:text-white">
                        {editingWorkId === work.id ? (
                          <GooglePlacesAutocomplete
                            label="Street Name"
                            value={editForm.streetName}
                            onChange={(value) => setEditForm((prev) => ({ ...prev, streetName: value }))}
                            city={editForm.city}
                            pincode={editForm.pincode}
                            type="route"
                          />
                        ) : (
                          work.streetName
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-normal break-words text-gray-800 dark:text-white">
                        {editingWorkId === work.id ? (
                          <GooglePlacesAutocomplete
                            label="Area Name"
                            value={editForm.areaName}
                            onChange={(value) => setEditForm((prev) => ({ ...prev, areaName: value }))}
                            city={editForm.city}
                            pincode={editForm.pincode}
                            type="sublocality"
                          />
                        ) : (
                          work.areaName
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-normal break-words text-gray-800 dark:text-white">
                        {editingWorkId === work.id ? (
                          <Input
                            value={editForm.pincode}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, pincode: e.target.value }))}
                            className="w-full"
                          />
                        ) : (
                          work.pincode
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-normal break-words text-gray-800 dark:text-white">
                        {editingWorkId === work.id ? (
                          <Input
                            value={editForm.city}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, city: e.target.value }))}
                            className="w-full"
                          />
                        ) : (
                          work.city
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-normal break-words">
                        <span
                          className={cn(
                            "px-3 py-1 rounded-full text-sm font-medium shadow-sm",
                            work.status === "pending" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100" : "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                          )}
                        >
                          {work.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-normal break-words text-gray-800 dark:text-white">
                        {work.assignedDay}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingWorkId === work.id ? (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleEditSave(work.id)}
                              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-shadow"
                            >
                              <Save className="h-4 w-4 mr-2" /> Save
                            </Button>
                            <Button
                              onClick={handleEditCancel}
                              className="bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 shadow-md hover:shadow-lg transition-shadow"
                            >
                              <X className="h-4 w-4 mr-2" /> Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleEditStart(work)}
                              className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700 shadow-md hover:shadow-lg transition-shadow"
                            >
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </Button>
                            <Button
                              onClick={() => handleDeleteWork(work.id)}
                              className="bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transition-shadow"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
