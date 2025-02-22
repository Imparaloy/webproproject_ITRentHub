"use client";
import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = () => {
    console.log("Logging in with:", { username, password, rememberMe });
    // Add authentication logic here
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-gray-300 p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-center text-2xl font-bold mb-2">ITRentHub</h2>
        <p className="text-center text-lg mb-4">Login</p>

        <label className="block text-sm font-medium">Username</label>
        <input
          type="text"
          className="w-full p-2 rounded-lg border border-gray-400 mt-1 mb-3"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <label className="block text-sm font-medium">Password</label>
        <input
          type="password"
          className="w-full p-2 rounded-lg border border-gray-400 mt-1 mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            className="mr-2"
            checked={rememberMe}
            onChange={() => setRememberMe(!rememberMe)}
          />
          <span>Remember me</span>
        </div>

        <button
          className="w-full bg-white text-black p-2 rounded-lg border border-gray-500 hover:bg-gray-200"
          onClick={handleLogin}
        >
          Login
        </button>

        <div className="text-center mt-4 text-sm">
          <span>Don&apos;t have an account?</span>{" "}
          <a href="/signup" className="text-blue-500">
            Sign up now
          </a>
          <br />
          <a href="/forgot-password" className="text-blue-500">
            Forgot password
          </a>
        </div>

        <button className="w-full bg-gray-400 text-black p-2 mt-4 rounded-lg hover:bg-gray-500">
          Dormitory Owner
        </button>
      </div>
    </div>
  );
}
