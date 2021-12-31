<script setup>
  import { AgGridVue } from "ag-grid-vue3"
  import "ag-grid-community/dist/styles/ag-grid.css";
  import "ag-grid-community/dist/styles/ag-theme-alpine-dark.css";

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
    assets_row_data.value = assets_response.data
  }

  const testSocket = async () => {
    const data = {status: 'ok', msg: 'ping'}
    console.debug('Socket sending: ', data)
    socket.emit('ping', data)

  }

  const assets_columns = ref([
    { field: "name", sortable: true, filter: true },
    { field: "quantity", sortable: true, filter: true },
    { field: "character.name", sortable: true, filter: true },
  ])

  const assets_row_data = ref([])
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

  <AgGridVue
      style="height: 800px; width: 100%;"
      class="ag-theme-alpine-dark"
      :columnDefs="assets_columns"
      :rowData="assets_row_data"
  >
  </AgGridVue>
</template>

<style scoped>
</style>
