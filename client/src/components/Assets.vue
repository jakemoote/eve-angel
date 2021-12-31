<script setup>
  import axios from "axios";
  import {ref} from "vue";

  import { io } from "socket.io-client"
  const socket = io("https://api.eve-angel.localhost", {withCredentials: true})

  socket.on('pong', (msg) => {
    console.debug('Socket received: ', msg)
  })

  const updateAssets = async () => {
    await axios.get('https://api.eve-angel.localhost/assets/update', { withCredentials: true })
  }

  const getAssets = async () => {
    const assets_response = await axios.get('https://api.eve-angel.localhost/assets', { withCredentials: true })
    assets.value = assets_response.data
  }

  const testSocket = async () => {
    const data = {status: 'ok', msg: 'ping'}
    console.debug('Socket sending: ', data)
    socket.emit('ping', data)

  }

  const assets = ref([])
  getAssets()
</script>

<template>
  <a href="/">Home</a>
  <br><br>
  Assets!
  <br>
  <button @click="updateAssets">Update Assets</button>
  <button @click="getAssets">Get Assets</button>
  <button @click="testSocket">Test Socket</button>

  <table>
    <thead>
    <tr>
      <th>Name</th>
      <th>Quantity</th>
      <th>Character</th>
    </tr>
    </thead>
    <tbody>
    <tr v-for="asset in assets">
      <td>{{ asset.name }}</td>
      <td>{{ asset.quantity }}</td>
      <td>{{ asset.character.name }}</td>
    </tr>
    </tbody>
  </table>
</template>

<style scoped>
</style>
