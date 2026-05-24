import api from "../api/axios";

export const fetchProfile = () => api.get("/users/profile");
export const fetchUsers = () => api.get("/users/getUsersList");
export const searchUsers = (query) => api.get("/users/search", {
  params: { q: query },
});
export const startConversation = (userId) => api.post("/users/start-conversation", {
  userId,
});
