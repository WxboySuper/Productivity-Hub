import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-center">Welcome to Productivity Hub</h1>
      <div className="flex flex-col items-center gap-4">
        <Link to="/login" className="w-48 bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition text-center">Login</Link>
        <Link to="/register" className="w-48 bg-green-600 text-white font-semibold py-2 rounded hover:bg-green-700 transition text-center">Register</Link>
      </div>
    </div>
  );
}

export default HomePage;