<template>
  <div 
    class="speed-dial-overlay"
    :style="position"
  >
    <!-- Background overlay to capture clicks outside -->
    <div class="speed-dial-backdrop" @click="$emit('close')"></div>
    
    <!-- Speed dial content -->
    <div class="speed-dial-content">
      <div class="speed-dial-actions">
        <div 
          class="speed-dial-action red"
          @click="$emit('save-annotation', 'Red Flag')"
        >
          <q-icon name="flag" size="20px" />
          <span class="action-label">Red Flag</span>
        </div>
        <div 
          class="speed-dial-action yellow"
          @click="$emit('save-annotation', 'Yellow Flag')"
        >
          <q-icon name="flag" size="20px" />
          <span class="action-label">Yellow Flag</span>
        </div>
        <div 
          class="speed-dial-action green"
          @click="$emit('save-annotation', 'Green Flag')"
        >
          <q-icon name="flag" size="20px" />
          <span class="action-label">Green Flag</span>
        </div>
        <div 
          class="speed-dial-action grey"
          @click="$emit('save-annotation', 'Others')"
        >
          <q-icon name="more_horiz" size="20px" />
          <span class="action-label">Others</span>
        </div>
      </div>
      <div class="speed-dial-center" @click="$emit('close')">
        <q-icon name="close" size="24px" color="white" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AnnotationValue, Position } from '../types/annotations'

interface Props {
  position: Position
}

interface Emits {
  (e: 'save-annotation', value: AnnotationValue): void
  (e: 'close'): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<style scoped>
.speed-dial-overlay {
  position: fixed;
  z-index: 10002;
  pointer-events: auto;
}

.speed-dial-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: transparent;
  z-index: -1;
}

.speed-dial-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: speedDialAppear 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes speedDialAppear {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.speed-dial-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.speed-dial-action {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: rgba(0,0,0,0.85);
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  border: 2px solid transparent;
  min-width: 150px;
  user-select: none;
  -webkit-user-select: none;
}

.speed-dial-action:hover {
  transform: scale(1.05);
  background: rgba(0,0,0,0.95);
}

.speed-dial-action:active {
  transform: scale(0.98);
}

.speed-dial-action.red {
  border-color: #f44336;
  color: #f44336;
}

.speed-dial-action.yellow {
  border-color: #ff9800;
  color: #ff9800;
}

.speed-dial-action.green {
  border-color: #4caf50;
  color: #4caf50;
}

.speed-dial-action.grey {
  border-color: #9e9e9e;
  color: #9e9e9e;
}

.action-label {
  color: white;
  font-weight: 500;
  font-size: 14px;
}

.speed-dial-center {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(0,0,0,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  border: 2px solid #666;
  user-select: none;
  -webkit-user-select: none;
}

.speed-dial-center:hover {
  transform: scale(1.1);
  background: rgba(0,0,0,0.95);
  border-color: #999;
}

.speed-dial-center:active {
  transform: scale(0.9);
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .speed-dial-action {
    padding: 16px 20px;
    min-width: 160px;
    gap: 16px;
  }
  
  .action-label {
    font-size: 16px;
  }
  
  .speed-dial-center {
    width: 60px;
    height: 60px;
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .speed-dial-action:active {
    transform: scale(0.95);
    background: rgba(0,0,0,0.95);
  }
  
  .speed-dial-center:active {
    transform: scale(0.9);
  }
}

/* Reduced motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .speed-dial-content {
    animation: none;
  }
  
  .speed-dial-action,
  .speed-dial-center {
    transition: none;
  }
}
</style>