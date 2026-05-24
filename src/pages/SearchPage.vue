<template>
  <q-page class="search-page">
    <section class="search-shell">
      <q-btn
        flat
        dense
        icon="arrow_back"
        label="Back to chats"
        class="back-btn"
        @click="router.push('/')"
      />

      <div class="search-panel">
        <q-input
          v-model="query"
          label="Search users"
          outlined
          dense
          rounded
          :loading="loading"
          class="q-mb-md search-input input-field"
          @update:model-value="search"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>

        <div v-if="loading" class="search-state">
          <q-spinner color="positive" size="36px" />
        </div>

        <div v-else-if="error" class="search-state">
          <q-icon name="error_outline" color="negative" size="36px" />
          <div>{{ error }}</div>
        </div>

        <div v-else-if="showEmptyState" class="search-state">
          <q-icon name="person_search" size="40px" />
          <div>{{ emptyStateText }}</div>
        </div>

        <q-list v-else separator class="result-list">
          <q-item
            v-for="user in users"
            :key="user._id"
            clickable
            v-ripple
            class="result-item"
            @click="selectUser(user)"
          >
            <q-item-section avatar>
              <q-avatar size="40px" class="avatar" text-color="white">
                {{ user.username?.charAt(0)?.toUpperCase() }}
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label>{{ user.username }}</q-item-label>
              <q-item-label caption>{{ user.email }}</q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-btn
                round
                dense
                flat
                icon="add_comment"
                class="select-btn"
                :loading="selectedUserId === user._id"
                @click.stop="selectUser(user)"
              >
                <q-tooltip>Start chat</q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </section>
  </q-page>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../stores/user";
import * as userService from "../services/userService";

const router = useRouter();
const userStore = useUserStore();

const query = ref("");
const users = ref([]);
const loading = ref(false);
const error = ref("");
const selectedUserId = ref(null);
let searchRequestId = 0;

const MIN_SEARCH_LOADER_TIME = 450;

const trimmedQuery = computed(() => query.value.trim());
const showEmptyState = computed(() => !loading.value && users.value.length === 0);
const emptyStateText = computed(() => {
  return trimmedQuery.value ? "No users found" : "Search by username or email";
});

const search = async () => {
  const requestId = ++searchRequestId;

  error.value = "";
  users.value = [];

  if (!trimmedQuery.value) {
    loading.value = false;
    return;
  }

  loading.value = true;
  const loadingStartedAt = Date.now();

  try {
    const { data } = await userService.searchUsers(trimmedQuery.value);
    await waitForMinimumLoaderTime(loadingStartedAt);
    if (requestId !== searchRequestId) return;
    users.value = data;
  } catch (err) {
    await waitForMinimumLoaderTime(loadingStartedAt);
    if (requestId !== searchRequestId) return;
    error.value = err.response?.data?.message || "Search failed";
  } finally {
    if (requestId === searchRequestId) {
      loading.value = false;
    }
  }
};

const waitForMinimumLoaderTime = (startedAt) => {
  const remainingTime = MIN_SEARCH_LOADER_TIME - (Date.now() - startedAt);

  if (remainingTime <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    setTimeout(resolve, remainingTime);
  });
};

const selectUser = async (user) => {
  selectedUserId.value = user._id;

  try {
    const { data: conversation } = await userService.startConversation(user._id);
    userStore.addOrUpdateUser(conversation);
    userStore.setSelectedUser({
      userId: conversation.otherUser._id,
      conversationId: conversation._id,
      username: conversation.otherUser.username,
    });
    router.push(`/${conversation.otherUser._id}`);
  } catch (err) {
    error.value = err.response?.data?.message || "Could not start chat";
  } finally {
    selectedUserId.value = null;
  }
};
</script>

<style scoped>
.search-page {
  min-height: calc(100dvh - 51px);
  padding: 32px 16px;
  background: radial-gradient(circle at top, #0f172a, #020617);
  color: #e2e8f0;
}

.search-shell {
  width: min(100%, 400px);
  margin: 0 auto;
}

.back-btn {
  margin-bottom: 16px;
  color: #94a3b8;
}

.back-btn:hover {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.search-panel {
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.88);
  color: #e2e8f0;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.42);
}

.search-input {
  padding: 18px;
}

.input-field :deep(.q-field__control) {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s ease;
}

.input-field :deep(input) {
  color: #e2e8f0 !important;
}

.input-field :deep(input::placeholder) {
  color: #94a3b8;
}

.input-field :deep(.q-field__label),
.input-field :deep(.q-field__prepend) {
  color: #94a3b8 !important;
}

.input-field :deep(.q-field--focused .q-field__control) {
  border: 1px solid #22c55e;
  box-shadow: 0 0 0 1px #22c55e, 0 0 15px rgba(34, 197, 94, 0.3);
}

.input-field :deep(input:focus) {
  outline: none !important;
  box-shadow: none !important;
}

.result-list {
  background: transparent;
}

.result-item {
  padding: 14px 18px;
  color: #e2e8f0;
}

.result-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.result-item :deep(.q-item__label--caption) {
  color: #94a3b8;
}

.avatar {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}

.select-btn {
  color: #94a3b8;
}

.select-btn:hover {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.12);
}

.search-state {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  justify-content: center;
  padding: 28px;
  color: #94a3b8;
  text-align: center;
}

@media (max-width: 600px) {
  .search-page {
    padding: 20px 12px;
  }

  .search-input {
    padding: 14px;
  }
}
</style>
