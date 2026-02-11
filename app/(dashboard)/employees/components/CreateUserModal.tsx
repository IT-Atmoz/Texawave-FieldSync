import * as React from "react";
import { useState, useEffect } from "react";
import { ref, get, set } from "firebase/database";
import { database } from "@/lib/firebase";
import { Eye, EyeOff, AlertCircle, CheckCircle, RotateCcw } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Inline Button Component
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-lg",
        destructive: "bg-red-500 text-white hover:bg-red-600 shadow-lg",
        outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 shadow-sm",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 shadow-sm",
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

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? "span" : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

// Inline Input Component
const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-all duration-200",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

interface CreateUserModalProps {
  onUserCreated?: () => void;
}

export const CreateUserModal = ({ onUserCreated }: CreateUserModalProps) => {
  const [name, setName] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [usernames, setUsernames] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: "error" | "success" } | null>(null);

  useEffect(() => {
    const fetchUsernames = async () => {
      const usersRef = ref(database, "users");
      const snapshot = await get(usersRef);
      if (snapshot.exists()) {
        const users = snapshot.val();
        const usernamesList = Object.values(users).map((user: any) => user.username);
        setUsernames(usernamesList);
      }
    };
    fetchUsernames();
  }, []);

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleCreateUser = async () => {
    if (!name || !username || !password) {
      setNotification({ message: "Please fill all fields", type: "error" });
      return;
    }

    if (usernames.includes(username)) {
      setNotification({ message: "Username already exists", type: "error" });
      return;
    }

    const userData = {
      name,
      username,
      password,
      loggedIn: false,
      role: "worker",
      joinDate: new Date().toISOString(),
    };
    const newUserId = Date.now().toString();
    const userRef = ref(database, `users/${newUserId}`); // Fixed syntax error
    await set(userRef, userData);

    setNotification({ message: "User created successfully", type: "success" });
    setTimeout(() => {
      if (onUserCreated) onUserCreated();
      resetForm();
    }, 1500); // Reset form after showing success message
  };

  const resetForm = () => {
    setName("");
    setUsername("");
    setPassword("");
    setShowPassword(false);
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Create New User</h2>
        {notification && (
          <div
            className={cn(
              "flex items-center gap-2 p-3 rounded-lg mb-6 transition-all duration-300 animate-slide-down",
              notification.type === "error" ? "bg-red-100 text-red-800 shadow-md" : "bg-green-100 text-green-800 shadow-md"
            )}
          >
            {notification.type === "error" ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        )}
        <div className="space-y-5">
          <Input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full"
          />
          <Input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full"
          />
          <div className="relative w-full">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pr-12"
            />
            <button
              type="button"
              onClick={toggleShowPassword}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div className="flex justify-end space-x-3">
            <Button onClick={resetForm} variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button onClick={handleCreateUser}>
              Create User
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};