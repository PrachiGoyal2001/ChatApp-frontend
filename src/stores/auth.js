import { defineStore } from "pinia";
import * as authService from "../services/authService";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    userId: localStorage.getItem("userId"),
    token: localStorage.getItem("token"),
  }),

  getters: {
    getLoggedInUserId() {
      return this.userId;
    },
  },

  actions: {
    async checkAuth() {
      if (!this.token) {
        this.clearAuth();
        return null;
      }

      if (this.userId) return this.userId;

      try {
        const { data } = await authService.checkAuth();
        this.userId = data.user || null;
        if (this.userId) {
          localStorage.setItem("userId", this.userId);
        } else {
          this.clearAuth();
        }
        return this.userId;
      } catch {
        this.userId = null;
        this.token = null;
        localStorage.removeItem("userId");
        localStorage.removeItem("token");
      }
    },
    async login(credentials) {
      const response = await authService.login({
        username: credentials.username,
        password: credentials.password,
      });
      this.setAuth(response.data);
      return response;
    },
    async register(credentials) {
      const response = await authService.register({
        username: credentials.username,
        password: credentials.password,
        email: credentials.email,
      });
      this.setAuth(response.data);
      return response;
    },
    async logout() {
      try {
        await authService.logout();
      } finally {
        this.clearAuth();
      }
    },
    setAuth(data) {
      this.userId = data.userId || data.user || null;
      this.token = data.token || null;

      if (this.userId) {
        localStorage.setItem("userId", this.userId);
      }

      if (this.token) {
        localStorage.setItem("token", this.token);
      }
    },
    clearAuth() {
      this.userId = null;
      this.token = null;
      localStorage.removeItem("userId");
      localStorage.removeItem("token");
    },
  },
});
