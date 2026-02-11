"use client";
import React, { useState, useEffect, useRef } from "react";
import { ref, onValue, push, set, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw, User, CheckCircle, XCircle, MapPin, X, MessageSquare, Send, Mic, StopCircle } from "lucide-react";
import marker from './markermap.jpg';
import axios from 'axios';

// UI Components from Shadcn
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// OpenLayers imports for location tracking
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Style, Icon } from 'ol/style';

// Types
interface Location {
  latitude: string;
  longitude: string;
  gpsActive: boolean;
}

interface User {
  key: string;
  username: string;
  name: string;
  password: string;
  location?: Location;
  unreadCount: number;
}

interface Message {
  messageId: string;
  messageText?: string;
  audioUrl?: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  formattedTime: string;
  isRead: boolean;
}

// Notification Component
const Notification: React.FC<{ message: string; type: "success" | "error" }> = ({ message, type }) => {
  return (
    <div
      className={`flex items-center gap-2 p-3 rounded-lg mb-6 transition-all duration-300 animate-slide-down w-full max-w-md mx-auto shadow-md ${
        type === "error" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
      }`}
    >
      {type === "error" ? (
        <XCircle className="h-4 sm:h-5 w-4 sm:w-5" />
      ) : (
        <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5" />
      )}
      <span className="text-xs sm:text-sm font-medium">{message}</span>
    </div>
  );
};

// Location Tracking Modal Component
const LocationModal: React.FC<{
  user: User | null;
  onClose: () => void;
}> = ({ user, onClose }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);
  const markerLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const markerFeatureRef = useRef<Feature<Point> | null>(null);

  const [location, setLocation] = useState({ lat: 13.0827, lng: 80.2707 });
  const [gpsStatus, setGpsStatus] = useState<'waiting' | 'active' | 'stopped'>('waiting');
  const [error, setError] = useState<string | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);

  useEffect(() => {
    if (!mapRef.current) return;

    mapInstance.current = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat([location.lng, location.lat]),
        zoom: 15,
      }),
    });

    vectorSourceRef.current = new VectorSource();
    const markerLayer = new VectorLayer({
      source: vectorSourceRef.current,
    });
    mapInstance.current.addLayer(markerLayer);
    markerLayerRef.current = markerLayer;

    setIsMapLoading(false);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.setTarget(undefined);
      }
    };
  }, []);

  useEffect(() => {
    if (!user || !user.username) {
      setError('Invalid or missing username');
      setGpsStatus('stopped');
      setIsMapLoading(false);
      if (vectorSourceRef.current) {
        vectorSourceRef.current.clear();
      }
      return;
    }

    const locationRef = ref(database, `users/${user.username}/location`);

    const unsubscribe = onValue(
      locationRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const locData = snapshot.val();
          const latitude = parseFloat(locData.latitude);
          const longitude = parseFloat(locData.longitude);

          if (
            !isNaN(latitude) &&
            !isNaN(longitude) &&
            latitude >= -90 &&
            latitude <= 90 &&
            longitude >= -180 &&
            longitude <= 180
          ) {
            const newLocation = { lat: latitude, lng: longitude };
            setLocation(newLocation);
            setGpsStatus(locData.gpsActive ? 'active' : 'stopped');
            setError(null);

            const coords = fromLonLat([newLocation.lng, newLocation.lat]);

            if (mapInstance.current) {
              mapInstance.current.getView().animate({
                center: coords,
                duration: 500,
              });

              if (vectorSourceRef.current) {
                if (!markerFeatureRef.current) {
                  markerFeatureRef.current = new Feature({
                    geometry: new Point(coords),
                  });
                  markerFeatureRef.current.setStyle(
                    new Style({
                      image: new Icon({
                        src: marker,
                        scale: 0.1,
                        anchor: [0.5, 1],
                        zIndex: 0,
                      }),
                    })
                  );
                  vectorSourceRef.current.addFeature(markerFeatureRef.current);
                } else {
                  markerFeatureRef.current.setGeometry(new Point(coords));
                }
              }
            }
          } else {
            setLocation({ lat: 13.0827, lng: 80.2707 });
            setGpsStatus('stopped');
            setError('Invalid location data');
            if (vectorSourceRef.current) {
              vectorSourceRef.current.clear();
              markerFeatureRef.current = null;
            }
          }
        } else {
          setLocation({ lat: 13.0827, lng: 80.2707 });
          setGpsStatus('stopped');
          setError('No location data found for this user');
          if (vectorSourceRef.current) {
            vectorSourceRef.current.clear();
            markerFeatureRef.current = null;
          }
        }
      },
      (error) => {
        setGpsStatus('stopped');
        setError('Failed to fetch location: ' + error.message);
        if (vectorSourceRef.current) {
          vectorSourceRef.current.clear();
          markerFeatureRef.current = null;
        }
      }
    );

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto transition-all duration-300 transform scale-95 hover:scale-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Track Location: {user?.name || 'Unknown User'} ({user?.username || 'Unknown'})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        {error && (
          <div className="text-center mb-4 text-red-500 font-medium text-sm md:text-base break-words">
            {error}
          </div>
        )}
        <div
          ref={mapRef}
          className={`w-full h-[60vh] md:h-[500px] bg-gray-200 relative overflow-hidden rounded-lg ${
            isMapLoading ? 'opacity-50' : 'opacity-100'
          } transition-opacity duration-300`}
        >
          {isMapLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-gray-600 text-sm md:text-lg">Loading map...</span>
            </div>
          )}
        </div>
        <div className="text-center mt-4 text-sm md:text-base text-gray-600 break-words">
          {gpsStatus === 'waiting' && 'Waiting for GPS signal...'}
          {gpsStatus === 'active' && 'Live GPS tracking is active.'}
          {gpsStatus === 'stopped' && (
            <span className="text-red-500 font-medium">
              GPS tracking stopped. Last known location shown.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Chat Component
const ChatComponent: React.FC<{
  userId: string;
  userName: string;
  onBack: () => void;
}> = ({ userId, userName, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const chatRef = ref(database, `chats/user_admin_${userId}/messages`);
    const unsubscribe = onValue(
      chatRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const messagesData = snapshot.val();
          const messagesList: Message[] = Object.keys(messagesData).map((key) => ({
            messageId: key,
            ...messagesData[key],
            isRead: messagesData[key].isRead ?? false,
          }));
          setMessages(messagesList.sort((a, b) => a.timestamp - b.timestamp));
          setTimeout(scrollToBottom, 100);

          // Mark all admin messages as read
          const updates: { [key: string]: boolean } = {};
          messagesList.forEach((message) => {
            if (message.senderId === "admin" && !message.isRead) {
              updates[`chats/user_admin_${userId}/messages/${message.messageId}/isRead`] = true;
            }
          });
          if (Object.keys(updates).length > 0) {
            update(ref(database), updates)
              .catch((error) => {
                setNotification({ message: "Failed to mark messages as read.", type: "error" });
              });
          }
        } else {
          setMessages([]);
        }
      },
      (error) => {
        setNotification({ message: "Failed to load messages.", type: "error" });
      }
    );

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const chatRef = ref(database, `chats/user_admin_${userId}/messages`);
    const newMessageRef = push(chatRef);
    const timestamp = Date.now();
    const date = new Date(timestamp);
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      await set(newMessageRef, {
        messageId: newMessageRef.key,
        messageText: newMessage.trim(),
        senderId: "admin",
        senderName: "Admin",
        timestamp,
        formattedTime,
        isRead: false,
      });
      setNewMessage("");
    } catch (error) {
      setNotification({ message: "Failed to send message.", type: "error" });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await uploadAudio(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      setNotification({ message: "Failed to start recording.", type: "error" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const uploadAudio = async (blob: Blob) => {
    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');
    formData.append('upload_preset', 'unsigned_preset');

    try {
      const response = await axios.post(
        'https://api.cloudinary.com/v1_1/dpgf1rkjl/upload',
        formData
      );
      const audioUrl = response.data.secure_url;

      const chatRef = ref(database, `chats/user_admin_${userId}/messages`);
      const newMessageRef = push(chatRef);
      const timestamp = Date.now();
      const date = new Date(timestamp);
      const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      await set(newMessageRef, {
        messageId: newMessageRef.key,
        audioUrl,
        senderId: "admin",
        senderName: "Admin",
        timestamp,
        formattedTime,
        isRead: false,
      });
    } catch (error) {
      setNotification({ message: "Failed to upload audio.", type: "error" });
    }
  };

  const formatDate = (timestamp: number) => {
    const today = new Date();
    const messageDate = new Date(timestamp);
    const isToday = messageDate.toDateString() === today.toDateString();
    if (isToday) return "Today";
    return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const groupMessagesByDate = () => {
    const grouped: { date: string; messages: Message[] }[] = [];
    let currentDate = '';

    messages.forEach((message) => {
      const messageDate = formatDate(message.timestamp);
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        grouped.push({ date: currentDate, messages: [message] });
      } else {
        grouped[grouped.length - 1].messages.push(message);
      }
    });

    return grouped;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center gap-4 shadow-lg">
        <button onClick={onBack} className="text-white">
          <X className="h-6 w-6" />
        </button>
        <Avatar>
          <AvatarImage src={`https://ui-avatars.com/api/?name=${userName}`} />
          <AvatarFallback>{userName[0]}</AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-bold text-white">{userName}</h2>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4 bg-[url('/whatsapp-bg.png')] bg-repeat" ref={chatContainerRef}>
        {notification && <Notification message={notification.message} type={notification.type} />}
        {groupMessagesByDate().map((group, index) => (
          <div key={index} className="mb-4">
            <div className="text-center my-4">
              <span className="bg-white text-gray-800 text-sm font-semibold px-4 py-2 rounded-full shadow-md">
                {group.date}
              </span>
            </div>
            {group.messages.map((message) => (
              <div
                key={message.messageId}
                className={`flex ${message.senderId === "admin" ? "justify-end" : "justify-start"} mb-2`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg shadow-sm ${
                    message.senderId === "admin"
                      ? "bg-green-100 text-gray-800 rounded-br-none"
                      : "bg-white text-gray-800 rounded-bl-none"
                  }`}
                >
                  {message.messageText && <p>{message.messageText}</p>}
                  {message.audioUrl && (
                    <audio controls src={message.audioUrl} className="max-w-full" />
                  )}
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {message.formattedTime}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Message Input */}
      <div className="bg-white p-4 flex items-center gap-2 border-t">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          className="flex-1 rounded-full"
        />
        {isRecording ? (
          <Button
            onClick={stopRecording}
            className="bg-red-500 hover:bg-red-600 rounded-full"
            size="icon"
          >
            <StopCircle className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            onClick={startRecording}
            className="bg-gray-500 hover:bg-gray-600 rounded-full"
            size="icon"
          >
            <Mic className="h-5 w-5" />
          </Button>
        )}
        <Button
          onClick={handleSendMessage}
          className="bg-indigo-500 hover:bg-indigo-600 rounded-full"
          size="icon"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

// Main Location Tracking Page Component
const LocationTrackingPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const userId = searchParams.get("userId");
  const userName = searchParams.get("userName");

  useEffect(() => {
    setIsLoading(true);
    const usersRef = ref(database, "users");
    const unsubscribe = onValue(
      usersRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const usersData = snapshot.val();
            const usersList: User[] = Object.keys(usersData)
              .map((key) => {
                const userData = usersData[key];
                const username = userData.username || key;
                return {
                  key,
                  username,
                  name: userData.name || username,
                  password: userData.password || "",
                  location: userData.location || { latitude: "13.0827", longitude: "80.2707", gpsActive: false },
                  unreadCount: 0,
                };
              })
              .filter((user) => user.username.length <= 25);

            // Track loaded users to avoid premature state updates
            let loadedUsers = 0;
            const totalUsers = usersList.length;
            const tempUsers = [...usersList]; // Temporary array to store updates

            // Fetch unread message counts for each user
            const unsubscribeList: Array<() => void> = [];
            usersList.forEach((user, index) => {
              const chatRef = ref(database, `chats/user_admin_${user.username}/messages`);
              const unsubscribeChat = onValue(
                chatRef,
                (chatSnapshot) => {
                  let unreadCount = 0;
                  if (chatSnapshot.exists()) {
                    const messagesData = chatSnapshot.val();
                    Object.values(messagesData).forEach((message: any) => {
                      console.log(`Message for ${user.username}:`, message);
                      if (message.senderId !== "admin" && (message.isRead === false || message.isRead === undefined)) {
                        unreadCount++;
                      }
                    });
                  }
                  tempUsers[index] = { ...user, unreadCount };
                  loadedUsers++;

                  // Only update state when all users' unread counts are loaded
                  if (loadedUsers === totalUsers) {
                    setUsers(tempUsers);
                    setIsLoading(false);
                  }
                },
                (error) => {
                  console.error(`Failed to fetch messages for ${user.username}:`, error);
                  tempUsers[index] = { ...user, unreadCount: 0 };
                  loadedUsers++;

                  if (loadedUsers === totalUsers) {
                    setUsers(tempUsers);
                    setIsLoading(false);
                  }
                }
              );
              unsubscribeList.push(unsubscribeChat);
            });

            // Cleanup chat listeners
            return () => {
              unsubscribeList.forEach((unsubscribeChat) => unsubscribeChat());
            };
          } else {
            setUsers([]);
            setNotification({ message: "No users found in the database.", type: "error" });
            setIsLoading(false);
          }
        } catch (err) {
          setNotification({ message: "Failed to load users.", type: "error" });
          setIsLoading(false);
        }
      },
      (err) => {
        setNotification({ message: "Failed to listen for users.", type: "error" });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleTrackUserLocation = (user: User) => {
    setSelectedUser(user);
  };

  const handleChatWithUser = (user: User) => {
    router.push(`/employees?view=chat&userId=${user.username}&userName=${encodeURIComponent(user.name)}`);
  };

  const handleBackToList = () => {
    router.push("/employees");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 sm:py-8 flex flex-col items-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (view === "chat" && userId && userName) {
    return (
      <ChatComponent
        userId={userId}
        userName={decodeURIComponent(userName)}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mt-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 sm:p-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Employee Dashboard
            </h1>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setNotification({ message: "Refreshed", type: "success" });
                }}
                className="bg-white text-indigo-600 hover:bg-gray-100 shadow-lg transition-transform hover:scale-105"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6">
        {notification && <Notification message={notification.message} type={notification.type} />}

        {/* Users List */}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-8 transition-all duration-300 hover:shadow-xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Employees</h2>
          {users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/4">Username</TableHead>
                  <TableHead className="w-1/4">Name</TableHead>
                  <TableHead className="w-1/4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.key} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell className="flex gap-2 items-center">
                      <div className="relative">
                        <Button
                          onClick={() => handleChatWithUser(user)}
                          className="bg-green-500 hover:bg-green-600 shadow-sm transition-transform hover:scale-105"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Chat
                        </Button>
                        {user.unreadCount > 0 && (
                          <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                            {user.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
              <User className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No employees found</h3>
              <p className="text-sm text-muted-foreground text-center">
                No employees with valid usernames available in the database.<br />
                Please ensure users are added under the 'users' path with a 'username' field.
              </p>
            </div>
          )}
        </div>

        {/* Location Modal */}
        {selectedUser && (
          <LocationModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
          />
        )}
      </div>
    </div>
  );
};

export default LocationTrackingPage;
