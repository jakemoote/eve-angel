<script setup>
  import axios from "axios";

  const testApi = async () => {
    const assets_response = await axios.get('https://api.eve-angel.localhost/assets', { withCredentials: true })

    console.log(assets_response)
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
