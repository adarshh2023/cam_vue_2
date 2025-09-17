<template>
  <div class="video-controls">
    <q-card flat class="bg-grey-9 text-white">
      <q-card-section class="q-pa-sm">
        <!-- Progress Bar -->
        <div class="progress-container q-mb-sm">
          <q-slider
            :model-value="currentTime"
            :min="0"
            :max="duration"
            :step="0.1"
            @update:model-value="handleSeek"
            color="primary"
            track-color="grey-7"
            class="video-progress"
            dense
          />
        </div>

        <!-- Control Buttons and Time Display -->
        <div class="row items-center q-gutter-sm">
          <!-- Play/Pause Button -->
          <q-btn
            :icon="isPlaying ? 'pause' : 'play_arrow'"
            @click="handlePlayPause"
            round
            color="primary"
            :loading="isLoading"
            size="md"
          />

          <!-- Time Display -->
          <div class="text-body2 text-grey-3">
            {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
          </div>

          <q-space />

          <!-- Add Timeline Tag Button -->
          <q-btn
            icon="bookmark_add"
            label="Add Timeline Tag"
            @click="handleAddTimelineTag"
            color="primary"
            outline
            :disable="isLoading"
          />
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isPlaying: boolean
  currentTime: number
  duration: number
  isLoading: boolean
}

interface Emits {
  (e: 'play'): void
  (e: 'pause'): void
  (e: 'seek', time: number): void
  (e: 'add-timeline-tag'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handlePlayPause = () => {
  if (props.isPlaying) {
    emit('pause')
  } else {
    emit('play')
  }
}

const handleSeek = (time: number) => {
  emit('seek', time)
}

const handleAddTimelineTag = () => {
  emit('add-timeline-tag')
}

const formatTime = (seconds: number): string => {
  const totalSeconds = Math.floor(seconds)
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.video-controls {
  width: 100%;
}

.progress-container {
  padding: 0 8px;
}

.video-progress :deep(.q-slider__track) {
  height: 4px;
}

.video-progress :deep(.q-slider__thumb) {
  width: 16px;
  height: 16px;
}
</style>