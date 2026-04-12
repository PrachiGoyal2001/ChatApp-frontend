<template>
  <div class="auth-page">
    <RegisterForm form-type="register" @submit="register" />
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import RegisterForm from "../components/RegisterForm.vue";
import { registerApi } from "../api/authApi"; // ✅ API layer
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();

const register = async ({ username, password, email }) => {
  // ✅ Validation
  if (!username || !password || !email) {
    return $q.notify({
      type: "negative",
      message: "Please fill all fields",
    });
  }

  try {
    const { data } = await registerApi({
      username,
      password,
      email,
    });

    // ✅ optional: store credentials for auto-fill login
    authStore.setCredentials({ username, password });

    $q.notify({
      type: "positive",
      message: data.message || "Registration successful",
    });

    router.push("/login");
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
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;

  background: radial-gradient(circle at top, #0f172a, #020617);
  color: #e2e8f0;
}
</style>
