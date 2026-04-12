<template>
  <div class="auth-page">
    <register-form form-type="login" :initial-values="authStore.credentials" @submit="login"/>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import RegisterForm from "../components/RegisterForm.vue";
import { loginApi } from "../api/authApi";
import { useAuthStore } from "../stores/auth"; // ✅ ADD THIS

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore(); // ✅ ADD THIS

const login = async ({ username, password }) => {
  if (!username || !password) {
    return $q.notify({ type: "negative", message: "Fill all fields" });
  }

  try {
    const { data } = await loginApi({ username, password });

    $q.notify({ type: "positive", message: data.message });
    router.push("/");
  } catch (err) {
    $q.notify({
      type: "negative",
      message: err.response?.data?.message || "Login failed",
    });
  }
};
</script>


<style scoped>
/* Background */
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
