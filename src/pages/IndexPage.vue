<template>
  <div class="app-bg">
    <div class="main-card row">
      <!-- Left Sidebar: Users List -->

      <div
        v-if="!$q.screen.lt.md || !route.params.userId"
        class="sidebar col-12 col-md-3"
      >
        <!-- Sidebar Header -->
        <div class="header text-center" style="padding: 14px">
          <q-icon name="people" size="sm" class="q-mr-sm" />
          Users
        </div>
        <!-- <q-separator style="border-bottom: 1px solid rgba(255, 255, 255, 0.08);"/> -->

        <!-- User List -->
        <div class="col">
          <q-list separator>
            <q-item
              v-for="user in users"
              :key="user._id"
              clickable
              v-ripple
              class="user-item"
              :class="{ active: route.params.userId === user._id }"
              @click="selectUser(user)"
            >
              <q-item-section avatar>
                <q-avatar size="32px" class="avatar" text-color="white">
                  {{ user.username.charAt(0).toUpperCase() }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-body2">
                  {{ user.username }}
                </q-item-label>
                <q-item-label class="text-body2" v-if="user.lastMessage">
                  {{ user.lastMessage.content }}
                </q-item-label>
              </q-item-section>
              <q-item-section side top v-if="user.lastMessage">
                <q-item-label caption class="text-grey-6">
                  {{ formatTime(user.lastMessage.time) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </div>

      <!-- 🔵 Chat Section -->
      <div
        v-if="!$q.screen.lt.md || route.params.userId"
        class="col-12 col-md column full-height chat-section"
      >
        <div class="col" v-if="!route.params.userId">
          Select the user you want to chat with
        </div>
        <router-view class="col full-height" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useUserStore } from "../stores/user";
import { getUsersApi } from "../api/userApi";
import { useSocket } from "../composables/useSocket";

const router = useRouter();
const route = useRoute();

const authStore = useAuthStore();
const userStore = useUserStore();
const { onMessage } = useSocket();

const users = computed(() => userStore.users);

// ✅ Format Time (keep as utility-like function)
const formatTime = (time) => {
  if (!time) return "";

  const date = new Date(time);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString("en-IN");
};

// ✅ Fetch users from API layer
const fetchUsers = async () => {
  try {
    const { data } = await getUsersApi()
    userStore.setUsers(data.filter((u) => u._id !== authStore.userId));
  } catch (err) {
    console.error("Error fetching users:", err);
  }
};

// ✅ Select user
const selectUser = async (user) => {
  await userStore.setSelectedUser(user._id);
  router.push(`/${user._id}`);
};

// ✅ Lifecycle
onMounted(async () => {
  await fetchUsers();

  // Listen to socket messages instead of window events
  onMessage((data) => {
    userStore.updateLastMessage({
      userId: data.from,
      message: data.message,
      time: data.createdAt,
    });
  });
});
</script>

<style scoped>
/* 🌌 Background */
.app-bg {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 🧊 Main Glass Card */
.main-card {
  width: 95%;
  height: calc(100vh - 40px);

  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(12px);

  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);

  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  background: rgba(255, 255, 255, 0.04);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
}

/* 👤 User Item */
.user-item {
  border-radius: 12px;
  margin: 6px;
  padding: 10px;
  transition: all 0.3s ease;
}

/* Hover */
.user-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

/* 🟢 Active User */
.user-item.active {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.4);
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.2);
}

/* Username */
.user-item .q-item__label {
  color: #e2e8f0;
}

/* Last Message */
.user-item .text-body2,
.header {
  color: #94a3b8;
}

/* Chat Section */
.chat-section {
  background: transparent;
}
.avatar {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}
</style>
