<template>
  <q-card class="image-section q-mb-md">
    <q-card-section>
      <div class="text-h6 q-mb-md">
        <q-icon name="image" color="white" class="q-mr-sm" />
        Add Image for Annotation
      </div>
      
      <div class="image-input-options">
        <!-- File Upload -->
        <q-btn
          icon="upload"
          label="Upload Image"
          color="white"
          text-color="primary"
          size="lg"
          @click="triggerImageUpload"
          class="q-mr-md q-mb-sm"
        />
        
        <!-- Camera Capture -->
        <q-btn
          icon="camera_alt"
          label="Take Photo"
          color="white"
          text-color="secondary"
          size="lg"
          @click="captureImage"
          :loading="capturingImage"
          class="q-mb-sm"
        />
        
        <input
          ref="imageUpload"
          type="file"
          accept="image/*"
          @change="handleImageUpload"
          style="display: none"
        />
      </div>
    </q-card-section>
    
    <!-- Camera Capture Overlay -->
    <div v-if="showCameraCapture" class="camera-capture-overlay">
      <video
        ref="captureVideo"
        autoplay
        muted
        playsinline
        webkit-playsinline
        class="capture-video"
      ></video>
      
      <div class="capture-controls">
        <q-btn
          icon="camera_alt"
          round
          color="white"
          text-color="black"
          size="xl"
          @click="takePicture"
          class="capture-btn"
        />
        <q-btn
          icon="close"
          round
          color="red"
          size="lg"
          @click="closeCameraCapture"
          class="cancel-btn"
        />
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

interface Emits {
  (e: 'image-selected', imageUrl: string): void
}

const emit = defineEmits<Emits>()

const imageUpload = ref<HTMLInputElement>()
const captureVideo = ref<HTMLVideoElement>()
const captureStream = ref<MediaStream | null>(null)
const showCameraCapture = ref(false)
const capturingImage = ref(false)

const triggerImageUpload = () => {
  imageUpload.value?.click()
}

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      emit('image-selected', imageUrl)
      console.log('Image uploaded successfully')
    }
    reader.readAsDataURL(file)
  }
}

const captureImage = async () => {
  capturingImage.value = true
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        facingMode: 'environment' // Use back camera if available
      } 
    })
    captureStream.value = stream
    showCameraCapture.value = true
    
    await nextTick()
    
    if (captureVideo.value) {
      captureVideo.value.srcObject = stream
      try {
        await captureVideo.value.play()
        console.log('Capture video started')
      } catch (playError) {
        console.warn('Capture video play failed:', playError)
      }
    }
  } catch (error) {
    console.error('Error accessing camera for capture:', error)
    alert('Camera access failed. Please check permissions and try again.')
  } finally {
    capturingImage.value = false
  }
}

const takePicture = () => {
  if (!captureVideo.value) return
  
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  
  canvas.width = captureVideo.value.videoWidth
  canvas.height = captureVideo.value.videoHeight
  
  context?.drawImage(captureVideo.value, 0, 0)
  
  const imageUrl = canvas.toDataURL('image/jpeg', 0.8)
  emit('image-selected', imageUrl)
  
  console.log('Picture taken:', canvas.width, 'x', canvas.height)
  closeCameraCapture()
}

const closeCameraCapture = () => {
  if (captureStream.value) {
    captureStream.value.getTracks().forEach(track => track.stop())
    captureStream.value = null
  }
  
  if (captureVideo.value) {
    captureVideo.value.srcObject = null
  }
  
  showCameraCapture.value = false
}
</script>

<style scoped>
.image-section {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.image-input-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

/* Camera Capture Overlay */
.camera-capture-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #000;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.capture-video {
  width: 100vw;
  height: 100vh;
  object-fit: cover;
}

.capture-controls {
  position: absolute;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 30px;
}

.capture-btn {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
  }
  70% {
    box-shadow: 0 0 0 20px rgba(255, 255, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
}

.cancel-btn {
  background: rgba(255,255,255,0.1) !important;
  backdrop-filter: blur(10px);
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .image-input-options {
    flex-direction: column;
    align-items: center;
  }
  
  .capture-controls {
    bottom: 30px;
    gap: 20px;
  }
}

/* Reduced motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .capture-btn {
    animation: none;
  }
}
</style>