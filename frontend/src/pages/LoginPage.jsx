import React, { useContext, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const API_BASE_URL = "http://127.0.0.1:5000"; // Flask backend URL

const LoginPage = () => {
  const [mode, setMode] = useState("login"); // "signup" or "login"
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Choose endpoint based on mode
      const endpoint =
        mode === "signup"
          ? `${API_BASE_URL}/api/signup`
          : `${API_BASE_URL}/api/login`;

      // Prepare data to send
      const payload =
        mode === "signup"
          ? { username, email, password }
          : { username, password };

      const res = await axios.post(endpoint, payload, {
        headers: { "Content-Type": "application/json" },
      });

      if (mode === "signup") {
        alert("Signup successful! Please log in now.");
        setMode("login");
        setLoading(false);
        return;
      }

      // ✅ Login Success
      if (res.data && res.data.token) {
        const userData = {
          username: res.data.username,
          token: res.data.token,
        };

        // Save to localStorage + Context
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", res.data.token);
        setUser(userData);

        alert(`Welcome ${userData.username}!`);
        navigate("/"); // redirect after login
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.response?.data?.error || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-black via-gray-900 to-purple-900 text-white p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white/10 backdrop-blur-lg border border-gray-700 rounded-2xl shadow-xl p-8 w-[350px] flex flex-col gap-4"
      >
        <h2 className="text-2xl font-semibold mb-2 text-center capitalize">
          {mode === "signup" ? "Sign Up" : "Login"}
        </h2>

        {/* Username */}
        <input
          type="text"
          placeholder="Username"
          className="p-3 rounded-md bg-transparent border border-gray-500 focus:ring-2 focus:ring-purple-500 outline-none"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        {/* Email (only for signup) */}
        {mode === "signup" && (
          <input
            type="email"
            placeholder="Email Address"
            className="p-3 rounded-md bg-transparent border border-gray-500 focus:ring-2 focus:ring-purple-500 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        )}

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          className="p-3 rounded-md bg-transparent border border-gray-500 focus:ring-2 focus:ring-purple-500 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-linear-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 py-3 rounded-md text-white font-medium transition disabled:opacity-50"
        >
          {loading
            ? "Please wait..."
            : mode === "signup"
            ? "Create Account"
            : "Login Now"}
        </button>

        <p className="text-sm text-gray-400 mt-2 text-center">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <span
                onClick={() => setMode("login")}
                className="text-purple-400 cursor-pointer hover:underline"
              >
                Login here
              </span>
            </>
          ) : (
            <>
              Don’t have an account?{" "}
              <span
                onClick={() => setMode("signup")}
                className="text-purple-400 cursor-pointer hover:underline"
              >
                Sign up
              </span>
            </>
          )}
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
