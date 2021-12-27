<script setup>
  import axios from "axios";

  const testApi = async () => {
    const status_response = await axios.get('https://api.eve-angel.localhost/status', { withCredentials: true })

    console.log(status_response)
  }
</script>

<template>
  <a href="/">Home</a>
  <br><br>
  Assets!
  <br>
  <button @click="testApi">Test Api</button>
</template>

<style scoped>
</style>
