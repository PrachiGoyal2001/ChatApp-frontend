import api from "./axios";

export const getMessagesApi = (userId) =>
  api.get(`/messages/${userId}`);
