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
      </div>
    </div>
    <div id="messages" class="col q-pa-md chat-box" style="overflow-y: auto">
      <div
        v-for="(msg, index) in messages"
        :key="index"
        class="q-mb-sm"
        :class="
          msg.senderId._id === loggedInUserId
            ? 'flex justify-end'
            : 'flex justify-start'
        "
      >
        <div
          class="chat-bubble"
          :class="msg.senderId._id === loggedInUserId ? 'sent' : 'received'"
        >
          {{ msg.content }}
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
      />
      <q-btn round icon="send" class="send-btn" @click="handleSend" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useUserStore } from "../stores/user";
import { getMessagesApi } from "../api/messageApi";
import { useSocket } from "../composables/useSocket";

const route = useRoute();
const auth = useAuthStore();
const userStore = useUserStore();
const messages = ref([]);
const userMessage = ref("");
const { sendMessage, onMessage } = useSocket();

const getSelectedUsername = computed(() => userStore.getSelectedUsername);
const loggedInUserId = computed(() => auth.userId);

const fetchMessages = async () => {
  const { data } = await getMessagesApi(route.params.userId);
  messages.value = data;
};

const handleSend = () => {
  if (!userMessage.value.trim()) return;

  sendMessage({
    type: "private_message",
    from: auth.userId,
    to: route.params.userId,
    message: userMessage.value,
  });

  userStore.updateLastMessage({
    userId: route.params.userId,
    message: userMessage.value,
    time: new Date(),
  });

  messages.value.push({
    content: userMessage.value,
    senderId: { _id: auth.userId },
  });
  userMessage.value = "";
};

onMounted(async () => {
  onMessage((data) => {
    messages.value.push({
      content: data.message,
      senderId: { _id: data.from },
    });
  });
});

watch(
  () => route.params.userId,
  async (newUserId) => {
    if (!newUserId) return;

    await userStore.setSelectedUser(newUserId);
    await fetchMessages();
  },
  { immediate: true }
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
