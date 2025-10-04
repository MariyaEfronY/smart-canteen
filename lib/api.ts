import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // important for cookies
});

export default api;
