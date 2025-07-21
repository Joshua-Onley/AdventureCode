
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios, { AxiosError } from "axios";

type ErrorResponse = { detail: string };

const FASTAPI_BACKEND_URL = import.meta.env.VITE_API_URL;

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${FASTAPI_BACKEND_URL}/api/signup`,
        new URLSearchParams(formData),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );
      setMessage(res.data.msg);
      navigate("/login");
    } catch (err) {
      const error = err as AxiosError;
      const errorData = error.response?.data as ErrorResponse;
      setMessage(errorData?.detail || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Sign Up</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="sr-only">Firstname</label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="Firstname (Optional)"
              onChange={handleChange}
              
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="username" className="sr-only">Username</label>
            <input
              id="username"
              type="text"
              name="username"
              placeholder="Username"
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Sign Up
          </button>
          {message && <p className="text-sm text-red-500 mt-4 text-center">{message}</p>}
        </form>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => navigate("/")}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded transition-colors"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}