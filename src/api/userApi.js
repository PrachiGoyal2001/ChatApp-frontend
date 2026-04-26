import api from "./axios";

export const getUsersApi = () => api.get("/messages/conversations");
export const getUserDetailsApi = (id) =>
  api.get(`/users/getUserDetails/${id}`);
