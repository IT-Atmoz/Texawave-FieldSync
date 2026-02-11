import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ref, set, onValue, remove, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { v4 as uuidv4 } from "uuid";
import { Paperclip, Send, ArrowLeft, Mic, StopCircle, Trash2, Video, Phone } from "lucide-react";
import { ButtonComponent, InputComponent, ScrollAreaComponent } from "../utils/ui-components";
import { Message } from "../utils/types";

// Define Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = "dpgf1rkjl";
const CLOUDINARY_UPLOAD_PRESET = "unsigned_preset";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
const CLOUDINARY_AUDIO_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

interface ChatAdminProps {
  userId: string;
  userName: string;
}

export const ChatAdmin = ({ userId, userName }: ChatAdminProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const senderId = "admin";
  const senderName = "Admin";
  const chatId = `user_admin_${userId.replace(/^-/, "")}`;

  useEffect(() => {
    const messagesRef = ref(database, `chats/${chatId}/messages`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const messageList: Message[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const message = childSnapshot.val() as Message;
          messageList.push({
            messageId: childSnapshot.key!,
            ...message,
          });
        });
      }
      messageList.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(messageList);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

      // Mark all user messages as read
      const updates: { [key: string]: boolean } = {};
      messageList.forEach((message) => {
        if (message.senderId !== "admin" && !message.isRead) {
          updates[`chats/${chatId}/messages/${message.messageId}/isRead`] = true;
        }
      });
      if (Object.keys(updates).length > 0) {
        update(ref(database), updates).catch((error) => {
          console.error("Failed to mark messages as read:", error);
        });
      }
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      alert("Please enter a message");
      return;
    }

    const messageId = uuidv4();
    const timestamp = Date.now();
    const formattedTime = new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const message: Message = {
      messageId,
      senderId,
      senderName,
      messageText,
      imageUrl: null,
      audioUrl: null,
      timestamp,
      formattedTime,
      isRead: false, // New messages from admin are initially unread
    };

    try {
      await set(ref(database, `chats/${chatId}/messages/${messageId}`), message);
      setMessageText("");
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      alert("Failed to send message: " + (error as Error).message);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      uploadImage(file);
    }
  };

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(CLOUDINARY_API_URL, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Image upload failed");
      const imageUrl = data.secure_url;
      await sendImageMessage(imageUrl);
    } catch (error) {
      alert("Failed to upload image: " + (error as Error).message);
    }
  };

  const sendImageMessage = async (imageUrl: string) => {
    const messageId = uuidv4();
    const timestamp = Date.now();
    const formattedTime = new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const message: Message = {
      messageId,
      senderId,
      senderName,
      messageText: null,
      imageUrl,
      audioUrl: null,
      timestamp,
      formattedTime,
      isRead: false, // New image messages from admin are initially unread
    };

    try {
      await set(ref(database, `chats/${chatId}/messages/${messageId}`), message);
      setImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      alert("Failed to send image message: " + (error as Error).message);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        await uploadAudio(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      alert("Failed to start recording: " + (error as Error).message);
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
    formData.append("file", blob, "audio.webm");
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(CLOUDINARY_AUDIO_API_URL, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Audio upload failed");
      const audioUrl = data.secure_url;

      const messageId = uuidv4();
      const timestamp = Date.now();
      const formattedTime = new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const message: Message = {
        messageId,
        senderId,
        senderName,
        messageText: null,
        imageUrl: null,
        audioUrl,
        timestamp,
        formattedTime,
        isRead: false, // New audio messages from admin are initially unread
      };

      await set(ref(database, `chats/${chatId}/messages/${messageId}`), message);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      alert("Failed to upload audio: " + (error as Error).message);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const formatDate = (timestamp: number) => {
    const today = new Date();
    const messageDate = new Date(timestamp);
    const isToday = messageDate.toDateString() === today.toDateString();
    if (isToday) return "Today";
    return messageDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const groupMessagesByDate = () => {
    const grouped: { date: string; messages: Message[] }[] = [];
    let currentDate = "";

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

  const handleMessageClick = (messageId: string) => {
    setSelectedMessageId(selectedMessageId === messageId ? null : messageId);
  };

  const handleDeleteForEveryone = useCallback(async (messageId: string) => {
    try {
      await remove(ref(database, `chats/${chatId}/messages/${messageId}`));
      setSelectedMessageId(null);
    } catch (error) {
      alert("Failed to delete message: " + (error as Error).message);
    }
  }, [chatId]);

  const handleCallClick = () => {
    alert("This feature is available in the pro version");
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100 mt-[45px] md:mt-[45px] sm:mt-[45px]">
      <div className="bg-white shadow-md p-4 flex items-center sticky top-0 z-20 transition-all duration-300">
        <ButtonComponent
          onClick={() => router.push("/chats")}
          variant="ghost"
          size="icon"
          className="hover:bg-indigo-100 rounded-full transition-colors duration-200"
        >
          <ArrowLeft size={24} className="text-indigo-600" />
        </ButtonComponent>
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 ml-3 truncate flex-1">
          Chat with {userName || "User"}
        </h1>
        <ButtonComponent
          onClick={handleCallClick}
          variant="ghost"
          size="icon"
          className="hover:bg-indigo-100 rounded-full transition-colors duration-200"
        >
          <Video size={24} className="text-indigo-600" />
        </ButtonComponent>
        <ButtonComponent
          onClick={handleCallClick}
          variant="ghost"
          size="icon"
          className="hover:bg-indigo-100 rounded-full transition-colors duration-200"
        >
          <Phone size={24} className="text-indigo-600" />
        </ButtonComponent>
      </div>

      <ScrollAreaComponent className="flex-1 p-4 sm:p-6 md:p-8 bg-[url('/whatsapp-bg.png')] bg-repeat">
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
                className={`mb-4 flex animate-fade-in relative ${
                  message.senderId === senderId ? "justify-end" : "justify-start"
                }`}
                onClick={() => handleMessageClick(message.messageId)}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] md:max-w-[60%] p-3 rounded-2xl shadow-md break-words transition-all duration-200 ${
                    message.senderId === senderId
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-800 border border-gray-200"
                  } ${selectedMessageId === message.messageId ? "ring-2 ring-indigo-400" : ""}`}
                >
                  {message.senderId !== senderId && (
                    <p className="text-xs sm:text-sm font-semibold text-indigo-700 mb-1">
                      {message.senderName}
                    </p>
                  )}
                  {message.messageText && (
                    <p className="text-sm sm:text-base">{message.messageText}</p>
                  )}
                  {message.imageUrl && (
                    <img
                      src={message.imageUrl}
                      alt="Chat image"
                      className="max-w-full h-auto rounded-lg mt-2 shadow-sm"
                    />
                  )}
                  {message.audioUrl && (
                    <audio controls src={message.audioUrl} className="max-w-full mt-2" />
                  )}
                  <p className="text-xs mt-2 opacity-70">{message.formattedTime}</p>
                </div>
                {selectedMessageId === message.messageId && (
                  <div className="absolute bottom-0 right-0 sm:right-2 md:right-4 bg-white shadow-lg rounded-lg p-2 flex flex-col z-30">
                    {message.senderId === senderId && (
                      <ButtonComponent
                        onClick={() => handleDeleteForEveryone(message.messageId)}
                        variant="ghost"
                        className="text-sm text-red-600 hover:bg-red-100 flex items-center"
                      >
                        <Trash2 size={16} className="mr-2" />
                        Delete
                      </ButtonComponent>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </ScrollAreaComponent>

      <div className="bg-white p-3 sm:p-4 md:p-5 border-t shadow-lg flex items-center sticky bottom-0 z-10">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleImageSelect}
        />
        <ButtonComponent
          onClick={handleAttachClick}
          variant="ghost"
          size="icon"
          className="hover:bg-indigo-100 rounded-full transition-colors duration-200"
        >
          <Paperclip size={20} className="text-indigo-600" />
        </ButtonComponent>
        <InputComponent
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 mx-2 p-2 sm:p-3 text-sm sm:text-base rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
        />
        {isRecording ? (
          <ButtonComponent
            onClick={stopRecording}
            variant="destructive"
            size="icon"
            className="bg-red-500 hover:bg-red-600 rounded-full"
          >
            <StopCircle size={20} className="text-white" />
          </ButtonComponent>
        ) : (
          <ButtonComponent
            onClick={startRecording}
            variant="ghost"
            size="icon"
            className="hover:bg-gray-100 rounded-full"
          >
            <Mic size={20} className="text-gray-600" />
          </ButtonComponent>
        )}
        <ButtonComponent
          onClick={handleSendMessage}
          size="icon"
          className="bg-indigo-600 hover:bg-indigo-700 rounded-full transition-colors duration-200"
        >
          <Send size={20} className="text-white" />
        </ButtonComponent>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
