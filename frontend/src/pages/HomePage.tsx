import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-200 via-blue-400 to-green-200 px-4">
      {/* SVG background */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <circle cx="220" cy="180" r="180" fill="#6366f1" fillOpacity="0.18" />
        <circle cx="1300" cy="120" r="140" fill="#22d3ee" fillOpacity="0.15" />
        <ellipse cx="1200" cy="800" rx="260" ry="120" fill="#fde68a" fillOpacity="0.18" />
        <ellipse cx="300" cy="850" rx="200" ry="80" fill="#a21caf" fillOpacity="0.10" />
        <circle cx="900" cy="500" r="120" fill="#2563eb" fillOpacity="0.13" />
        <ellipse cx="720" cy="300" rx="320" ry="80" fill="#0ea5e9" fillOpacity="0.10" />
        <ellipse cx="1440" cy="900" rx="180" ry="80" fill="#f43f5e" fillOpacity="0.10" />
      </svg>
      <div className="max-w-lg w-full bg-white/90 rounded-xl shadow-2xl p-10 flex flex-col items-center mt-10 z-10 border border-blue-200 backdrop-blur-sm">
        <h1 className="text-4xl font-extrabold mb-4 text-blue-700 text-center drop-shadow">Productivity Hub</h1>
        <p className="text-lg text-gray-700 mb-8 text-center">
          Your all-in-one productivity assistant. Organize tasks, manage projects, and boost your workflow—all in one place.
        </p>
        <div className="flex flex-col gap-4 w-full">
          <Link
            to="/login"
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition text-center text-lg shadow-md"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition text-center text-lg shadow-md"
          >
            Register
          </Link>
        </div>
      </div>
      {/* Descriptive section about the app, reduced nesting for JS-0415 */}
      <section className="max-w-3xl w-full bg-white/80 rounded-xl shadow-xl mt-12 p-8 border border-blue-100 z-10 backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-blue-800 mb-4 text-center">Why Productivity Hub?</h2>
        <p className="text-gray-700 text-center mb-6 max-w-2xl mx-auto">
          Productivity Hub is designed to help you take control of your work and life. Whether you’re a solo professional, a student, or part of a team, our mission is to empower you to achieve more with less stress.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {[{
            icon: "📁",
            color: "text-blue-600",
            title: "Project Management",
            desc: "Create, organize, and track projects with ease. Stay on top of deadlines and deliverables."
          }, {
            icon: "✅",
            color: "text-green-600",
            title: "Task Views",
            desc: "Visualize your tasks in lists, boards, or calendars. Prioritize and focus on what matters most."
          }, {
            icon: "📊",
            color: "text-yellow-500",
            title: "Analytics & Insights",
            desc: "Gain insights into your productivity patterns and progress with built-in analytics."
          }, {
            icon: "🗓️",
            color: "text-purple-600",
            title: "Scheduling & Dashboard",
            desc: "Plan your days, set reminders, and get a unified dashboard for all your work."
          }, {
            icon: "⚙️",
            color: "text-pink-500",
            title: "Customization",
            desc: "Personalize your workspace to fit your workflow and preferences."
          }, {
            icon: "🤝",
            color: "text-indigo-500",
            title: "Collaboration",
            desc: "Work solo or invite teammates. Share projects, assign tasks, and collaborate in real time."
          }].map(({ icon, color, title, desc }) => (
            <div key={title} className="flex flex-col items-center">
              <span className={`${color} text-3xl mb-2`}>{icon}</span>
              <h3 className="font-semibold text-lg mb-1">{title}</h3>
              <p className="text-gray-600 text-center text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>
      <footer className="mt-10 text-gray-400 text-sm text-center z-10">
        &copy; {new Date().getFullYear()} Productivity Hub. All rights reserved.
      </footer>
    </div>
  );
}

export default HomePage;