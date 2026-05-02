import api from "../api/axios";

export const fetchMessages = (userId) =>
  api.get(`/messages/${userId}`);

export const markAsRead = (conversationId)=> api.post('/messages/read', conversationId)
