import api from "./axios";

export const getUsersApi = () => api.get("/users");
export const getUserDetailsApi = (id) =>
  api.get(`/users/getUserDetails/${id}`);
