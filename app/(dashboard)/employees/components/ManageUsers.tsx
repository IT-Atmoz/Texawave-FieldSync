import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ref, onValue, set, remove, get, push } from "firebase/database";
import { database } from "@/lib/firebase";
import { Search, Filter, Users, Eye, EyeOff, AlertCircle, CheckCircle, Trash2, Edit, MapPin, Clock, MessageSquare, RotateCcw, Send, Check, ChevronDown, ChevronUp } from "lucide-react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ChatAdapter } from "./ChatAdapter";
import { User } from "../utils/types";

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
        track: "bg-green-500 text-white hover:bg-green-600 shadow-lg",
        history: "bg-blue-500 text-white hover:bg-blue-600 shadow-lg",
        chat: "bg-purple-500 text-white hover:bg-purple-600 shadow-lg",
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

// Inline Card Component
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-white shadow-lg transition-all hover:shadow-xl w-full",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-4 sm:p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg sm:text-xl font-bold text-gray-800 truncate", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs sm:text-sm text-gray-500 truncate", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 sm:p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-4 sm:p-6 pt-0 border-t bg-gray-50", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// Inline Input Component
const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 sm:h-12 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 sm:px-4 py-2 text-xs sm:text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-all duration-200",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

// Inline Tabs Components
const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 sm:h-12 items-center justify-center rounded-lg bg-white p-1 text-gray-600 shadow-sm flex-wrap",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

// Inline Badge Component
const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 sm:px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-indigo-500 text-white shadow hover:bg-indigo-600",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
        destructive: "bg-red-500 text-white shadow hover:bg-red-600",
        outline: "border border-gray-300 text-gray-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

// Inline Avatar Components
const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-12 sm:h-14 w-12 sm:w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-indigo-100",
      className
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-indigo-100 text-indigo-700",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

// Inline Select Components
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
      "flex h-10 sm:h-12 w-full items-center justify-between rounded-lg border border-gray-300 bg-gray-50 px-3 sm:px-4 py-2 text-xs sm:text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
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
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
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
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-xs sm:text-sm outline-none focus:bg-indigo-100 focus:text-indigo-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
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
  <SelectPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export const ManageUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [createName, setCreateName] = useState<string>("");
  const [createUsername, setCreateUsername] = useState<string>("");
  const [createPassword, setCreatePassword] = useState<string>("");
  const [usernames, setUsernames] = useState<string[]>([]);
  const [usernameToUidMap, setUsernameToUidMap] = useState<{ [key: string]: string }>({});
  const [selectedUsername, setSelectedUsername] = useState<string>("");
  const [workName, setWorkName] = useState<string>("");
  const [workPlace, setWorkPlace] = useState<string>("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const router = useRouter();
  const adminId = "admin";

  useEffect(() => {
    const usersRef = ref(database, "users");
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const usersList = Object.keys(usersData)
          .map((uid) => ({
            uid,
            name: usersData[uid].name || "",
            username: usersData[uid].username || "",
            password: usersData[uid].password || "",
            loggedIn: usersData[uid].loggedIn || false,
            gpsActive: usersData[uid].location?.gpsActive ?? null,
            role: usersData[uid].role || "worker",
            joinDate: usersData[uid].joinDate || new Date().toISOString(),
            photo: usersData[uid].photo || "/placeholder.svg",
          }))
          .filter((user) => user.name && user.name.trim() !== "" && user.username && user.username.trim() !== "");

        const uniqueUsers: User[] = [];
        const seenUsernames = new Set<string>();
        const usernameMap: { [key: string]: string } = {};
        usersList.forEach((user) => {
          if (!seenUsernames.has(user.username)) {
            seenUsernames.add(user.username);
            uniqueUsers.push(user);
            usernameMap[user.username] = user.uid;
          }
        });

        setUsers(uniqueUsers);
        setUsernames(uniqueUsers.map((user) => user.username));
        setUsernameToUidMap(usernameMap);
        if (uniqueUsers.length > 0 && !selectedUsername) {
          setSelectedUsername(uniqueUsers[0].username);
        }
        setIsLoading(false);
      } else {
        setUsers([]);
        setUsernames([]);
        setUsernameToUidMap({});
        setSelectedUsername("");
        setIsLoading(false);
        setNotification({ message: "No users found", type: "error" });
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedUsername) {
      const userId = usernameToUidMap[selectedUsername];
      if (userId) {
        const messagesRef = ref(database, `chats/${userId}`);
        const unsubscribe = onValue(messagesRef, (snapshot) => {
          if (snapshot.exists()) {
            const messagesData = snapshot.val();
            const messagesList = Object.values(messagesData) as any[];
            setMessages(messagesList);
          } else {
            setMessages([]);
          }
        });
        return () => unsubscribe();
      }
    }
  }, [selectedUsername, usernameToUidMap]);

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setUsername(user.username);
    setPassword(user.password);
    setShowPassword(false);
  };

  const handleUpdateUser = async () => {
    if (!name || !username || !password || !editingUser) {
      setNotification({ message: "Please fill all fields", type: "error" });
      return;
    }

    if (username !== editingUser.username && usernames.includes(username)) {
      setNotification({ message: "Username already exists", type: "error" });
      return;
    }

    const userRef = ref(database, `users/${editingUser.uid}`);
    await set(userRef, {
      name,
      username,
      password,
      loggedIn: editingUser.loggedIn,
      gpsActive: editingUser.gpsActive,
      role: editingUser.role || "worker",
      joinDate: editingUser.joinDate,
      photo: editingUser.photo,
    });

    setNotification({ message: "User updated successfully", type: "success" });
    setEditingUser(null);
    setName("");
    setUsername("");
    setPassword("");
    setShowPassword(false);
  };

  const handleCreateUser = async () => {
    if (!createName || !createUsername || !createPassword) {
      setNotification({ message: "Please fill all fields", type: "error" });
      return;
    }

    if (usernames.includes(createUsername)) {
      setNotification({ message: "Username already exists", type: "error" });
      return;
    }

    const userData = {
      name: createName,
      username: createUsername,
      password: createPassword,
      loggedIn: false,
      role: "worker",
      joinDate: new Date().toISOString(),
      photo: "/placeholder.svg",
    };
    const newUserId = Date.now().toString();
    const userRef = ref(database, `users/${createUsername}`);
    await set(userRef, userData);

    setNotification({ message: "User created successfully", type: "success" });
    setTimeout(() => {
      resetCreateForm();
    }, 1500);
  };

  const resetCreateForm = () => {
    setCreateName("");
    setCreateUsername("");
    setCreatePassword("");
    setShowPassword(false);
  };

  const handleAssignWork = async () => {
    if (!selectedUsername || !workName || !workPlace) {
      setNotification({ message: "Please fill all fields", type: "error" });
      return;
    }

    const userId = usernameToUidMap[selectedUsername];
    if (!userId) {
      setNotification({ message: "User not found", type: "error" });
      return;
    }

    let lat = 0.0,
      lon = 0.0;
    if (latitude && longitude) {
      lat = parseFloat(latitude);
      lon = parseFloat(longitude);
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        setNotification({ message: "Invalid latitude or longitude", type: "error" });
        return;
      }
    }

    const workData: any = {
      name: workName,
      place: workPlace,
      accepted: false,
      status: "pending",
      assignedAt: Date.now(),
      assignedDay: new Date().toLocaleDateString("en-US", { weekday: "long" }),
      ...(latitude && longitude && { latitude: lat, longitude: lon }),
    };

    const workRef = ref(database, `users/${userId}/work`);
    await set(workRef, workData);

    const worksRef = ref(database, `users/${userId}/works`);
    const worksSnapshot = await get(worksRef);
    const worksList = worksSnapshot.exists() ? (Object.values(worksSnapshot.val()) as any[]) : [];
    worksList.push(workData);
    await set(worksRef, worksList);

    setNotification({ message: "Work assigned successfully", type: "success" });
    setTimeout(() => {
      resetAssignForm();
    }, 1500);
  };

  const handleSendMessage = async () => {
    if (!selectedUsername || !messageInput) {
      setNotification({ message: "Please select a user and type a message", type: "error" });
      return;
    }

    const userId = usernameToUidMap[selectedUsername];
    if (!userId) {
      setNotification({ message: "User not found", type: "error" });
      return;
    }

    const messageData: any = {
      senderId: adminId,
      senderRole: "admin",
      message: messageInput,
      timestamp: Date.now(),
    };

    const messagesRef = ref(database, `chats/${userId}`);
    await push(messagesRef, messageData);

    setMessageInput("");
    setNotification({ message: "Message sent successfully", type: "success" });
  };

  const resetAssignForm = () => {
    setSelectedUsername(usernames.length > 0 ? usernames[0] : "");
    setWorkName("");
    setWorkPlace("");
    setLatitude("");
    setLongitude("");
    setMessageInput("");
  };

  const handleInitiateDelete = (uid: string) => {
    setUserToDelete(uid);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      const userRef = ref(database, `users/${userToDelete}`);
      await remove(userRef);
      setNotification({ message: "User deleted successfully", type: "success" });
    }
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  const handleDeleteUser = async (uid: string) => {
    handleInitiateDelete(uid);
  };

  const handleTrackUserLocation = (uid: string, userName: string) => {
    router.push(`/employees?view=track&userId=${uid}&userName=${encodeURIComponent(userName)}`);
  };

  const handleViewHistory = (uid: string, userName: string) => {
    router.push(`/employees?view=history&userId=${uid}&userName=${encodeURIComponent(userName)}`);
  };

  const handleChatWithUser = (uid: string, userName: string) => {
    router.push(`/employees?view=chat&userId=${uid}&userName=${encodeURIComponent(userName)}`);
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 sm:px-6 pt-8 sm:pt-10">
      <div className="max-w-7xl mx-auto mt-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 tracking-tight text-center sm:text-left">
            Manage Users
          </h1>
        </div>

        {notification && (
          <div
            className={cn(
              "flex items-center gap-2 p-3 rounded-lg mb-6 transition-all duration-300 animate-slide-down w-full max-w-md mx-auto",
              notification.type === "error" ? "bg-red-100 text-red-800 shadow-md" : "bg-green-100 text-green-800 shadow-md"
            )}
          >
            {notification.type === "error" ? (
              <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5" />
            ) : (
              <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5" />
            )}
            <span className="text-xs sm:text-sm font-medium">{notification.message}</span>
          </div>
        )}

        <Tabs defaultValue="all" className="space-y-4 sm:space-y-6">
          <TabsList className="flex justify-center sm:justify-start">
            <TabsTrigger value="all">
              All Users
              <Badge variant="outline" className="ml-2 bg-indigo-50 text-indigo-700">
                {filteredUsers.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="create">Create User</TabsTrigger>
            {/* <TabsTrigger value="assign">Assign Work</TabsTrigger> */}
          </TabsList>

          <TabsContent value="all" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                <Input
                  type="search"
                  placeholder="       Search users by name or username..."
                  className="pl-10 rounded-lg shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
            </div>

            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                      <div className="h-12 sm:h-14 w-12 sm:w-14 rounded-full bg-gray-200"></div>
                      <div className="space-y-2">
                        <div className="h-4 sm:h-5 w-24 sm:w-32 bg-gray-200 rounded"></div>
                        <div className="h-3 sm:h-4 w-20 sm:w-24 bg-gray-200 rounded"></div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="h-3 sm:h-4 w-full bg-gray-200 rounded"></div>
                        <div className="h-3 sm:h-4 w-5/6 bg-gray-200 rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <Card
                    key={user.uid}
                    className={`transition-all hover:scale-105 ${
                      user.username.toLowerCase() === "rohit" ? "bg-yellow-50 border-2 border-yellow-300" : ""
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center gap-3 sm:gap-4 pb-2">
                      <Avatar>
                        <AvatarImage src={user.photo} alt={user.name} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="overflow-hidden">
                        <CardTitle>{user.name}</CardTitle>
                        <CardDescription>{user.username}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Role:</span>
                          <span className="font-medium capitalize">{user.role}</span>
                        </div>
                        {/* <div className="flex justify-between">
                          <span className="text-gray-500">Joined:</span>
                          <span className="font-medium">{new Date(user.joinDate).toLocaleDateString()}</span>
                        </div> */}
                        <div className="flex justify-between">
                          <span className="text-gray-500">GPS Active:</span>
                          <span
                            className={`font-medium ${
                              user.gpsActive === true ? "text-green-500" : user.gpsActive === false ? "text-red-500" : "text-gray-500"
                            }`}
                          >
                            {user.gpsActive !== null ? user.gpsActive.toString() : "Unknown"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <div className="flex w-full justify-between text-xs sm:text-sm">
                        <span className="text-gray-500">Status:</span>
                        <Badge variant="outline" className={user.loggedIn ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                          {user.loggedIn ? "User Viewing The App" : "User Minimized or Closed the App"}
                        </Badge>
                      </div>
                    </CardFooter>
                    <div className="flex flex-col space-y-2 p-4 sm:p-6 pt-0">
                      <Button onClick={() => handleEditUser(user)} variant="default" size="sm">
                        <Edit className="mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                        Edit
                      </Button>
                      <Button onClick={() => handleDeleteUser(user.uid)} variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                        Delete
                      </Button>
                      {/* <Button
                        onClick={() => handleTrackUserLocation(user.uid, user.username)}
                        variant="track"
                        size="sm"
                      >
                        <MapPin className="mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                        Track
                      </Button> */}
                      {/* <Button
                        onClick={() => handleViewHistory(user.uid, user.username)}
                        variant="history"
                        size="sm"
                      >
                        <Clock className="mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                        History
                      </Button> */}
                      {/* <Button
                        onClick={() => handleChatWithUser(user.uid, user.username)}
                        variant="chat"
                        size="sm"
                      >
                        <MessageSquare className="mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                        Chat
                      </Button> */}
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-white shadow-sm">
                  <Users className="h-10 sm:h-12 w-10 sm:w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg sm:text-xl font-medium text-gray-800">No users found</h3>
                  <p className="text-xs sm:text-sm text-gray-500 text-center">
                    {searchQuery ? "Try adjusting your search query" : "Get started by adding your first user"}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="create" className="space-y-4 sm:space-y-6">
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8 transform transition-all duration-300">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">Create New User</h2>
              {notification && (
                <div
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg mb-4 sm:mb-6 transition-all duration-300 animate-slide-down",
                    notification.type === "error" ? "bg-red-100 text-red-800 shadow-md" : "bg-green-100 text-green-800 shadow-md"
                  )}
                >
                  {notification.type === "error" ? (
                    <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5" />
                  ) : (
                    <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5" />
                  )}
                  <span className="text-xs sm:text-sm font-medium">{notification.message}</span>
                </div>
              )}
              <div className="space-y-4 sm:space-y-5">
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full"
                />
                <Input
                  type="text"
                  placeholder="Username"
                  value={createUsername}
                  onChange={(e) => setCreateUsername(e.target.value)}
                  className="w-full"
                />
                <div className="relative w-full">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    className="w-full pr-10 sm:pr-12"
                  />
                  <button
                    type="button"
                    onClick={toggleShowPassword}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="flex justify-end space-x-2 sm:space-x-3">
                  <Button onClick={resetCreateForm} variant="outline" size="sm">
                    <RotateCcw className="mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                    Reset
                  </Button>
                  <Button onClick={handleCreateUser} size="sm">
                    Create User
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="assign" className="space-y-4 sm:space-y-6">
            <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8 transform transition-all duration-300">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">Assign Work</h2>
              {notification && (
                <div
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg mb-4 sm:mb-6 transition-all duration-300 animate-slide-down",
                    notification.type === "error" ? "bg-red-100 text-red-800 shadow-md" : "bg-green-100 text-green-800 shadow-md"
                  )}
                >
                  {notification.type === "error" ? (
                    <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5" />
                  ) : (
                    <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5" />
                  )}
                  <span className="text-xs sm:text-sm font-medium">{notification.message}</span>
                </div>
              )}
              <div className="space-y-4 sm:space-y-5">
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
                  placeholder="Work Place"
                  value={workPlace}
                  onChange={(e) => setWorkPlace(e.target.value)}
                  className="w-full"
                />
                <Input
                  type="text"
                  placeholder="Latitude (e.g., 12.9716)"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full"
                />
                <Input
                  type="text"
                  placeholder="Longitude (e.g., 77.5946)"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full"
                />
                <ChatAdapter messages={messages} currentUserId={adminId} currentUserRole="admin" />
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    placeholder="Type a message or report..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="w-full"
                  />
                  <Button onClick={handleSendMessage} size="icon" variant="default">
                    <Send className="h-4 sm:h-5 w-4 sm:w-5" />
                  </Button>
                </div>
                <div className="flex justify-end space-x-2 sm:space-x-3">
                  <Button onClick={resetAssignForm} variant="outline" size="sm">
                    <RotateCcw className="mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                    Reset
                  </Button>
                  <Button onClick={handleAssignWork} size="sm">
                    Assign Work
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg transform transition-all duration-300 relative">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">Confirm Delete</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-6 text-center">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2 sm:space-x-3">
                <Button onClick={handleCancelDelete} variant="outline" size="sm">
                  Cancel
                </Button>
                <Button onClick={handleConfirmDelete} variant="destructive" size="sm">
                  Confirm Delete
                </Button>
              </div>
            </div>
          </div>
        )}

        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg transform transition-all duration-300 relative">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">Edit User</h2>
              {notification && (
                <div
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg mb-4 sm:mb-6 transition-all duration-300 animate-slide-down",
                    notification.type === "error" ? "bg-red-100 text-red-800 shadow-md" : "bg-green-100 text-green-800 shadow-md"
                  )}
                >
                  {notification.type === "error" ? (
                    <AlertCircle className="h-4 sm:h-5 w-4 sm:h-5" />
                  ) : (
                    <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5" />
                  )}
                  <span className="text-xs sm:text-sm font-medium">{notification.message}</span>
                </div>
              )}
              <div className="space-y-4 sm:space-y-5">
                <Input
                  type="text"
                  placeholder="Name"
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
                    className="w-full pr-10 sm:pr-12"
                  />
                  <button
                    type="button"
                    onClick={toggleShowPassword}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="flex justify-end space-x-2 sm:space-x-3">
                  <Button onClick={() => setEditingUser(null)} variant="outline" size="sm">
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateUser} size="sm">
                    Update
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
