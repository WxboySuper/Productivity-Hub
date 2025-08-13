import React from "react";
import { Link } from "react-router-dom";

interface AppHeaderProps {
  betaLabel?: string;
  rightContent?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({ betaLabel, rightContent }) => (
  <header
    data-testid="app-header"
    className="w-full bg-white/80 shadow-sm py-4 px-8 flex items-center justify-between border-b border-blue-100 backdrop-blur-sm"
  >
    <Link
      to="/"
      className="text-2xl font-extrabold text-blue-800 tracking-tight drop-shadow hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
    >
      Productivity Hub
    </Link>
    <div className="flex items-center gap-3">
      {betaLabel && (
        <span className="text-blue-600 font-semibold text-sm bg-blue-100 px-3 py-1 rounded-full">
          {betaLabel}
        </span>
      )}
      {rightContent}
    </div>
  </header>
);

export default AppHeader;
