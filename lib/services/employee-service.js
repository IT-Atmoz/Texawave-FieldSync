import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"

const COLLECTION_NAME = "employees"

// Get all employees
export const getAllEmployees = async () => {
  const employeesRef = collection(db, COLLECTION_NAME)
  const snapshot = await getDocs(employeesRef)

  return snapshot.docs.map((doc) => ({
    _id: doc.id,
    ...doc.data(),
  }))
}

// Get employee by ID
export const getEmployeeById = async (id) => {
  const docRef = doc(db, COLLECTION_NAME, id)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    return {
      _id: docSnap.id,
      ...docSnap.data(),
    }
  } else {
    throw new Error("Employee not found")
  }
}

// Create new employee
export const createEmployee = async (employeeData, photoFile = null) => {
  try {
    let photoURL = employeeData.photo || null

    // Upload photo if provided
    if (photoFile) {
      const storageRef = ref(storage, `employees/${Date.now()}_${photoFile.name}`)
      await uploadBytes(storageRef, photoFile)
      photoURL = await getDownloadURL(storageRef)
    }

    // Add timestamp and photo URL
    const employeeWithTimestamp = {
      ...employeeData,
      photo: photoURL,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), employeeWithTimestamp)

    return {
      _id: docRef.id,
      ...employeeWithTimestamp,
    }
  } catch (error) {
    console.error("Error creating employee:", error)
    throw error
  }
}

// Update employee
export const updateEmployee = async (id, employeeData, photoFile = null) => {
  try {
    let photoURL = employeeData.photo || null

    // Upload new photo if provided
    if (photoFile) {
      const storageRef = ref(storage, `employees/${Date.now()}_${photoFile.name}`)
      await uploadBytes(storageRef, photoFile)
      photoURL = await getDownloadURL(storageRef)
    }

    // Update with timestamp and photo URL if changed
    const updates = {
      ...employeeData,
      ...(photoFile ? { photo: photoURL } : {}),
      updatedAt: serverTimestamp(),
    }

    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, updates)

    return {
      _id: id,
      ...updates,
    }
  } catch (error) {
    console.error("Error updating employee:", error)
    throw error
  }
}

// Delete employee
export const deleteEmployee = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
    return true
  } catch (error) {
    console.error("Error deleting employee:", error)
    throw error
  }
}

// Get employees by role
export const getEmployeesByRole = async (role) => {
  try {
    const employeesRef = collection(db, COLLECTION_NAME)
    const q = query(employeesRef, where("role", "==", role))
    const snapshot = await getDocs(q)

    return snapshot.docs.map((doc) => ({
      _id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error getting employees by role:", error)
    throw error
  }
}
