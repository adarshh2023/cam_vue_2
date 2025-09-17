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

      <!-- Split Video Controls -->
      <q-card v-if="recordedVideoUrl || videoSrc" class="split-controls q-mb-md">
        <q-card-section>
          <div class="row items-center q-gutter-md">
            <q-toggle
              v-model="splitVideoMode"
              label="Split Video View"
              color="primary"
              @update:model-value="handleSplitModeChange"
            />
            
            <div v-if="splitVideoMode" class="row items-center q-gutter-md">
              <div class="col-auto">
                <q-select
                  v-model="leftVideoDate"
                  :options="videoDateOptions"
                  label="Left Video Date"
                  outlined
                  dense
                  style="min-width: 150px"
                />
              </div>
              <div class="col-auto">
                <q-select
                  v-model="rightVideoDate"
                  :options="videoDateOptions"
                  label="Right Video Date"
                  outlined
                  dense
                  style="min-width: 150px"
                />
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
      <!-- Video Player Section -->
      <div v-if="recordedVideoUrl || videoSrc" class="video-layout">
        <!-- Single Video View -->
        <q-card v-if="!splitVideoMode" class="video-section">
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
              @annotation-click="handleVideoAnnotationClick"
            />
          </q-card-section>
        </q-card>
        
        <!-- Split Video View -->
        <div v-else class="split-video-container">
          <q-card class="video-section split-video-left">
            <q-card-section class="q-pa-none">
              <div class="video-header">
                <span class="video-title">{{ leftVideoDate }}</span>
              </div>
              <VideoPlayer
                ref="leftVideoPlayerRef"
                :video-src="getVideoSrcForDate(leftVideoDate)"
                :timeline-tags="getTimelineTagsForDate(leftVideoDate)"
                :spatial-annotations="getSpatialAnnotationsForDate(leftVideoDate)"
                @add-timeline-tag="(timestamp, wasPlaying) => handleAddTimelineTag(timestamp, wasPlaying, 'left')"
                @add-spatial-annotation="(timestamp, x, y, position) => handleAddSpatialAnnotation(timestamp, x, y, position, 'left')"
                @seek-to-time="handleSeekToTime"
                @update-annotation-description="handleUpdateAnnotationDescription"
                @annotation-click="handleVideoAnnotationClick"
              />
            </q-card-section>
          </q-card>
          
          <q-card class="video-section split-video-right">
            <q-card-section class="q-pa-none">
              <div class="video-header">
                <span class="video-title">{{ rightVideoDate }}</span>
              </div>
              <VideoPlayer
                ref="rightVideoPlayerRef"
                :video-src="getVideoSrcForDate(rightVideoDate)"
                :timeline-tags="getTimelineTagsForDate(rightVideoDate)"
                :spatial-annotations="getSpatialAnnotationsForDate(rightVideoDate)"
                @add-timeline-tag="(timestamp, wasPlaying) => handleAddTimelineTag(timestamp, wasPlaying, 'right')"
                @add-spatial-annotation="(timestamp, x, y, position) => handleAddSpatialAnnotation(timestamp, x, y, position, 'right')"
                @seek-to-time="handleSeekToTime"
                @update-annotation-description="handleUpdateAnnotationDescription"
                @annotation-click="handleVideoAnnotationClick"
              />
            </q-card-section>
          </q-card>
        </div>
        
        <!-- Annotations Sidebar -->
        <div class="annotations-sidebar">
          <q-card class="full-height">
            <q-card-section class="full-height">
              <!-- Timeline Tags -->
              <div class="annotations-section">
                <div class="section-header">
                  <q-icon name="bookmark" color="primary" class="q-mr-sm" />
                  <span class="text-h6">Timeline Tags ({{ timelineTags.length }})</span>
                </div>
                
                <div v-if="timelineTags.length === 0" class="text-grey-6 text-center q-py-md">
                  No timeline tags added yet
                </div>
                
                <q-scroll-area v-else class="tags-scroll-area">
                  <q-list separator>
                    <TimelineTagItem
                      v-for="tag in sortedTimelineTags"
                      :key="tag.id"
                      :tag="tag"
                      @seek="handleSeekToTime"
                      @delete="handleDeleteTimelineTag"
                      @edit-description="handleEditTagDescription"
                      @click="handleTagClick"
                    />
                  </q-list>
                </q-scroll-area>
              </div>
              
              <!-- Spatial Annotations -->
              <div class="annotations-section">
                <div class="section-header">
                  <q-icon name="place" color="negative" class="q-mr-sm" />
                  <span class="text-h6">Spatial Annotations ({{ spatialAnnotations.length }})</span>
                </div>
                
                <div v-if="spatialAnnotations.length === 0" class="text-grey-6 text-center q-py-md no-annotations">
                  <q-icon name="touch_app" size="32px" class="q-mb-sm opacity-30" />
                  <div>Click on video to add spatial annotations</div>
                </div>
                
                <q-scroll-area v-else class="spatial-scroll-area">
                  <q-list separator>
                    <SpatialAnnotationItem
                      v-for="annotation in sortedSpatialAnnotations"
                      :key="annotation.id"
                      :annotation="annotation"
                      @seek="handleSeekToTime"
                      @delete="handleDeleteSpatialAnnotation"
                      @edit-description="handleEditSpatialDescription"
                      @click="handleSpatialAnnotationClick"
                    />
                  </q-list>
                </q-scroll-area>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
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

    <!-- Non-Video Annotations Layout -->
    <div v-if="(annotationMode === 'image' && selectedImageUrl) || (annotationMode === 'pdf' && selectedPdfUrl)" class="media-annotations-layout">
      <!-- Spatial Annotations Sidebar -->
      <div class="spatial-annotations-sidebar">
        <q-card class="full-height">
          <q-card-section class="full-height">
            <div class="text-h6 q-mb-md">
              <q-icon name="place" color="negative" class="q-mr-sm" />
              Spatial Annotations ({{ annotationMode === 'image' ? imageSpatialAnnotations.length : pdfSpatialAnnotations.length }})
            </div>
            
            <div v-if="(annotationMode === 'image' ? imageSpatialAnnotations.length : pdfSpatialAnnotations.length) === 0" class="text-grey-6 text-center q-py-lg no-annotations">
              <q-icon name="touch_app" size="48px" class="q-mb-sm opacity-30" />
              <div>Click on {{ annotationMode }} to add spatial annotations</div>
            </div>
            
            <q-scroll-area v-else class="spatial-scroll-area">
              <q-list separator>
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

    <!-- Google Docs Style Description Editor -->
    <GoogleDocsDescriptionEditor
      v-if="showDescriptionEditor"
      :annotation="selectedAnnotation"
      :position="editorPosition"
      @save="handleSaveDescription"
      @close="closeDescriptionEditor"
    />

    <!-- Anchored Popover for Video Annotations -->
    <AnchoredPopover
      v-if="showAnchoredPopover"
      :target-element="popoverTarget"
      :annotation="hoveredAnnotation"
      :editable="popoverEditable"
      @save-description="handleSaveDescription"
      @close="closeAnchoredPopover"
      @edit="enablePopoverEdit"
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
import GoogleDocsDescriptionEditor from './GoogleDocsDescriptionEditor.vue'
import AnchoredPopover from './AnchoredPopover.vue'
import type { TimelineTag, SpatialAnnotation, AnnotationValue, Position } from './types/annotations'

// Sample video URL - replace with your video
const videoSrc = 'https://videos.pexels.com/video-files/6755156/6755156-uhd_2560_1440_25fps.mp4'

// Template refs
const videoPlayerRef = ref()
const leftVideoPlayerRef = ref()
const rightVideoPlayerRef = ref()
const imageViewerRef = ref()
const pdfViewerRef = ref()

// Core state
const annotationMode = ref<'video' | 'image' | 'pdf'>('video')
const timelineTags = ref<TimelineTag[]>([])
const spatialAnnotations = ref<SpatialAnnotation[]>([])
const imageSpatialAnnotations = ref<SpatialAnnotation[]>([])
const pdfSpatialAnnotations = ref<SpatialAnnotation[]>([])

// Split video state
const splitVideoMode = ref(false)
const leftVideoDate = ref('2024-01-15')
const rightVideoDate = ref('2024-01-16')
const videoDateOptions = [
  '2024-01-15',
  '2024-01-16', 
  '2024-01-17',
  '2024-01-18',
  '2024-01-19'
]

// Video data by date (mock data)
const videoDataByDate = ref({
  '2024-01-15': {
    src: 'https://videos.pexels.com/video-files/6755156/6755156-uhd_2560_1440_25fps.mp4',
    timelineTags: [],
    spatialAnnotations: []
  },
  '2024-01-16': {
    src: 'https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4',
    timelineTags: [],
    spatialAnnotations: []
  },
  '2024-01-17': {
    src: 'https://videos.pexels.com/video-files/6755156/6755156-uhd_2560_1440_25fps.mp4',
    timelineTags: [],
    spatialAnnotations: []
  },
  '2024-01-18': {
    src: 'https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4',
    timelineTags: [],
    spatialAnnotations: []
  },
  '2024-01-19': {
    src: 'https://videos.pexels.com/video-files/6755156/6755156-uhd_2560_1440_25fps.mp4',
    timelineTags: [],
    spatialAnnotations: []
  }
})
// Media state
const recordedVideoUrl = ref<string>('')
const selectedImageUrl = ref<string>('')
const selectedPdfUrl = ref<string>('')

// UI state
const showDebug = ref(false)

// Modal and dialog state
const showAnnotationModal = ref(false)
const showSpeedDial = ref(false)
const showDescriptionEditor = ref(false)
const showAnchoredPopover = ref(false)
const popoverEditable = ref(false)

const pendingAnnotationType = ref<'timeline' | 'spatial'>('timeline')
const pendingTimestamp = ref(0)
const pendingCoordinates = ref<Position | null>(null)
const pendingAnnotation = ref<{ x: number; y: number; mode: 'video' | 'image' } | null>(null)

// Position state
const speedDialPosition = ref<Position>({ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' })
const editorPosition = ref<Position>({ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' })
const selectedAnnotation = ref<TimelineTag | SpatialAnnotation | null>(null)

// Anchored popover state
const popoverTarget = ref<HTMLElement | null>(null)
const hoveredAnnotation = ref<TimelineTag | SpatialAnnotation | null>(null)

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

// Split video methods
const handleSplitModeChange = (enabled: boolean) => {
  if (enabled) {
    // Initialize split video data if needed
    console.log('Split video mode enabled')
  } else {
    console.log('Split video mode disabled')
  }
}

const getVideoSrcForDate = (date: string): string => {
  return videoDataByDate.value[date]?.src || videoSrc
}

const getTimelineTagsForDate = (date: string): TimelineTag[] => {
  return videoDataByDate.value[date]?.timelineTags || []
}

const getSpatialAnnotationsForDate = (date: string): SpatialAnnotation[] => {
  return videoDataByDate.value[date]?.spatialAnnotations || []
}
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
const handleAddTimelineTag = (timestamp: number, wasPlaying: boolean, videoSide?: 'left' | 'right') => {
  pendingAnnotationType.value = 'timeline'
  pendingTimestamp.value = timestamp
  pendingCoordinates.value = null
  showAnnotationModal.value = true
}

const handleAddSpatialAnnotation = (timestamp: number, x: number, y: number, position?: Position, videoSide?: 'left' | 'right') => {
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

// Click handlers for annotations
const handleTagClick = (tag: TimelineTag) => {
  // Seek to the tag timestamp and show popover on video
  handleSeekToTime(tag.timestamp)
  // Show popover at video position
  setTimeout(() => {
    showAnnotationPopoverOnVideo(tag)
  }, 100)
}

const handleSpatialAnnotationClick = (annotation: SpatialAnnotation) => {
  // Seek to the annotation timestamp and show popover on video
  handleSeekToTime(annotation.timestamp)
  // Show popover at video position
  setTimeout(() => {
    showAnnotationPopoverOnVideo(annotation)
  }, 100)
}

const handleVideoAnnotationClick = (annotation: TimelineTag | SpatialAnnotation, target: HTMLElement) => {
  hoveredAnnotation.value = annotation
  popoverTarget.value = target
  popoverEditable.value = true
  showAnchoredPopover.value = true
}

const showAnnotationPopoverOnVideo = (annotation: TimelineTag | SpatialAnnotation) => {
  // Find the annotation element on the video and show popover
  const videoContainer = document.querySelector('.video-player-container')
  if (videoContainer) {
    const annotationElement = videoContainer.querySelector(`[data-annotation-id="${annotation.id}"]`)
    if (annotationElement) {
      hoveredAnnotation.value = annotation
      popoverTarget.value = annotationElement as HTMLElement
      popoverEditable.value = false
      showAnchoredPopover.value = true
    }
  }
}

// Editor handlers
const handleAnnotationHover = (annotation: SpatialAnnotation, position: Position) => {
  if (!showAnchoredPopover.value || hoveredAnnotation.value?.id !== annotation.id) {
    hoveredAnnotation.value = annotation
    popoverEditable.value = false
    showAnchoredPopover.value = true
  }
}

const handleAnnotationClick = (annotation: SpatialAnnotation, position: Position) => {
  selectedAnnotation.value = annotation
  editorPosition.value = position
  showDescriptionEditor.value = true
}

const handleEditTagDescription = (tag: TimelineTag, position: Position) => {
  selectedAnnotation.value = tag
  editorPosition.value = position
  showDescriptionEditor.value = true
}

const handleEditSpatialDescription = (annotation: SpatialAnnotation, position: Position) => {
  selectedAnnotation.value = annotation
  editorPosition.value = position
  showDescriptionEditor.value = true
}

const handleEditImageSpatialDescription = (annotation: SpatialAnnotation, position: Position) => {
  editorPosition.value = position
  showDescriptionEditor.value = true
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
  closeDescriptionEditor()
  closeAnchoredPopover()
}

// Navigation handlers
const handleSeekToTime = (timestamp: number) => {
  if (videoPlayerRef.value) {
    videoPlayerRef.value.seekToTime(timestamp)
  }
  if (leftVideoPlayerRef.value) {
    leftVideoPlayerRef.value.seekToTime(timestamp)
  }
  if (rightVideoPlayerRef.value) {
    rightVideoPlayerRef.value.seekToTime(timestamp)
  }
}

const closeDescriptionEditor = () => {
  showDescriptionEditor.value = false
  selectedAnnotation.value = null
}

const closeAnchoredPopover = () => {
  showAnchoredPopover.value = false
  hoveredAnnotation.value = null
  popoverTarget.value = null
  popoverEditable.value = false
}

const enablePopoverEdit = () => {
  popoverEditable.value = true
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

const handleDeletePdfSpatialAnnotation = (annotationId: string) => {
  const index = pdfSpatialAnnotations.value.findIndex(annotation => annotation.id === annotationId)
  if (index > -1) {
    pdfSpatialAnnotations.value.splice(index, 1)
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

/* Split Video Controls */
.split-controls {
  background: rgba(0,0,0,0.05);
}

/* Layout */
.video-layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.video-section {
  flex: 1;
  min-width: 0;
}

.split-video-container {
  display: flex;
  gap: 16px;
  flex: 1;
}

.split-video-left,
.split-video-right {
  flex: 1;
  min-width: 0;
}

.video-header {
  padding: 8px 16px;
  background: rgba(0,0,0,0.05);
  border-bottom: 1px solid rgba(0,0,0,0.1);
  font-weight: 500;
}

.annotations-sidebar {
  width: 350px;
  flex-shrink: 0;
}

.annotations-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0,0,0,0.1);
}

.tags-scroll-area {
  max-height: 200px;
}

.spatial-scroll-area {
  max-height: 300px;
}

/* Non-Video Layout */
.media-annotations-layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.spatial-annotations-sidebar {
  width: 350px;
  flex-shrink: 0;
}

.no-annotations {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 150px;
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

/* PDF Controls */
.pdf-controls {
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
  .video-layout {
    flex-direction: column;
  }
  
  .annotations-sidebar {
    width: 100%;
  }
  
  .split-video-container {
    flex-direction: column;
  }
  
  .spatial-scroll-area {
    max-height: 250px;
  }
  
  .tags-scroll-area {
    max-height: 150px;
  }
  
  .media-annotations-layout {
    flex-direction: column;
  }
  
  .spatial-annotations-sidebar {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .video-annotation-app {
    padding: 8px;
  }
  
  .video-layout {
    gap: 12px;
  }
  
  .split-video-container {
    gap: 12px;
  }
  
  .annotations-sidebar {
    width: 100%;
  }
  
  .spatial-scroll-area {
    max-height: 200px;
  }
  
  .tags-scroll-area {
    max-height: 120px;
  }
  
  .media-annotations-layout {
    gap: 12px;
  }
  
  .spatial-annotations-sidebar {
    width: 100%;
  }
}
</style>