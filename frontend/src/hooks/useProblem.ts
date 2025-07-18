import { useState } from "react";
import type { AxiosError } from "axios";
import { fetchProblemByCode, submitSolution, type Problem } from "../api/problems";


interface ErrorResponse {
    message?: string;
  }
  
export function useFetchProblem() {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);


  const load = async (accessCode: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetchProblemByCode(accessCode);
      setProblem(res.data);
    } catch (err) {
      console.error("failed to fetch problem", err)
      setError("Problem not found.");
      setProblem(null);
    } finally {
      setLoading(false);
    }
  };

  return { problem, loading, error, load };
}

export function useSubmitSolution() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const submit = async (args: { access_code: string; code: string; language: string }) => {
    setLoading(true);
    setError(null);
    setMessage(null);
    setIsCorrect(null);

    try {
      const res = await submitSolution(args);
      setMessage(res.data.message ?? "Submitted successfully.");
      setIsCorrect(res.data.is_correct ?? false);
    } catch (e) {
        const err = e as AxiosError;
        const data = err.response?.data as ErrorResponse | undefined;
        setError(data?.message ?? "Error submitting solution.");
      }finally {
      setLoading(false);
    }
  };

  return { loading, error, message,  isCorrect, submit };
}
