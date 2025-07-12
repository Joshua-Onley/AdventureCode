import axios, { AxiosError } from "axios";
import type {
  Adventure,
  PublicAdventuresResponse,
  AdventureCreate,  
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
        `${FASTAPI_BACKEND_URL}/adventures`,
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
        throw new Error("Something went wrong. Try again later.");
      }
    }
  };

export const startAdventureAttempt = async (adventureId: number) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");

  const response = await axios.post(
    `${FASTAPI_BACKEND_URL}/adventure-attempts`,
    { adventure_id: adventureId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const updateAdventureAttempt = async (
  attemptId: number,
  current_node_id: string,
  completed: boolean = false
) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");

  const response = await axios.put(
    `${FASTAPI_BACKEND_URL}/adventure-attempts/${attemptId}`,
    { current_node_id, completed },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const getAdventure = async (id: number) => {
  const response = await axios.get(`${FASTAPI_BACKEND_URL}/adventures/${id}`);
  return response.data;
};

export const getPublicAdventures = async (): Promise<Adventure[]> => {
  const response = await axios.get<PublicAdventuresResponse>(`${FASTAPI_BACKEND_URL}/adventures/public`);
  console.log("fetching public adventures from adventure.ts file", response);
  return response.data.adventures;
};

export const getUserAdventures = async (userId: number) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");
  
  const response = await axios.get(
    `${FASTAPI_BACKEND_URL}/adventures/user/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const getAdventureAttempt = async (attemptId: number) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Authentication required");
  
  const response = await axios.get(
    `${FASTAPI_BACKEND_URL}/adventure-attempts/${attemptId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};