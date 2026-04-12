import api from "./axios";

export const loginApi = (payload) => api.post("/auth/login", payload);
export const registerApi = (payload) => api.post("/auth/register", payload);
export const logoutApi = () => api.post("/auth/logout");
export const checkAuthApi = () => api.get("/auth/check");
