import { Link } from "react-router-dom";
import AppHeader from "../components/common/AppHeader";

function HomePage() {
  return (
    <main
      className="min-h-screen flex flex-col flex-1 items-center justify-center relative z-10 px-4"
      data-testid="home-page"
    >
      <AppHeader />
      <div className="w-full max-w-md bg-white/95 rounded-xl shadow-2xl p-10 flex flex-col items-center border border-blue-200 backdrop-blur-sm z-10 mt-10 phub-glass">
        {/* Reduced nesting by extracting content into smaller components or sections (JS-0415) */}
        <h1 className="text-4xl font-extrabold mb-4 text-center drop-shadow phub-text-gradient">
          Productivity Hub
        </h1>
        <p className="text-lg text-gray-700 mb-8 text-center">
          Your all-in-one productivity assistant. Organize tasks, manage
          projects, and boost your workflow—all in one place.
        </p>
        <div className="flex flex-col gap-4 w-full">
          <Link
            to="/register"
            className="phub-action-btn w-full text-center justify-center"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold py-3 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 text-center text-lg shadow-md transform hover:scale-105 flex justify-center items-center"
          >
            Sign In
          </Link>
        </div>
      </div>
      {/* Descriptive section about the app, reduced nesting for JS-0415 */}
      <section className="max-w-3xl w-full bg-white/80 rounded-xl shadow-xl mt-12 p-8 border border-blue-100 z-10 backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-blue-800 mb-4 text-center">
          Why Productivity Hub?
        </h2>
        <p className="text-gray-700 text-center mb-6 max-w-2xl mx-auto">
          Productivity Hub is designed to help you take control of your work and
          life. Whether you’re a solo professional, a student, or part of a
          team, our mission is to empower you to achieve more with less stress.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {[
            {
              icon: "📁",
              color: "text-blue-600",
              title: "Project Management",
              desc: "Create, organize, and track projects with ease. Stay on top of deadlines and deliverables.",
            },
            {
              icon: "✅",
              color: "text-green-600",
              title: "Task Views",
              desc: "Visualize your tasks in lists, boards, or calendars. Prioritize and focus on what matters most.",
            },
            {
              icon: "📊",
              color: "text-yellow-500",
              title: "Analytics & Insights",
              desc: "Gain insights into your productivity patterns and progress with built-in analytics.",
            },
            {
              icon: "🗓️",
              color: "text-purple-600",
              title: "Scheduling & Dashboard",
              desc: "Plan your days, set reminders, and get a unified dashboard for all your work.",
            },
            {
              icon: "⚙️",
              color: "text-pink-500",
              title: "Customization",
              desc: "Personalize your workspace to fit your workflow and preferences.",
            },
            {
              icon: "🤝",
              color: "text-indigo-500",
              title: "Collaboration",
              desc: "Work solo or invite teammates. Share projects, assign tasks, and collaborate in real time.",
            },
          ].map(({ icon, color, title, desc }) => (
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
    </main>
  );
}

export default HomePage;
