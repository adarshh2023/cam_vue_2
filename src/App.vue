<template>
  <q-app>
    <q-layout view="hHh lpR fFf">
      <q-header elevated class="bg-primary text-white">
        <q-toolbar>
          <q-toolbar-title>
            <q-icon name="video_library" class="q-mr-sm" />
            Video Annotation Tool
          </q-toolbar-title>
        </q-toolbar>
      </q-header>

      <q-page-container>
        <q-page class="q-pa-md">
          <VideoAnnotationApp />
        </q-page>
      </q-page-container>
    </q-layout>
  </q-app>
</template>

<script setup lang="ts">
import VideoAnnotationApp from './components/VideoAnnotationApp.vue'
</script>