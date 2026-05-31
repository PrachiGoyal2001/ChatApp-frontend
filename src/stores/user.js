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
    clearSelectedUserId(){
      this.selectedUserId = null;
      this.selectedUserName = null;
      this.conversationId = null;
    },
    async getUsers() {
      const { data } = await userService.fetchUsers();
      this.users = data;
    },
    addOrUpdateUser(conversation) {
      const index = this.users.findIndex((user) => user._id === conversation._id);

      if (index === -1) {
        this.users.unshift(conversation);
        return;
      }

      this.users.splice(index, 1, {
        ...this.users[index],
        ...conversation,
      });
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
    async fetchSelectedUserMessages(userId){
      await this.getUsers();
      const selectedUser = this.users.find(
        (curr) => curr.otherUser._id === userId
      );
      if (!selectedUser) return;
      const userDetails = {
        conversationId: selectedUser._id,
        username: selectedUser.otherUser.username,
      };

      this.setSelectedUser({
        ...userDetails,
        userId,
      });
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
        // const isExistingUser = this.users.findIndex(
        //   (curr) => curr.otherUser._id === otherUserId
        // );
        // if(isExistingUser === -1){
        //   this.users.unshift({
        //     otherUser: {
        //       email:,
        //       username:,
        //       _id: data.conversationId,
        //     },
        //     lastMessage:{
        //       createdAt:data.createdAt,
        //       sender:data.sender,
        //       text:data.text,
        //     },
        //     unreadCount:0,
        //   })
        // }
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
