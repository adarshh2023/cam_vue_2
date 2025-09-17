<template>
  <q-item class="spatial-annotation-item">
    <q-item-section avatar>
      <q-icon 
        name="flag" 
        :color="getFlagColor(annotation.selectedValue)"
        size="md"
      />
    </q-item-section>
    
    <q-item-section>
      <q-item-label class="text-weight-medium">
        {{ annotation.selectedValue }}
      </q-item-label>
      <q-item-label caption class="text-grey-6">
        Position: {{ Math.round(annotation.x) }}%, {{ Math.round(annotation.y) }}%
      </q-item-label>
      <q-item-label caption class="text-grey-5">
        Added {{ formatDate(annotation.createdAt) }}
      </q-item-label>
    </q-item-section>
    
    <q-item-section side>
      <q-btn
        icon="delete"
        flat
        round
        dense
        color="negative"
        @click="$emit('delete', annotation.id)"
        class="delete-btn"
      >
        <q-tooltip>Delete annotation</q-tooltip>
      </q-btn>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import type { SpatialAnnotation, AnnotationValue } from '../types/annotations'

interface Props {
  annotation: SpatialAnnotation
}

interface Emits {
  (e: 'delete', annotationId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const getFlagColor = (value: AnnotationValue): string => {
  switch (value) {
    case 'Red Flag': return 'red'
    case 'Yellow Flag': return 'orange'
    case 'Green Flag': return 'green'
    case 'Others': return 'grey'
    default: return 'grey'
  }
}

const formatDate = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  
  return date.toLocaleDateString()
}
</script>

<style scoped>
.spatial-annotation-item {
  border-left: 4px solid transparent;
  transition: all 0.2s ease;
}

.spatial-annotation-item:hover {
  background: rgba(0,0,0,0.02);
  border-left-color: var(--q-primary);
}

.delete-btn {
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.delete-btn:hover {
  opacity: 1;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .spatial-annotation-item:hover {
    background: rgba(255,255,255,0.05);
  }
}
</style>