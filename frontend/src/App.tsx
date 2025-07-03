import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Simple placeholder components
function Home() {
  return <div className="text-2xl font-bold text-center mt-10">Home Page</div>;
}
function Login() {
  return <div className="text-2xl font-bold text-center mt-10">Login Page</div>;
}
function Register() {
  return <div className="text-2xl font-bold text-center mt-10">Register Page</div>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;
