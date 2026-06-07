<template>
  <q-layout view="lHh Lpr lFf" class="app-bg">
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style scoped>
.app-bg {
  background: radial-gradient(circle at 20% 20%, #020617, #020617 80%);
}
</style>