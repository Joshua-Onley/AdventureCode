import { useState } from "react";
import axios, { AxiosError } from "axios";

export default function Login() {
  const [formData, setFormData] = useState({
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
        "https://adventurecode-bcekcrhpauffhzbn.uksouth-01.azurewebsites.net/login",
        new URLSearchParams(formData),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );
      setMessage(res.data.msg);
      // Optionally save user info to state or localStorage
      console.log(res.data.user); // { id, email }
    } catch (err) {
      const error = err as AxiosError;
      const errorData = error.response?.data as { detail: string };
      setMessage(errorData?.detail || "Login failed");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2> Log In</h2>
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
        Log In
      </button>
      {message && <p className="text-sm text-red-500">{message}</p>}
    </form>
  );
}
