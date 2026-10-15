import axios from "axios";

const TOKEN_KEY = "snapYourselfToken";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const saveToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

/* A booking with a receipt file is sent as multipart/form-data */
api.interceptors.request.use((config) => {
  const body = config.data;

  if (body && typeof body === "object" && body.gcashReceipt instanceof File) {
    const { gcashReceipt, ...fields } = body;
    const form = new FormData();
    form.append("data", JSON.stringify(fields));
    form.append("gcashReceipt", gcashReceipt);
    config.data = form;
  }

  return config;
});

/* Attach the JWT to every request automatically */
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* If a logged-in session expires (401), log out cleanly */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const isAuthAttempt =
      url.includes("/auth/login") || url.includes("/auth/register");

    if (error.response?.status === 401 && getToken() && !isAuthAttempt) {
      clearToken();
      window.dispatchEvent(new Event("auth:expired"));
    }

    return Promise.reject(error);
  }
);

export default api;