import { defineStore } from "pinia";
import * as userService from "../services/userService";
import * as messageService from "../services/messagesService";
import { useAuthStore } from "./auth";
import { useSocket } from "../composables/useSocket";

export const useUserStore = defineStore("user", {
  state: () => ({
    selectedUserId: null,
    conversationId: null,
    selectedUserName: null,
    users: [],
    authStore: useAuthStore(),
    messages: [],
  }),

  getters: {
    getSelectedUsername: (state) => state.selectedUserName,
  },

  actions: {
    async getUsers() {
      const { data } = await userService.fetchUsers();
      this.users = data;
    },
    setSelectedUser(user) {
      this.selectedUserId = user.userId;
      this.conversationId = user.conversationId;
      this.selectedUserName = user.username;
      this.openConversation();
    },
    async openConversation() {
      try {
        this.messages=[];
        const { joinConversation } = useSocket();
        const { data } = await messageService.fetchMessages(this.conversationId);
        this.messages = data;
        await joinConversation(this.conversationId);
        await messageService.markAsRead({
          conversationId: this.conversationId,
        });
        this.updateMessagesCount(this.selectedUserId);
      } catch (err) {
        console.error("Fetch messages error:", err);
      }
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
    handleIncomingMessage(data) {
      const myId = this.authStore.userId;

      const otherUserId = data.sender === myId ? data.receiver : data.sender;

      if (otherUserId === this.selectedUserId) {
        this.addMessage({
          _id: data._id,
          text: data.text,
          sender: data.sender,
          files: data.files,
        });
        messageService.markAsRead({
          conversationId: this.conversationId,
        });
      }
      if (otherUserId !== this.selectedUserId) {
        this.updateUnseenMessageCount(otherUserId);
      }
      this.updateLastMessage({
        userId: otherUserId,
        message: data.text || (data.files.length && data.files[data.files.length-1].fileName),
        time: data.createdAt,
      });
    },
    addMessage(msg) {
      this.messages.push(msg);
    },
  },
});
