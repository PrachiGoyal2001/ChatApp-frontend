import { defineStore } from "pinia";

export const useChatStore = defineStore("chat", {
  state: () => ({
    messages: {}, // { conversationId: [] }
  }),

  actions: {
    setMessages(conversationId, msgs) {
      this.messages[conversationId] = msgs;
    },

    addMessage(conversationId, msg) {
      if (!this.messages[conversationId]) {
        this.messages[conversationId] = [];
      }
      this.messages[conversationId].push(msg);
    },
  },
});
