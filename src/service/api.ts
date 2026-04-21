import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
});

export const apiNoAuth = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
});
