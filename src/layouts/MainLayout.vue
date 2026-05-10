<template>
  <q-layout view="lHh Lpr lFf" class="app-bg">
    <q-header elevated class="header" v-if="!($q.screen.lt.md && route.params.userId)">
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
          v-if="!isAuthPage"
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
import {computed} from "vue";
import {useRoute} from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useSocket } from "../composables/useSocket";

const { disconnect } = useSocket();
const authStore = useAuthStore();
const route = useRoute();

const isAuthPage =computed(()=>["/register","/login"].includes(route.path)); 

const logout = async () => {
  await authStore.logout();
  disconnect();
  window.location.href="/login";
};
</script>

<style scoped>
.app-bg {
  background: radial-gradient(circle at 20% 20%, #020617, #020617 80%);
}
.header {
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

.logout-btn {
  color: #94a3b8;
  transition: all 0.25s ease;
}

.logout-btn:hover {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.12);

  transform: scale(1.05);
}
</style>
