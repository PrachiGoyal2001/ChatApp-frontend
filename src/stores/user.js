import { defineStore } from "pinia";
import { getUserDetailsApi } from "../api/userApi";

export const useUserStore = defineStore("user", {
  state: () => ({
    selectedUserId: null,
    selectedUserName: null,
    users: []
  }),

  getters:{
    getSelectedUsername:(state)=> state.selectedUserName,
  },

  actions: {
    async setSelectedUser(userId) {
      this.selectedUserId = userId;

      const { data } = await getUserDetailsApi(userId);
      this.selectedUserName = data.username;
      console.log("user information", this.selectedUserId, this.selectedUserName);
    },
    updateLastMessage({ userId, message, time }) {
      const index = this.users.findIndex((u) => u._id === userId);

      if (index === -1) return;

      this.users[index].lastMessage = { content: message, time };

      const updated = this.users.splice(index, 1)[0];
      this.users.unshift(updated);
    },
    setUsers(users){
      this.users = users;
    },
  },
});
