import { defineStore } from "pinia";
import * as uploadService from "../services/uploadService";

export const useUploadStore = defineStore("upload", {
  actions: {
    async uploadAttachment(formData) {
      return await uploadService.uploadAttachment(formData);
    },
  },
});
