<template>
  <q-page class="flex flex-center bg-grey-2 q-pa-md">
    <div class="column bg-white rounded-borders shadow-2 w-100 q-pa-lg" style="max-width: 400px">
      <h5 class="text-center q-mb-lg">Register</h5>

      <q-input
        v-model="username"
        label="Username"
        outlined
        dense
        rounded
        class="q-mb-md"
      />

      <q-input
        v-model="password"
        label="Password"
        type="password"
        outlined
        dense
        rounded
        class="q-mb-md"
      />

      <q-btn
        label="Register"
        color="primary"
        rounded
        unelevated
        class="full-width q-mt-md"
        @click="register"
      />

      <div class="text-caption text-center q-mt-md">
        Already have an account?
        <router-link to="/login" class="text-primary">Login</router-link>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import { useQuasar } from "quasar";

const $q = useQuasar();
console.log($q)
const username = ref("");
const password = ref("");

const register = async () => {
  if (!username.value || !password.value) {
    $q.notify({ type: "negative",  position: 'top-right', message: "Please fill all fields" });
    return;
  }

  try {
    // Example API call to backend
    const response = await fetch("http://localhost:3000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.value, password: password.value }),
    });

    if (response.ok) {
      $q.notify({ type: "positive",  position: 'top-right', message: "Registration successful" });
    } else {
      const error = await response.json();
      $q.notify({ type: "negative",  position: 'top-right', message: error.message || "Registration failed" });
    }
  } catch (err) {
    console.log(err);
    $q.notify({ type: "negative",  position: 'top-right', message: "Error" });
  }
};
</script>
