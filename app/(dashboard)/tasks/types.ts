export interface User {
  uid: string;
  name: string;
  username: string;
  password: string;
  loggedIn: boolean;
  gpsActive: boolean | null;
  role: string;
  joinDate: string;
  photo?: string;
}

export interface Work {
  workId: number;
  name: string;
  place: string;
  accepted: boolean;
  status: string;
  assignedAt: number;
  assignedDay: string;
  completedAt?: number;
  latitude?: number;
  longitude?: number;
}

export interface Message {
  messageId: string;
  senderId: string;
  senderName: string;
  messageText: string | null;
  imageUrl: string | null;
  timestamp: number;
  formattedTime: string;
}

export interface ChatMessageData {
  senderId: string;
  senderRole: string;
  message: string;
  timestamp: number;
}