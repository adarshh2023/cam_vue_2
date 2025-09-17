<template>
  <q-item class="pdf-spatial-annotation-item">
    <q-item-section avatar>
      <q-icon 
        name="picture_as_pdf" 
        :color="getFlagColor(annotation.selectedValue)"
        size="md"
      />
    </q-item-section>
    
    <q-item-section>
      <q-item-label class="text-weight-medium">
        {{ annotation.selectedValue }}
        <q-chip
          v-if="annotation.page"
          :label="`Page ${annotation.page}`"
          size="sm"
          color="grey-3"
          text-color="grey-8"
          class="q-ml-sm"
        />
      </q-item-label>
      <q-item-label caption class="text-grey-6">
        Position: {{ Math.round(annotation.x) }}%, {{ Math.round(annotation.y) }}%
      </q-item-label>
      <q-item-label 
        v-if="annotation.description" 
        caption 
        class="annotation-description"
      >
        {{ annotation.description }}
      </q-item-label>
      <q-item-label caption class="text-grey-5">
        Added {{ formatDate(annotation.createdAt) }}
      </q-item-label>
    </q-item-section>
    
    <q-item-section side>
      <div class="action-buttons">
        <q-btn
          icon="edit"
          flat
          round
          dense
          color="primary"
          @click="editDescription"
          class="action-btn"
        >
          <q-tooltip>Edit description</q-tooltip>
        </q-btn>
        
        <q-btn
          icon="delete"
          flat
          round
          dense
          color="negative"
          @click="$emit('delete', annotation.id)"
          class="action-btn"
        >
          <q-tooltip>Delete annotation</q-tooltip>
        </q-btn>
      </div>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import type { SpatialAnnotation, AnnotationValue, Position } from '../types/annotations'

interface Props {
  annotation: SpatialAnnotation & { page?: number }
}

interface Emits {
  (e: 'delete', annotationId: string): void
  (e: 'edit-description', annotation: SpatialAnnotation, position: Position): void
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

const editDescription = (event: MouseEvent) => {
  const position: Position = {
    left: event.clientX + 'px',
    top: event.clientY + 'px',
    transform: 'translate(-50%, -100%)'
  }
  emit('edit-description', props.annotation, position)
}
</script>

<style scoped>
.pdf-spatial-annotation-item {
  border-left: 4px solid transparent;
  transition: all 0.2s ease;
}

.pdf-spatial-annotation-item:hover {
  background: rgba(0,0,0,0.02);
  border-left-color: var(--q-primary);
}

.annotation-description {
  font-style: italic;
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

.action-btn {
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.action-btn:hover {
  opacity: 1;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .pdf-spatial-annotation-item:hover {
    background: rgba(255,255,255,0.05);
  }
}
</style>-