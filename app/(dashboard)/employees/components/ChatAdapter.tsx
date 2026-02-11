import * as React from "react";
import { ChatMessageData } from "../utils/types";

export const ChatAdapter = ({ messages, currentUserId, currentUserRole }: { messages: ChatMessageData[]; currentUserId: string; currentUserRole: string }) => {
  return (
    <div className="max-h-40 overflow-y-auto mb-4 rounded-lg bg-gray-50 p-4">
      {messages.map((msg, index) => {
        const isSentByCurrentUser = msg.senderId === currentUserId && msg.senderRole === currentUserRole;
        return (
          <div
            key={index}
            className={`p-3 mb-2 rounded-lg shadow-sm ${isSentByCurrentUser ? "bg-indigo-100 ml-auto" : "bg-gray-100 mr-auto"} max-w-xs`}
          >
            <p className="text-sm">{msg.message}</p>
            <p className="text-xs text-gray-500 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
          </div>
        );
      })}
    </div>
  );
};