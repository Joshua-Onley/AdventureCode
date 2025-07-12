import axios from "axios";
import { isTokenExpired } from "../utils/authHelpers";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  
  if (token) {
    if (isTokenExpired(token)) {
      return Promise.reject(new Error("Token expired"));
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

export default api;