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
    const response = await axios.post('https://api.eve-angel.localhost/graphql', {
      query: `{
        assets {
          quantity
          character {
            name
          }
          type {
            typeName
          }
          station {
            stationName
          }
        }
      }`
    }, { withCredentials: true })
    assets_row_data.value = response.data.data.assets
  }

  const testSocket = async () => {
    const data = {status: 'ok', msg: 'ping'}
    console.debug('Socket sending: ', data)
    socket.emit('ping', data)
  }

  const assets_columns = ref([
    { field: "type.typeName", headerName: 'Asset', sortable: true, filter: true },
    { field: "quantity", sortable: true, filter: true, width: 80 },
    { field: "character.name", sortable: true, filter: true },
    { field: "station.stationName", headerName: 'Station', sortable: true, filter: true },
  ])

  const assets_row_data = ref([])
  getAssets()

  const default_col_def = {
    resizable: true
  }

  let grid_api
  let column_api
  const onGridReady = (params) => {
    console.debug('grid ready')
    grid_api = params.api
    column_api = params.columnApi

    grid_api.sizeColumnsToFit()
  }

  const doSearch = () => {
    grid_api.setQuickFilter(document.getElementById('search').value)
  }
</script>

<template>
  <a href="/">Home</a>
  <br><br>
  Assets!
  <br>
  <button @click="updateAssets">Update Assets</button>
  <button @click="getAssets">Get Assets</button>
  <button @click="testSocket">Test Socket</button>
  <button @click="testGraphql">Test GraphQL</button>

  <input type="text" id="search" placeholder="Filter..." @input="doSearch">
  <AgGridVue
      style="height: 800px; width: 100%;"
      class="ag-theme-alpine-dark"
      :columnDefs="assets_columns"
      :rowData="assets_row_data"
      :defaultColDef="default_col_def"
      @grid-ready="onGridReady"
  >
  </AgGridVue>
</template>

<style scoped>
</style>
