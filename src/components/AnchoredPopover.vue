<template>
  <teleport to="body">
    <div
      v-if="visible"
      ref="popoverElement"
      class="anchored-popover"
      :style="popoverStyle"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <!-- Popover Arrow -->
      <div class="popover-arrow" :class="`arrow-${arrowPosition}`"></div>
      
      <!-- Popover Content -->
      <div class="popover-content">
        <!-- Header -->
        <div class="popover-header">
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
            <!-- Position info for spatial annotations -->
            <span v-if="'x' in annotation" class="meta-item">
              <q-icon name="place" size="xs" />
              {{ Math.round(annotation.x) }}%, {{ Math.round(annotation.y) }}%
            </span>
            
            <!-- Timestamp info -->
            <span v-if="annotation.timestamp > 0" class="meta-item">
              <q-icon name="schedule" size="xs" />
              {{ formatTimestamp(annotation.timestamp) }}
            </span>
            
            <!-- Creation date -->
            <span class="meta-item">
              <q-icon name="event" size="xs" />
              {{ formatDate(annotation.createdAt) }}
            </span>
          </div>
        </div>
        
        <!-- Body -->
        <div class="popover-body">
          <!-- View Mode -->
          <div v-if="!editable" class="description-view">
            <div v-if="annotation.description" class="description-text">
              {{ annotation.description }}
            </div>
            <div v-else class="no-description">
              <q-icon name="info_outline" size="sm" class="q-mr-xs opacity-60" />
              <span>No description added</span>
            </div>
          </div>
          
          <!-- Edit Mode -->
          <div v-else class="description-edit">
            <q-input
  v-model="editableDescription"
  type="textarea"
  placeholder="Add a description for this annotation..."
  filled
  dense
  autogrow
  rows="2"
  class="description-input white-text"
  @keyup.enter.ctrl="saveDescription"
  @keyup.escape="$emit('close')"
  autofocus
/>
            
            <div class="edit-actions">
              <q-btn
                label="Save"
                color="primary"
                size="sm"
                dense
                @click="saveDescription"
                :disable="!editableDescription.trim()"
              />
              <q-btn
                label="Cancel"
                color="grey"
                flat
                size="sm"
                dense
                @click="$emit('close')"
                class="q-ml-xs"
              />
            </div>
          </div>
        </div>
        
        <!-- Footer Actions -->
        <div v-if="!editable" class="popover-footer">
          <div class="footer-actions">
            <q-btn
              icon="edit"
              size="sm"
              flat
              dense
              color="primary"
              @click="$emit('edit')"
              class="action-btn"
            >
              <q-tooltip anchor="top middle" self="bottom middle">Edit description</q-tooltip>
            </q-btn>
            
            <q-btn
              v-if="'timestamp' in annotation && annotation.timestamp > 0"
              icon="play_arrow"
              size="sm"
              flat
              dense
              color="green"
              @click="seekToAnnotation"
              class="action-btn"
            >
              <q-tooltip anchor="top middle" self="bottom middle">Go to timestamp</q-tooltip>
            </q-btn>
            
            <q-btn
              icon="close"
              size="sm"
              flat
              dense
              color="grey"
              @click="$emit('close')"
              class="action-btn"
            >
              <q-tooltip anchor="top middle" self="bottom middle">Close</q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type { TimelineTag, SpatialAnnotation } from '../types/annotations'

interface Props {
  targetElement: HTMLElement | null
  annotation: TimelineTag | SpatialAnnotation
  editable?: boolean
}

interface Emits {
  (e: 'save-description', description: string): void
  (e: 'close'): void
  (e: 'edit'): void
  (e: 'seek-to-time', timestamp: number): void
}

const props = withDefaults(defineProps<Props>(), {
  editable: false
})

const emit = defineEmits<Emits>()

// Template refs
const popoverElement = ref<HTMLElement>()

// Local state
const editableDescription = ref('')
const visible = ref(false)
const arrowPosition = ref<'top' | 'bottom' | 'left' | 'right'>('bottom')

// Computed styles for positioning
const popoverStyle = computed(() => {
  if (!props.targetElement) return {}
  
  const targetRect = props.targetElement.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  // Popover dimensions (approximate)
  const popoverWidth = 300
  const popoverHeight = 200
  const arrowSize = 8
  const margin = 16
  
  let left = 0
  let top = 0
  let transformOrigin = 'center center'
  
  // Calculate horizontal position
  if (targetRect.left + popoverWidth + margin <= viewportWidth) {
    // Position to the right
    left = targetRect.right + arrowSize
    arrowPosition.value = 'left'
  } else if (targetRect.right - popoverWidth - margin >= 0) {
    // Position to the left
    left = targetRect.left - popoverWidth - arrowSize
    arrowPosition.value = 'right'
  } else {
    // Center horizontally
    left = Math.max(margin, Math.min(
      viewportWidth - popoverWidth - margin,
      targetRect.left + targetRect.width / 2 - popoverWidth / 2
    ))
    
    // Position above or below
    if (targetRect.top - popoverHeight - arrowSize - margin >= 0) {
      top = targetRect.top - popoverHeight - arrowSize
      arrowPosition.value = 'bottom'
    } else {
      top = targetRect.bottom + arrowSize
      arrowPosition.value = 'top'
    }
  }
  
  // Calculate vertical position for side positioning
  if (arrowPosition.value === 'left' || arrowPosition.value === 'right') {
    top = Math.max(margin, Math.min(
      viewportHeight - popoverHeight - margin,
      targetRect.top + targetRect.height / 2 - popoverHeight / 2
    ))
  }
  
  return {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
    zIndex: 10004,
    transformOrigin
  }
})

// Watch for changes in annotation or editable state
watch(() => [props.annotation, props.editable], () => {
  if (props.editable) {
    editableDescription.value = props.annotation.description || ''
  }
  visible.value = true
}, { immediate: true })

watch(() => props.targetElement, (newTarget) => {
  visible.value = !!newTarget
}, { immediate: true })

// Methods
const saveDescription = () => {
  emit('save-description', editableDescription.value.trim())
}

const seekToAnnotation = () => {
  if ('timestamp' in props.annotation) {
    emit('seek-to-time', props.annotation.timestamp)
  }
}

const handleMouseEnter = () => {
  // Keep popover open when mouse enters
}

const handleMouseLeave = () => {
  // Delay closing to allow mouse movement
  setTimeout(() => {
    if (!isMouseOverTarget()) {
      emit('close')
    }
  }, 100)
}

const isMouseOverTarget = (): boolean => {
  if (!props.targetElement) return false
  
  // This is a simplified check - in a real implementation,
  // you might want to check if mouse is over target element
  return false
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

const formatDate = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}

// Handle click outside
const handleClickOutside = (event: MouseEvent) => {
  if (!popoverElement.value || !props.targetElement) return
  
  const isClickInPopover = popoverElement.value.contains(event.target as Node)
  const isClickInTarget = props.targetElement.contains(event.target as Node)
  
  if (!isClickInPopover && !isClickInTarget) {
    emit('close')
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('scroll', () => emit('close'), true)
  window.addEventListener('resize', () => emit('close'))
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('scroll', () => emit('close'), true)
  window.removeEventListener('resize', () => emit('close'))
})
</script>

<style scoped>

.white-text .q-field__native,
.white-text .q-field__control {
  color: white;
}

.white-text .q-placeholder {
  color: rgba(255, 255, 255, 0.5); /* Optional: make placeholder also white-ish */
}

.anchored-popover {
  background: white;
  border-radius: 12px;
  box-shadow: 0 12px 48px rgba(0,0,0,0.15);
  border: 1px solid rgba(0,0,0,0.08);
  overflow: hidden;
  animation: popoverAppear 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  max-width: 320px;
  min-width: 280px;
}

@keyframes popoverAppear {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-5px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.popover-arrow {
  position: absolute;
  width: 16px;
  height: 16px;
  background: white;
  border: 1px solid rgba(0,0,0,0.08);
  transform: rotate(45deg);
  z-index: -1;
}

.popover-arrow.arrow-top {
  top: -8px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  border-bottom: none;
  border-right: none;
}

.popover-arrow.arrow-bottom {
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  border-top: none;
  border-left: none;
}

.popover-arrow.arrow-left {
  left: -8px;
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
  border-top: none;
  border-right: none;
}

.popover-arrow.arrow-right {
  right: -8px;
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
  border-bottom: none;
  border-left: none;
}

.popover-content {
  position: relative;
  z-index: 1;
}

.popover-header {
  padding: 16px 16px 12px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  background: rgba(0,0,0,0.02);
}

.annotation-info {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 8px;
  color: #1a1a1a;
}

.annotation-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
}

.popover-body {
  padding: 16px;
}

.description-view {
  min-height: 40px;
}

.description-text {
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  white-space: pre-wrap;
  word-break: break-word;
}

.no-description {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #999;
  font-style: italic;
}

.description-edit {
  width: 100%;
}

.description-input {
  margin-bottom: 12px;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.popover-footer {
  padding: 12px 16px;
  border-top: 1px solid rgba(0,0,0,0.06);
  background: rgba(0,0,0,0.02);
}

.footer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-btn {
  min-width: 32px;
  min-height: 32px;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .anchored-popover {
    background: #2d2d2d;
    border-color: #444;
    color: white;
  }
  
  .popover-arrow {
    background: #2d2d2d;
    border-color: #444;
  }
  
  .popover-header {
    background: rgba(255,255,255,0.05);
    border-color: rgba(255,255,255,0.1);
  }
  
  .annotation-info {
    color: #e0e0e0;
  }
  
  .description-text {
    color: #e0e0e0;
  }
  
  .meta-item {
    color: #aaa;
  }
  
  .popover-footer {
    background: rgba(255,255,255,0.05);
    border-color: rgba(255,255,255,0.1);
  }
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .anchored-popover {
    max-width: calc(100vw - 32px);
    min-width: 260px;
  }
  
  .popover-header {
    padding: 12px 14px 10px;
  }
  
  .popover-body {
    padding: 14px;
  }
  
  .popover-footer {
    padding: 10px 14px;
  }
  
  .annotation-info {
    font-size: 14px;
  }
  
  .meta-item {
    font-size: 11px;
  }
  
  .description-text {
    font-size: 13px;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .anchored-popover {
    border-width: 2px;
    border-color: #000;
  }
  
  .popover-header,
  .popover-footer {
    border-width: 2px;
  }
}

/* Reduced motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .anchored-popover {
    animation: none;
  }
}

/* Focus styles for accessibility */
.action-btn:focus-visible {
  outline: 2px solid #1976d2;
  outline-offset: 2px;
}

.description-input:focus-within {
  outline: 2px solid #1976d2;
  outline-offset: 2px;
}
</style>