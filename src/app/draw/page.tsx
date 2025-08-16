"use client";
import { useRef, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

type DrawPayload = { x: number; y: number; prevX: number; prevY: number };

export default function ScribbleGuessPage() {
  const [messages, setMessages] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [userCount, setUserCount] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Setup socket connection
  useEffect(() => {
    // Make sure we're using the correct URL
    const socket = io("http://localhost:3000");
    socketRef.current = socket;

    // Connect and set up event handlers
    socket.on("connect", () => {
      console.log("Connected to server with ID:", socket.id);
      // Request current user count on connection
      socket.emit("request user count");
    });

    // Handle incoming chat messages
    socket.on("chat message", (msg: string) => {
      setMessages((prevMsgs) => [...prevMsgs, msg]);
    });

    // Handle drawing from other users
    socket.on("draw", (data: DrawPayload) => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx || !data) return;
      ctx.strokeStyle = "#2c3e50";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(data.prevX, data.prevY);
      ctx.lineTo(data.x, data.y);
      ctx.stroke();
    });

    // Handle canvas clear events
    socket.on("clear", () => {
      console.log("Received clear canvas event");
      clearCanvasInternal();
    });

    // Track user count
    socket.on("user count update", (count: number) => {
      setUserCount(count);
      console.log("User count updated:", count);
    });

    // Clean up on component unmount
    return () => {
      console.log("Disconnecting socket");
      socket.disconnect();
    };
  }, []);

  // Auto-scroll messages when new ones arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Internal function to clear canvas
  const clearCanvasInternal = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLastPos({ x, y });
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvasRef.current.getContext("2d");
    if (ctx && socketRef.current) {
      ctx.strokeStyle = "#2c3e50";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);

      // Emit drawing data to server
      socketRef.current.emit("draw", {
        x,
        y,
        prevX: lastPos.x,
        prevY: lastPos.y,
      });

      setLastPos({ x, y });
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (socketRef.current) {
      console.log("Sending clear canvas event");
      socketRef.current.emit("clear");
      // We don't need to clear locally as the socket event will come back and trigger the clear
    }
  };

  const sendGuess = () => {
    if (message.trim() && socketRef.current) {
      socketRef.current.emit("chat message", `🎃 ${message}`);
      setMessage("");
    }
  };

  const handleInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendGuess();
  };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        minHeight: "100vh",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h1 style={{ color: "#fff", marginBottom: 30, textAlign: "center" }}>
        🎨 Scribble & Guess Game
      </h1>
      
      {/* User Count Display */}
      <div style={{ color: "#fff", marginBottom: 20, background: "rgba(0,0,0,0.2)", padding: "5px 15px", borderRadius: 20 }}>
        👥 {userCount} {userCount === 1 ? 'player' : 'players'} online
      </div>

      <div style={{ display: "flex", gap: 20, maxWidth: 1200, width: "100%" }}>
        {/* Drawing Area */}
        <div
          style={{
            background: "#fff",
            borderRadius: 15,
            padding: 20,
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            flex: 1,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
            <h3 style={{ margin: 0, color: "#333" }}>Drawing Canvas</h3>
            <button
              onClick={clearCanvas}
              style={{
                background: "#e74c3c",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Clear Canvas
            </button>
          </div>

          <canvas
            ref={canvasRef}
            width={500}
            height={400}
            style={{
              border: "3px solid #ddd",
              borderRadius: 10,
              background: "#fff",
              cursor: "crosshair",
              display: "block",
              width: "100%",
              maxWidth: 500,
            }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>
        
        {/* Guessing Area */}
        <div
          style={{
            background: "#fff",
            borderRadius: 15,
            padding: 20,
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            width: 350,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>Guesses & Chat</h3>
          <div
            style={{
              border: "2px solid #f1f2f6",
              background: "#f8f9fa",
              borderRadius: 10,
              padding: 15,
              height: 300,
              overflowY: "auto",
              marginBottom: 15,
            }}
          >
            {messages.length === 0 && (
              <div style={{ color: "#999", textAlign: "center", marginTop: 50 }}>
                Start guessing what's being drawn! 🎯
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  background: "#fff",
                  padding: "8px 12px",
                  borderRadius: 8,
                  marginBottom: 8,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                {m}
              </div>
            ))}
            {/* This element helps with auto-scrolling to the latest message */}
            <div ref={messagesEndRef} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleInputKey}
              style={{
                flex: 1,
                padding: 12,
                border: "2px solid #e1e8ed",
                borderRadius: 8,
                fontSize: 14,
                outline: "none",
              }}
              placeholder="What are they drawing?"
            />
            <button
              onClick={sendGuess}
              style={{
                background: "#27ae60",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "12px 20px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Guess!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}