import axios from "axios";

const api = axios.create({
  baseURL: "https://chatapp-backend-v4hm.onrender.com",
  // baseURL: "http://localhost:3000",
  withCredentials: true,
});

export default api;
