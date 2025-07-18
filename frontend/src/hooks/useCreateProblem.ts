import { useState } from "react";
import type { AxiosError } from "axios";
import { createProblem, type CreateProblemPayload } from "../api/problems";
import type { ValidationErrorResponse } from '../components/shared/types';
 

export function isValidationErrorResponse(data: unknown): data is ValidationErrorResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "detail" in data &&
    Array.isArray((data as { detail?: unknown }).detail)
  );
}

export function useCreateProblem() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (payload: CreateProblemPayload) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in");
      setLoading(false);
      return;
    }

    

    try {
      const resp = await createProblem(payload, token);
      console.log(resp.data.problem_id)
      setSuccess(`Problem created successfully.`);

    } catch (e) {
      const err = e as AxiosError;
      if (err.response?.status === 401) {
        setError("Unauthorized: please log in again");
      } else if (
        err.response?.status === 422 &&
        isValidationErrorResponse(err.response.data)
      ) {
        setError(err.response.data.detail.map(d => d.msg).join(", "));
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSuccess(null);
    setError(null);
  };




  return { submit, loading, error, success, reset };
}
