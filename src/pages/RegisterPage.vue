<template>
  <div class="auth-page">
    <AuthForm form-type="register" @submit="register" />
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import AuthForm from "../components/AuthForm.vue";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();

const register = async (credentials) => {
  if (!credentials.username || !credentials.password || !credentials.email) {
    return $q.notify({
      type: "negative",
      message: "Please fill all fields",
    });
  }

  try {
    const { data } = await authStore.register(credentials);

    $q.notify({
      type: "positive",
      message: data.message || "Registration successful",
    });

    router.push("/");
  } catch (err) {
    $q.notify({
      type: "negative",
      message:
        err.response?.data?.message || "Registration failed",
    });
  }
};
</script>

<style scoped>
.auth-page {
  height: calc(100dvh - 51px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;

  background: radial-gradient(circle at top, #0f172a, #020617);
  color: #e2e8f0;
}
</style>
