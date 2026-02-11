"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ref, onValue, set, update, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { Search, Filter, Plus, Truck, MapPin, Clock } from "lucide-react";
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
import { format, addDays } from "date-fns";
import { Badge } from "@/components/ui/badge";

// TypeScript interfaces for data structures
interface Dispatch {
  dispatchId: string;
  materialId: string;
  materialName: string;
  quantity: number;
  fromSite: string;
  toSite: string;
  driverId: string;
  driverName: string;
  vehicleNumber: string;
  status: "in-transit" | "delivered" | "delayed";
  dispatchTime: number;
  eta: number;
  deliveryTime?: number;
  proofPhotoUrl?: string;
}

interface MaterialRequest {
  id: string;
  materialId: string;
  materialName: string;
  quantityRequested: number;
  userId: string;
  username: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: number;
  respondedAt: number;
  responseMessage: string;
}

interface Material {
  id: string;
  quantity: number;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
  supplier: string;
  description: string;
  size: string;
  weight: number;
  unitType: string;
  createdAt: number;
  updatedAt: number;
}

interface User {
  uid: string;
  name: string;
  username: string;
  role: string;
}

const DispatchesPage: React.FC = () => {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [materials, setMaterials] = useState<{ [key: string]: Material }>({});
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterMaterial, setFilterMaterial] = useState<string>("All Materials");
  const [filterProject, setFilterProject] = useState<string>("All Projects");
  const [filterStatus, setFilterStatus] = useState<string>("All Statuses");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false);
  const [newDispatch, setNewDispatch] = useState<Partial<Dispatch>>({
    fromSite: "Warehouse",
    toSite: "MKR Project",
    vehicleNumber: "",
    status: "in-transit",
  });

  // Fetch materials
  useEffect(() => {
    const materialsRef = ref(database, "materials");
    const unsubscribe = onValue(materialsRef, (snapshot) => {
      if (snapshot.exists()) {
        const materialsData = snapshot.val() as { [key: string]: Material };
        const materialsMap: { [key: string]: Material } = {};
        Object.entries(materialsData).forEach(([id, material]) => {
          materialsMap[id] = {
            id,
            quantity: material.quantity ?? 0,
            name: material.name ?? "",
            price: material.price ?? 0,
            category: material.category ?? "Uncategorized",
            imageUrl: material.imageUrl ?? "",
            supplier: material.supplier ?? "N/A",
            description: material.description ?? "No description available",
            size: material.size ?? "N/A",
            weight: material.weight ?? 0,
            unitType: material.unitType ?? "N/A",
            createdAt: material.createdAt ?? 0,
            updatedAt: material.updatedAt ?? 0,
          };
        });
        setMaterials(materialsMap);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch users
  useEffect(() => {
    const usersRef = ref(database, "users");
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData = snapshot.val() as { [key: string]: User };
        const usersList = Object.entries(usersData).map(([uid, user]) => ({
          uid,
          name: user.name ?? "",
          username: user.username ?? "",
          role: user.role ?? "worker",
        }));
        setUsers(usersList);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch material requests and auto-create dispatches
  useEffect(() => {
    const requestsRef = ref(database, "material_requests");
    const unsubscribe = onValue(requestsRef, async (snapshot) => {
      if (snapshot.exists()) {
        const requestsData = snapshot.val() as { [key: string]: MaterialRequest };
        const requestsList = Object.entries(requestsData).map(([id, request]) => ({
          id,
          materialId: request.materialId ?? "",
          materialName: request.materialName ?? "",
          quantityRequested: request.quantityRequested ?? 0,
          userId: request.userId ?? "",
          username: request.username ?? "Unknown User",
          status: request.status ?? "pending",
          requestedAt: request.requestedAt ?? 0,
          respondedAt: request.respondedAt ?? 0,
          responseMessage: request.responseMessage ?? "",
        }));
        setMaterialRequests(requestsList);

        // Auto-create dispatches for approved requests
        const approvedRequests = requestsList.filter((req) => req.status === "approved");
        for (const request of approvedRequests) {
          const dispatchRef = ref(database, `dispatches/${request.id}`);
          const dispatchSnapshot = await get(dispatchRef);
          if (!dispatchSnapshot.exists()) {
            const driver = users.find((user) => user.role === "driver") ?? users[0];
            const newDispatch: Dispatch = {
              dispatchId: request.id,
              materialId: request.materialId,
              materialName: request.materialName,
              quantity: request.quantityRequested,
              fromSite: "Warehouse",
              toSite: "MKR Project",
              driverId: driver?.uid ?? "unknown",
              driverName: driver?.name ?? "Unknown Driver",
              vehicleNumber: `VEH-${Math.floor(Math.random() * 10000)}`,
              status: "in-transit",
              dispatchTime: Date.now(),
              eta: addDays(Date.now(), 2).getTime(),
            };
            await set(dispatchRef, newDispatch);

            // Deduct quantity from materials
            const materialRef = ref(database, `materials/${request.materialId}`);
            const materialSnapshot = await get(materialRef);
            if (materialSnapshot.exists()) {
              const material = materialSnapshot.val() as Material;
              await update(materialRef, {
                quantity: material.quantity - request.quantityRequested,
                updatedAt: Date.now(),
              });
            }
          }
        }
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [users]);

  // Fetch dispatches
  useEffect(() => {
    const dispatchesRef = ref(database, "dispatches");
    const unsubscribe = onValue(dispatchesRef, (snapshot) => {
      if (snapshot.exists()) {
        const dispatchesData = snapshot.val() as { [key: string]: Dispatch };
        const dispatchesList = Object.entries(dispatchesData).map(([id, dispatch]) => ({
          dispatchId: id,
          materialId: dispatch.materialId ?? "",
          materialName: dispatch.materialName ?? "",
          quantity: dispatch.quantity ?? 0,
          fromSite: dispatch.fromSite ?? "",
          toSite: dispatch.toSite ?? "",
          driverId: dispatch.driverId ?? "",
          driverName: dispatch.driverName ?? "",
          vehicleNumber: dispatch.vehicleNumber ?? "",
          status: dispatch.status ?? "in-transit",
          dispatchTime: dispatch.dispatchTime ?? 0,
          eta: dispatch.eta ?? 0,
          deliveryTime: dispatch.deliveryTime,
          proofPhotoUrl: dispatch.proofPhotoUrl,
        }));
        setDispatches(dispatchesList);
      } else {
        setDispatches([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Get unique materials and projects for filtering
  const materialsList = useMemo(() => {
    const uniqueMaterials = new Set(dispatches.map((dispatch) => dispatch.materialName));
    return ["All Materials", ...uniqueMaterials];
  }, [dispatches]);

  const projectsList = useMemo(() => {
    const uniqueProjects = new Set(dispatches.map((dispatch) => dispatch.toSite));
    return ["All Projects", ...uniqueProjects];
  }, [dispatches]);

  // Filter dispatches
  const filteredDispatches = useMemo(() => {
    return dispatches.filter((dispatch) => {
      const matchesSearch =
        dispatch.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dispatch.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dispatch.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMaterial = filterMaterial === "All Materials" || dispatch.materialName === filterMaterial;
      const matchesProject = filterProject === "All Projects" || dispatch.toSite === filterProject;
      const matchesStatus = filterStatus === "All Statuses" || dispatch.status === filterStatus.toLowerCase();
      return matchesSearch && matchesMaterial && matchesProject && matchesStatus;
    });
  }, [dispatches, searchQuery, filterMaterial, filterProject, filterStatus]);

  // Handle create dispatch
  const handleCreateDispatch = async () => {
    if (
      !newDispatch.materialId ||
      !newDispatch.quantity ||
      !newDispatch.driverId ||
      !newDispatch.vehicleNumber
    ) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const material = materials[newDispatch.materialId];
      if (!material || material.quantity < newDispatch.quantity) {
        alert("Insufficient material quantity");
        return;
      }

      const driver = users.find((user) => user.uid === newDispatch.driverId);
      const dispatchId = `DISP-${Date.now()}`;
      const newDispatchData: Dispatch = {
        dispatchId,
        materialId: newDispatch.materialId,
        materialName: material.name,
        quantity: newDispatch.quantity,
        fromSite: newDispatch.fromSite ?? "Warehouse",
        toSite: newDispatch.toSite ?? "MKR Project",
        driverId: newDispatch.driverId,
        driverName: driver?.name ?? "Unknown Driver",
        vehicleNumber: newDispatch.vehicleNumber,
        status: newDispatch.status ?? "in-transit",
        dispatchTime: Date.now(),
        eta: addDays(Date.now(), 2).getTime(),
      };

      const dispatchRef = ref(database, `dispatches/${dispatchId}`);
      await set(dispatchRef, newDispatchData);

      // Deduct quantity from materials
      const materialRef = ref(database, `materials/${newDispatch.materialId}`);
      await update(materialRef, {
        quantity: material.quantity - newDispatch.quantity,
        updatedAt: Date.now(),
      });

      setOpenCreateDialog(false);
      setNewDispatch({ fromSite: "Warehouse", toSite: "MKR Project", vehicleNumber: "", status: "in-transit" });
    } catch (error) {
      console.error("Failed to create dispatch:", error);
      alert("Failed to create dispatch");
    }
  };

  // Handle status update
  const handleUpdateStatus = async (
    dispatch: Dispatch,
    newStatus: "in-transit" | "delivered" | "delayed"
  ) => {
    try {
      const dispatchRef = ref(database, `dispatches/${dispatch.dispatchId}`);
      const updates: Partial<Dispatch> = { status: newStatus };
      if (newStatus === "delivered") {
        updates.deliveryTime = Date.now();
      }
      await update(dispatchRef, updates);
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Dispatches</h1>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by material, driver, or vehicle..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterMaterial} onValueChange={setFilterMaterial}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent>
              {materialsList.map((material) => (
                <SelectItem key={material} value={material}>
                  {material}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projectsList.map((project) => (
                <SelectItem key={project} value={project}>
                  {project}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {["All Statuses", "In-transit", "Delivered", "Delayed"].map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Dispatch
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Dispatch</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Select
                  onValueChange={(value) =>
                    setNewDispatch({ ...newDispatch, materialId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(materials).map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Quantity"
                  value={newDispatch.quantity ?? ""}
                  onChange={(e) =>
                    setNewDispatch({
                      ...newDispatch,
                      quantity: parseInt(e.target.value) || undefined,
                    })
                  }
                />
                <Input
                  type="text"
                  placeholder="From Site"
                  value={newDispatch.fromSite ?? ""}
                  onChange={(e) =>
                    setNewDispatch({ ...newDispatch, fromSite: e.target.value })
                  }
                />
                <Input
                  type="text"
                  placeholder="To Site"
                  value={newDispatch.toSite ?? ""}
                  onChange={(e) =>
                    setNewDispatch({ ...newDispatch, toSite: e.target.value })
                  }
                />
                <Select
                  onValueChange={(value) =>
                    setNewDispatch({ ...newDispatch, driverId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((user) => user.role === "driver" || user.role === "worker")
                      .map((user) => (
                        <SelectItem key={user.uid} value={user.uid}>
                          {user.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Input
                  type="text"
                  placeholder="Vehicle Number"
                  value={newDispatch.vehicleNumber ?? ""}
                  onChange={(e) =>
                    setNewDispatch({ ...newDispatch, vehicleNumber: e.target.value })
                  }
                />
              </div>
              <Button onClick={handleCreateDispatch}>Create</Button>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dispatch List</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center text-sm text-gray-500">Loading dispatches...</div>
            ) : filteredDispatches.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dispatch Time</TableHead>
                    <TableHead>ETA</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDispatches.map((dispatch) => (
                    <TableRow key={dispatch.dispatchId}>
                      <TableCell>{dispatch.materialName}</TableCell>
                      <TableCell>
                        {dispatch.quantity} {materials[dispatch.materialId]?.unitType ?? ""}
                      </TableCell>
                      <TableCell>{dispatch.fromSite}</TableCell>
                      <TableCell>{dispatch.toSite}</TableCell>
                      <TableCell>{dispatch.driverName}</TableCell>
                      <TableCell>{dispatch.vehicleNumber}</TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            dispatch.status === "in-transit" && "bg-orange-500",
                            dispatch.status === "delivered" && "bg-green-500",
                            dispatch.status === "delayed" && "bg-red-500"
                          )}
                        >
                          {dispatch.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(dispatch.dispatchTime, "PPP")}</TableCell>
                      <TableCell>{format(dispatch.eta, "PPP")}</TableCell>
                      <TableCell>
                        <Select
                          value={dispatch.status}
                          onValueChange={(value) =>
                            handleUpdateStatus(
                              dispatch,
                              value as "in-transit" | "delivered" | "delayed"
                            )
                          }
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="in-transit">In-transit</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="delayed">Delayed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-sm text-gray-500">No dispatches found.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DispatchesPage;
