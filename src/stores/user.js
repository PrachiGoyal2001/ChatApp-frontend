import { defineStore } from "pinia";
import { getUserDetailsApi } from "../api/userApi";
import { markAsReadApi } from "src/api/messagesApi";
import { useAuthStore } from "./auth";
import { useChatStore } from "./chat";

// const authStore = useAuthStore();
export const useUserStore = defineStore("user", {
  state: () => ({
    selectedUserId: null,
    conversationId: null,
    selectedUserName: null,
    users: [],
    authStore: useAuthStore(),
    chatStore: useChatStore(),
  }),

  getters: {
    getSelectedUsername: (state) => state.selectedUserName,
  },

  actions: {
    async setSelectedUser(user) {
      this.selectedUserId = user.userId;
      this.conversationId = user.conversationId;

      const { data } = await getUserDetailsApi(user.userId);
      this.selectedUserName = data.username;
    },
    updateLastMessage({ userId, message, time }) {
      const index = this.users.findIndex((u) => u.otherUser._id === userId);

      if (index === -1) return;

      this.users[index].lastMessage = { text: message, createdAt: time };

      const updated = this.users.splice(index, 1)[0];
      this.users.unshift(updated);
    },
    updateUnseenMessageCount(userId) {
      const index = this.users.findIndex((u) => u.otherUser._id === userId);

      if (index === -1) return;

      this.users[index].unreadCount = (this.users[index].unreadCount || 0) + 1;
    },
    updateMessagesCount(userId) {
      const index = this.users.findIndex((u) => u.otherUser._id === userId);

      if (index === -1) return;
      this.users[index].unreadCount = 0;
    },
    setUsers(users) {
      this.users = users;
    },
    handleIncomingMessage(data) {
      const myId = this.authStore.userId;

      const otherUserId = data.sender === myId ? data.receiver : data.sender;
      // if (data.conversationId !== this.conversationId) return;

      // // ❗ prevent duplicate (own message)
      // if (data.sender === myId) return;

      this.chatStore.addMessage(this.conversationId, {
        _id: data._id,
        text: data.text,
        sender: data.sender,
      });

      this.updateLastMessage({
        userId: otherUserId,
        message: data.text,
        time: data.createdAt,
      });

      if (otherUserId !== this.selectedUserId) {
        this.updateUnseenMessageCount(otherUserId);
      }
      markAsReadApi({
        conversationId: this.conversationId,
      });
    },
  },
});
