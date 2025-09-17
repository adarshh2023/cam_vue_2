<template>
  <div 
    class="description-bubble-overlay"
    :style="position"
    @click.stop
  >
    <div class="bubble-content" :class="{ 'editable': editable }">
      <!-- Bubble Arrow -->
      <div class="bubble-arrow"></div>
      
      <!-- Annotation Info Header -->
      <div class="bubble-header">
        <div class="annotation-info">
          <q-icon 
            :name="getAnnotationIcon(annotation)"
            :color="getAnnotationColor(annotation)"
            size="sm"
            class="q-mr-xs"
          />
          <span class="annotation-type">{{ annotation.selectedValue }}</span>
        </div>
        
        <div class="annotation-meta">
          <span v-if="'x' in annotation" class="position-info">
            {{ Math.round(annotation.x) }}%, {{ Math.round(annotation.y) }}%
          </span>
          <span v-if="'timestamp' in annotation && annotation.timestamp > 0" class="timestamp-info">
            {{ formatTimestamp(annotation.timestamp) }}
          </span>
        </div>
      </div>
      
      <!-- Description Content -->
      <div class="bubble-body">
        <div v-if="!editable && annotation.description" class="description-display">
          {{ annotation.description }}
        </div>
        
        <div v-else-if="!editable && !annotation.description" class="no-description">
          <q-icon name="info" size="sm" class="q-mr-xs opacity-60" />
          No description added
        </div>
        
        <div v-if="editable" class="description-editor">
          <q-input
            v-model="editableDescription"
            type="textarea"
            placeholder="Add a description for this annotation..."
            filled
            dense
            autogrow
            rows="3"
            class="q-mb-sm"
            @keyup.enter.ctrl="saveDescription"
            @keyup.escape="$emit('close')"
          />
          
          <div class="editor-actions">
            <q-btn
              label="Save"
              color="primary"
              size="sm"
              @click="saveDescription"
              :disable="!editableDescription.trim()"
            />
            <q-btn
              label="Cancel"
              color="grey"
              flat
              size="sm"
              @click="$emit('close')"
              class="q-ml-sm"
            />
          </div>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div v-if="!editable" class="bubble-actions">
        <q-btn
          icon="edit"
          size="sm"
          flat
          round
          color="primary"
          @click="enableEdit"
        >
          <q-tooltip>Edit description</q-tooltip>
        </q-btn>
        
        <q-btn
          icon="close"
          size="sm"
          flat
          round
          color="grey"
          @click="$emit('close')"
        >
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { TimelineTag, SpatialAnnotation, Position } from '../types/annotations'

interface Props {
  position: Position
  annotation: TimelineTag | SpatialAnnotation
  editable: boolean
}

interface Emits {
  (e: 'save-description', description: string): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const editableDescription = ref('')

// Watch for changes in annotation or editable state
watch(() => [props.annotation, props.editable], () => {
  if (props.editable) {
    editableDescription.value = props.annotation.description || ''
  }
}, { immediate: true })

const enableEdit = () => {
  editableDescription.value = props.annotation.description || ''
  // Emit a signal to parent to switch to editable mode
  // Since we can't directly modify props, we'll use a different approach
}

const saveDescription = () => {
  if (editableDescription.value.trim()) {
    emit('save-description', editableDescription.value.trim())
  } else {
    emit('save-description', '')
  }
}

const getAnnotationIcon = (annotation: TimelineTag | SpatialAnnotation): string => {
  if ('x' in annotation) {
    return 'place' // Spatial annotation
  }
  return 'bookmark' // Timeline tag
}

const getAnnotationColor = (annotation: TimelineTag | SpatialAnnotation): string => {
  switch (annotation.selectedValue) {
    case 'Red Flag': return 'red'
    case 'Yellow Flag': return 'orange'
    case 'Green Flag': return 'green'
    case 'Others': return 'grey'
    default: return 'primary'
  }
}

const formatTimestamp = (timestamp: number): string => {
  const totalSeconds = Math.floor(timestamp / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
</script>

<style>
.description-bubble-overlay {
  position: fixed;
  z-index: 10003;
  pointer-events: auto;
  max-width: 300px;
  min-width: 200px;
}

.bubble-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  border: 1px solid rgba(0,0,0,0.1);
  overflow: hidden;
  animation: bubbleAppear 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
}

.bubble-content.editable {
  min-width: 280px;
}

@keyframes bubbleAppear {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.bubble-arrow {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 16px;
  background: white;
  border: 1px solid rgba(0,0,0,0.1);
  border-bottom: none;
  border-right: none;
  transform: translateX(-50%) rotate(45deg);
  z-index: -1;
}

.bubble-header {
  padding: 12px 16px 8px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  background: rgba(0,0,0,0.02);
}

.annotation-info {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.annotation-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.position-info,
.timestamp-info {
  background: rgba(0,0,0,0.05);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.bubble-body {
  padding: 12px 16px;
}

.description-display {
  font-size: 14px;
  line-height: 1.4;
  color: #333;
  white-space: pre-wrap;
  word-break: break-word;
}

.no-description {
  font-size: 13px;
  color: #999;
  font-style: italic;
  display: flex;
  align-items: center;
}

.description-editor {
  width: 100%;
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.bubble-actions {
  padding: 8px 12px;
  border-top: 1px solid rgba(0,0,0,0.05);
  background: rgba(0,0,0,0.02);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>