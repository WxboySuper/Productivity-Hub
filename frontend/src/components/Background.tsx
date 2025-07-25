import React, { useState, useEffect } from "react";
import "../styles/Background.css";

export type BackgroundType =
  | "creative-dots"
  | "neural-network"
  | "cosmic-waves"
  | "productivity-minimal"
  | "sunset-gradient"
  | "forest-depth"
  | "aurora-borealis"
  | "geometric-dreams"
  | "ocean-depths"
  | "cyberpunk-neon";

interface BackgroundProps {
  backgroundType?: BackgroundType;
}

const backgroundOptions = [
  // skipcq: JS-0356
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

const Background: React.FC<BackgroundProps> = ({
  backgroundType = "creative-dots",
}) => {
  const [currentBackground, setCurrentBackground] =
    useState<BackgroundType>(backgroundType);

  useEffect(() => {
    setCurrentBackground(backgroundType);
  }, [backgroundType]);

  return <div className={`dynamic-background bg-${currentBackground}`} />;
};

export default Background;
