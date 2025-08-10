import axios, { AxiosError } from "axios";
import type {
  Adventure,
  PublicAdventuresResponse,
  AdventureCreate,  
  AdventureAttempt,
  DetailedAdventure,
  AdventureSubmissionResponse,
} from "../components/shared/types";
import { isValidationErrorResponse } from "../hooks/useCreateProblem";

const FASTAPI_BACKEND_URL = import.meta.env.VITE_API_URL;

export const createAdventure = async (
    adventureData: AdventureCreate    
  ) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("You must be logged in to create an adventure.");
  
    try {
      const response = await axios.post(
        `${FASTAPI_BACKEND_URL}/api/adventures/`,
        adventureData,             
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError;
      const status = error.response?.status;
      const data = error.response?.data;
      if (status === 401) {
        throw new Error("Unauthorized: Please log in again.");
      } else if (status === 422 && isValidationErrorResponse(data)) {
        const messages = data.detail.map((d) => d.msg).join(", ");
        throw new Error(`Validation error: ${messages}`);
      } else if (typeof data === "string") {
        throw new Error(data);
      } else {
        throw new Error("Something went wrong. Tr again later.");
      }
    }
  };

export const getPublicAdventures = async (): Promise<Adventure[]> => {
  const response = await axios.get<PublicAdventuresResponse>(`${FASTAPI_BACKEND_URL}/api/adventures/public`);
  
  return response.data.adventures;
};

export const getAdventureAttempt = async (adventureId: number, token?: string): Promise<AdventureAttempt> => {
  try {
    
    const headers = token
      ? { Authorization: `Bearer ${token}` }
      : undefined;

    const res = await axios.get<AdventureAttempt>(
      `${FASTAPI_BACKEND_URL}/api/adventures/${adventureId}/attempt`,
      { headers }
    );
    
    return res.data;
  } catch (err) {
    const error = err as AxiosError;
      const status = error.response?.status;
      const data = error.response?.data;
      if (status === 401) {
        throw new Error("Unauthorized: Please log in again.");
      } else if (status === 422 && isValidationErrorResponse(data)) {
        const messages = data.detail.map((d) => d.msg).join(", ");
        throw new Error(`Validation error: ${messages}`);
      } else if (typeof data === "string") {
        throw new Error(data);
      } else {
        throw new Error("Something went wrong. Tr again later.");
      }
  }
}

export const getAdventureByAccessCode = async (
  accessCode: string, 
  headers: Record<string, string>
): Promise<DetailedAdventure> => {
  try {
    const res = await axios.get<DetailedAdventure>(
      `${FASTAPI_BACKEND_URL}/api/adventures/access/${accessCode}`,
      { headers }
    );
    return res.data;
  } catch (err) {
    const error = err as AxiosError;
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 401) {
      throw new Error("Unauthorized: Please log in again.");
    } else if (status === 422 && isValidationErrorResponse(data)) {
      const messages = data.detail.map((d) => d.msg).join(", ");
      throw new Error(`Validation error: ${messages}`);
    } 
    if (status === 404) {
      throw error; 
    }

    throw new Error("Something went wrong. Try again later.");
  }
}

  export const submitGuestCode = async (form: URLSearchParams): Promise<AdventureSubmissionResponse> => {
    try {
    const { data } = await axios.post(
      `${FASTAPI_BACKEND_URL}/api/adventure_submissions/guest_by_id`,
      form,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    
    return data
  } catch (err) {
    const error = err as AxiosError;
      const status = error.response?.status;
      const data = error.response?.data;
      if (status === 401) {
        throw new Error("Unauthorized: Please log in again.");
      } else if (status === 422 && isValidationErrorResponse(data)) {
        const messages = data.detail.map((d) => d.msg).join(", ");
        throw new Error(`Validation error: ${messages}`);
      } else if (typeof data === "string") {
        throw new Error(data);
      } else {
        throw new Error("Something went wrong. Try again later.");
      }
  }
}

export const submitUserCode = async (form: URLSearchParams, token?:string): Promise<AdventureSubmissionResponse> => {

  try {
    const {data} = await axios.post(
      `${FASTAPI_BACKEND_URL}/api/adventure_submissions`,
      form,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return data
  } catch(err) {
    const error = err as AxiosError;
      const status = error.response?.status;
      const data = error.response?.data;
      if (status === 401) {
        throw new Error("Unauthorized: Please log in again.");
      } else if (status === 422 && isValidationErrorResponse(data)) {
        const messages = data.detail.map((d) => d.msg).join(", ");
        throw new Error(`Validation error: ${messages}`);
      } else if (typeof data === "string") {
        throw new Error(data);
      } else {
        throw new Error("Something went wrong. Try again later.");
      }
  }}


  export const updateProgress = async (authenticatedAttemptId: number, nextNodeId: string, outcome: string, code: string, completed: boolean, token?:string):Promise<AdventureAttempt> => {
    
    const { data } = await axios.patch<AdventureAttempt>(
      `${FASTAPI_BACKEND_URL}/api/adventures/attempts/${authenticatedAttemptId}/progress`,
      {
        current_node_id: nextNodeId,
        outcome: outcome,
        code: code,
        completed: completed  
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    return data

  }

  export const fetchCompletedAdventures = async (userId: string, token?: string): Promise<Adventure[]> => {
    const {data} = await axios.get(
        `${FASTAPI_BACKEND_URL}/api/adventures/users/${userId}/completed_public_adventures`,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return data

}