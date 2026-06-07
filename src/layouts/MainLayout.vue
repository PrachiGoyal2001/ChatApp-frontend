<template>
  <q-layout view="lHh Lpr lFf" class="app-bg">
    <q-header
      elevated
      class="header"
      v-if="callStore.isCallActive || !($q.screen.lt.md && route.params.userId)"
    >
      <q-toolbar>
        <q-toolbar-title color="white"> Chat App </q-toolbar-title>
        <q-btn round dense flat icon="search" to="/search" class="header-btn" />
        <q-btn
          round
          dense
          flat
          icon="account_circle"
          to="/profile"
          class="header-btn"
        />
      </q-toolbar>
    </q-header>
    <q-page-container>
      <router-view />
    </q-page-container>
    <GlobalCallManager />
  </q-layout>
</template>

<script setup>
import { onMounted, watch, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useUserStore } from "../stores/user";
import { useCallStore } from "../stores/callStore";
import { useSocket } from "src/composables/useSocket";
import GlobalCallManager from "../components/GlobalCallManager.vue";

const authStore = useAuthStore();
const userStore = useUserStore();
const callStore = useCallStore();
const route = useRoute();
const { connect, onMessage } = useSocket();
let unsubscribe;

const connectSocket = (userId) => {
  if (!userId) return;
  authStore.checkAuth();
  connect(userId);
};

watch(
  () => authStore.userId,
  (userId) => {
    connectSocket(userId);
    unsubscribe = onMessage((data) => {
      userStore.handleIncomingMessage(data);
    });
  },
);

onMounted(() => {
  if (authStore.userId) {
    connectSocket(authStore.userId);
    unsubscribe = onMessage((data) => {
      userStore.handleIncomingMessage(data);
    });
  }
});

onUnmounted(() => {
  unsubscribe && unsubscribe();
  console.log("in unmounted", cleanupCall);
  callStore.cleanupCall();
});
</script>

<style scoped>
.app-bg {
  background: radial-gradient(circle at 20% 20%, #020617, #020617 80%);
}
.header {
  z-index: 10000;
  background: linear-gradient(
    90deg,
    rgba(15, 23, 42, 0.98),
    rgba(17, 24, 39, 0.95)
  );
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  color: #f8fafc;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
}

.header :deep(.q-toolbar__title) {
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: #9e9e9e;
}

.header-btn {
  color: #94a3b8;
  transition: all 0.25s ease;
}

.header-btn:hover,
.header-btn.q-router-link--active {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.12);
  transform: scale(1.05);
}
</style>
