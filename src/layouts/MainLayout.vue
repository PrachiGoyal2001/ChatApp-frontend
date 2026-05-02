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
