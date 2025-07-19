import axios from "axios";
import type { AxiosResponse } from "axios"

export interface CreateProblemPayload {
  title: string;
  description: string;
  code_snippet: string;
  expected_output: string;
  language: string;
  is_public: boolean;
}

export interface Problem {
    title: string;
    description: string;
    code_snippet: string;
    language: string;
    expected_output: string;
     
  }

export interface SubmissionResponse {
    message?: string;
    is_correct?: boolean;
  }

const BASE = import.meta.env.VITE_API_URL;

export async function createProblem(
  payload: CreateProblemPayload,
  token: string
) {
  const data = new URLSearchParams({
    title: payload.title,
    description: payload.description,
    code_snippet: payload.code_snippet,
    expected_output: payload.expected_output,
    language: payload.language,
    is_public: payload.is_public.toString(),
  });

  return axios.post(
    `${BASE}/api/problems`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
}

export function fetchProblemByCode(accessCode: string) {
    return axios.get<Problem>(`${BASE}/api/problems/access/${accessCode}`);
  }

  
  export function submitSolution(form: {
    access_code: string;
    code: string;
    language: string;
  }): Promise<AxiosResponse<SubmissionResponse>> {
    const data = new URLSearchParams();
    data.append("access_code", form.access_code);
    data.append("code", form.code);
    data.append("language", form.language);
  
    return axios.post<SubmissionResponse>(
      `${BASE}/api/submissions`,
      data,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
  }

