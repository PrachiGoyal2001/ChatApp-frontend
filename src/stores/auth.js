import { defineStore } from "pinia";
import { checkAuthApi, logoutApi } from "../api/authApi";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    userId: null,
    credentials: {
      username: "",
      password: "",
    },
  }),

  getters: {
    getLoggedInUserId() {
      return this.userId;
    },
  },

  actions: {
    async checkAuth() {
      if (this.userId) return this.userId;

      try {
        const { data } = await checkAuthApi();
        this.userId = data.user || null;
        return this.userId;
      } catch {
        this.userId = null;
      }
    },

    async logout() {
      await logoutApi();
      this.userId = null;
    },

    setCredentials(data) {
      this.credentials = data;
    },
  },
});
