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
        `${FASTAPI_BACKEND_URL}/signup`,
        new URLSearchParams(formData),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );
      setMessage(res.data.msg);
      navigate("/login")
    } catch (err) {
        const error = err as AxiosError;
        const errorData = error.response?.data as ErrorResponse;
        setMessage(errorData?.detail || "Signup failed");
      }
      
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Sign Up</h2>
      <input
        type="text"
        name="name"
        placeholder="Firstname"
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="username"
        placeholder="Username"
        onChange={handleChange}
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        onChange={handleChange}
        required
      />
      <button type="submit">
        Sign Up
      </button>
      {message && <p className="text-sm text-red-500">{message}</p>}
    </form>
  );
}
