"use client";

import React, { useState, useEffect } from "react";
import { ref, onValue, set, remove, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { Search, Plus, Edit, Trash2, Camera, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import axios from "axios";

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = "dpgf1rkjl";
const CLOUDINARY_UPLOAD_PRESET = "unsigned_preset";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// Interfaces
interface Driver {
  uid: string;
  name: string;
  username: string;
  role: "driver";
  photo: string;
  status: "available" | "on-duty";
  phoneNumber: string;
  email: string;
  address: string;
  bankAccountNumber: string;
  ifscCode: string;
  bankBranch: string;
  aadharNumber: string;
  panNumber: string;
}

interface Vehicle {
  id: string;
  name: string;
  numberPlate: string;
  model: string;
  licenseNumber: string;
  type: "Truck" | "Lorry" | "Mini-van";
  capacity: string;
  assignedTo?: string;
  active: boolean;
  photo?: string;
}

const DriversVehiclesPage: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openDriverDialog, setOpenDriverDialog] = useState<boolean>(false);
  const [openVehicleDialog, setOpenVehicleDialog] = useState<boolean>(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [newDriver, setNewDriver] = useState<Partial<Driver>>({
    role: "driver",
    status: "available",
    photo: "/placeholder.svg",
  });
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    active: true,
    photo: "/placeholder-vehicle.svg",
  });
  const [driverPhoto, setDriverPhoto] = useState<File | null>(null);
  const [vehiclePhoto, setVehiclePhoto] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);
  const [expandedDrivers, setExpandedDrivers] = useState<Set<string>>(new Set());

  // Fetch drivers
  useEffect(() => {
    const usersRef = ref(database, "users");
    const unsubscribe = onValue(
      usersRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const usersData = snapshot.val() as { [key: string]: Partial<Driver> };
          const driversList = Object.entries(usersData)
            .filter(([_, user]) => user.role === "driver")
            .map(([uid, user]) => ({
              uid,
              name: user.name ?? "",
              username: user.username ?? "",
              role: user.role ?? "driver",
              photo: user.photo ?? "/placeholder.svg",
              status: user.status ?? "available",
              phoneNumber: user.phoneNumber ?? "",
              email: user.email ?? "",
              address: user.address ?? "",
              bankAccountNumber: user.bankAccountNumber ?? "",
              ifscCode: user.ifscCode ?? "",
              bankBranch: user.bankBranch ?? "",
              aadharNumber: user.aadharNumber ?? "",
              panNumber: user.panNumber ?? "",
            }));
          setDrivers(driversList);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Failed to fetch drivers:", error);
        setNotification({ message: "Failed to load drivers", type: "error" });
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch vehicles
  useEffect(() => {
    const vehiclesRef = ref(database, "vehicles");
    const unsubscribe = onValue(
      vehiclesRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const vehiclesData = snapshot.val() as { [key: string]: Vehicle };
          const vehiclesList = Object.entries(vehiclesData).map(([id, vehicle]) => ({
            id,
            name: vehicle.name ?? "",
            numberPlate: vehicle.numberPlate ?? "",
            model: vehicle.model ?? "",
            licenseNumber: vehicle.licenseNumber ?? "",
            type: vehicle.type ?? "Truck",
            capacity: vehicle.capacity ?? "",
            assignedTo: vehicle.assignedTo,
            active: vehicle.active ?? true,
            photo: vehicle.photo ?? "/placeholder-vehicle.svg",
          }));
          setVehicles(vehiclesList);
        }
      },
      (error) => {
        console.error("Failed to fetch vehicles:", error);
        setNotification({ message: "Failed to load vehicles", type: "error" });
      }
    );
    return () => unsubscribe();
  }, []);

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Upload image to Cloudinary
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    try {
      const response = await axios.post<{ secure_url: string }>(CLOUDINARY_API_URL, formData);
      return response.data.secure_url;
    } catch (error) {
      console.error("Image upload failed:", error);
      setNotification({ message: "Failed to upload image", type: "error" });
      throw new Error("Failed to upload image");
    }
  };

  // Handle create/edit driver
  const handleSaveDriver = async () => {
    if (
      !newDriver.name ||
      !newDriver.username ||
      !newDriver.phoneNumber ||
      !newDriver.email ||
      !newDriver.address ||
      !newDriver.bankAccountNumber ||
      !newDriver.ifscCode ||
      !newDriver.bankBranch ||
      !newDriver.aadharNumber ||
      !newDriver.panNumber
    ) {
      setNotification({ message: "Please fill all required fields", type: "error" });
      return;
    }

    try {
      let photoUrl = editingDriver?.photo ?? newDriver.photo ?? "/placeholder.svg";
      if (driverPhoto) {
        photoUrl = await uploadImage(driverPhoto);
      }

      const driverData: Driver = {
        uid: editingDriver?.uid ?? `DRIVER-${Date.now()}`,
        name: newDriver.name,
        username: newDriver.username,
        role: "driver",
        photo: photoUrl,
        status: newDriver.status ?? "available",
        phoneNumber: newDriver.phoneNumber,
        email: newDriver.email,
        address: newDriver.address,
        bankAccountNumber: newDriver.bankAccountNumber,
        ifscCode: newDriver.ifscCode,
        bankBranch: newDriver.bankBranch,
        aadharNumber: newDriver.aadharNumber,
        panNumber: newDriver.panNumber,
      };

      const driverRef = ref(database, `users/${driverData.uid}`);
      await set(driverRef, driverData);

      setNotification({
        message: editingDriver ? "Driver updated" : "Driver created",
        type: "success",
      });
      setOpenDriverDialog(false);
      setEditingDriver(null);
      setNewDriver({
        role: "driver",
        status: "available",
        photo: "/placeholder.svg",
        phoneNumber: "",
        email: "",
        address: "",
        bankAccountNumber: "",
        ifscCode: "",
        bankBranch: "",
        aadharNumber: "",
        panNumber: "",
      });
      setDriverPhoto(null);
    } catch (error) {
      console.error("Failed to save driver:", error);
      setNotification({ message: "Failed to save driver", type: "error" });
    }
  };

  // Handle create/edit vehicle
  const handleSaveVehicle = async (driverId: string) => {
    if (
      !newVehicle.name ||
      !newVehicle.numberPlate ||
      !newVehicle.model ||
      !newVehicle.licenseNumber ||
      !newVehicle.type ||
      !newVehicle.capacity
    ) {
      setNotification({ message: "Please fill all required vehicle fields", type: "error" });
      return;
    }

    try {
      let photoUrl = editingVehicle?.photo ?? newVehicle.photo ?? "/placeholder-vehicle.svg";
      if (vehiclePhoto) {
        photoUrl = await uploadImage(vehiclePhoto);
      }

      const vehicleData: Vehicle = {
        id: editingVehicle?.id ?? `VEH-${Date.now()}`,
        name: newVehicle.name,
        numberPlate: newVehicle.numberPlate,
        model: newVehicle.model,
        licenseNumber: newVehicle.licenseNumber,
        type: newVehicle.type as "Truck" | "Lorry" | "Mini-van",
        capacity: newVehicle.capacity,
        assignedTo: driverId,
        active: newDriver.active ?? true,
        photo: photoUrl,
      };

      const vehicleRef = ref(database, `vehicles/${vehicleData.id}`);
      await set(vehicleRef, vehicleData);

      setNotification({
        message: editingVehicle ? "Vehicle updated" : "Vehicle created",
        type: "success",
      });
      setOpenVehicleDialog(false);
      setEditingVehicle(null);
      setNewVehicle({
        active: true,
        photo: "/placeholder-vehicle.svg",
        name: "",
        numberPlate: "",
        model: "",
        licenseNumber: "",
      });
      setVehiclePhoto(null);
    } catch (error) {
      console.error("Failed to save vehicle:", error);
      setNotification({ message: "Failed to save vehicle", type: "error" });
    }
  };

  // Handle delete driver
  const handleDeleteDriver = async (uid: string) => {
    try {
      const driverRef = ref(database, `users/${uid}`);
      await remove(driverRef);
      // Unassign vehicles linked to this driver
      const driverVehicles = vehicles.filter((v) => v.assignedTo === uid);
      for (const vehicle of driverVehicles) {
        const vehicleRef = ref(database, `vehicles/${vehicle.id}`);
        await update(vehicleRef, { assignedTo: null });
      }
      setNotification({ message: "Driver deleted", type: "success" });
    } catch (error) {
      console.error("Failed to delete driver:", error);
      setNotification({ message: "Failed to delete driver", type: "error" });
    }
  };

  // Handle delete vehicle
  const handleDeleteVehicle = async (id: string) => {
    try {
      const vehicleRef = ref(database, `vehicles/${id}`);
      await remove(vehicleRef);
      setNotification({ message: "Vehicle deleted", type: "success" });
    } catch (error) {
      console.error("Failed to delete vehicle:", error);
      setNotification({ message: "Failed to delete vehicle", type: "error" });
    }
  };

  // Toggle driver row expansion
  const toggleDriverExpansion = (uid: string) => {
    const newExpanded = new Set(expandedDrivers);
    if (newExpanded.has(uid)) {
      newExpanded.delete(uid);
    } else {
      newExpanded.add(uid);
    }
    setExpandedDrivers(newExpanded);
  };

  // Filter drivers
  const filteredDrivers = drivers.filter(
    (driver) =>
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-semibold text-gray-900 mb-6">Drivers & Vehicles</h1>

        {notification && (
          <div
            className={cn(
              "flex items-center gap-2 p-3 rounded-lg mb-6 max-w-md mx-auto transition-all duration-300",
              notification.type === "error"
                ? "bg-red-50 text-red-800 border border-red-200"
                : "bg-green-50 text-green-800 border border-green-200"
            )}
          >
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, username, phone, or email..."
              className="pl-10 rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={openDriverDialog} onOpenChange={setOpenDriverDialog}>
            <DialogTrigger asChild>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                onClick={() => {
                  setEditingDriver(null);
                  setNewDriver({
                    role: "driver",
                    status: "available",
                    photo: "/placeholder.svg",
                    phoneNumber: "",
                    email: "",
                    address: "",
                    bankAccountNumber: "",
                    ifscCode: "",
                    bankBranch: "",
                    aadharNumber: "",
                    panNumber: "",
                  });
                  setDriverPhoto(null);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Driver
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg bg-white rounded-xl shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  {editingDriver ? "Edit Driver" : "Add Driver"}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4 grid-cols-1 sm:grid-cols-2">
                <div className="flex items-center gap-4 col-span-2">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={driverPhoto ? URL.createObjectURL(driverPhoto) : newDriver.photo}
                      alt="Driver"
                    />
                    <AvatarFallback>{newDriver.name?.[0]?.toUpperCase() ?? "D"}</AvatarFallback>
                  </Avatar>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                    <Camera className="h-4 w-4" />
                    Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setDriverPhoto(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
                <Input
                  placeholder="Name"
                  value={newDriver.name ?? ""}
                  onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                  className="rounded-lg border-gray-200"
                />
                <Input
                  placeholder="Username"
                  value={newDriver.username ?? ""}
                  onChange={(e) => setNewDriver({ ...newDriver, username: e.target.value })}
                  className="rounded-lg border-gray-200"
                />
                <Input
                  placeholder="Phone Number"
                  value={newDriver.phoneNumber ?? ""}
                  onChange={(e) => setNewDriver({ ...newDriver, phoneNumber: e.target.value })}
                  className="rounded-lg border-gray-200"
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={newDriver.email ?? ""}
                  onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })}
                  className="rounded-lg border-gray-200"
                />
                <Input
                  placeholder="Address"
                  value={newDriver.address ?? ""}
                  onChange={(e) => setNewDriver({ ...newDriver, address: e.target.value })}
                  className="rounded-lg border-gray-200"
                />
                <Input
                  placeholder="Bank Account Number"
                  value={newDriver.bankAccountNumber ?? ""}
                  onChange={(e) => setNewDriver({ ...newDriver, bankAccountNumber: e.target.value })}
                  className="rounded-lg border-gray-200"
                />
                <Input
                  placeholder="IFSC Code"
                  value={newDriver.ifscCode ?? ""}
                  onChange={(e) => setNewDriver({ ...newDriver, ifscCode: e.target.value })}
                  className="rounded-lg border-gray-200"
                />
                <Input
                  placeholder="Bank Branch"
                  value={newDriver.bankBranch ?? ""}
                  onChange={(e) => setNewDriver({ ...newDriver, bankBranch: e.target.value })}
                  className="rounded-lg border-gray-200"
                />
                <Input
                  placeholder="Aadhar Number"
                  value={newDriver.aadharNumber ?? ""}
                  onChange={(e) => setNewDriver({ ...newDriver, aadharNumber: e.target.value })}
                  className="rounded-lg border-gray-200"
                />
                <Input
                  placeholder="PAN Number"
                  value={newDriver.panNumber ?? ""}
                  onChange={(e) => setNewDriver({ ...newDriver, panNumber: e.target.value })}
                  className="rounded-lg border-gray-200"
                />
                <Select
                  value={newDriver.status}
                  onValueChange={(value) =>
                    setNewDriver({ ...newDriver, status: value as "available" | "on-duty" })
                  }
                >
                  <SelectTrigger className="rounded-lg border-gray-200">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="on-duty">On-duty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleSaveDriver}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Save
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900">Drivers & Vehicles</CardTitle>
            <Dialog open={openVehicleDialog} onOpenChange={setOpenVehicleDialog}>
              <DialogTrigger asChild>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  onClick={() => {
                    setEditingVehicle(null);
                    setNewVehicle({
                      active: true,
                      photo: "/placeholder-vehicle.svg",
                      name: "",
                      numberPlate: "",
                      model: "",
                      licenseNumber: "",
                    });
                    setVehiclePhoto(null);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Vehicle
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg bg-white rounded-xl shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-gray-900">
                    {editingVehicle ? "Edit Vehicle" : "Add Vehicle"}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 grid-cols-1 sm:grid-cols-2">
                  <div className="flex items-center gap-4 col-span-2">
                    <img
                      src={vehiclePhoto ? URL.createObjectURL(vehiclePhoto) : newVehicle.photo}
                      alt="Vehicle"
                      className="h-16 w-16 object-cover rounded-md"
                    />
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                      <Camera className="h-4 w-4" />
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setVehiclePhoto(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                  <Input
                    placeholder="Vehicle Name"
                    value={newVehicle.name ?? ""}
                    onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
                    className="rounded-lg border-gray-200"
                  />
                  <Input
                    placeholder="Number Plate"
                    value={newVehicle.numberPlate ?? ""}
                    onChange={(e) => setNewVehicle({ ...newVehicle, numberPlate: e.target.value })}
                    className="rounded-lg border-gray-200"
                  />
                  <Input
                    placeholder="Model"
                    value={newVehicle.model ?? ""}
                    onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                    className="rounded-lg border-gray-200"
                  />
                  <Input
                    placeholder="License Number"
                    value={newVehicle.licenseNumber ?? ""}
                    onChange={(e) => setNewVehicle({ ...newVehicle, licenseNumber: e.target.value })}
                    className="rounded-lg border-gray-200"
                  />
                  <Select
                    value={newVehicle.type}
                    onValueChange={(value) =>
                      setNewVehicle({ ...newVehicle, type: value as "Truck" | "Lorry" | "Mini-van" })
                    }
                  >
                    <SelectTrigger className="rounded-lg border-gray-200">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Truck">Truck</SelectItem>
                      <SelectItem value="Lorry">Lorry</SelectItem>
                      <SelectItem value="Mini-van">Mini-van</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Capacity (e.g., 10 tons)"
                    value={newVehicle.capacity ?? ""}
                    onChange={(e) => setNewVehicle({ ...newVehicle, capacity: e.target.value })}
                    className="rounded-lg border-gray-200"
                  />
                  <Select
                    value={newVehicle.assignedTo ?? "none"}
                    onValueChange={(value) =>
                      setNewVehicle({ ...newVehicle, assignedTo: value === "none" ? undefined : value })
                    }
                  >
                    <SelectTrigger className="rounded-lg border-gray-200">
                      <SelectValue placeholder="Assign to driver" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {drivers.map((driver) => (
                        <SelectItem key={driver.uid} value={driver.uid}>
                          {driver.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={newVehicle.active ? "true" : "false"}
                    onValueChange={(value) => setNewVehicle({ ...newVehicle, active: value === "true" })}
                  >
                    <SelectTrigger className="rounded-lg border-gray-200">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => handleSaveVehicle(newVehicle.assignedTo ?? "")}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Save
                </Button>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center text-sm text-gray-500">Loading drivers and vehicles...</div>
            ) : filteredDrivers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Photo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Bank Account</TableHead>
                    <TableHead>IFSC</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Aadhar</TableHead>
                    <TableHead>PAN</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrivers.map((driver) => (
                    <React.Fragment key={driver.uid}>
                      <TableRow className="hover:bg-gray-50 transition-colors">
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleDriverExpansion(driver.uid)}
                          >
                            {expandedDrivers.has(driver.uid) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={driver.photo} alt={driver.name} />
                            <AvatarFallback>{driver.name[0]?.toUpperCase() ?? "D"}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{driver.name}</TableCell>
                        <TableCell>{driver.username}</TableCell>
                        <TableCell>{driver.phoneNumber}</TableCell>
                        <TableCell>{driver.email}</TableCell>
                        <TableCell>{driver.address}</TableCell>
                        <TableCell>{driver.bankAccountNumber}</TableCell>
                        <TableCell>{driver.ifscCode}</TableCell>
                        <TableCell>{driver.bankBranch}</TableCell>
                        <TableCell>{driver.aadharNumber}</TableCell>
                        <TableCell>{driver.panNumber}</TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              driver.status === "available" && "bg-green-500",
                              driver.status === "on-duty" && "bg-orange-500"
                            )}
                          >
                            {driver.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg border-gray-200 hover:bg-gray-100"
                            onClick={() => {
                              setEditingDriver(driver);
                              setNewDriver(driver);
                              setDriverPhoto(null);
                              setOpenDriverDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="rounded-lg"
                            onClick={() => handleDeleteDriver(driver.uid)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedDrivers.has(driver.uid) && (
                        <TableRow className="bg-gray-50">
                          <TableCell colSpan={14}>
                            <div className="pl-8 pr-4 py-4">
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Vehicles Assigned to {driver.name}</h4>
                              {vehicles.filter((v) => v.assignedTo === driver.uid).length > 0 ? (
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-gray-100">
                                      <TableHead>Photo</TableHead>
                                      <TableHead>Name</TableHead>
                                      <TableHead>Number Plate</TableHead>
                                      <TableHead>Model</TableHead>
                                      <TableHead>License Number</TableHead>
                                      <TableHead>Type</TableHead>
                                      <TableHead>Capacity</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead>Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {vehicles
                                      .filter((v) => v.assignedTo === driver.uid)
                                      .map((vehicle) => (
                                        <TableRow key={vehicle.id} className="hover:bg-gray-200 transition-colors">
                                          <TableCell>
                                            <img
                                              src={vehicle.photo}
                                              alt={vehicle.numberPlate}
                                              className="h-10 w-10 object-cover rounded-md"
                                            />
                                          </TableCell>
                                          <TableCell>{vehicle.name}</TableCell>
                                          <TableCell>{vehicle.numberPlate}</TableCell>
                                          <TableCell>{vehicle.model}</TableCell>
                                          <TableCell>{vehicle.licenseNumber}</TableCell>
                                          <TableCell>{vehicle.type}</TableCell>
                                          <TableCell>{vehicle.capacity}</TableCell>
                                          <TableCell>
                                            <Badge
                                              className={cn(
                                                vehicle.active ? "bg-green-500" : "bg-red-500"
                                              )}
                                            >
                                              {vehicle.active ? "Active" : "Inactive"}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="flex gap-2">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="rounded-lg border-gray-200 hover:bg-gray-100"
                                              onClick={() => {
                                                setEditingVehicle(vehicle);
                                                setNewVehicle(vehicle);
                                                setVehiclePhoto(null);
                                                setOpenVehicleDialog(true);
                                              }}
                                            >
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              variant="destructive"
                                              size="sm"
                                              className="rounded-lg"
                                              onClick={() => handleDeleteVehicle(vehicle.id)}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <div className="text-sm text-gray-500">No vehicles assigned.</div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-sm text-gray-500">No drivers found.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriversVehiclesPage;
