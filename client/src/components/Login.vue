<script setup>
import { ref } from 'vue'

defineProps({
  login_url: String
})

const count = ref(0)
</script>

<template>
  <a href="https://api.eve-angel.localhost/login/eve?redirect_uri=https://eve-angelx.localhost/assets">
    <img src="https://web.ccpgamescdn.com/eveonlineassets/developers/eve-sso-login-black-large.png">
  </a>
</template>

<style scoped>

</style>
