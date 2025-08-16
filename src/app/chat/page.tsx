"use client";
import { useEffect, useState, useRef } from "react";
import { Send, Users, Smile, Info, Lock, LogOut, Copy } from "lucide-react";
import { io, Socket } from "socket.io-client";

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  isOwn: boolean;
}

let socket: Socket | null = null;

export default function ProfessionalChatPage() {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessKey, setAccessKey] = useState("");
  const [authError, setAuthError] = useState("");
  // Chat states
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [username, setUsername] = useState("");
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const CHAT_ACCESS_KEY = "TEAM2024";

  const verifyAccessKey = () => {
    if (accessKey.trim() === CHAT_ACCESS_KEY) {
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Invalid access key. Please check and try again.");
      setAccessKey("");
    }
  };

  const initializeSocket = () => {
    if (!socket) {
      socket = io();
    }
    socket.on("connect", () => {});
    
    socket.on(
      "chat message",
      (data: { text: string; sender: string; timestamp: string; senderId: string }) => {
        const newMessage: Message = {
          id: Date.now().toString(),
          text: data.text,
          sender: data.sender,
          timestamp: new Date(data.timestamp),
          isOwn: data.senderId === socket?.id,
        };
        setMessages((prev) => [...prev, newMessage]);
      }
    );
    
    socket.on("typing", (data: { username: string; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        if (data.isTyping) {
          return prev.includes(data.username) ? prev : [...prev, data.username];
        } else {
          return prev.filter((user) => user !== data.username);
        }
      });
    });
  };

  useEffect(() => {
    if (isAuthenticated && isUsernameSet) {
      initializeSocket();
    }
    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, [isAuthenticated, isUsernameSet]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeySubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") verifyAccessKey();
  };

  const handleUsernameSubmit = () => {
    if (username.trim()) {
      setIsUsernameSet(true);
      if (socket && socket.emit) {
        socket.emit("user joined", { username: username.trim() });
      }
    }
  };

  const sendMessage = () => {
    if (message.trim() && isUsernameSet && socket) {
      socket.emit("chat message", {
        text: message.trim(),
        sender: username,
        timestamp: new Date().toISOString(),
        senderId: socket.id,
      });
      setMessage("");
      socket.emit("typing", { username, isTyping: false });
      setIsTyping(false);
    }
  };

  const handleTyping = (value: string) => {
    setMessage(value);
    if (!isTyping && value.trim() && socket) {
      setIsTyping(true);
      socket.emit("typing", { username, isTyping: true });
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socket) {
        socket.emit("typing", { username, isTyping: false });
      }
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (!isUsernameSet) {
        handleUsernameSubmit();
      } else {
        sendMessage();
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsUsernameSet(false);
    setAccessKey("");
    setUsername("");
    setMessages([]);
    setMessage("");
    setTypingUsers([]);
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  };

  const handleCopy = async (text: string, id: string) => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    }
  };

  function parseCodeBlock(text: string) {
    const codeBlockRegex = /^\`\`\`(\w*)\n?([\s\S]*?)\`\`\`$/;
    const match = text.trim().match(codeBlockRegex);
    if (match) {
      return {
        isCode: true,
        code: match[2].trim(),
        lang: match[1] || "",
      };
    }
    return { isCode: false, code: "", lang: "" };
  }

  // Authentication Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Secure Team Chat</h1>
            <p className="text-gray-600">Enter the access key to join the team chat</p>
          </div>

          <div className="space-y-4">
            <div>
              <input
                type="password"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                onKeyDown={handleKeySubmit}
                placeholder="Enter access key"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
              {authError && (
                <div className="text-red-500 text-sm mt-2 text-center">{authError}</div>
              )}
            </div>

            <button
              onClick={verifyAccessKey}
              disabled={!accessKey.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              Access Chat
            </button>
          </div>
          <div className="mt-6 text-center">
            <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">Demo key: TEAM2024</div>
          </div>
        </div>
      </div>
    );
  }

  // Username setup screen
  if (!isUsernameSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="flex justify-between items-center mb-6">
            <div></div>
            <button
              onClick={logout}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Join the Conversation</h1>
            <p className="text-gray-600">Enter your name to start chatting with the team</p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Your display name"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              maxLength={25}
            />
            <button
              onClick={handleUsernameSubmit}
              disabled={!username.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              Join Chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Chat UI (simplified)
  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar (simplified) */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Team Chat</h1>
            <button
              onClick={logout}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-red-600"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{username}</p>
              <p className="text-sm text-black flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Online
              </p>
            </div>
          </div>
        </div>

        {/* Empty space in sidebar */}
        <div className="flex-1"></div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">General Chat</h2>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                <Lock className="w-3 h-3 mr-1" />
                Secure
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to the secure chat!</h3>
              <p className="text-gray-500">Start a conversation by sending your first message.</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const showAvatar = index === 0 || messages[index - 1].sender !== msg.sender;
              const showTimestamp =
                index === messages.length - 1 ||
                messages[index + 1].sender !== msg.sender ||
                new Date(messages[index + 1].timestamp).getTime() - msg.timestamp.getTime() > 300000; // 5 minutes
              // Parse code block
              const codeParse = parseCodeBlock(msg.text);
              return (
                <div key={msg.id} className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`flex ${msg.isOwn ? "flex-row-reverse" : "flex-row"} items-end space-x-2 max-w-xs lg:max-w-md`}
                  >
                    {!msg.isOwn && showAvatar && (
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-semibold">
                          {msg.sender.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {!msg.isOwn && !showAvatar && <div className="w-8"></div>}

                    <div
                      className={`px-4 py-2 rounded-2xl relative ${
                        msg.isOwn ? "bg-blue-600 text-white" : "bg-gray-100 text-black"
                      }`}
                    >
                      {!msg.isOwn && showAvatar && (
                        <p className="text-xs font-medium mb-1 text-gray-600">{msg.sender}</p>
                      )}
                      {codeParse.isCode ? (
                        <div className="relative my-2 bg-gray-900 rounded-xl shadow-lg border border-gray-800 max-w-full w-full">
                          {/* Language label (if present) */}
                          {codeParse.lang && (
                            <div className="absolute top-2 left-2 text-xs px-2 py-1 bg-indigo-600 text-white rounded font-mono z-10">
                              {codeParse.lang}
                            </div>
                          )}
                          <pre
                            className="overflow-x-auto text-white text-xs font-mono whitespace-pre p-4 max-w-full w-full"
                            style={{ wordBreak: "break-all", maxWidth: "90vw" }}
                          >
                            <code>{codeParse.code}</code>
                          </pre>
                          <button
                            className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded flex items-center text-xs transition"
                            onClick={() => handleCopy(codeParse.code, msg.id)}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            {copiedId === msg.id ? "Copied" : "Copy"}
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm break-words">{msg.text}</p>
                      )}
                      {showTimestamp && (
                        <p className={`text-xs mt-1 ${msg.isOwn ? "text-blue-200" : "text-gray-500"}`}>
                          {formatTime(msg.timestamp)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-xs">...</span>
              </div>
              <div className="bg-gray-100 px-4 py-2 rounded-2xl">
                <p className="text-sm text-gray-600">
                  {typingUsers.length === 1
                    ? `${typingUsers[0]} is typing...`
                    : `${typingUsers.slice(0, -1).join(", ")} and ${
                        typingUsers[typingUsers.length - 1]
                      } are typing...`}
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-6">
          <div className="flex items-end space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
              <Smile className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex-1 relative">
              <input
                type="text"
                value={message}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-12 text-black"
              />
            </div>

            <button
              onClick={sendMessage}
              disabled={!message.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}