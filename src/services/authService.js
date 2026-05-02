import api from "../api/axios";

export const login = (payload) => api.post("/auth/login", payload);
export const register = (payload) => api.post("/auth/register", payload);
export const logout = () => api.post("/auth/logout");
export const checkAuth = () => api.get("/auth/check");
