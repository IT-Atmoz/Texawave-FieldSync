import { ref, set, get, update, remove, push, query, orderByChild, equalTo, onValue, off } from "firebase/database"
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import { database, storage } from "@/lib/firebase"

const DB_PATH = "employees"

// Create a new employee
export const createEmployee = async (employeeData, photoFile = null) => {
  try {
    let photoURL = employeeData.photo || null

    // Upload photo if provided
    if (photoFile) {
      const fileRef = storageRef(storage, `employees/${Date.now()}_${photoFile.name}`)
      await uploadBytes(fileRef, photoFile)
      photoURL = await getDownloadURL(fileRef)
    }

    // Create a new reference with an auto-generated id
    const newEmployeeRef = push(ref(database, DB_PATH))
    const employeeId = newEmployeeRef.key

    // Add timestamp and photo URL
    const employeeWithTimestamp = {
      ...employeeData,
      photo: photoURL,
      _id: employeeId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    // Set the data at the generated location
    await set(newEmployeeRef, employeeWithTimestamp)

    return {
      ...employeeWithTimestamp,
      _id: employeeId,
    }
  } catch (error) {
    console.error("Error creating employee:", error)
    throw error
  }
}

// Get all employees
export const getAllEmployees = async () => {
  try {
    const employeesRef = ref(database, DB_PATH)
    const snapshot = await get(employeesRef)

    if (snapshot.exists()) {
      const employees = []
      snapshot.forEach((childSnapshot) => {
        employees.push({
          _id: childSnapshot.key,
          ...childSnapshot.val(),
        })
      })
      return employees
    }
    return []
  } catch (error) {
    console.error("Error getting employees:", error)
    throw error
  }
}

// Set up a real-time listener for employees
export const subscribeToEmployees = (callback) => {
  const employeesRef = ref(database, DB_PATH)

  const handleData = (snapshot) => {
    if (snapshot.exists()) {
      const employees = []
      snapshot.forEach((childSnapshot) => {
        employees.push({
          _id: childSnapshot.key,
          ...childSnapshot.val(),
        })
      })
      callback(employees)
    } else {
      callback([])
    }
  }

  onValue(employeesRef, handleData)

  // Return unsubscribe function
  return () => off(employeesRef, "value", handleData)
}

// Get employee by ID
export const getEmployeeById = async (id) => {
  try {
    const employeeRef = ref(database, `${DB_PATH}/${id}`)
    const snapshot = await get(employeeRef)

    if (snapshot.exists()) {
      return {
        _id: snapshot.key,
        ...snapshot.val(),
      }
    } else {
      throw new Error("Employee not found")
    }
  } catch (error) {
    console.error("Error getting employee:", error)
    throw error
  }
}

// Update employee
export const updateEmployee = async (id, employeeData, photoFile = null) => {
  try {
    let photoURL = employeeData.photo || null

    // Upload new photo if provided
    if (photoFile) {
      const fileRef = storageRef(storage, `employees/${Date.now()}_${photoFile.name}`)
      await uploadBytes(fileRef, photoFile)
      photoURL = await getDownloadURL(fileRef)
    }

    // Update with timestamp and photo URL if changed
    const updates = {
      ...employeeData,
      ...(photoFile ? { photo: photoURL } : {}),
      updatedAt: Date.now(),
    }

    const employeeRef = ref(database, `${DB_PATH}/${id}`)
    await update(employeeRef, updates)

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
    const employeeRef = ref(database, `${DB_PATH}/${id}`)
    await remove(employeeRef)
    return true
  } catch (error) {
    console.error("Error deleting employee:", error)
    throw error
  }
}

// Get employees by role
export const getEmployeesByRole = async (role) => {
  try {
    const employeesRef = ref(database, DB_PATH)
    const roleQuery = query(employeesRef, orderByChild("role"), equalTo(role))
    const snapshot = await get(roleQuery)

    if (snapshot.exists()) {
      const employees = []
      snapshot.forEach((childSnapshot) => {
        employees.push({
          _id: childSnapshot.key,
          ...childSnapshot.val(),
        })
      })
      return employees
    }
    return []
  } catch (error) {
    console.error("Error getting employees by role:", error)
    throw error
  }
}

// Subscribe to employees by role
export const subscribeToEmployeesByRole = (role, callback) => {
  const employeesRef = ref(database, DB_PATH)
  const roleQuery = query(employeesRef, orderByChild("role"), equalTo(role))

  const handleData = (snapshot) => {
    if (snapshot.exists()) {
      const employees = []
      snapshot.forEach((childSnapshot) => {
        employees.push({
          _id: childSnapshot.key,
          ...childSnapshot.val(),
        })
      })
      callback(employees)
    } else {
      callback([])
    }
  }

  onValue(roleQuery, handleData)

  // Return unsubscribe function
  return () => off(roleQuery, "value", handleData)
}
