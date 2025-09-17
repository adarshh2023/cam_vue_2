<template>
  <div class="image-viewer" @click="handleImageClick">
    <img
      ref="imageElement"
      :src="imageSrc"
      alt="Annotated Image"
      class="annotation-image"
      @load="onImageLoad"
    />
    
    <!-- Spatial annotations overlay -->
    <div class="image-annotations-overlay">
      <div
        v-for="annotation in spatialAnnotations"
        :key="annotation.id"
        :style="{
          left: annotation.x + '%',
          top: annotation.y + '%'
        }"
        class="image-annotation-pin"
        :class="getFlagClass(annotation.selectedValue)"
      >
        <q-icon name="flag" size="20px" />
        <div class="annotation-label">{{ annotation.selectedValue }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { SpatialAnnotation, AnnotationValue } from '../types/annotations'

interface Props {
  imageSrc: string
  spatialAnnotations: SpatialAnnotation[]
}

interface Emits {
  (e: 'add-spatial-annotation', x: number, y: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const imageElement = ref<HTMLImageElement>()

const handleImageClick = (event: MouseEvent) => {
  if (!imageElement.value) return
  
  const rect = imageElement.value.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const clickY = event.clientY - rect.top
  
  const relativeX = (clickX / rect.width) * 100
  const relativeY = (clickY / rect.height) * 100
  
  if (relativeX >= 0 && relativeX <= 100 && relativeY >= 0 && relativeY <= 100) {
    emit('add-spatial-annotation', relativeX, relativeY)
  }
}

const onImageLoad = () => {
  console.log('Image loaded successfully')
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
</script>

<style scoped>
.image-viewer {
  position: relative;
  display: inline-block;
  width: 100%;
  cursor: crosshair;
}

.annotation-image {
  width: 100%;
  height: auto;
  max-height: 600px;
  object-fit: contain;
  display: block;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.image-annotations-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.image-annotation-pin {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  animation: pinAppear 0.3s ease-out;
}

@keyframes pinAppear {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.flag-red {
  color: #f44336;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

.flag-yellow {
  color: #ff9800;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

.flag-green {
  color: #4caf50;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

.flag-others {
  color: #9e9e9e;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

.annotation-label {
  font-size: 10px;
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 2px;
  white-space: nowrap;
  font-weight: 500;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .annotation-image {
    max-height: 400px;
  }
  
  .image-annotation-pin {
    transform: translate(-50%, -50%) scale(1.2);
  }
  
  .annotation-label {
    font-size: 11px;
    padding: 3px 6px;
  }
}
</style>