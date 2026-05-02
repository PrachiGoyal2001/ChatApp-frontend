import api from "../api/axios";

export const fetchUsers = () => api.get("/users/getUsersList");
