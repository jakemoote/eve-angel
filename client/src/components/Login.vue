<script setup>
import { ref } from 'vue'

defineProps({
  login_url: String
})

const count = ref(0)
</script>

<template>
  <a href="http://localhost/login/eve?redirect_uri=http://localhost:3000/assets" data-bcup-haslogintext="no">
    <img src="https://web.ccpgamescdn.com/eveonlineassets/developers/eve-sso-login-black-large.png">
  </a>
</template>

<style scoped>

</style>
