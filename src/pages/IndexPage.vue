<template>
  <q-page class="flex flex-center bg-grey-2 q-pa-md">
    <div
      class="row bg-white rounded-borders shadow-3 w-100"
      style="height: 85vh; max-width: 1200px"
    >
      <!-- Left Sidebar: Users List -->
      <div
        class="col-4 bg-grey-1 column"
        style="border-right: 1px solid #ddd"
      >
        <!-- Sidebar Header -->
        <div class="q-pa-sm text-bold text-primary text-center">
          <q-icon name="people" size="sm" class="q-mr-sm" />
          Users
        </div>
        <q-separator />

        <!-- Scrollable user list -->
        <div class="col scroll">
          <q-list padding separator>
            <q-item
              v-for="user in users"
              :key="user._id"
              clickable
              v-ripple
              class="q-pa-sm rounded-borders"
              @click="selectUser(user)"
            >
              <q-item-section avatar>
                <q-avatar size="32px" color="primary" text-color="white">
                  {{ user.username.charAt(0).toUpperCase() }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-body2">
                  {{ user.username }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </div>

      <!-- Right Section: Chat Area -->
      <div class="col column">
        <!-- Chat Header -->
        <div
          class="row items-center q-pa-sm bg-grey-3 text-dark"
          style="border-bottom: 1px solid #ddd"
        >
          <q-avatar size="36px" color="primary" text-color="white">
            <q-icon name="chat" />
          </q-avatar>
          <div class="q-ml-sm">
            <div class="text-subtitle1">Chat Room</div>
            <div class="text-caption text-grey">{{selectedUser?._id}}</div>
          </div>
        </div>
        <!-- Messages Section -->
        <div
          id="messages"
          class="col scroll q-pa-md"
          style="overflow-y: auto; flex: 1; background: #f9f9f9"
        >
          <div
            v-for="(msg, index) in messages"
            :key="index"
            class="q-mb-sm"
            :class="msg.senderId._id === loggedInUserId ? 'flex justify-end' : 'flex justify-start'"
          >
            <div
              class="q-pa-sm q-px-md rounded-borders shadow-1"
              :class="msg.senderId._id === loggedInUserId
                ? 'bg-primary text-white'
                : 'bg-grey-3 text-dark'"
              style="max-width: 65%"
            >
              {{ msg.content }}
            </div>
          </div>
        </div>

        <!-- Input Area (sticky at bottom) -->
        <div
          class="row items-center q-pa-sm q-gutter-sm bg-white"
          style="border-top: 1px solid #ddd"
        >
          <q-input
            v-model="userMessage"
            placeholder="Type a message..."
            outlined
            dense
            rounded
            class="col"
            @keyup.enter="messageSend"
          >
            <template v-slot:append>
              <q-icon name="mood" class="cursor-pointer" />
            </template>
          </q-input>
          <q-btn
            round
            color="primary"
            icon="send"
            unelevated
            @click="messageSend"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, nextTick, onMounted } from "vue";
import axios from "axios";

const userMessage = ref("");
const messages = ref([]);
const users = ref([]);
const selectedUser= ref(null);
const loggedInUserId= ref('');

// ✅ WebSocket setup
const ws = new WebSocket("ws://localhost:3000");
// const ws = new WebSocket("wss://chatapp-backend-v4hm.onrender.com");// Prachi

ws.onopen = () => {
  //registered user send to server
  console.log('connected to server');
  ws.send(JSON.stringify({ type: "register", userId: localStorage.getItem('loggedInUserId')}));
  // ws.send(JSON.stringify({ type: "register", userId: localStorage.getItem('loggedInUserId') }));
};
//onMessage function is called when received message from server
ws.onmessage = () => {
  fetchMessages();
  // messages.value.push({ sender: "server", ...JSON.parse(event.data) });
  scrollToBottom();
};

ws.onclose = () => {
  console.log("Disconnected from server");
};

const messageSend = () => {
  if (userMessage.value.trim() !== "") {
    // messages.value.push({ sender: "user", message:userMessage.value });
    ws.send(
    JSON.stringify({
      type: "private_message",
      from: localStorage.getItem('loggedInUserId'),
      to: selectedUser.value._id,
      message:userMessage.value,
    })
  );
    fetchMessages();
    userMessage.value = "";
    scrollToBottom();
  }
};

// ✅ Auto-scroll to bottom
const scrollToBottom = () => {
  nextTick(() => {
    const container = document.getElementById("messages");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  });
};

// ✅ Fetch users
const fetchUsers = async () => {
  try {
    const res = await axios.get("http://localhost:3000/users", {
      withCredentials: true,
    });
    users.value = res.data;
    console.log('all users', users.value);
  } catch (err) {
    console.error("Error fetching users:", err);
  }
};

//fetch Messages
const fetchMessages = async ()=>{
  try {
    const res = await axios.get(`http://localhost:3000/messages/${selectedUser.value._id}`, {
      withCredentials: true,
    });
    messages.value = res.data;
    console.log('all messages between the two participants', messages.value);
  } catch (err) {
    console.error("Error fetching users:", err);
  }
}

const selectUser=(user)=>{
  selectedUser.value=user;
  fetchMessages();
}

onMounted(() => {
  loggedInUserId.value = localStorage.getItem('loggedInUserId')
  fetchUsers();
});
</script>
