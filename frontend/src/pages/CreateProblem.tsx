import React, { useState } from "react";
import axios, { AxiosError } from "axios";

interface ValidationErrorItem {
  msg: string;
  [key: string]: unknown;
}

interface ValidationErrorResponse {
  detail: ValidationErrorItem[];
}

const FASTAPI_BACKEND_URL = import.meta.env.VITE_API_URL;


const SUPPORTED_LANGUAGES = [
  { value: "python", label: "Python 3.10" },
  { value: "javascript", label: "JavaScript (Node.js 18.15)" },
  { value: "typescript", label: "TypeScript" },
  { value: "java", label: "Java 15" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "php", label: "PHP" },
  { value: "swift", label: "Swift" },
  { value: "rust", label: "Rust" },
  { value: "bash", label: "Bash" },
  { value: "kotlin", label: "Kotlin" },
];


const isValidationErrorResponse = (data: unknown): data is ValidationErrorResponse => {
  return (
    data !== null &&
    typeof data === "object" &&
    "detail" in data &&
    Array.isArray((data as { detail: unknown }).detail)
  );
};

const CreateProblem = () => {
  const [formData, setFormData] = useState({
    language: "",
    title: "",
    description: "",
    code_snippet: "",
    expected_output: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("You must be logged in to create a problem.");
        return;
      }

      await axios.post(
        `${FASTAPI_BACKEND_URL}/problems`,
        new URLSearchParams({
          title: formData.title,
          description: formData.description,
          code_snippet: formData.code_snippet,
          expected_output: formData.expected_output,
          language: formData.language,
          is_public: "false",
        }),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      setMessage("Problem created successfully.");
      setFormData({
        language: "",
        title: "",
        description: "",
        code_snippet: "",
        expected_output: "",
      });
    } catch (err) {
      const error = err as AxiosError;
      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 401) {
        setMessage("Unauthorized: Please log in again.");
      } else if (status === 422 && isValidationErrorResponse(data)) {
        const messages = data.detail.map((d) => d.msg).join(", ");
        setMessage(`Validation error: ${messages}`);
      } else if (typeof data === "string") {
        setMessage(`${data}`);
      } else {
        setMessage("Something went wrong. Try again later.");
      }

      console.error("Error creating problem:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create a New Problem</h2>

      <label htmlFor="language">Language</label>
      <select
        name="language"
        id="language"
        value={formData.language}
        onChange={handleChange}
        required
      >
        <option value="" disabled>
          Select a language
        </option>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.value} value={lang.value}>
            {lang.label}
          </option>
        ))}
      </select>

      <input
        type="text"
        name="title"
        placeholder="Title"
        value={formData.title}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="description"
        placeholder="Description"
        value={formData.description}
        onChange={handleChange}
        required
      />
      <textarea
        name="code_snippet"
        placeholder="Incomplete code snippet"
        value={formData.code_snippet}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="expected_output"
        placeholder="Expected output"
        value={formData.expected_output}
        onChange={handleChange}
        required
      />
      <button type="submit">Create Problem</button>
      {message && <p>{message}</p>}
    </form>
  );
};

export default CreateProblem;
