import axios, { AxiosError } from "axios";
import { isValidationErrorResponse, type Problem } from "../components/shared/types";


const FASTAPI_BACKEND_URL = import.meta.env.VITE_API_URL;

interface NodePosition {
  id: string;
  position: { x: number; y: number };
}

interface GraphEdge {
  source: string;
  target: string;
  condition: string;
}

interface AdventureData {
  title: string;
  description: string;
  problems: Problem[]; 
  graph_data: {
    nodes: NodePosition[];
    edges: GraphEdge[];
  };
}

export const createAdventure = async (adventureData: AdventureData) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("You must be logged in to create an adventure.");
  }

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