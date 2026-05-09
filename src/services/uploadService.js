import api from "../api/axios";

export const uploadAttachment = (formData) =>
  api.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
