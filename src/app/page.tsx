"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FaComment, FaPencilAlt, FaGraduationCap, FaUserCircle } from 'react-icons/fa';
// Import Image is causing issues, so we'll use a different approach

export default function HomePage() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const router = useRouter();
  
  // User information
 
  const navigateTo = (path: string): void => {
    router.push(path);
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col overflow-hidden">
      {/* Navigation Bar */}
      <nav className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <FaGraduationCap className="text-white text-3xl" />
          <span className="ml-2 text-white text-2xl font-bold">StudySpace</span>
        </div>
        
        {/* User Avatar and Info */}
        
      </nav>

      {/* Content - Centered on screen */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Learn, Connect, Create
          </h1>
          <p className="text-xl text-white text-opacity-90 max-w-2xl mx-auto">
            The ultimate platform for students to collaborate, chat with peers, and unleash your creativity with our scribble game.
          </p>
        </motion.div>

        {/* Feature Cards - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {/* Chat Card */}
          <motion.div 
            className="relative rounded-2xl overflow-hidden cursor-pointer h-64"
            whileHover={{ scale: 1.03 }}
            onHoverStart={() => setHoveredCard('chat')}
            onHoverEnd={() => setHoveredCard(null)}
            onClick={() => navigateTo('/chat')}
          >
            <div className={`absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 transition-opacity duration-300 ${hoveredCard === 'chat' ? 'opacity-90' : 'opacity-80'}`}></div>
            <div className="relative z-10 p-6 flex flex-col h-full justify-center items-center text-center">
              <div className="bg-white bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <FaComment className="text-white text-2xl" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Student Chat</h2>
              <p className="text-white text-opacity-90">
                Connect with fellow students, discuss assignments, and share resources.
              </p>
            </div>
          </motion.div>

          {/* Scribble Game Card */}
          <motion.div 
            className="relative rounded-2xl overflow-hidden cursor-pointer h-64"
            whileHover={{ scale: 1.03 }}
            onHoverStart={() => setHoveredCard('scribble')}
            onHoverEnd={() => setHoveredCard(null)}
            onClick={() => navigateTo('/draw')}
          >
            <div className={`absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-500 transition-opacity duration-300 ${hoveredCard === 'scribble' ? 'opacity-90' : 'opacity-80'}`}></div>
            <div className="relative z-10 p-6 flex flex-col h-full justify-center items-center text-center">
              <div className="bg-white bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <FaPencilAlt className="text-white text-2xl" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Scribble Game</h2>
              <p className="text-white text-opacity-90">
                Challenge your creativity with our multiplayer drawing and guessing game.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Simple Footer */}
      <footer className="p-4 text-center text-white text-opacity-70 text-sm">
        © 2025 StudySpace. All rights reserved.
      </footer>
    </div>
  );
}