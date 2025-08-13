import React, { useState } from "react";
import { BackgroundType } from "./Background";
import "../styles/Background.css";

interface BackgroundSwitcherProps {
  currentBackground: BackgroundType;
  onBackgroundChange: (newType: BackgroundType) => void;
  className?: string;
}

const backgroundOptions = [
  {
    id: "creative-dots" as BackgroundType,
    name: "Creative Dots",
    description: "Floating dots with gradient shifts",
    colors: ["#3b82f6", "#8b45ff", "#ec4899"],
    animated: true,
  },
  {
    id: "neural-network" as BackgroundType,
    name: "Neural Network",
    description: "Tech-inspired grid patterns",
    colors: ["#00ffff", "#ff00ff", "#ffff00"],
    animated: true,
  },
  {
    id: "cosmic-waves" as BackgroundType,
    name: "Cosmic Waves",
    description: "Space-like flowing gradients",
    colors: ["#2d1b69", "#11998e", "#38ef7d"],
    animated: true,
  },
  {
    id: "productivity-minimal" as BackgroundType,
    name: "Clean Focus",
    description: "Minimal professional design",
    colors: ["#f8fafc", "#e2e8f0", "#cbd5e1"],
    animated: false,
  },
  {
    id: "sunset-gradient" as BackgroundType,
    name: "Sunset Vibes",
    description: "Warm sunset gradients",
    colors: ["#ff9a9e", "#fecfef", "#ffffff"],
    animated: true,
  },
  {
    id: "forest-depth" as BackgroundType,
    name: "Forest Depth",
    description: "Natural green gradients",
    colors: ["#134e5e", "#71b280", "#ffffff"],
    animated: true,
  },
  {
    id: "aurora-borealis" as BackgroundType,
    name: "Aurora Magic",
    description: "Northern lights dancing colors",
    colors: ["#00ff88", "#00d4ff", "#7b68ee"],
    animated: true,
  },
  {
    id: "geometric-dreams" as BackgroundType,
    name: "Geo Dreams",
    description: "Abstract geometric patterns",
    colors: ["#ff6b6b", "#4ecdc4", "#45b7d1"],
    animated: false,
  },
  {
    id: "ocean-depths" as BackgroundType,
    name: "Ocean Deep",
    description: "Deep sea flowing currents",
    colors: ["#006994", "#0085c3", "#b3e5fc"],
    animated: true,
  },
  {
    id: "cyberpunk-neon" as BackgroundType,
    name: "Cyber Neon",
    description: "Futuristic neon grid world",
    colors: ["#ff0080", "#00ffff", "#1a1a2e"],
    animated: false,
  },
];

const BackgroundSwitcher: React.FC<BackgroundSwitcherProps> = ({
  currentBackground,
  onBackgroundChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleBackgroundChange = (newType: BackgroundType) => {
    onBackgroundChange(newType);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        className="bg-white/90 border border-blue-200 rounded-lg p-2 shadow-lg hover:bg-blue-50 transition-all duration-200 hover:scale-105 backdrop-blur-sm"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change background style"
        title="Change background style"
      >
        <span className="text-xl">🎨</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-blue-200 rounded-xl shadow-2xl p-4 z-50 backdrop-blur-sm">
          <h3 className="font-bold text-blue-700 mb-3 text-lg">
            🎨 Background Style
          </h3>
          <div className="text-xs text-gray-600 mb-3">
            Current:{" "}
            {backgroundOptions.find((bg) => bg.id === currentBackground)?.name}
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {backgroundOptions.map((option) => (
              <button
                key={option.id}
                className={`p-3 border rounded-lg transition-all duration-200 text-left hover:shadow-md ${
                  currentBackground === option.id
                    ? "border-blue-400 bg-blue-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-blue-200"
                }`}
                onClick={() => handleBackgroundChange(option.id)}
                title={option.description}
              >
                <div className="flex items-center mb-2">
                  {option.colors.map((color) => (
                    <div
                      key={`${option.id}-${color}`}
                      className="w-3 h-3 rounded-full mr-1"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="text-sm font-medium text-gray-800">
                  {option.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {option.description}
                </div>
                {option.animated && (
                  <div className="text-xs text-blue-600 mt-1">✨ Animated</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BackgroundSwitcher;
