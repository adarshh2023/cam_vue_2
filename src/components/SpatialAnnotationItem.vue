<template>
  <q-item clickable @click="handleSeek">
    <q-item-section avatar>
      <q-avatar :color="getAvatarColor()" text-color="white" size="sm">
        <q-icon name="flag" />
      </q-avatar>
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ annotation.selectedValue }}</q-item-label>
      <q-item-label caption>
        {{ formatTime(annotation.timestamp) }} • 
        ({{ Math.round(annotation.x) }}%, {{ Math.round(annotation.y) }}%)
      </q-item-label>
    </q-item-section>

    <q-item-section side>
      <q-btn
        icon="delete"
        size="sm"
        flat
        round
        color="negative"
        @click.stop="handleDelete"
      />
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import type { SpatialAnnotation } from '../types/annotations'

interface Props {
  annotation: SpatialAnnotation
}

interface Emits {
  (e: 'seek', timestamp: number): void
  (e: 'delete', annotationId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleSeek = () => {
  emit('seek', props.annotation.timestamp)
}

const handleDelete = () => {
  emit('delete', props.annotation.id)
}

const getAvatarColor = (): string => {
  switch (props.annotation.selectedValue) {
    case 'Red Flag': return 'red'
    case 'Yellow Flag': return 'orange'
    case 'Green Flag': return 'green'
    case 'Others': return 'grey'
    default: return 'negative'
  }
}

const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
</script>