<template>
  <div class="app-bg"   :class="{
    'app-bg-mobile-chat': $q.screen.lt.md && route.params.userId
  }"
 >
    <div class="main-card row">
      <!-- Left Sidebar: Users List -->

      <div
        v-if="!$q.screen.lt.md || !route.params.userId"
        class="sidebar col-12 col-md-3"
      >
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
        <div class="col right-view" v-if="!route.params.userId">
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
import { useAuthStore } from "../stores/auth";
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
  height: calc(100vh - 51px);
  background: radial-gradient(circle at 20% 20%, #020617, #020617 80%);
}

.main-card {
  display: flex;
  height: 100%;

  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(12px);

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
.right-view {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}
/* Mobile chat opened */
.app-bg-mobile-chat {
  height: 100vh;
}
</style>
