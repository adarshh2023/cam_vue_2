<template>
  <q-card class="camera-section q-mb-md">
    <q-card-section>
      <div class="text-h6 q-mb-md">
        <q-icon name="videocam" color="primary" class="q-mr-sm" />
        Record Video with Live Annotations
      </div>
      
      <!-- Start Camera Button -->
      <div v-if="!cameraStream" class="text-center">
        <q-btn
          icon="videocam"
          label="Start Camera"
          color="primary"
          size="lg"
          @click="startCamera"
          :loading="startingCamera"
        />
      </div>
      
      <!-- Camera Preview -->
      <div v-if="cameraStream && !isRecording" class="camera-preview">
        <video
          ref="cameraPreview"
          autoplay
          muted
          playsinline
          webkit-playsinline
          class="camera-video"
        ></video>
        
        <div class="camera-controls q-mt-md">
          <q-btn
            icon="fiber_manual_record"
            label="Start Recording"
            color="red"
            size="lg"
            @click="startRecording"
            :loading="startingRecording"
          />
          <q-btn
            icon="stop"
            label="Stop Camera"
            color="grey"
            flat
            @click="stopCamera"
            class="q-ml-sm"
          />
        </div>
      </div>
    </q-card-section>
    
    <!-- Fullscreen Recording Overlay -->
    <div v-if="isRecording" class="fullscreen-recording-overlay">
      <video
        ref="recordingVideo"
        autoplay
        muted
        playsinline
        webkit-playsinline
        class="fullscreen-video"
        @click="handleFullscreenVideoClick"
        @touchstart="handleFullscreenVideoTouch"
        @loadedmetadata="onVideoLoaded"
        @canplay="onVideoCanPlay"
        @loadstart="onVideoLoadStart"
      ></video>
      
      <!-- Live annotation overlay -->
      <div class="fullscreen-annotations-overlay">
        <div
          v-for="annotation in liveAnnotations"
          :key="annotation.id"
          :style="{
            left: annotation.x + '%',
            top: annotation.y + '%'
          }"
          class="live-annotation-pin"
          :class="getFlagClass(annotation.selectedValue)"
        >
          <q-icon name="flag" size="24px" />
          <div class="flag-label">{{ annotation.selectedValue }}</div>
        </div>
      </div>
      
      <!-- Recording controls overlay -->
      <div class="fullscreen-recording-controls">
        <div class="recording-indicator">
          <q-icon name="fiber_manual_record" color="red" class="blink" size="md" />
          <span class="text-white q-ml-sm text-weight-medium">REC {{ formatRecordingTime(recordingTime) }}</span>
        </div>
        <q-btn
          icon="stop"
          round
          color="red"
          size="lg"
          @click="stopRecording"
          class="stop-btn"
        />
      </div>
      
      <!-- Exit fullscreen button -->
      <div class="fullscreen-exit-btn">
        <q-btn
          icon="fullscreen_exit"
          round
          color="white"
          text-color="black"
          size="md"
          @click="exitFullscreen"
        />
      </div>
      
      <!-- Instructions overlay -->
      <div class="recording-instructions" v-if="showInstructions">
        <div class="instruction-text">
          <q-icon name="touch_app" size="md" class="q-mr-sm" />
          Tap anywhere on video to add annotations
        </div>
        <q-btn 
          flat 
          dense 
          icon="close" 
          color="white" 
          @click="showInstructions = false"
          class="close-instructions"
        />
      </div>
    </div>
    
    <!-- Speed Dial for Live Annotations -->
    <SpeedDial
      v-if="showLiveAnnotationDialog"
      :position="speedDialPosition"
      @save-annotation="saveLiveAnnotation"
      @close="closeLiveAnnotationDialog"
    />
  </q-card>
</template>

<script setup lang="ts">
import { ref, onUnmounted, nextTick } from 'vue'
import SpeedDial from './SpeedDial.vue'
import type { SpatialAnnotation, AnnotationValue, Position } from '../types/annotations'

interface Emits {
  (e: 'video-recorded', videoUrl: string): void
  (e: 'live-annotations', annotations: SpatialAnnotation[]): void
}

const emit = defineEmits<Emits>()

// Template refs
const cameraPreview = ref<HTMLVideoElement>()
const recordingVideo = ref<HTMLVideoElement>()

// Camera and recording state
const cameraStream = ref<MediaStream | null>(null)
const isRecording = ref(false)
const mediaRecorder = ref<MediaRecorder | null>(null)
const recordedChunks = ref<Blob[]>([])
const liveAnnotations = ref<SpatialAnnotation[]>([])
const recordingStartTime = ref(0)
const recordingTime = ref(0)
const recordingTimer = ref<number | null>(null)

// UI state
const startingCamera = ref(false)
const startingRecording = ref(false)
const showInstructions = ref(true)
const showLiveAnnotationDialog = ref(false)
const pendingLiveAnnotation = ref<{ x: number; y: number } | null>(null)

// Position state
const speedDialPosition = ref<Position>({
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)'
})

// Camera functionality
const startCamera = async () => {
  startingCamera.value = true
  try {
    console.log('Starting camera...')
    const constraints = {
      video: { 
        width: { ideal: 1920, max: 1920 },
        height: { ideal: 1080, max: 1080 },
        facingMode: 'user'
      }, 
      audio: {
        echoCancellation: true,
        noiseSuppression: true
      }
    }
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    cameraStream.value = stream
    console.log('Camera stream obtained:', stream.getVideoTracks()[0].getSettings())
    
    await nextTick()
    
    if (cameraPreview.value) {
      cameraPreview.value.srcObject = stream
      cameraPreview.value.muted = true
      cameraPreview.value.playsInline = true
      
      try {
        await cameraPreview.value.play()
        console.log('Camera preview started')
      } catch (playError) {
        console.warn('Camera preview play failed:', playError)
      }
    }
  } catch (error) {
    console.error('Error accessing camera:', error)
    alert('Camera access failed. Please check permissions and try again.')
  } finally {
    startingCamera.value = false
  }
}

const stopCamera = () => {
  console.log('Stopping camera...')
  if (cameraStream.value) {
    cameraStream.value.getTracks().forEach(track => {
      track.stop()
      console.log('Track stopped:', track.kind)
    })
    cameraStream.value = null
  }
  
  if (cameraPreview.value) {
    cameraPreview.value.srcObject = null
  }
  
  if (recordingVideo.value) {
    recordingVideo.value.srcObject = null
  }
}

const startRecording = async () => {
  if (!cameraStream.value) {
    console.error('No camera stream available')
    return
  }
  
  startingRecording.value = true
  
  try {
    console.log('Starting recording...')
    recordedChunks.value = []
    liveAnnotations.value = []
    showInstructions.value = true
    
    // First set isRecording to true to show the fullscreen overlay
    isRecording.value = true
    
    // Wait for DOM update
    await nextTick()
    
    // Set up recording video element
    if (recordingVideo.value && cameraStream.value) {
      recordingVideo.value.srcObject = cameraStream.value
      recordingVideo.value.muted = true
      recordingVideo.value.playsInline = true
      recordingVideo.value.autoplay = true
      
      // Force video to load
      recordingVideo.value.load()
      
      try {
        await recordingVideo.value.play()
        console.log('Recording video started playing')
      } catch (playError) {
        console.warn('Recording video play failed:', playError)
        // Retry after a short delay
        setTimeout(async () => {
          try {
            if (recordingVideo.value) {
              await recordingVideo.value.play()
              console.log('Recording video retry successful')
            }
          } catch (retryError) {
            console.error('Recording video retry failed:', retryError)
          }
        }, 200)
      }
    }
    
    // Enter fullscreen mode
    try {
      await document.documentElement.requestFullscreen()
      console.log('Entered fullscreen')
    } catch (error) {
      console.warn('Fullscreen not supported or denied:', error)
    }
    
    // Set up MediaRecorder
    const setupMediaRecorder = () => {
      const options: MediaRecorderOptions = {}
      
      const supportedTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus', 
        'video/webm;codecs=h264,opus',
        'video/webm',
        'video/mp4;codecs=h264,aac',
        'video/mp4'
      ]
      
      for (const mimeType of supportedTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          options.mimeType = mimeType
          console.log('Using mimeType:', mimeType)
          break
        }
      }
      
      return new MediaRecorder(cameraStream.value!, options)
    }
    
    try {
      mediaRecorder.value = setupMediaRecorder()
    } catch (error) {
      console.warn('MediaRecorder setup failed, using defaults:', error)
      mediaRecorder.value = new MediaRecorder(cameraStream.value)
    }
    
    // Set up MediaRecorder event handlers
    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.value.push(event.data)
        console.log('Data chunk received:', event.data.size, 'bytes')
      }
    }
    
    mediaRecorder.value.onstop = () => {
      console.log('Recording stopped, creating blob...')
      const mimeType = mediaRecorder.value?.mimeType || 'video/webm'
      const blob = new Blob(recordedChunks.value, { type: mimeType })
      console.log('Blob created:', blob.size, 'bytes, type:', blob.type)
      
      const videoUrl = URL.createObjectURL(blob)
      console.log('Video URL created:', videoUrl)
      
      // Emit events
      emit('video-recorded', videoUrl)
      emit('live-annotations', [...liveAnnotations.value])
      
      // Clean up recording video first
      if (recordingVideo.value) {
        recordingVideo.value.srcObject = null
      }
      
      // Exit fullscreen
      exitFullscreen()
      
      // Stop camera
      stopCamera()
    }
    
    mediaRecorder.value.onerror = (event) => {
      console.error('MediaRecorder error:', event)
    }
    
    mediaRecorder.value.onstart = () => {
      console.log('MediaRecorder started, state:', mediaRecorder.value?.state)
    }
    
    // Start recording
    mediaRecorder.value.start(200) // 200ms chunks
    recordingStartTime.value = Date.now()
    recordingTime.value = 0
    
    // Start recording timer
    recordingTimer.value = setInterval(() => {
      recordingTime.value = Date.now() - recordingStartTime.value
    }, 100)
    
    console.log('Recording started successfully')
    
  } catch (error) {
    console.error('Error starting recording:', error)
    isRecording.value = false
    alert('Recording failed to start. Please try again.')
  } finally {
    startingRecording.value = false
  }
}

const stopRecording = () => {
  if (mediaRecorder.value && isRecording.value && mediaRecorder.value.state !== 'inactive') {
    console.log('Stopping recording...')
    mediaRecorder.value.stop()
    isRecording.value = false
    
    if (recordingTimer.value) {
      clearInterval(recordingTimer.value)
      recordingTimer.value = null
    }
    
    // Clean up recording video
    if (recordingVideo.value) {
      recordingVideo.value.srcObject = null
    }
  }
}

const exitFullscreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen().then(() => {
      console.log('Exited fullscreen')
    }).catch(console.warn)
  }
}

// Video event handlers
const onVideoLoadStart = () => {
  console.log('Video load started')
}

const onVideoLoaded = () => {
  console.log('Video metadata loaded')
}

const onVideoCanPlay = () => {
  console.log('Video can play')
  if (recordingVideo.value && recordingVideo.value.paused) {
    recordingVideo.value.play().catch(console.warn)
  }
}

// Fullscreen video interaction handling
const handleFullscreenVideoClick = (event: MouseEvent) => {
  event.preventDefault()
  handleVideoInteraction(event)
}

const handleFullscreenVideoTouch = (event: TouchEvent) => {
  event.preventDefault()
  if (event.touches.length > 0) {
    const touch = event.touches[0]
    handleVideoInteraction(touch)
  }
}

const handleVideoInteraction = (event: MouseEvent | Touch) => {
  if (!isRecording.value || !recordingVideo.value) return
  
  // Hide instructions after first interaction
  showInstructions.value = false
  
  const rect = recordingVideo.value.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const clickY = event.clientY - rect.top
  
  const relativeX = (clickX / rect.width) * 100
  const relativeY = (clickY / rect.height) * 100
  
  if (relativeX >= 0 && relativeX <= 100 && relativeY >= 0 && relativeY <= 100) {
    pendingLiveAnnotation.value = { x: relativeX, y: relativeY }
    
    // Position speed dial at click/touch location
    const screenX = event.clientX
    const screenY = event.clientY
    
    // Adjust position to keep speed dial on screen
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    const dialSize = 250 // Approximate size of speed dial
    
    let finalX = screenX
    let finalY = screenY
    
    // Keep speed dial within screen bounds
    if (screenX + dialSize/2 > windowWidth) {
      finalX = windowWidth - dialSize/2 - 20
    }
    if (screenX - dialSize/2 < 0) {
      finalX = dialSize/2 + 20
    }
    if (screenY + dialSize/2 > windowHeight) {
      finalY = windowHeight - dialSize/2 - 20
    }
    if (screenY - dialSize/2 < 0) {
      finalY = dialSize/2 + 20
    }
    
    speedDialPosition.value = {
      left: finalX + 'px',
      top: finalY + 'px',
      transform: 'translate(-50%, -50%)'
    }
    
    showLiveAnnotationDialog.value = true
    console.log('Speed dial opened at:', finalX, finalY)
  }
}

const closeLiveAnnotationDialog = () => {
  showLiveAnnotationDialog.value = false
  pendingLiveAnnotation.value = null
}

const saveLiveAnnotation = (value: AnnotationValue) => {
  if (!pendingLiveAnnotation.value || !isRecording.value) return
  
  const timestamp = Date.now() - recordingStartTime.value
  const id = `live_${Date.now()}_${Math.random()}`
  
  const annotation: SpatialAnnotation = {
    id,
    timestamp,
    x: pendingLiveAnnotation.value.x,
    y: pendingLiveAnnotation.value.y,
    selectedValue: value,
    description: '',
    createdAt: new Date()
  }
  
  liveAnnotations.value.push(annotation)
  console.log('Live annotation added:', value, 'at', annotation.x, annotation.y)
  closeLiveAnnotationDialog()
}

// Utility functions
const formatRecordingTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
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

// Handle fullscreen change events
const handleFullscreenChange = () => {
  if (!document.fullscreenElement && isRecording.value) {
    console.log('User exited fullscreen, stopping recording')
    stopRecording()
  }
}

// Lifecycle
onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  stopCamera()
  
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value)
  }
  
  console.log('Camera recorder unmounted')
})
</script>

<style scoped>
.camera-section {
  position: relative;
}

.camera-preview {
  position: relative;
}

.camera-video {
  width: 100%;
  max-height: 500px;
  background: #000;
  border-radius: 8px;
  display: block;
}

.camera-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* Fullscreen Recording Styles */
.fullscreen-recording-overlay {
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

.fullscreen-video {
  width: 100vw;
  height: 100vh;
  object-fit: cover;
  cursor: crosshair;
  background: #000;
}

.fullscreen-annotations-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10000;
}

.live-annotation-pin {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 10001;
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
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.6));
}

.flag-yellow {
  color: #ff9800;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.6));
}

.flag-green {
  color: #4caf50;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.6));
}

.flag-others {
  color: #9e9e9e;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.6));
}

.flag-label {
  font-size: 12px;
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  margin-top: 4px;
  white-space: nowrap;
  font-weight: 500;
}

.fullscreen-recording-controls {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 20px;
  background: rgba(0,0,0,0.7);
  padding: 12px 24px;
  border-radius: 50px;
  z-index: 10001;
  backdrop-filter: blur(10px);
}

.fullscreen-exit-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10001;
}

.recording-instructions {
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 12px 20px;
  border-radius: 25px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 10001;
  backdrop-filter: blur(10px);
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.instruction-text {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.close-instructions {
  margin-left: 8px;
}

.recording-indicator {
  display: flex;
  align-items: center;
}

.blink {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .camera-controls {
    gap: 8px;
  }
  
  .fullscreen-recording-controls {
    top: 10px;
    padding: 8px 16px;
    gap: 12px;
  }
  
  .fullscreen-exit-btn {
    top: 10px;
    right: 10px;
  }
  
  .recording-instructions {
    bottom: 80px;
    padding: 10px 16px;
    font-size: 14px;
  }
  
  .live-annotation-pin {
    transform: translate(-50%, -50%) scale(1.3);
  }
  
  .flag-label {
    font-size: 14px;
    padding: 6px 10px;
  }
}

/* Landscape mobile optimizations */
@media (max-width: 896px) and (orientation: landscape) {
  .fullscreen-recording-controls {
    top: 8px;
    padding: 6px 12px;
  }
  
  .fullscreen-exit-btn {
    top: 8px;
    right: 8px;
  }
  
  .recording-instructions {
    bottom: 60px;
    padding: 8px 12px;
    font-size: 12px;
  }
}

/* Reduced motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .blink,
  .pinAppear,
  .fadeInUp {
    animation: none;
  }
}
</style>