<template>
  <q-page class="flex flex-center bg-grey-2 q-pa-md">
    <div class="column bg-white rounded-borders shadow-2 w-100 q-pa-lg" style="max-width: 400px">
      <h5 class="text-center q-mb-lg">Login</h5>

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
        label="Login"
        color="primary"
        rounded
        unelevated
        class="full-width q-mt-md"
        @click="login"
      />

      <div class="text-caption text-center q-mt-md">
        Don’t have an account?
        <router-link to="/register" class="text-primary">Register</router-link>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import  { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import axios from "axios";

const $q = useQuasar();
const username = ref("");
const password = ref("");
const router=useRouter();

// const login = async () => {
//   if (!username.value || !password.value) {
//     $q.notify({ type: "negative",  position: 'top-right', message: "Please fill all fields" });
//     return;
//   }

//   try {
//     // Example API call to backend
//     const response = await fetch("http://localhost:3000/login", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ username: username.value, password: password.value }),
//     });

//     if (response.ok) {
//       $q.notify({ type: "positive", position: 'top-right', message: "Login successful" });
//       // Example: redirect to chat page
//       router.push("/");
//     } else {
//       const error = await response.json();
//       $q.notify({ type: "negative", position: 'top-right', message: error.message || "Login failed" });
//     }
//   } catch (err) {
//     console.log(err);
//     $q.notify({ type: "negative", position: 'top-right', message: "Error" });
//   }
// };


const login = async () => {
  if (!username.value || !password.value) {
    $q.notify({
      type: "negative",
      position: "top-right",
      message: "Please fill all fields",
    });
    return;
  }

  try {
    const {data} = await axios.post(
      "http://localhost:3000/login",
      {
        username: username.value,
        password: password.value,
      },
      {
        withCredentials: true, // ✅ send & receive session cookies
      }
    );
    // console.log("loggedInUserId", loggedInUserId);
    localStorage.setItem('loggedInUserId', data);
    $q.notify({
      type: "positive",
      position: "top-right",
      message: "Login successful",
    });

    router.push("/"); // redirect to chat page
  } catch (err) {
    console.error(err);
    $q.notify({
      type: "negative",
      position: "top-right",
      message:
        err.response?.data?.message || "Login failed. Please try again.",
    });
  }
};


</script>
