<script setup>
</script>

<template>
  <div id="main">
    <router-view />
  </div>
</template>

<style>
body {
  background: linear-gradient(rgba(0,0,0,.6), rgba(0,0,0,.6)),
    url('./assets/space-bg.webp') no-repeat center center fixed;
  background-size: cover;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
#main {
  width: 1000px;
  background: rgba(20,20,20,.65);
  min-height: 200px;
  margin: 20px auto;
  padding: 20px;
  border-radius: 15px;
  color: white;
}
</style>
