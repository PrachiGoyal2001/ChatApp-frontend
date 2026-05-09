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
    <div class="messages-wrapper">
      <div id="messages" class="col q-pa-md chat-box">
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
            <!-- Attachments -->
            <div v-if="msg.files?.length" class="attachments-container">
              <div
                v-for="(fileItem, fileIndex) in msg.files"
                :key="fileIndex"
                class="attachment-item"
              >
                <!-- IMAGE -->
                <img
                  v-if="fileItem.fileType?.startsWith('image/')"
                  :src="fileItem.url"
                  class="chat-image"
                />

                <!-- VIDEO -->
                <video
                  v-else-if="fileItem.fileType?.startsWith('video/')"
                  controls
                  class="chat-video"
                >
                  <source :src="fileItem.url" :type="fileItem.fileType" />
                </video>

                <!-- AUDIO -->
                <audio
                  v-else-if="fileItem.fileType?.startsWith('audio/')"
                  controls
                  class="chat-audio"
                >
                  <source :src="fileItem.url" :type="fileItem.fileType" />
                </audio>

                <!-- OTHER FILE -->
                <a
                  v-else
                  :href="fileItem.url"
                  target="_blank"
                  class="file-link"
                >
                  📄 {{ fileItem.fileName }}
                </a>
              </div>
            </div>

            <!-- Text -->
            <div v-if="msg.text" class="message-text">
              {{ msg.text }}
            </div>
          </div>
        </div>
      </div>
      <AttachmentPreview
        v-if="selectedFiles.length"
        :files="selectedFiles"
        @close="selectedFiles = []"
        @add-more="openFilePicker"
        @remove-file="removeSelectedFile"
      />
    </div>

    <div
      class="row items-center q-pa-sm input-box"
      style="border-top: 1px solid rgba(255, 255, 255, 0.08)"
    >
      <!-- Hidden File Input -->
      <q-file
        v-model="selectedFiles"
        ref="filePicker"
        multiple
        append
        style="display: none"
        @update:model-value="handleFileSelect"
      />
      <!-- File Button -->
      <q-btn
        round
        flat
        icon="attach_file"
        class="q-mr-sm"
        @click="openFilePicker"
      />
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
import { useUploadStore } from "../stores/upload";
import { useSocket } from "../composables/useSocket";
import { scrollToBottom } from "../utils";
import AttachmentPreview from "../components/AttachmentPreview.vue";

const { sendMessage, handleTyping, onlineUsers, isTyping } = useSocket();

const auth = useAuthStore();
const userStore = useUserStore();
const uploadStore = useUploadStore();

const userMessage = ref("");
const selectedFiles = ref([]);
const filePicker = ref(null);

const loggedInUserId = computed(() => auth.userId);
const conversationId = computed(() => userStore.conversationId);
const selectedUserId = computed(() => userStore.selectedUserId);
const getSelectedUsername = computed(() => userStore.getSelectedUsername);
const isSelectedUserOnline = computed(() =>
  onlineUsers.value.has(selectedUserId.value),
);
const messages = computed(() => userStore.messages || []);

const openFilePicker = () => {
  filePicker.value.pickFiles();
};

// Only store selected file
const handleFileSelect = async (files) => {
  if (!files || !files.length) return;

  selectedFiles.value = [...files];
};

const removeSelectedFile = (index) => {
  selectedFiles.value.splice(index, 1);
};

// ✅ Send message
const handleSend = async () => {
  if (!userMessage.value.trim() && !selectedFiles.value.length)return;

  const text = userMessage.value;

try {
  let uploadedFiles = [];

  // upload files first
  if (selectedFiles.value.length) {
    const formData = new FormData();

    selectedFiles.value.forEach((file) => {
      formData.append("files", file);
    });

    const { data } = await uploadStore.uploadAttachment(formData);

    uploadedFiles = data.files || [];
  }
  console.log("uploadedFiles", uploadedFiles);
  sendMessage({
    type: "private_message",
    from: loggedInUserId.value,
    to: selectedUserId.value,
    message: text,
    files: uploadedFiles,
  });

  userStore.addMessage({
    _id: Date.now(),
    text,
    sender: loggedInUserId.value,
    files: uploadedFiles,
  });

  // update sidebar
  userStore.updateLastMessage({
    userId: selectedUserId.value,
    message: text || (uploadedFiles.length && uploadedFiles[uploadedFiles.length-1].fileName),
    time: new Date(),
  });

  selectedFiles.value = [];
  userMessage.value = "";

  await scrollToBottom();
  } catch (err) {
    console.error("Send failed", err);
  }
};

watch(
  () => messages.value.length,
  async () => {
    await scrollToBottom();
  },
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
.selected-file {
  background: rgba(255, 255, 255, 0.06);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  color: white;
}
.messages-wrapper {
  position: relative;
  flex: 1;
  overflow: hidden;
}

#messages {
  width: 100%;
  height: 100%;
  overflow-y: auto;
}
.attachments-container {
  display: flex;
  flex-direction: column;
  gap: 8px;

  margin-bottom: 6px;
}

.attachment-item {
  width: 100%;
}

.chat-image {
  width: 100%;
  max-width: 320px;
  border-radius: 10px;
  object-fit: cover;

  cursor: pointer;
}

.chat-video {
  width: 100%;
  max-width: 320px;

  border-radius: 10px;
}

.chat-audio {
  width: 260px;
}

.file-link {
  display: inline-flex;
  align-items: center;

  gap: 8px;

  padding: 10px 12px;

  border-radius: 10px;

  text-decoration: none;
  color: white;

  background: rgba(255, 255, 255, 0.08);
}

.message-text {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
