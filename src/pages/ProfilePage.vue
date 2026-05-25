<template>
  <q-page class="profile-page">
    <section class="profile-shell">
      <q-btn
        flat
        dense
        icon="arrow_back"
        label="Back to chats"
        class="back-btn"
        @click="router.push('/')"
      />

      <q-card class="profile-card">
        <div v-if="loading" class="profile-state">
          <q-spinner color="positive" size="42px" />
        </div>
        <div v-else-if="error" class="profile-state">
          <q-icon name="error_outline" size="42px" color="negative" />
          <div class="state-title">Profile unavailable</div>
          <div class="state-copy">{{ error }}</div>
          <q-btn
            unelevated
            icon="refresh"
            label="Try again"
            class="primary-btn"
            @click="loadProfile"
          />
        </div>

        <div v-else>
          <div class="profile-hero">
            <q-avatar size="92px" class="profile-avatar">
              {{ profileInitial }}
            </q-avatar>

            <div class="profile-title">
              <h1>{{ profile.username }}</h1>
              <p>{{ profile.email }}</p>
            </div>
          </div>

          <div class="profile-actions">
            <q-btn
              unelevated
              icon="logout"
              label="Logout"
              class="logout-btn"
              :loading="loggingOut"
              @click="logout"
            />
          </div>
        </div>
      </q-card>
    </section>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useSocket } from "../composables/useSocket";
import * as userService from "../services/userService";

const router = useRouter();
const authStore = useAuthStore();
const { disconnect } = useSocket();

const profile = ref(null);
const loading = ref(true);
const loggingOut = ref(false);
const error = ref("");

const profileInitial = computed(() => {
  return profile.value?.username?.charAt(0)?.toUpperCase() || "?";
});

const loadProfile = async () => {
  loading.value = true;
  error.value = "";

  try {
    const { data } = await userService.fetchProfile();
    profile.value = data;
  } catch (err) {
    error.value = err.response?.data?.message || "Could not load your profile details.";
  } finally {
    loading.value = false;
  }
};

const logout = async () => {
  loggingOut.value = true;

  try {
    await authStore.logout();
    disconnect();
    router.replace("/login");
  } finally {
    loggingOut.value = false;
  }
};

onMounted(loadProfile);
</script>

<style scoped>
.profile-page {
  min-height: calc(100dvh - 51px);
  padding: 32px 16px;
  background: radial-gradient(circle at top, #0f172a, #020617);
  color: #e2e8f0;
}

.profile-shell {
  width: min(100%, 400px);
  margin: 0 auto;
}

.back-btn {
  margin-bottom: 16px;
  color: #94a3b8;
}

.back-btn:hover {
  color: #22c55e;
}

.profile-card {
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.88);
  color: #e2e8f0;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.42);
}

.profile-hero {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  justify-content: center;
  padding: 36px 28px 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(2, 6, 23, 0.34);
  text-align: center;
}

.profile-avatar {
  flex: 0 0 auto;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #ffffff;
  font-size: 38px;
  font-weight: 700;
}

.profile-title {
  min-width: 0;
  width: 100%;
}

.profile-title h1 {
  margin: 0;
  color: #ffffff;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.profile-title p {
  margin: 8px 0 0;
  color: #94a3b8;
  font-size: 15px;
  overflow-wrap: anywhere;
}

.profile-actions {
  display: flex;
  justify-content: center;
  padding: 28px 24px;
}

.logout-btn {
  width: 100%;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #ffffff;
}

.primary-btn {
  background: #22c55e;
  color: #052e16;
}

.profile-state {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
  justify-content: center;
  padding: 28px;
  text-align: center;
}

.state-title {
  color: #ffffff;
  font-size: 20px;
  font-weight: 700;
}

.state-copy {
  max-width: 360px;
  color: #94a3b8;
}

@media (max-width: 600px) {
  .profile-page {
    padding: 20px 12px;
  }

  .profile-hero {
    padding: 24px;
  }

  .profile-title h1 {
    font-size: 24px;
  }

}
</style>
