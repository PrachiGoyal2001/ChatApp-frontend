import axios from "axios";

const api = axios.create({
  baseURL: "https://chatapp-backend-v4hm.onrender.com",
  withCredentials: true,
});

export default api;
