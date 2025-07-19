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
    <form onSubmit={handleSubmit}>
      <h2>Log In</h2>
      <input
        type="text"
        name="username"
        placeholder="Username"
        value={formData.username}
        onChange={handleChange}
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
        required
      />
      <button type="submit">Log In</button>
      {message && <p className="text-sm text-red-500">{message}</p>}
    </form>
  );
}