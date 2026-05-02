import { defineStore } from "pinia";
import * as authService from "../services/authService";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    userId: null,
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
        const { data } = await authService.checkAuth();
        this.userId = data.user || null;
        return this.userId;
      } catch {
        this.userId = null;
      }
    },
    async login(credentials) {
      const data = await authService.login({
        username: credentials.username,
        password: credentials.password,
      });
      return data;
    },
    async register(credentials) {
      const data = await authService.register({
        username: credentials.username,
        password: credentials.password,
        email: credentials.email,
      });
      return data;
    },
    async logout() {
      await authService.logout();
    },
  },
});
