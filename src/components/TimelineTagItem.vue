<template>
  <q-item clickable @click="handleClick">
    <q-item-section avatar>
      <q-avatar :color="getAvatarColor()" text-color="white" size="sm">
        <q-icon name="flag" />
      </q-avatar>
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ tag.selectedValue }}</q-item-label>
      <q-item-label caption>{{ formatTime(tag.timestamp) }}</q-item-label>
      <q-item-label v-if="tag.description" caption class="description-preview">
        {{ tag.description.substring(0, 50) }}{{ tag.description.length > 50 ? '...' : '' }}
      </q-item-label>
    </q-item-section>

    <q-item-section side>
      <div class="action-buttons">
        <q-btn
          icon="edit"
          size="sm"
          flat
          round
          color="primary"
          @click.stop="handleEdit"
        >
          <q-tooltip>Edit description</q-tooltip>
        </q-btn>
        <q-btn
          icon="delete"
          size="sm"
          flat
          round
          color="negative"
          @click.stop="handleDelete"
        >
          <q-tooltip>Delete tag</q-tooltip>
        </q-btn>
      </div>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import type { TimelineTag, Position } from '../types/annotations'

interface Props {
  tag: TimelineTag
}

interface Emits {
  (e: 'seek', timestamp: number): void
  (e: 'delete', tagId: string): void
  (e: 'edit-description', tag: TimelineTag, position: Position): void
  (e: 'click', tag: TimelineTag): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleClick = () => {
  emit('click', props.tag)
}

const handleDelete = () => {
  emit('delete', props.tag.id)
}

const handleEdit = (event: MouseEvent) => {
  const position: Position = {
    left: event.clientX + 'px',
    top: event.clientY + 'px',
    transform: 'translate(-50%, -100%)'
  }
  emit('edit-description', props.tag, position)
}

const getAvatarColor = (): string => {
  switch (props.tag.selectedValue) {
    case 'Red Flag': return 'red'
    case 'Yellow Flag': return 'orange'
    case 'Green Flag': return 'green'
    case 'Others': return 'grey'
    default: return 'primary'
  }
}

const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.description-preview {
  font-style: italic;
  color: #666;
  margin-top: 4px;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .description-preview {
    color: #aaa;
  }
}
</style>