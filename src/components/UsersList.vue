<template>
  <q-list separator class="q-pt-sm">
    <q-item
      v-for="user in users"
      :key="user._id"
      clickable
      v-ripple
      class="user-item"
      :class="{ active: route.params.userId === user.otherUser?._id }"
      @click="selectUser(user)"
    >
      <q-item-section avatar>
        <q-avatar size="32px" class="avatar" text-color="white">
          {{ user.otherUser?.username?.charAt(0)?.toUpperCase() }}
        </q-avatar>
      </q-item-section>
      <q-item-section>
        <q-item-label class="text-body2">
          {{ user.otherUser.username }}
        </q-item-label>
        <q-item-label class="text-body2" v-if="user.lastMessage">
          {{ user.lastMessage?.text }}
        </q-item-label>
      </q-item-section>
      <q-item-section side top v-if="user.lastMessage">
        <q-item-label caption class="text-grey-6">
          {{ formatTime(user.lastMessage?.createdAt) }}
        </q-item-label>
      </q-item-section>
      <q-item-section side>
        <q-badge
          v-if="
            user.unreadCount > 0 && route.params.userId != user.otherUser._id
          "
          color="red"
          floating
        >
          {{ user.unreadCount }}
        </q-badge>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useUserStore } from "../stores/user";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const users = computed(() => userStore.users);

const getUsers = async () => {
  try {
    await userStore.getUsers();
  } catch (err) {
    console.error("Error fetching users:", err);
  }
};

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

const selectUser = (user) => {
  userStore.setSelectedUser({
    userId: user.otherUser._id,
    conversationId: user._id,
    username:user.otherUser?.username
  });
  router.push(`/${user.otherUser._id}`);
};

onMounted(async() => {
  await getUsers();
  if (route.params.userId) {
    const user = users.value.find(
      (user) => user.otherUser._id === route.params.userId,
    );

    if (user) {
      selectUser(user);
    }
  }
});
</script>

<style scoped>
/* User Item */
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

/* Active User */
.user-item.active {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.4);
}

/* Username */
.user-item .q-item__label {
  color: #e2e8f0;
}

/* Last Message */
.user-item .text-body2 {
  color: #94a3b8;
}

.avatar {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}
</style>
