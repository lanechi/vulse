<script setup>
import { RouterLink, RouterView, useRoute } from 'vue-router'
import AdminSpa from '../src/admin/components/AdminSpa.vue'
import { resetDemo } from './mock-api.js'
const route = useRoute()
function reset() {
  if (confirm('Reset all sample data in this tab?')) {
    resetDemo()
    location.reload()
  }
}
</script>

<template>
  <header class="demo-bar">
    <div class="demo-bar-main">
      <RouterLink to="/site" class="demo-brand">Vulse <span>CMS demo</span></RouterLink>
      <nav aria-label="Demo navigation">
        <RouterLink to="/site">Sample website</RouterLink>
        <RouterLink to="/admin">Control panel</RouterLink>
        <a href="https://github.com/lanechi/vulse" target="_blank" rel="noopener noreferrer">Source</a>
        <button type="button" @click="reset">Reset demo</button>
      </nav>
    </div>
    <div class="demo-disclaimer">
      Static UI demonstration · Mock API · No Cloudflare connection or real login. Changes stay in this browser tab and reset on reload. Use sample data only.
    </div>
  </header>
  <RouterView v-if="route.name === 'demo-site'" />
  <AdminSpa v-else />
</template>
