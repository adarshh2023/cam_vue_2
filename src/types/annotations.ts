export type AnnotationValue = 'Red Flag' | 'Yellow Flag' | 'Green Flag' | 'Others'

export type MediaType = 'video' | 'image' | 'pdf'

export interface Position {
  left: string
  top: string
  transform?: string
  x?: number
  y?: number
}

export interface BaseAnnotation {
  id: string
  selectedValue: AnnotationValue
  description: string
  createdAt: Date
}

export interface TimelineTag extends BaseAnnotation {
  timestamp: number
}

export interface SpatialAnnotation extends BaseAnnotation {
  timestamp: number
  x: number
  y: number
  page?: number // For PDF annotations
}

export interface PdfAnnotation extends SpatialAnnotation {
  page: number
  pageWidth?: number
  pageHeight?: number
}

export interface AnnotationEvent {
  type: 'timeline' | 'spatial'
  timestamp: number
  coordinates?: { x: number; y: number }
  position?: Position
  page?: number
}

export interface VideoRecorderState {
  isRecording: boolean
  recordingTime: number
  liveAnnotations: SpatialAnnotation[]
}

export interface ImageState {
  imageUrl: string
  annotations: SpatialAnnotation[]
}

export interface PdfState {
  pdfUrl: string
  annotations: PdfAnnotation[]
  currentPage: number
  totalPages: number
  scale: number
}

export interface AppState {
  mode: MediaType
  video: {
    timelineTags: TimelineTag[]
    spatialAnnotations: SpatialAnnotation[]
    recordedVideoUrl: string
  }
  image: ImageState
  pdf: PdfState
}
export const PREDEFINED_VALUES = [
  'Red Flag',
  'Yellow Flag', 
  'Green Flag',
  'Others'
] as const