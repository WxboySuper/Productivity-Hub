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
