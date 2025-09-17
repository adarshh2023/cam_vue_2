<template>
  <div class="video-player-container">
    <div class="video-wrapper" @click="handleVideoClick">
      <video
        ref="videoElement"
        :src="videoSrc"
        class="video-player"
        controls
        @loadedmetadata="onVideoLoaded"
        @timeupdate="onTimeUpdate"
        @play="onPlay"
        @pause="onPause"
        @seeking="onSeeking"
        @seeked="onSeeked"
      ></video>
      
      <!-- Spatial Annotations Overlay -->
      <div class="video-annotations-overlay">
        <div
          v-for="annotation in visibleSpatialAnnotations"
          :key="annotation.id"
          :style="{
            left: annotation.x + '%',
            top: annotation.y + '%'
          }"
          class="video-annotation-pin"
          :class="getFlagClass(annotation.selectedValue)"
          @mouseenter="handleAnnotationHover(annotation, $event)"
          @mouseleave="handleAnnotationLeave(annotation)"
          @click.stop="handleAnnotationClick(annotation, $event)"
        >
          <q-icon name="place" size="18px" />
        </div>
      </div>
      
      <!-- Timeline Tags Overlay -->
      <div class="timeline-tags-overlay">
        <div
          v-for="tag in visibleTimelineTags"
          :key="tag.id"
          :style="{
            left: getTimelineTagPosition(tag.timestamp) + '%'
          }"
          class="timeline-tag-marker"
          :class="getFlagClass(tag.selectedValue)"
          @mouseenter="handleTimelineTagHover(tag, $event)"
          @mouseleave="handleTimelineTagLeave(tag)"
          @click.stop="handleTimelineTagClick(tag, $event)"
        >
          <q-icon name="bookmark" size="16px" />
        </div>
      </div>
    </div>
    
    <!-- Custom Timeline with Tags -->
    <div class="custom-timeline" @click="handleTimelineClick">
      <div class="timeline-track">
        <div class="timeline-progress" :style="{ width: progressPercentage + '%' }"></div>
        
        <!-- Timeline Tag Markers -->
        <div
          v-for="tag in timelineTags"
          :key="tag.id"
          :style="{
            left: getTimelineTagPosition(tag.timestamp) + '%'
          }"
          class="timeline-tag-dot"
          :class="getFlagClass(tag.selectedValue)"
          @mouseenter="handleTimelineTagHover(tag, $event)"
          @mouseleave="handleTimelineTagLeave(tag)"
          @click.stop="seekToTime(tag.timestamp)"
        >
          <div class="tag-tooltip">
            {{ tag.selectedValue }} - {{ formatTime(tag.timestamp) }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Video Controls -->
    <div class="video-controls">
      <q-btn
        :icon="isPlaying ? 'pause' : 'play_arrow'"
        flat
        round
        @click="togglePlayPause"
        class="control-btn"
      />
      
      <div class="time-display">
        {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
      </div>
      
      <q-space />
      
      <q-btn
        icon="bookmark_add"
        flat
        round
        @click="addTimelineTag"
        class="control-btn"
      >
        <q-tooltip>Add Timeline Tag</q-tooltip>
      </q-btn>
      
      <q-btn
        icon="add_location"
        flat
        round
        @click="toggleSpatialMode"
        :color="spatialMode ? 'primary' : ''"
        class="control-btn"
      >
        <q-tooltip>{{ spatialMode ? 'Exit' : 'Add' }} Spatial Annotation Mode</q-tooltip>
      </q-btn>
      
      <q-btn
        icon="fullscreen"
        flat
        round
        @click="toggleFullscreen"
        class="control-btn"
      />
    </div>
  </div>
  
  <!-- Anchored Popover for Annotations -->
  <AnchoredPopover
    v-if="showPopover"
    :target-element="popoverTarget"
    :annotation="hoveredAnnotation"
    :editable="popoverEditable"
    @save-description="handleSaveDescription"
    @close="closePopover"
    @edit="enablePopoverEdit"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import AnchoredPopover from './AnchoredPopover.vue'
import type { TimelineTag, SpatialAnnotation, AnnotationValue, Position } from '../types/annotations'

interface Props {
  videoSrc: string
  timelineTags: TimelineTag[]
  spatialAnnotations: SpatialAnnotation[]
}

interface Emits {
  (e: 'add-timeline-tag', timestamp: number, wasPlaying: boolean): void
  (e: 'add-spatial-annotation', timestamp: number, x: number, y: number, position?: Position): void
  (e: 'seek-to-time', timestamp: number): void
  (e: 'update-annotation-description', annotation: TimelineTag | SpatialAnnotation, description: string): void
  (e: 'annotation-click', annotation: TimelineTag | SpatialAnnotation, target: HTMLElement): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Template refs
const videoElement = ref<HTMLVideoElement>()

// Video state
const currentTime = ref(0)
const duration = ref(0)
const isPlaying = ref(false)
const spatialMode = ref(false)

// Popover state
const showPopover = ref(false)
const popoverTarget = ref<HTMLElement | null>(null)
const hoveredAnnotation = ref<TimelineTag | SpatialAnnotation | null>(null)
const popoverEditable = ref(false)
const hoverTimeout = ref<number | null>(null)

// Computed properties
const progressPercentage = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

const visibleSpatialAnnotations = computed(() => {
  return props.spatialAnnotations.filter(annotation => {
    const timeDiff = Math.abs(annotation.timestamp - currentTime.value * 1000)
    return timeDiff <= 1000 // Show annotations within 1 second of current time
  })
})

const visibleTimelineTags = computed(() => {
  return props.timelineTags.filter(tag => {
    const timeDiff = Math.abs(tag.timestamp - currentTime.value * 1000)
    return timeDiff <= 500 // Show timeline tags within 0.5 seconds
  })
})

// Video event handlers
const onVideoLoaded = () => {
  if (videoElement.value) {
    duration.value = videoElement.value.duration
  }
}

const onTimeUpdate = () => {
  if (videoElement.value) {
    currentTime.value = videoElement.value.currentTime
  }
}

const onPlay = () => {
  isPlaying.value = true
}

const onPause = () => {
  isPlaying.value = false
}

const onSeeking = () => {
  // Handle seeking if needed
}

const onSeeked = () => {
  // Handle seeked if needed
}

// Video controls
const togglePlayPause = () => {
  if (!videoElement.value) return
  
  if (videoElement.value.paused) {
    videoElement.value.play()
  } else {
    videoElement.value.pause()
  }
}

const seekToTime = (timestamp: number) => {
  if (!videoElement.value) return
  
  videoElement.value.currentTime = timestamp / 1000
  emit('seek-to-time', timestamp)
}

const toggleSpatialMode = () => {
  spatialMode.value = !spatialMode.value
  closePopover()
}

const toggleFullscreen = () => {
  if (!videoElement.value) return
  
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    videoElement.value.requestFullscreen()
  }
}

// Annotation handlers
const handleVideoClick = (event: MouseEvent) => {
  if (!spatialMode.value || !videoElement.value) return
  
  const rect = videoElement.value.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const clickY = event.clientY - rect.top
  
  const relativeX = (clickX / rect.width) * 100
  const relativeY = (clickY / rect.height) * 100
  
  if (relativeX >= 0 && relativeX <= 100 && relativeY >= 0 && relativeY <= 100) {
    const timestamp = currentTime.value * 1000
    const position: Position = {
      left: event.clientX + 'px',
      top: event.clientY + 'px',
      transform: 'translate(-50%, -50%)'
    }
    
    emit('add-spatial-annotation', timestamp, relativeX, relativeY, position)
  }
}

const addTimelineTag = () => {
  if (!videoElement.value) return
  
  const timestamp = currentTime.value * 1000
  const wasPlaying = !videoElement.value.paused
  
  if (wasPlaying) {
    videoElement.value.pause()
  }
  
  emit('add-timeline-tag', timestamp, wasPlaying)
}

const handleTimelineClick = (event: MouseEvent) => {
  if (!videoElement.value) return
  
  const rect = event.currentTarget.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percentage = (clickX / rect.width) * 100
  const targetTime = (percentage / 100) * duration.value
  
  videoElement.value.currentTime = targetTime
}

// Popover handlers
const handleAnnotationHover = (annotation: SpatialAnnotation, event: MouseEvent) => {
  clearHoverTimeout()
  
  hoverTimeout.value = window.setTimeout(() => {
    showAnnotationPopover(annotation, event.target as HTMLElement, false)
  }, 300) // 300ms delay before showing popover
}

const handleAnnotationLeave = (annotation: SpatialAnnotation) => {
  clearHoverTimeout()
  
  // Delay hiding popover to allow moving mouse to popover
  setTimeout(() => {
    if (!isMouseOverPopover()) {
      closePopover()
    }
  }, 100)
}

const handleAnnotationClick = (annotation: SpatialAnnotation, event: MouseEvent) => {
  clearHoverTimeout()
  emit('annotation-click', annotation, event.target as HTMLElement)
}

const handleTimelineTagHover = (tag: TimelineTag, event: MouseEvent) => {
  clearHoverTimeout()
  
  hoverTimeout.value = window.setTimeout(() => {
    showAnnotationPopover(tag, event.target as HTMLElement, false)
  }, 300)
}

const handleTimelineTagLeave = (tag: TimelineTag) => {
  clearHoverTimeout()
  
  setTimeout(() => {
    if (!isMouseOverPopover()) {
      closePopover()
    }
  }, 100)
}

const handleTimelineTagClick = (tag: TimelineTag, event: MouseEvent) => {
  clearHoverTimeout()
  emit('annotation-click', tag, event.target as HTMLElement)
}

const showAnnotationPopover = (annotation: TimelineTag | SpatialAnnotation, target: HTMLElement, editable: boolean) => {
  hoveredAnnotation.value = annotation
  popoverTarget.value = target
  popoverEditable.value = editable
  showPopover.value = true
}

const closePopover = () => {
  showPopover.value = false
  hoveredAnnotation.value = null
  popoverTarget.value = null
  popoverEditable.value = false
  clearHoverTimeout()
}

const enablePopoverEdit = () => {
  popoverEditable.value = true
}

const handleSaveDescription = (description: string) => {
  if (hoveredAnnotation.value) {
    emit('update-annotation-description', hoveredAnnotation.value, description)
  }
  closePopover()
}

const clearHoverTimeout = () => {
  if (hoverTimeout.value) {
    clearTimeout(hoverTimeout.value)
    hoverTimeout.value = null
  }
}

const isMouseOverPopover = (): boolean => {
  // This would need to be implemented based on the popover component
  // For now, return false
  return false
}

// Utility functions
const getTimelineTagPosition = (timestamp: number): number => {
  if (duration.value === 0) return 0
  return (timestamp / 1000 / duration.value) * 100
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const getFlagClass = (value: AnnotationValue): string => {
  switch (value) {
    case 'Red Flag': return 'flag-red'
    case 'Yellow Flag': return 'flag-yellow'
    case 'Green Flag': return 'flag-green'
    case 'Others': return 'flag-others'
    default: return 'flag-default'
  }
}

// Expose methods for parent component
const getCurrentTime = () => currentTime.value * 1000

defineExpose({
  seekToTime,
  getCurrentTime
})

// Lifecycle
onMounted(() => {
  // Add any initialization logic here
})

onUnmounted(() => {
  clearHoverTimeout()
})
</script>

<style scoped>
.video-player-container {
  position: relative;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video-wrapper {
  position: relative;
  cursor: crosshair;
}

.video-player {
  width: 100%;
  height: auto;
  max-height: 500px;
  display: block;
}

.video-annotations-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.video-annotation-pin {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 11;
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.2s ease;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
  /* Add data attribute for identification */
}

.video-annotation-pin[data-annotation-id] {
  /* Styling for identifiable annotations */
}

.video-annotation-pin:hover {
  transform: translate(-50%, -50%) scale(1.3);
  z-index: 12;
}

.timeline-tags-overlay {
  position: absolute;
  bottom: 60px;
  left: 0;
  right: 0;
  height: 20px;
  pointer-events: none;
  z-index: 10;
}

.timeline-tag-marker {
  position: absolute;
  bottom: 0;
  transform: translateX(-50%);
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 11;
  /* Add data attribute for identification */
}

.timeline-tag-marker[data-annotation-id] {
  /* Styling for identifiable timeline tags */
}

.timeline-tag-marker:hover {
  transform: translateX(-50%) scale(1.3);
  z-index: 12;
}

.custom-timeline {
  position: relative;
  height: 40px;
  background: rgba(255,255,255,0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0 16px;
}

.timeline-track {
  position: relative;
  height: 6px;
  background: rgba(255,255,255,0.3);
  border-radius: 3px;
  flex: 1;
}

.timeline-progress {
  height: 100%;
  background: #1976d2;
  border-radius: 3px;
  transition: width 0.1s ease;
}

.timeline-tag-dot {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.timeline-tag-dot:hover {
  transform: translate(-50%, -50%) scale(1.3);
}

.timeline-tag-dot .tag-tooltip {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.timeline-tag-dot:hover .tag-tooltip {
  opacity: 1;
}

.video-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(0,0,0,0.8);
  color: white;
}

.control-btn {
  color: white;
}

.time-display {
  font-family: monospace;
  font-size: 14px;
  color: rgba(255,255,255,0.8);
}

/* Flag Colors */
.flag-red {
  color: #f44336;
}

.flag-yellow {
  color: #ff9800;
}

.flag-green {
  color: #4caf50;
}

.flag-others {
  color: #9e9e9e;
}

.timeline-tag-dot.flag-red {
  background: #f44336;
}

.timeline-tag-dot.flag-yellow {
  background: #ff9800;
}

.timeline-tag-dot.flag-green {
  background: #4caf50;
}

.timeline-tag-dot.flag-others {
  background: #9e9e9e;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .video-player {
    max-height: 300px;
  }
  
  .video-controls {
    padding: 8px 12px;
    gap: 6px;
  }
  
  .time-display {
    font-size: 12px;
  }
  
  .timeline-tag-dot {
    width: 14px;
    height: 14px;
  }
  
  .video-annotation-pin:hover,
  .timeline-tag-marker:hover {
    transform: translate(-50%, -50%) scale(1.2);
  }
}

/* Reduced motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .video-annotation-pin,
  .timeline-tag-marker,
  .timeline-tag-dot,
  .timeline-progress {
    transition: none;
  }
}
</style>