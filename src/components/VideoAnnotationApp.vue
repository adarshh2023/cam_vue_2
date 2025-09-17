const handleEditPdfSpatialDescription = (annotation: SpatialAnnotation, position: Position) => {
  selectedAnnotation.value = annotation
  bubblePosition.value = position
  bubbleEditable.value = true
  showDescriptionBubble.value = true
}<template>
  <div class="video-annotation-app">
    <!-- Mode Selection -->
    <q-card class="mode-selection q-mb-md">
      <q-card-section>
        <div class="text-h6 q-mb-md">
          <q-icon name="camera_alt" color="white" class="q-mr-sm" />
          Choose Annotation Mode
        </div>
        <q-btn-toggle
          v-model="annotationMode"
          toggle-color="white"
          color="white"
          text-color="primary"
          :options="[
            { label: 'Video Annotation', value: 'video', icon: 'videocam' },
            { label: 'Image Annotation', value: 'image', icon: 'image' },
            { label: 'PDF Annotation', value: 'pdf', icon: 'picture_as_pdf' }
          ]"
          class="mode-toggle"
        />
      </q-card-section>
    </q-card>

    <!-- Video Mode -->
    <div v-if="annotationMode === 'video'">
      <!-- Camera Recording Section -->
      <CameraRecorder
        v-if="!recordedVideoUrl"
        @video-recorded="handleVideoRecorded"
        @live-annotations="handleLiveAnnotations"
      />

      <!-- Video Player Section -->
      <q-card v-if="recordedVideoUrl || videoSrc" class="video-section q-mb-md">
        <q-card-section class="q-pa-none">
          <VideoPlayer
            ref="videoPlayerRef"
            :video-src="recordedVideoUrl || videoSrc"
            :timeline-tags="timelineTags"
            :spatial-annotations="spatialAnnotations"
            @add-timeline-tag="handleAddTimelineTag"
            @add-spatial-annotation="handleAddSpatialAnnotation"
            @seek-to-time="handleSeekToTime"
            @update-annotation-description="handleUpdateAnnotationDescription"
          />
        </q-card-section>
      </q-card>
    </div>

    <!-- Image Mode -->
    <div v-if="annotationMode === 'image'">
      <!-- Image Input Section -->
      <ImageInput
        v-if="!selectedImageUrl"
        @image-selected="handleImageSelected"
      />

      <!-- Image Viewer Section -->
      <q-card v-if="selectedImageUrl" class="image-viewer-section q-mb-md">
        <q-card-section class="q-pa-none">
          <ImageViewer
            ref="imageViewerRef"
            :image-src="selectedImageUrl"
            :spatial-annotations="imageSpatialAnnotations"
            @add-spatial-annotation="handleAddImageSpatialAnnotation"
            @annotation-hover="handleAnnotationHover"
            @annotation-click="handleAnnotationClick"
          />
          
          <!-- Image Controls -->
          <div class="image-controls q-pa-md">
            <q-btn
              icon="delete"
              label="Remove Image"
              color="negative"
              flat
              @click="removeImage"
              class="q-mr-sm"
            />
            <q-btn
              icon="image"
              label="Change Image"
              color="primary"
              flat
              @click="changeImage"
            />
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- PDF Mode -->
    <div v-if="annotationMode === 'pdf'">
      <!-- PDF Input Section -->
      <PdfInput
        v-if="!selectedPdfUrl"
        @pdf-selected="handlePdfSelected"
      />

      <!-- PDF Viewer Section -->
      <q-card v-if="selectedPdfUrl" class="pdf-viewer-section q-mb-md">
        <q-card-section class="q-pa-none">
          <PdfViewer
            ref="pdfViewerRef"
            :pdf-src="selectedPdfUrl"
            :spatial-annotations="pdfSpatialAnnotations"
            @add-spatial-annotation="handleAddPdfSpatialAnnotation"
            @annotation-hover="handleAnnotationHover"
            @annotation-click="handleAnnotationClick"
          />
          
          <!-- PDF Controls -->
          <div class="pdf-controls q-pa-md">
            <q-btn
              icon="delete"
              label="Remove PDF"
              color="negative"
              flat
              @click="removePdf"
              class="q-mr-sm"
            />
            <q-btn
              icon="picture_as_pdf"
              label="Change PDF"
              color="primary"
              flat
              @click="changePdf"
            />
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Annotations Layout -->
    <div v-if="(annotationMode === 'video' && (recordedVideoUrl || videoSrc)) || (annotationMode === 'image' && selectedImageUrl) || (annotationMode === 'pdf' && selectedPdfUrl)" class="video-annotations-layout">
      <!-- Timeline Tags (Only for Video Mode) -->
      <div v-if="annotationMode === 'video'" class="timeline-section q-mb-md">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="bookmark" color="primary" class="q-mr-sm" />
              Timeline Tags ({{ timelineTags.length }})
            </div>
            
            <div v-if="timelineTags.length === 0" class="text-grey-6 text-center q-py-lg">
              No timeline tags added yet
            </div>
            
            <q-scroll-area v-else class="timeline-list">
              <q-list separator>
                <TimelineTagItem
                  v-for="tag in sortedTimelineTags"
                  :key="tag.id"
                  :tag="tag"
                  @seek="handleSeekToTime"
                  @delete="handleDeleteTimelineTag"
                  @edit-description="handleEditTagDescription"
                />
              </q-list>
            </q-scroll-area>
          </q-card-section>
        </q-card>
      </div>

      <!-- Media with Side Annotations -->
      <div class="video-with-annotations">
        <!-- Spatial Annotations Sidebar -->
        <div class="spatial-annotations-sidebar">
          <q-card class="full-height">
            <q-card-section class="full-height">
              <div class="text-h6 q-mb-md">
                <q-icon name="place" color="negative" class="q-mr-sm" />
                Spatial Annotations ({{ annotationMode === 'video' ? spatialAnnotations.length : (annotationMode === 'image' ? imageSpatialAnnotations.length : pdfSpatialAnnotations.length) }})
              </div>
              
              <div v-if="(annotationMode === 'video' ? spatialAnnotations.length : (annotationMode === 'image' ? imageSpatialAnnotations.length : pdfSpatialAnnotations.length)) === 0" class="text-grey-6 text-center q-py-lg no-annotations">
                <q-icon name="touch_app" size="48px" class="q-mb-sm opacity-30" />
                <div>Click on {{ annotationMode }} to add spatial annotations</div>
              </div>
              
              <q-scroll-area v-else class="spatial-scroll-area">
                <q-list separator>
                  <!-- Video Annotations -->
                  <template v-if="annotationMode === 'video'">
                    <SpatialAnnotationItem
                      v-for="annotation in sortedSpatialAnnotations"
                      :key="annotation.id"
                      :annotation="annotation"
                      @seek="handleSeekToTime"
                      @delete="handleDeleteSpatialAnnotation"
                      @edit-description="handleEditSpatialDescription"
                    />
                  </template>
                  
                  <!-- Image Annotations -->
                  <template v-if="annotationMode === 'image'">
                    <ImageSpatialAnnotationItem
                      v-for="annotation in sortedImageSpatialAnnotations"
                      :key="annotation.id"
                      :annotation="annotation"
                      @delete="handleDeleteImageSpatialAnnotation"
                      @edit-description="handleEditImageSpatialDescription"
                    />
                  </template>
                  
                  <!-- PDF Annotations -->
                  <template v-if="annotationMode === 'pdf'">
                    <PdfSpatialAnnotationItem
                      v-for="annotation in sortedPdfSpatialAnnotations"
                      :key="annotation.id"
                      :annotation="annotation"
                      @delete="handleDeletePdfSpatialAnnotation"
                      @edit-description="handleEditPdfSpatialDescription"
                    />
                  </template>
                </q-list>
              </q-scroll-area>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Speed Dial for Annotations -->
    <SpeedDial
      v-if="showSpeedDial"
      :position="speedDialPosition"
      @save-annotation="handleSaveAnnotation"
      @close="closeSpeedDial"
    />

    <!-- Annotation Modal -->
    <AnnotationModal
      v-model="showAnnotationModal"
      :annotation-type="pendingAnnotationType"
      :timestamp="pendingTimestamp"
      :coordinates="pendingCoordinates"
      @save="handleSaveAnnotationFromModal"
      @cancel="handleCancelAnnotation"
    />

    <!-- Description Bubble -->
    <DescriptionBubble
      v-if="showDescriptionBubble"
      :position="bubblePosition"
      :annotation="selectedAnnotation"
      :editable="bubbleEditable"
      @save-description="handleSaveDescription"
      @close="closeDescriptionBubble"
    />

    <!-- Debug Info -->
    <q-card v-if="showDebug" class="debug-info q-mt-md">
      <q-card-section>
        <div class="text-h6">Debug Info</div>
        <div>Mode: {{ annotationMode }}</div>
        <div>Video Annotations: {{ spatialAnnotations.length }}</div>
        <div>Image Annotations: {{ imageSpatialAnnotations.length }}</div>
        <div>Timeline Tags: {{ timelineTags.length }}</div>
        <q-btn @click="showDebug = false" flat size="sm">Hide Debug</q-btn>
      </q-card-section>
    </q-card>
    
    <!-- Debug Toggle -->
    <q-btn 
      v-if="!showDebug"
      @click="showDebug = true" 
      flat 
      size="sm" 
      class="debug-toggle"
      icon="bug_report"
    >
      Debug
    </q-btn>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import CameraRecorder from './CameraRecorder.vue'
import VideoPlayer from './VideoPlayer.vue'
import ImageInput from './ImageInput.vue'
import ImageViewer from './ImageViewer.vue'
import PdfInput from './PdfInput.vue'
import PdfViewer from './PdfViewer.vue'
import TimelineTagItem from './TimelineTagItem.vue'
import SpatialAnnotationItem from './SpatialAnnotationItem.vue'
import ImageSpatialAnnotationItem from './ImageSpatialAnnotationItem.vue'
import PdfSpatialAnnotationItem from './PdfSpatialAnnotationItem.vue'
import SpeedDial from './SpeedDial.vue'
import AnnotationModal from './AnnotationModal.vue'
import DescriptionBubble from './DescriptionBubble.vue'
import type { TimelineTag, SpatialAnnotation, AnnotationValue, Position } from './types/annotations'

// Sample video URL - replace with your video
const videoSrc = 'https://videos.pexels.com/video-files/6755156/6755156-uhd_2560_1440_25fps.mp4'

// Template refs
const videoPlayerRef = ref()
const imageViewerRef = ref()
const pdfViewerRef = ref()

// Core state
const annotationMode = ref<'video' | 'image' | 'pdf'>('video')
const timelineTags = ref<TimelineTag[]>([])
const spatialAnnotations = ref<SpatialAnnotation[]>([])
const imageSpatialAnnotations = ref<SpatialAnnotation[]>([])
const pdfSpatialAnnotations = ref<SpatialAnnotation[]>([])

// Media state
const recordedVideoUrl = ref<string>('')
const selectedImageUrl = ref<string>('')
const selectedPdfUrl = ref<string>('')

// UI state
const showDebug = ref(false)

// Modal and dialog state
const showAnnotationModal = ref(false)
const showSpeedDial = ref(false)
const showDescriptionBubble = ref(false)
const bubbleEditable = ref(false)

const pendingAnnotationType = ref<'timeline' | 'spatial'>('timeline')
const pendingTimestamp = ref(0)
const pendingCoordinates = ref<Position | null>(null)
const pendingAnnotation = ref<{ x: number; y: number; mode: 'video' | 'image' } | null>(null)

// Position state
const speedDialPosition = ref<Position>({ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' })
const bubblePosition = ref<Position>({ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' })
const selectedAnnotation = ref<TimelineTag | SpatialAnnotation | null>(null)

// Computed properties
const sortedTimelineTags = computed(() => {
  return [...timelineTags.value].sort((a, b) => a.timestamp - b.timestamp)
})

const sortedSpatialAnnotations = computed(() => {
  return [...spatialAnnotations.value].sort((a, b) => a.timestamp - b.timestamp)
})

const sortedImageSpatialAnnotations = computed(() => {
  return [...imageSpatialAnnotations.value].sort((a, b) => a.timestamp - b.timestamp)
})

const sortedPdfSpatialAnnotations = computed(() => {
  return [...pdfSpatialAnnotations.value].sort((a, b) => a.timestamp - b.timestamp)
})

// Video handlers
const handleVideoRecorded = (videoUrl: string) => {
  recordedVideoUrl.value = videoUrl
}

const handleLiveAnnotations = (annotations: SpatialAnnotation[]) => {
  spatialAnnotations.value = annotations
}

// Image handlers
const handleImageSelected = (imageUrl: string) => {
  selectedImageUrl.value = imageUrl
  imageSpatialAnnotations.value = []
}

// const removeImage = () => {
//   if (selectedImageUrl.value && selectedImageUrl.value.startsWith('blob:')) {
//     URL.revokeObjectURL(selectedImageUrl.value)
//   }
//   selectedImageUrl.value = ''
//   imageSpatialAnnotations.value = []
// }

// const changeImage = () => {
//   removeImage()
// }

// const handleAddImageSpatialAnnotation = (x: number, y: number, position?: Position) => {
//   pendingAnnotation.value = { x, y, mode: 'image' }
//   if (position) {
//     speedDialPosition.value = position
//   }
//   showSpeedDial.value = true
// }

// PDF handlers
const handlePdfSelected = (pdfUrl: string) => {
  selectedPdfUrl.value = pdfUrl
  pdfSpatialAnnotations.value = []
}

const removePdf = () => {
  if (selectedPdfUrl.value && selectedPdfUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(selectedPdfUrl.value)
  }
  selectedPdfUrl.value = ''
  pdfSpatialAnnotations.value = []
}

const changePdf = () => {
  removePdf()
}

const handleAddPdfSpatialAnnotation = (x: number, y: number, position?: Position) => {
  pendingAnnotation.value = { x, y, mode: 'pdf' }
  if (position) {
    speedDialPosition.value = position
  }
  showSpeedDial.value = true
}

const removeImage = () => {
  if (selectedImageUrl.value && selectedImageUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(selectedImageUrl.value)
  }
  selectedImageUrl.value = ''
  imageSpatialAnnotations.value = []
}

const changeImage = () => {
  removeImage()
}

// Annotation handlers
const handleAddTimelineTag = (timestamp: number, wasPlaying: boolean) => {
  pendingAnnotationType.value = 'timeline'
  pendingTimestamp.value = timestamp
  pendingCoordinates.value = null
  showAnnotationModal.value = true
}

const handleAddSpatialAnnotation = (timestamp: number, x: number, y: number, position?: Position) => {
  pendingAnnotation.value = { x, y, mode: 'video' }
  if (position) {
    speedDialPosition.value = position
  }
  showSpeedDial.value = true
}

const handleAddImageSpatialAnnotation = (x: number, y: number, position?: Position) => {
  pendingAnnotation.value = { x, y, mode: 'image' }
  if (position) {
    speedDialPosition.value = position
  }
  showSpeedDial.value = true
}

const handleSaveAnnotation = (value: AnnotationValue) => {
  if (!pendingAnnotation.value) return
  
  const id = `${pendingAnnotation.value.mode}_${Date.now()}_${Math.random()}`
  const annotation: SpatialAnnotation = {
    id,
    timestamp: pendingAnnotation.value.mode === 'video' ? (videoPlayerRef.value?.getCurrentTime() || 0) : 0,
    x: pendingAnnotation.value.x,
    y: pendingAnnotation.value.y,
    selectedValue: value,
    description: '',
    createdAt: new Date()
  }
  
  if (pendingAnnotation.value.mode === 'video') {
    spatialAnnotations.value.push(annotation)
  } else if (pendingAnnotation.value.mode === 'image') {
    imageSpatialAnnotations.value.push(annotation)
  } else if (pendingAnnotation.value.mode === 'pdf') {
    pdfSpatialAnnotations.value.push(annotation)
  }
  
  closeSpeedDial()
}

const handleSaveAnnotationFromModal = (value: AnnotationValue) => {
  const id = `${pendingAnnotationType.value}_${Date.now()}_${Math.random()}`
  
  if (pendingAnnotationType.value === 'timeline') {
    const newTag: TimelineTag = {
      id,
      timestamp: pendingTimestamp.value,
      selectedValue: value,
      description: '',
      createdAt: new Date()
    }
    timelineTags.value.push(newTag)
  } else if (pendingCoordinates.value) {
    const newAnnotation: SpatialAnnotation = {
      id,
      timestamp: pendingTimestamp.value,
      x: pendingCoordinates.value.x,
      y: pendingCoordinates.value.y,
      selectedValue: value,
      description: '',
      createdAt: new Date()
    }
    spatialAnnotations.value.push(newAnnotation)
  }
  
  showAnnotationModal.value = false
}

const handleCancelAnnotation = () => {
  showAnnotationModal.value = false
}

const closeSpeedDial = () => {
  showSpeedDial.value = false
  pendingAnnotation.value = null
}

// Bubble handlers
const handleAnnotationHover = (annotation: SpatialAnnotation, position: Position) => {
  if (!showDescriptionBubble.value || selectedAnnotation.value?.id !== annotation.id) {
    selectedAnnotation.value = annotation
    bubblePosition.value = position
    bubbleEditable.value = false
    showDescriptionBubble.value = true
  }
}

const handleAnnotationClick = (annotation: SpatialAnnotation, position: Position) => {
  selectedAnnotation.value = annotation
  bubblePosition.value = position
  bubbleEditable.value = true
  showDescriptionBubble.value = true
}

const handleEditTagDescription = (tag: TimelineTag, position: Position) => {
  selectedAnnotation.value = tag
  bubblePosition.value = position
  bubbleEditable.value = true
  showDescriptionBubble.value = true
}

const handleEditSpatialDescription = (annotation: SpatialAnnotation, position: Position) => {
  selectedAnnotation.value = annotation
  bubblePosition.value = position
  bubbleEditable.value = true
  showDescriptionBubble.value = true
}

const handleEditImageSpatialDescription = (annotation: SpatialAnnotation, position: Position) => {
  selectedAnnotation.value = annotation
  bubblePosition.value = position
  bubbleEditable.value = true
  showDescriptionBubble.value = true
}

const handleUpdateAnnotationDescription = (annotation: TimelineTag | SpatialAnnotation, description: string) => {
  // Update the description in the appropriate array
  if ('x' in annotation) {
    // Spatial annotation
    const videoIndex = spatialAnnotations.value.findIndex(ann => ann.id === annotation.id)
    const imageIndex = imageSpatialAnnotations.value.findIndex(ann => ann.id === annotation.id)
    const pdfIndex = pdfSpatialAnnotations.value.findIndex(ann => ann.id === annotation.id)
    
    if (videoIndex > -1) {
      spatialAnnotations.value[videoIndex].description = description
    } else if (imageIndex > -1) {
      imageSpatialAnnotations.value[imageIndex].description = description
    } else if (pdfIndex > -1) {
      pdfSpatialAnnotations.value[pdfIndex].description = description
    }
  } else {
    // Timeline tag
    const index = timelineTags.value.findIndex(tag => tag.id === annotation.id)
    if (index > -1) {
      timelineTags.value[index].description = description
    }
  }
}

const handleSaveDescription = (description: string) => {
  if (!selectedAnnotation.value) return
  
  handleUpdateAnnotationDescription(selectedAnnotation.value, description)
  closeDescriptionBubble()
}

// Navigation handlers
const handleSeekToTime = (timestamp: number) => {
  if (videoPlayerRef.value) {
    videoPlayerRef.value.seekToTime(timestamp)
  }
}

const closeDescriptionBubble = () => {
  showDescriptionBubble.value = false
  selectedAnnotation.value = null
  bubbleEditable.value = false
}
  const index = timelineTags.value.findIndex(tag => tag.id === tagId)
  if (index > -1) {
    timelineTags.value.splice(index, 1)
  }

const handleDeleteSpatialAnnotation = (annotationId: string) => {
  const index = spatialAnnotations.value.findIndex(annotation => annotation.id === annotationId)
  if (index > -1) {
    spatialAnnotations.value.splice(index, 1)
  }
}

// Delete handlers
const handleDeleteTimelineTag = (tagId: string) => {
  const index = imageSpatialAnnotations.value.findIndex(annotation => annotation.id === annotationId)
  if (index > -1) {
    imageSpatialAnnotations.value.splice(index, 1)
  }
}
</script>

<style scoped>
.video-annotation-app {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px;
}

/* Mode Selection */
.mode-selection {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.mode-toggle {
  width: 100%;
}

/* Layout */
.video-annotations-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.timeline-section {
  width: 100%;
}

.timeline-list {
  max-height: 200px;
}

.video-with-annotations {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.spatial-annotations-sidebar {
  width: 350px;
  flex-shrink: 0;
}

.spatial-scroll-area {
  height: calc(100vh - 400px);
  min-height: 300px;
  max-height: 600px;
}

.no-annotations {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
}

.full-height {
  height: 100%;
}

/* Image Controls */
.image-controls {
  background: rgba(0,0,0,0.05);
  border-top: 1px solid rgba(0,0,0,0.1);
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Debug */
.debug-info {
  background: rgba(255,255,255,0.1);
  border: 1px solid #333;
}

.debug-toggle {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 1000;
}

/* Mobile Optimizations */
@media (max-width: 1024px) {
  .video-with-annotations {
    flex-direction: column;
  }
  
  .spatial-annotations-sidebar {
    width: 100%;
  }
  
  .spatial-scroll-area {
    height: 300px;
    max-height: 400px;
  }
}

@media (max-width: 768px) {
  .video-annotation-app {
    padding: 8px;
  }
  
  .video-annotations-layout {
    gap: 12px;
  }
  
  .video-with-annotations {
    gap: 12px;
  }
  
  .spatial-annotations-sidebar {
    width: 100%;
  }
  
  .spatial-scroll-area {
    height: 250px;
    max-height: 300px;
  }
  
  .timeline-list {
    max-height: 150px;
  }
}
</style>