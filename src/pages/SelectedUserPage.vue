<template>
  <div class="column full-height">
    <div class="row items-center justify-between q-pa-sm chat-header">
  <!-- LEFT -->
  <div class="row items-center no-wrap">
    <q-btn
      icon="arrow_back"
      flat
      dense
      round
      class="back-btn q-mr-sm"
      v-if="$q.screen.lt.md"
      @click="$router.push('/')"
    />

    <q-avatar size="42px" text-color="white" class="chat-icon">
      <q-icon name="chat" size="20px" />
    </q-avatar>

    <div class="q-ml-sm user-info">
      <div class="username">
        {{ getSelectedUsername }}
      </div>

      <div class="typing-text" v-if="isTyping">
        Typing...
      </div>

      <div class="online-status" v-if="!isTyping">
        <span v-if="isSelectedUserOnline">Online</span>
        <span v-else>Last Seen Recently</span>
      </div>
    </div>
  </div>

  <!-- RIGHT -->
  <div class="row items-center q-gutter-xs">
    <!-- Audio Call -->
    <q-btn
      round
      flat
      dense
      icon="call"
      class="header-action-btn"
      @click="startAudioCall"
    >
      <q-tooltip class="bg-dark">Audio Call</q-tooltip>
    </q-btn>

    <!-- Video Call -->
    <q-btn
      round
      flat
      dense
      icon="videocam"
      class="header-action-btn"
      @click="startVideoCall"
    >
      <q-tooltip class="bg-dark">Video Call</q-tooltip>
    </q-btn>
  </div>
</div>
    <div class="messages-wrapper">
      <div id="messages" class="col q-pa-md chat-box">
        <div
          v-for="msg in messages"
          :key="msg._id"
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

    <div class="row items-center q-pa-sm input-box">
      <!-- Hidden File Input -->
      <q-file
        v-model="selectedFiles"
        ref="filePicker"
        multiple
        append
        style="display: none"
        @update:model-value="handleFileSelect"
      />

      <!-- Input Wrapper -->
      <div class="message-input-wrapper row items-center col">
        <!-- Attachment -->
        <q-btn
          round
          flat
          dense
          icon="attach_file"
          class="attach-btn"
          @click="openFilePicker"
        />

        <!-- Message Input -->
        <q-input
          v-model="userMessage"
          placeholder="Type a message"
          borderless
          dense
          class="col message-input"
          @keyup.enter="handleSend"
          @update:model-value="handleTyping(conversationId, selectedUserId)"
        />
      </div>

      <!-- Send Button -->
      <q-btn round icon="send" class="send-btn q-ml-sm" @click="handleSend" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useAuthStore } from "../stores/auth";
import { useUserStore } from "../stores/user";
import { useUploadStore } from "../stores/upload";
import { useSocket } from "../composables/useSocket";
import { scrollToBottom } from "../utils";
import AttachmentPreview from "../components/AttachmentPreview.vue";

const {
  sendMessage,
  handleTyping,
  onlineUsers,
  isTyping,
} = useSocket();

const auth = useAuthStore();
const userStore = useUserStore();
const uploadStore = useUploadStore();
const emit = defineEmits(["start-call"]);

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

const startAudioCall = async () => {
  emit("start-call", false);
}

const startVideoCall = async () => {
  emit("start-call", true);
}

const openFilePicker = () => {
  filePicker.value.pickFiles();
};

const handleFileSelect = async (files) => {
  if (!files || !files.length) return;

  selectedFiles.value = [...files];
};

const removeSelectedFile = (index) => {
  selectedFiles.value.splice(index, 1);
};

// ✅ Send message
const handleSend = async () => {
  if (!userMessage.value.trim() && !selectedFiles.value.length) return;

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
  } catch (err) {
    console.error("Send failed", err);
  }
};

watch(messages,scrollToBottom,{deep:true});
</script>

<style scoped>
/* =========================
   CHAT HEADER
========================= */

.chat-header {
  height: 72px;
  padding-inline: 14px;

  background: rgba(15, 23, 42, 0.78);

  backdrop-filter: blur(16px);

  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  position: sticky;
  top: 0;
  z-index: 20;
}

/* Avatar */

.chat-icon {
  background: linear-gradient(
    135deg,
    #22c55e,
    #16a34a
  );

  box-shadow: 0 4px 14px rgba(34, 197, 94, 0.35);
}

/* User Info */

.user-info {
  display: flex;
  flex-direction: column;
}

.username {
  color: #f8fafc;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
}

.typing-text {
  color: #22c55e;
  font-size: 12px;
  font-weight: 600;
  margin-top: 2px;
}

.online-status {
  color: #94a3b8;
  font-size: 12px;
  margin-top: 2px;
}

/* Header Buttons */

.header-action-btn,
.back-btn {
  color: #cbd5e1;

  transition: all 0.22s ease;
}

.header-action-btn:hover,
.back-btn:hover {
  background: rgba(255, 255, 255, 0.06);

  color: #22c55e;

  transform: scale(1.05);
}

/* Mobile */

@media (max-width: 600px) {
  .chat-header {
    height: 66px;
    padding-inline: 10px;
  }

  .username {
    font-size: 14px;
  }

  .header-action-btn {
    width: 36px;
    height: 36px;
  }
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

  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.12) transparent;
  scroll-behavior: smooth;
}

#messages::-webkit-scrollbar {
  width: 6px;
}

#messages::-webkit-scrollbar-track {
  background: transparent;
}

#messages::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);

  border-radius: 10px;

  transition: background 0.3s ease;
}

#messages::-webkit-scrollbar-thumb:hover {
  background: rgba(34, 197, 94, 0.35);
}

/* =========================
   CHAT BUBBLES
========================= */

.chat-bubble {
  padding: 10px 14px;
  border-radius: 14px;
  max-width: 65%;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

/* Sent message */

.sent {
  background: linear-gradient(135deg,#22c55e, #16a34a);
  color: white;
}

/* Received message */

.received {
  background: rgba(255, 255, 255, 0.06);
  color: #e2e8f0;
  backdrop-filter: blur(6px);
}
.message-text {
  white-space: pre-wrap;

  word-break: break-word;
}
.input-box {
  padding: 12px;

  background: rgba(15, 23, 42, 0.92);

  backdrop-filter: blur(18px);

  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.message-input-wrapper {
  display: flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.25s ease;
}
.message-input-wrapper:focus-within {
   border-color: rgba(34, 197, 94, 0.45);
}
.message-input {
  padding-left: 8px;
}
.message-input :deep(input) {
  color: #f8fafc !important;
  font-size: 15px;
}
.message-input :deep(input::placeholder) {
  color: #94a3b8;
}

/* Remove Quasar background */

.message-input :deep(.q-field__control),
.message-input :deep(.q-field__native) {
  background: transparent !important;

  box-shadow: none !important;
}

.attach-btn {
  color: #94a3b8;

  transition: all 0.25s ease;
}

.attach-btn:hover {
  color: #22c55e;

  background: rgba(34, 197, 94, 0.1);

  transform: rotate(-12deg);
}
.send-btn {
  width: 48px;
  height: 48px;

  background: linear-gradient(135deg,#22c55e,#16a34a);
  color: white;
  transition: all 0.25s ease;
}

.send-btn:hover {
  transform: scale(1.05);
}

.send-btn :deep(.q-icon) {
  font-size: 20px;
}

.selected-file {
  background: rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  color: #e2e8f0;
  backdrop-filter: blur(8px);
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
  border-radius: 12px;
  object-fit: cover;

  cursor: pointer;
  transition: transform 0.25s ease;
}

.chat-video {
  width: 100%;
  max-width: 320px;

  border-radius: 12px;
}

.chat-audio {
  width: 260px;
}

.file-link {
  display: inline-flex;
  align-items: center;

  gap: 8px;

  padding: 10px 12px;

  border-radius: 12px;

  text-decoration: none;
  color: white;

  background: rgba(255, 255, 255, 0.08);
  transition: all 0.25s ease;
}

.file-link:hover {
  background: rgba(255, 255, 255, 0.12);
}

</style>
