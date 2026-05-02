<template>
  <div class="auth-card">
    <h5 class="form-title">{{ formTitle }}</h5>

    <form @submit.prevent="handleSubmit">
      <q-input
        v-model="credentials.username"
        label="Username"
        outlined
        dense
        rounded
        class="q-mb-md input-field"
      />

      <q-input
        v-if="formType === 'register'"
        v-model="credentials.email"
        label="Email"
        type="email"
        outlined
        dense
        rounded
        class="q-mb-md input-field"
      />

      <q-input
        v-model="credentials.password"
        label="Password"
        type="password"
        outlined
        dense
        rounded
        class="q-mb-md input-field"
      />

      <q-btn
        :label="formTitle"
        class="submit-btn"
        type="submit"
        unelevated
        rounded
      />

      <div class="switch-text">
        {{
          formType === "login"
            ? "Don’t have an account?"
            : "Already have an account?"
        }}

        <router-link
          :to="formType === 'login' ? '/register' : '/login'"
          class="switch-link"
        >
          {{ formType === "login" ? "Register" : "Login" }}
        </router-link>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const credentials = ref({});

const props = defineProps({
  formType: {
    type: String,
    default: "login",
  },
});

const emit = defineEmits(["submit"]);

const formTitle = computed(() =>
  props.formType.charAt(0).toUpperCase() + props.formType.slice(1)
);

const handleSubmit = () => {
  emit("submit", credentials.value);
};
</script>

<style scoped>
.auth-card {
  width: 100%;
  max-width: 420px;
  padding: 32px 24px;
  border-radius: 20px;

  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(12px);

  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  animation: fadeIn 0.4s ease-in-out;
}

/* Title */
.form-title {
  text-align: center;
  font-weight: 600;
  margin-bottom: 24px;
  color: #22c55e; /* soft green like reference */
}

/* INPUTS */
.input-field :deep(.q-field__control) {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);

  transition: all 0.3s ease;
}

/* Input text */
.input-field :deep(input) {
  color: #e2e8f0 !important;
}

/* Placeholder */
.input-field :deep(input::placeholder) {
  color: #94a3b8;
}

/* Label */
.input-field :deep(.q-field__label) {
  color: #94a3b8 !important;
}

/* Focus effect (important) */
.input-field :deep(.q-field--focused .q-field__control) {
  border: 1px solid #22c55e;
  box-shadow: 0 0 0 1px #22c55e, 0 0 15px rgba(34, 197, 94, 0.3);
}

/* Remove blue outline completely */
.input-field :deep(input:focus) {
  outline: none !important;
  box-shadow: none !important;
}

/* Button */
.submit-btn {
  width: 100%;
  margin-top: 16px;
  padding: 10px;

  border-radius: 999px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  font-weight: 600;

  transition: all 0.3s ease;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(34, 197, 94, 0.4);
}

/* Bottom text */
.switch-text {
  margin-top: 16px;
  text-align: center;
  font-size: 13px;
  color: #94a3b8;
}

/* Link */
.switch-link {
  margin-left: 5px;
  font-weight: 600;
  color: #22c55e;
  text-decoration: none;
}

.switch-link:hover {
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 480px) {
  .auth-card {
    padding: 24px 16px;
  }
}

/* Animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
