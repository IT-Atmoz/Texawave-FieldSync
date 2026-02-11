import * as React from "react";
import { useState, useEffect } from "react";
import { ref, get, set, push, onValue } from "firebase/database";
import { database } from "@/lib/firebase";
import { Send, Check, ChevronDown, ChevronUp, RotateCcw, AlertCircle, CheckCircle } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "@/lib/utils";
import { ChatAdapter } from "./ChatAdapter";

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
      "flex h-12 w-full items-center justify-between rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
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
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-indigo-100 focus:text-indigo-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
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

interface AssignWorkModalProps {
  onWorkAssigned?: () => void;
}

export const AssignWorkModal = ({ onWorkAssigned }: AssignWorkModalProps) => {
  const [usernames, setUsernames] = useState<string[]>([]);
  const [usernameToUidMap, setUsernameToUidMap] = useState<{ [key: string]: string }>({});
  const [selectedUsername, setSelectedUsername] = useState<string>("");
  const [workName, setWorkName] = useState<string>("");
  const [workPlace, setWorkPlace] = useState<string>("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");
  const [notification, setNotification] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const adminId = "admin";

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
      if (onWorkAssigned) onWorkAssigned();
      resetForm();
    }, 1500); // Reset form after showing success message
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

  const resetForm = () => {
    setSelectedUsername(usernames.length > 0 ? usernames[0] : "");
    setWorkName("");
    setWorkPlace("");
    setLatitude("");
    setLongitude("");
    setMessageInput("");
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 min-h-screen">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Assign Work</h2>
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
            <Button onClick={handleSendMessage} size="icon">
              <Send size={20} />
            </Button>
          </div>
          <div className="flex justify-end space-x-3">
            <Button onClick={resetForm} variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button onClick={handleAssignWork}>
              Assign Work
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};