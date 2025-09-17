<template>
  <div class="pdf-viewer-container">
    <!-- PDF Toolbar -->
    <div class="pdf-toolbar">
      <div class="toolbar-left">
        <q-btn
          icon="zoom_out"
          flat
          round
          dense
          @click="zoomOut"
          :disable="scale <= 0.5"
          class="toolbar-btn"
        >
          <q-tooltip>Zoom Out</q-tooltip>
        </q-btn>
        
        <span class="zoom-display">{{ Math.round(scale * 100) }}%</span>
        
        <q-btn
          icon="zoom_in"
          flat
          round
          dense
          @click="zoomIn"
          :disable="scale >= 3"
          class="toolbar-btn"
        >
          <q-tooltip>Zoom In</q-tooltip>
        </q-btn>
        
        <q-separator vertical class="q-mx-sm" />
        
        <q-btn
          icon="fit_screen"
          flat
          round
          dense
          @click="fitToWidth"
          class="toolbar-btn"
        >
          <q-tooltip>Fit to Width</q-tooltip>
        </q-btn>
      </div>
      
      <div class="toolbar-center">
        <q-btn
          icon="keyboard_arrow_left"
          flat
          round
          dense
          @click="previousPage"
          :disable="currentPage <= 1"
          class="toolbar-btn"
        />
        
        <span class="page-display">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        
        <q-btn
          icon="keyboard_arrow_right"
          flat
          round
          dense
          @click="nextPage"
          :disable="currentPage >= totalPages"
          class="toolbar-btn"
        />
      </div>
      
      <div class="toolbar-right">
        <q-btn
          icon="add_location"
          flat
          round
          dense
          @click="toggleAnnotationMode"
          :color="annotationMode ? 'primary' : ''"
          class="toolbar-btn"
        >
          <q-tooltip>{{ annotationMode ? 'Exit' : 'Enter' }} Annotation Mode</q-tooltip>
        </q-btn>
        
        <q-btn
          icon="fullscreen"
          flat
          round
          dense
          @click="toggleFullscreen"
          class="toolbar-btn"
        >
          <q-tooltip>Fullscreen</q-tooltip>
        </q-btn>
      </div>
    </div>
    
    <!-- PDF Canvas Container -->
    <div 
      ref="pdfContainer" 
      class="pdf-canvas-container"
      :class="{ 'annotation-mode': annotationMode }"
      @click="handleCanvasClick"
    >
      <div class="pdf-pages-wrapper" :style="{ transform: `scale(${scale})` }">
        <!-- PDF Pages -->
        <div
          v-for="pageNum in visiblePages"
          :key="`page-${pageNum}`"
          class="pdf-page-container"
          :data-page="pageNum"
        >
          <canvas
            :ref="el => setPageRef(el, pageNum)"
            class="pdf-page-canvas"
            @click="handlePageClick($event, pageNum)"
          ></canvas>
          
          <!-- Annotations Overlay for this page -->
          <div class="pdf-annotations-overlay">
            <div
              v-for="annotation in getPageAnnotations(pageNum)"
              :key="annotation.id"
              :style="{
                left: annotation.x + '%',
                top: annotation.y + '%'
              }"
              class="pdf-annotation-pin"
              :class="getFlagClass(annotation.selectedValue)"
              @mouseenter="handleAnnotationHover(annotation, $event)"
              @mouseleave="handleAnnotationLeave(annotation)"
              @click.stop="handleAnnotationClick(annotation, $event)"
            >
              <q-icon name="place" size="18px" />
              <div class="annotation-page-label">P{{ pageNum }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Loading Indicator -->
      <div v-if="loading" class="pdf-loading">
        <q-spinner-gears size="50px" color="primary" />
        <div class="q-mt-md">Loading PDF...</div>
      </div>
      
      <!-- Error State -->
      <div v-if="error" class="pdf-error">
        <q-icon name="error" size="48px" color="negative" />
        <div class="q-mt-md text-h6">Failed to load PDF</div>
        <div class="text-caption q-mt-sm">{{ error }}</div>
        <q-btn
          label="Retry"
          color="primary"
          @click="loadPdf"
          class="q-mt-md"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import type { SpatialAnnotation, AnnotationValue, Position } from '../types/annotations'

interface Props {
  pdfSrc: string
  spatialAnnotations: SpatialAnnotation[]
}

interface Emits {
  (e: 'add-spatial-annotation', x: number, y: number, position?: Position): void
  (e: 'annotation-hover', annotation: SpatialAnnotation, position: Position): void
  (e: 'annotation-click', annotation: SpatialAnnotation, position: Position): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Template refs
const pdfContainer = ref<HTMLElement>()
const pageRefs = ref<Map<number, HTMLCanvasElement>>(new Map())

// PDF.js related
let pdfDoc: any = null
let pdfjsLib: any = null

// State
const loading = ref(false)
const error = ref('')
const currentPage = ref(1)
const totalPages = ref(0)
const scale = ref(1.2)
const annotationMode = ref(false)

// Computed
const visiblePages = computed(() => {
  // For now, render all pages. In a real implementation, 
  // you might want to implement virtual scrolling for large PDFs
  const pages = []
  for (let i = 1; i <= totalPages.value; i++) {
    pages.push(i)
  }
  return pages
})

// Methods
const setPageRef = (el: HTMLCanvasElement | null, pageNum: number) => {
  if (el) {
    pageRefs.value.set(pageNum, el)
  } else {
    pageRefs.value.delete(pageNum)
  }
}

const loadPdf = async () => {
  if (!props.pdfSrc) return
  
  loading.value = true
  error.value = ''
  
  try {
    // Initialize PDF.js (in a real app, you'd import this properly)
    if (!pdfjsLib) {
      // This is a placeholder - in a real implementation, you'd load PDF.js
      pdfjsLib = await loadPdfJs()
    }
    
    // Load the PDF document
    pdfDoc = await pdfjsLib.getDocument(props.pdfSrc).promise
    totalPages.value = pdfDoc.numPages
    currentPage.value = 1
    
    // Render initial pages
    await renderVisiblePages()
    
    console.log('PDF loaded successfully:', totalPages.value, 'pages')
  } catch (err: any) {
    console.error('Error loading PDF:', err)
    error.value = err.message || 'Failed to load PDF'
  } finally {
    loading.value = false
  }
}

const loadPdfJs = async (): Promise<any> => {
  // This is a placeholder implementation
  // In a real app, you would load PDF.js from CDN or npm package
  return new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib)
      return
    }
    
    // Load PDF.js from CDN
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        resolve(pdfjsLib)
      } else {
        reject(new Error('Failed to load PDF.js'))
      }
    }
    script.onerror = () => reject(new Error('Failed to load PDF.js script'))
    document.head.appendChild(script)
  })
}

const renderVisiblePages = async () => {
  if (!pdfDoc) return
  
  for (const pageNum of visiblePages.value) {
    await renderPage(pageNum)
  }
}

const renderPage = async (pageNum: number) => {
  if (!pdfDoc) return
  
  try {
    const page = await pdfDoc.getPage(pageNum)
    const canvas = pageRefs.value.get(pageNum)
    
    if (!canvas) return
    
    const context = canvas.getContext('2d')
    const viewport = page.getViewport({ scale: 1.5 })
    
    canvas.height = viewport.height
    canvas.width = viewport.width
    
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    }
    
    await page.render(renderContext).promise
  } catch (err) {
    console.error(`Error rendering page ${pageNum}:`, err)
  }
}

// Navigation
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    scrollToPage(currentPage.value)
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    scrollToPage(currentPage.value)
  }
}

const scrollToPage = (pageNum: number) => {
  const pageElement = document.querySelector(`[data-page="${pageNum}"]`)
  if (pageElement && pdfContainer.value) {
    pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// Zoom
const zoomIn = () => {
  if (scale.value < 3) {
    scale.value = Math.min(3, scale.value + 0.2)
  }
}

const zoomOut = () => {
  if (scale.value > 0.5) {
    scale.value = Math.max(0.5, scale.value - 0.2)
  }
}

const fitToWidth = () => {
  if (pdfContainer.value) {
    // Calculate scale to fit container width
    const containerWidth = pdfContainer.value.clientWidth - 40 // padding
    const pageWidth = 595 // Standard A4 width in points
    scale.value = Math.min(2, containerWidth / pageWidth)
  }
}

// Fullscreen
const toggleFullscreen = () => {
  if (!pdfContainer.value) return
  
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    pdfContainer.value.requestFullscreen()
  }
}

// Annotation Mode
const toggleAnnotationMode = () => {
  annotationMode.value = !annotationMode.value
}

// Annotation Handlers
const handleCanvasClick = (event: MouseEvent) => {
  // This handles clicks on the container but not on specific pages
}

const handlePageClick = (event: MouseEvent, pageNum: number) => {
  if (!annotationMode.value) return
  
  const canvas = pageRefs.value.get(pageNum)
  if (!canvas) return
  
  const rect = canvas.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const clickY = event.clientY - rect.top
  
  const relativeX = (clickX / rect.width) * 100
  const relativeY = (clickY / rect.height) * 100
  
  if (relativeX >= 0 && relativeX <= 100 && relativeY >= 0 && relativeY <= 100) {
    const position: Position = {
      left: event.clientX + 'px',
      top: event.clientY + 'px',
      transform: 'translate(-50%, -50%)'
    }
    
    // Include page number in the annotation
    const annotationData = {
      x: relativeX,
      y: relativeY,
      page: pageNum
    }
    
    emit('add-spatial-annotation', relativeX, relativeY, position)
  }
}

const handleAnnotationHover = (annotation: SpatialAnnotation, event: MouseEvent) => {
  const position: Position = {
    left: event.clientX + 'px',
    top: (event.clientY - 20) + 'px',
    transform: 'translate(-50%, -100%)'
  }
  emit('annotation-hover', annotation, position)
}

const handleAnnotationLeave = (annotation: SpatialAnnotation) => {
  // Handle mouse leave if needed
}

const handleAnnotationClick = (annotation: SpatialAnnotation, event: MouseEvent) => {
  const position: Position = {
    left: event.clientX + 'px',
    top: (event.clientY - 20) + 'px',
    transform: 'translate(-50%, -100%)'
  }
  emit('annotation-click', annotation, position)
}

const getPageAnnotations = (pageNum: number) => {
  // Filter annotations for specific page
  return props.spatialAnnotations.filter(annotation => {
    // For now, assume all annotations are on page 1
    // In a real implementation, you'd store page info with each annotation
    return true
  })
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

// Watch for prop changes
watch(() => props.pdfSrc, () => {
  if (props.pdfSrc) {
    loadPdf()
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  if (props.pdfSrc) {
    loadPdf()
  }
})

onUnmounted(() => {
  // Cleanup
  pageRefs.value.clear()
})
</script>

<style scoped>
.pdf-viewer-container {
  display: flex;
  flex-direction: column;
  height: 600px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
}

.pdf-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: white;
  border-bottom: 1px solid #ddd;
  min-height: 48px;
}

.toolbar-left,
.toolbar-center,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-btn {
  color: #666;
}

.zoom-display,
.page-display {
  font-size: 14px;
  color: #666;
  min-width: 60px;
  text-align: center;
  font-family: monospace;
}

.pdf-canvas-container {
  flex: 1;
  overflow: auto;
  background: #e0e0e0;
  position: relative;
}

.pdf-canvas-container.annotation-mode {
  cursor: crosshair;
}

.pdf-pages-wrapper {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  transform-origin: top center;
  transition: transform 0.2s ease;
}

.pdf-page-container {
  position: relative;
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  border-radius: 4px;
  overflow: hidden;
}

.pdf-page-canvas {
  display: block;
  max-width: 100%;
}

.pdf-annotations-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.pdf-annotation-pin {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 11;
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.2s ease;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pdf-annotation-pin:hover {
  transform: translate(-50%, -50%) scale(1.3);
  z-index: 12;
}

.annotation-page-label {
  font-size: 10px;
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 2px 4px;
  border-radius: 2px;
  margin-top: 2px;
  font-weight: 500;
}

.pdf-loading,
.pdf-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
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

/* Mobile optimizations */
@media (max-width: 768px) {
  .pdf-viewer-container {
    height: 500px;
  }
  
  .pdf-toolbar {
    padding: 6px 12px;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .toolbar-left,
  .toolbar-center,
  .toolbar-right {
    gap: 4px;
  }
  
  .zoom-display,
  .page-display {
    font-size: 12px;
    min-width: 50px;
  }
  
  .pdf-pages-wrapper {
    padding: 10px;
  }
  
  .pdf-annotation-pin:hover {
    transform: translate(-50%, -50%) scale(1.2);
  }
}

/* Scrollbar styling */
.pdf-canvas-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.pdf-canvas-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.pdf-canvas-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.pdf-canvas-container::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>