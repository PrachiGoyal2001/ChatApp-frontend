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

        <!-- User List -->
        <div class="col">
          <UsersList />
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
import { onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import {useAuthStore} from "../stores/auth";
import { useUserStore } from "../stores/user";
import UsersList from "../components/UsersList.vue";
import { useSocket } from "../composables/useSocket";

const { connect, onMessage } = useSocket();

const route = useRoute();
const userStore = useUserStore();
const authStore = useAuthStore();
let unsubscribe;

onMounted(async () => {
  if (authStore.userId) {
    connect(authStore.userId);
    unsubscribe = onMessage((data) => {
      userStore.handleIncomingMessage(data);
    });
  }
});
onUnmounted(() => {
  unsubscribe && unsubscribe();
});
</script>

<style scoped>
.app-bg {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;

  background: radial-gradient(circle at 20% 20%, #020617, #020617 80%);
}

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

.header {
  color: #94a3b8;
}

/* Chat Section */
.chat-section {
  background: transparent;
}
</style>
