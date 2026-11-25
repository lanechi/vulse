<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { demoState } from './mock-api.js'
const locale = ref('en')
function scrollPages() { document.getElementById('demo-services')?.scrollIntoView({ behavior: 'smooth' }) }
const current = computed(() => demoState.entries.filter(e => e.collection === 'pages' && e.locale === locale.value && e.status === 'published'))
const home = computed(() => current.value.find(e => e.slug === 'home'))
</script>
<template>
  <div class="demo-site">
    <div class="demo-site-nav">
      <strong>{{ demoState.settings.siteName }}</strong>
      <div>
        <a href="#demo-services" @click.prevent="scrollPages">{{ locale === 'en' ? 'Pages' : '页面' }}</a>
        <select v-model="locale" aria-label="Content language"><option value="en">English</option><option value="zh-CN">简体中文</option></select>
        <RouterLink to="/admin">CMS →</RouterLink>
      </div>
    </div>
    <section class="demo-hero">
      <div class="demo-kicker">ASTRO-NATIVE CONTENT MANAGEMENT · STATIC PREVIEW</div>
      <h1>{{ home?.content.title || 'Vulse demo website' }}</h1>
      <p>{{ home?.content.body || 'Manage website content in the control panel and publish changes to this sample view.' }}</p>
      <RouterLink to="/admin/collections/pages">Edit website content</RouterLink>
    </section>
    <section id="demo-services" class="demo-site-section">
      <h2>{{ locale === 'en' ? 'Published pages' : '已发布页面' }}</h2>
      <div class="demo-site-grid">
        <article v-for="p in current.filter(e => e.slug !== 'home')" :key="p.id">
          <div class="demo-kicker">{{ p.slug }}</div>
          <h3>{{ p.content.title }}</h3><p>{{ p.content.body }}</p>
        </article>
      </div>
    </section>
    <section class="demo-site-section demo-site-note">
      <h2>Try the real editing interface</h2>
      <p>Open the control panel, choose Pages, edit the Home entry, and save &amp; publish. Switch to the sample website to see the published text. Drafts remain separate.</p>
      <RouterLink to="/admin/collections/pages">Open Pages</RouterLink>
    </section>
    <footer>Vulse CMS demonstration · Sample content only · Not a live SSR deployment.</footer>
  </div>
</template>
