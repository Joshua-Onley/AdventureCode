
import { useState } from "react";
import axios, { AxiosError } from "axios";

type ErrorResponse = { detail: string };

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "https://adventurecode-bcekcrhpauffhzbn.uksouth-01.azurewebsites.net/signup",
        new URLSearchParams(formData),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );
      setMessage(res.data.msg);
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
        placeholder="Name"
        onChange={handleChange}
        required
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
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
