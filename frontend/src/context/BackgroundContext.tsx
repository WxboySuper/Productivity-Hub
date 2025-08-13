import React, { createContext, useContext, useState } from "react";
import { BackgroundType } from "../components/common/Background";

interface BackgroundContextType {
  backgroundType: BackgroundType;
  setBackgroundType: (type: BackgroundType) => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(
  undefined,
);

export function BackgroundProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [backgroundType, setBackgroundType] =
    useState<BackgroundType>("creative-dots");

  return (
    <div data-testid="background-provider">
      <BackgroundContext.Provider value={{ backgroundType, setBackgroundType }}>
        {children}
      </BackgroundContext.Provider>
    </div>
  );
}

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error("useBackground must be used within a BackgroundProvider");
  }
  return context;
}
