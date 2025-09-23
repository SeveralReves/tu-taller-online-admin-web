import axios from "axios";
import Cookies from "js-cookie";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true, // si usas cookies
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("tutaller_token"); // o lee desde cookie HttpOnly vía backend
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error?.response?.status === 401) {
      // limpiar cliente y redirigir al login
      if (typeof window !== "undefined") {
        Cookies.remove("tutaller_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
