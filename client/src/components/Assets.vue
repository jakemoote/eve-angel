<script setup>
  import axios from "axios";

  const updateAssets = async () => {
    await axios.get('https://api.eve-angel.localhost/assets/update', { withCredentials: true })
  }

  const getAssets = async () => {
    await axios.get('https://api.eve-angel.localhost/assets', { withCredentials: true })
  }
</script>

<template>
  <a href="/">Home</a>
  <br><br>
  Assets!
  <br>
  <button @click="updateAssets">Update Assets</button>
  <button @click="getAssets">Get Assets</button>
</template>

<style scoped>
</style>
