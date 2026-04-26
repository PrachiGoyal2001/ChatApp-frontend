<template>
  <q-layout view="lHh Lpr lFf" class="app-bg">
    <q-header elevated class="header">
      <q-toolbar>
        <q-toolbar-title color="white"> Chat App </q-toolbar-title>
        <!-- ✅ Logout Button -->
        <q-btn
          round
          dense
          flat
          icon="logout"
          @click="logout"
          class="logout-btn"
        >
          <q-tooltip>Logout</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import { useAuthStore } from "../stores/auth";
import { useRouter } from "vue-router";
import { useSocket } from "../composables/useSocket";
import { useUserStore } from "../stores/user";

const { connect, disconnect, onMessage } = useSocket();
const auth = useAuthStore();
const userStore = useUserStore();
const router = useRouter();
let unsubscribe;

const logout = async () => {
  await auth.logout();
  disconnect();
  router.push("/login");
};
onMounted(() => {
  if (auth.userId) {
    connect(auth.userId);
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
  background: radial-gradient(circle at 20% 20%, #020617, #020617 80%);
}
.header {
  color: #94a3b8;
  font-weight: 600;
  letter-spacing: 0.5px;
  background: rgba(255, 255, 255, 0.04);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}
.logout-btn {
  color: #94a3b8;
}
</style>
