import api from "./axios";

export const getMessagesApi = (userId) =>
  api.get(`/messages/${userId}`);

export const markAsReadApi = (conversationId)=> api.post('/messages/read', conversationId)
