<template>
  <div class="column full-height">
    <div class="row items-center q-pa-sm chat-header">
      <q-btn
        icon="arrow_back"
        flat
        dense
        v-if="$q.screen.lt.md"
        @click="$router.push('/')"
      />
      <q-avatar size="36px" text-color="white" class="chat-icon">
        <q-icon name="chat" />
      </q-avatar>
      <div class="q-ml-sm">
        <div class="text-subtitle1 text-grey text-bold">
          {{ getSelectedUsername }}
        </div>
        <div class="text-subtitle2 text-grey text-bold" v-if="isTyping">
          Typing...
        </div>
        <div class="text-subtitle3 text-grey text-bold" v-if="!isTyping">
          <div v-if="isSelectedUserOnline">Online</div>
          <div v-else>Last Seen Recently</div>
        </div>
      </div>
    </div>
    <div id="messages" class="col q-pa-md chat-box" style="overflow-y: auto">
      <div
        v-for="(msg, index) in messages"
        :key="msg._id || index"
        class="q-mb-sm"
        :class="
          msg.sender === loggedInUserId
            ? 'flex justify-end'
            : 'flex justify-start'
        "
      >
        <div
          class="chat-bubble"
          :class="msg.sender === loggedInUserId ? 'sent' : 'received'"
        >
          {{ msg.text }}
        </div>
      </div>
    </div>

    <div
      class="row items-center q-pa-sm input-box"
      style="border-top: 1px solid rgba(255, 255, 255, 0.08)"
    >
      <q-input
        v-model="userMessage"
        placeholder="Type a message..."
        outlined
        dense
        rounded
        class="col input-field"
        @keyup.enter="handleSend"
        @update:model-value="handleTyping(conversationId, selectedUserId)"
      />
      <q-btn round icon="send" class="send-btn" @click="handleSend" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { useAuthStore } from "../stores/auth";
import { useUserStore } from "../stores/user";
import { useSocket } from "../composables/useSocket";
import {scrollToBottom} from "../utils";

const {
  sendMessage,
  handleTyping,
  onlineUsers,
  isTyping,
} = useSocket();

const auth = useAuthStore();
const userStore = useUserStore();

const userMessage = ref("");

const loggedInUserId = computed(() => auth.userId);
const conversationId = computed(() => userStore.conversationId);
const selectedUserId = computed(() => userStore.selectedUserId);
const getSelectedUsername = computed(() => userStore.getSelectedUsername);
const isSelectedUserOnline = computed(() => onlineUsers.value.has(selectedUserId.value));
const messages = computed(() => userStore.messages || []);

// ✅ Send message
const handleSend = async () => {
  if (!userMessage.value.trim()) return;

  const text = userMessage.value;

  sendMessage({
    type: "private_message",
    from: loggedInUserId.value,
    to: selectedUserId.value,
    message: text,
  });

  userStore.addMessage({
    _id: Date.now(),
    text,
    sender: loggedInUserId.value,
  });

  // update sidebar
  userStore.updateLastMessage({
    userId: selectedUserId.value,
    message: text,
    time: new Date(),
  });

  userMessage.value = "";

  await scrollToBottom();
};

watch(
  () => messages.value.length,
  async () => {
    await scrollToBottom();
  }
);
</script>

<style scoped>
/* 💬 Chat Header */
.chat-header {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
}

/* 💬 Chat Bubble Base */
.chat-bubble {
  padding: 10px 14px;
  border-radius: 12px;
  max-width: 65%;
  font-size: 14px;
  line-height: 1.4;
}

/* 🟢 Sent Message */
.sent {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  box-shadow: 0 5px 15px rgba(34, 197, 94, 0.3);
}

/* 📩 Received Message */
.received {
  background: rgba(255, 255, 255, 0.06);
  color: #e2e8f0;
}

/* ✍️ Input Field */
.q-field--outlined .q-field__control {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Input Text */
.q-input input {
  color: #e2e8f0 !important;
}

/* Placeholder */
.q-input input::placeholder {
  color: #94a3b8;
}

/* 🟢 Focus Effect */
.q-field--focused .q-field__control {
  border: 1px solid #22c55e !important;
  box-shadow:
    0 0 0 1px #22c55e,
    0 0 15px rgba(34, 197, 94, 0.3);
}

/* Remove Blue Outline */
.q-input input:focus {
  outline: none !important;
  box-shadow: none !important;
}

/* 🟢 Send Button */
.send-btn {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
}

.send-btn:hover {
  box-shadow: 0 10px 25px rgba(34, 197, 94, 0.4);
}
.chat-icon {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}
.chat-box,
.input-box {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.input-field :deep(.q-field__control) {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);

  transition: all 0.3s ease;
}

/* Input text */
.input-field :deep(input) {
  color: #e2e8f0 !important;
}

/* Placeholder */
.input-field :deep(input::placeholder) {
  color: #94a3b8;
}

/* Label */
.input-field :deep(.q-field__label) {
  color: #94a3b8 !important;
}

/* Focus effect (important) */
.input-field :deep(.q-field--focused .q-field__control) {
  border: 1px solid #22c55e;
  box-shadow:
    0 0 0 1px #22c55e,
    0 0 15px rgba(34, 197, 94, 0.3);
}

/* Remove blue outline completely */
.input-field :deep(input:focus) {
  outline: none !important;
  box-shadow: none !important;
}
</style>
