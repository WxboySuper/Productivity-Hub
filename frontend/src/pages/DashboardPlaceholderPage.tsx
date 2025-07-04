import React from "react";
import { useAuth } from "../auth";

function DashboardPlaceholderPage() {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-200 via-blue-400 to-green-200 px-4">
      <div className="max-w-xl w-full bg-white/90 rounded-xl shadow-2xl p-10 flex flex-col items-center border border-blue-200 backdrop-blur-sm z-10 mt-10">
        <h1 className="text-3xl font-extrabold mb-4 text-blue-700 text-center drop-shadow">Welcome to Productivity Hub!</h1>
        <p className="text-lg text-gray-700 mb-6 text-center">
          This is your dashboard. Here you’ll soon find an overview of your tasks, projects, analytics, and more.
        </p>
        <div className="text-center text-gray-500 mb-6">
          <span className="inline-block text-5xl mb-2">🚧</span>
          <div className="font-semibold">Dashboard features are coming soon.</div>
        </div>
        <ul className="text-gray-600 text-left list-disc pl-6 mb-4">
          <li>Project & task overview</li>
          <li>Productivity analytics</li>
          <li>Customizable widgets</li>
          <li>Scheduling & reminders</li>
          <li>And much more!</li>
        </ul>
        <div className="text-sm text-gray-400 mt-4 mb-6">Stay tuned for updates as we build out your productivity experience.</div>
        <button
          className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded shadow transition"
          onClick={logout}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default DashboardPlaceholderPage;
