<template>
  <div class="auth-page">
    <AuthForm form-type="login" @submit="login"/>
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


const login = async (credentials) => {
  if (!credentials.username || !credentials.password) {
    return $q.notify({ type: "negative", message: "Fill all fields" });
  }

  try {
    const { data } = await authStore.login(credentials);
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
  height: calc(100dvh - 51px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;

  background: radial-gradient(circle at top, #0f172a, #020617);
  color: #e2e8f0;
}
</style>
