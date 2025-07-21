import { useState } from "react";
import axios, { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import type { ValidationErrorResponse } from "../components/shared/types";

interface LoginSuccessResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    email: string;
  };
}

const FASTAPI_BACKEND_URL = import.meta.env.VITE_API_URL;

const isValidationErrorResponse = (data: unknown): data is ValidationErrorResponse => {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as ValidationErrorResponse).detail)
  );
};

export default function Login() {
  const [formData, setFormData] = useState({
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
      const params = new URLSearchParams();
      params.append("username", formData.username);
      params.append("password", formData.password);
      params.append("grant_type", "password");

      const res = await axios.post<LoginSuccessResponse>(
        `${FASTAPI_BACKEND_URL}/api/login`,
        params,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
        }
      );

      if (!res.data.access_token) {
        throw new Error("No access token received");
      }

      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("userId", res.data.user.id.toString());
      localStorage.setItem("userName", formData.username);
      setMessage("Login successful");
      console.log("User data:", res.data.user);
      navigate('/');
    } catch (err) {
      const error = err as AxiosError<unknown>;
      const errorData = error.response?.data;

      if (isValidationErrorResponse(errorData)) {
        const messages = errorData.detail.map((d) => d.msg).join(", ");
        setMessage(`Validation error: ${messages}`);
      } else if (error.response?.status === 422) {
        setMessage("Invalid form data format");
      } else if (typeof errorData === "string") {
        setMessage(errorData);
      } else if (error.response?.status === 401) {
        setMessage("Invalid email or password");
      } else {
        setMessage("Login failed. Please try again.");
      }
      console.error("Login error:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Log In</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="sr-only">Username</label>
            <input
              id="username"
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
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
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Log In
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