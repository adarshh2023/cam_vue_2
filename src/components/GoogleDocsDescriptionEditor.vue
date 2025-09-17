<template>
  <teleport to="body">
    <div
      v-if="visible"
      class="google-docs-editor-overlay"
      @click.self="$emit('close')"
    >
      <div
        ref="editorContainer"
        class="google-docs-editor"
        :style="editorStyle"
      >
        <!-- Header -->
        <div class="editor-header">
          <div class="header-left">
            <q-icon 
              :name="getAnnotationIcon(annotation)"
              :color="getAnnotationColor(annotation)"
              size="sm"
              class="q-mr-sm"
            />
            <span class="annotation-title">{{ annotation.selectedValue }}</span>
          </div>
          <div class="header-right">
            <q-btn
              icon="close"
              flat
              round
              dense
              size="sm"
              @click="$emit('close')"
              class="close-btn"
            />
          </div>
        </div>

        <!-- Toolbar -->
        <div class="editor-toolbar">
          <div class="toolbar-group">
            <q-btn
              :icon="isBold ? 'format_bold' : 'format_bold'"
              :color="isBold ? 'primary' : 'grey-6'"
              flat
              dense
              size="sm"
              @click="toggleBold"
              class="toolbar-btn"
            >
              <q-tooltip>Bold (Ctrl+B)</q-tooltip>
            </q-btn>
            <q-btn
              :icon="isItalic ? 'format_italic' : 'format_italic'"
              :color="isItalic ? 'primary' : 'grey-6'"
              flat
              dense
              size="sm"
              @click="toggleItalic"
              class="toolbar-btn"
            >
              <q-tooltip>Italic (Ctrl+I)</q-tooltip>
            </q-btn>
            <q-btn
              :icon="isUnderline ? 'format_underlined' : 'format_underlined'"
              :color="isUnderline ? 'primary' : 'grey-6'"
              flat
              dense
              size="sm"
              @click="toggleUnderline"
              class="toolbar-btn"
            >
              <q-tooltip>Underline (Ctrl+U)</q-tooltip>
            </q-btn>
          </div>

          <q-separator vertical class="q-mx-sm" />

          <div class="toolbar-group">
            <q-btn
              icon="format_list_bulleted"
              flat
              dense
              size="sm"
              @click="insertBulletList"
              class="toolbar-btn"
            >
              <q-tooltip>Bullet List</q-tooltip>
            </q-btn>
            <q-btn
              icon="format_list_numbered"
              flat
              dense
              size="sm"
              @click="insertNumberedList"
              class="toolbar-btn"
            >
              <q-tooltip>Numbered List</q-tooltip>
            </q-btn>
          </div>

          <q-separator vertical class="q-mx-sm" />

          <div class="toolbar-group">
            <q-btn
              icon="link"
              flat
              dense
              size="sm"
              @click="insertLink"
              class="toolbar-btn"
            >
              <q-tooltip>Insert Link</q-tooltip>
            </q-btn>
            <q-btn
              icon="code"
              flat
              dense
              size="sm"
              @click="insertCode"
              class="toolbar-btn"
            >
              <q-tooltip>Code</q-tooltip>
            </q-btn>
          </div>
        </div>

        <!-- Editor Content -->
        <div class="editor-content">
          <div
            ref="editorElement"
            class="rich-text-editor"
            contenteditable="true"
            @input="handleInput"
            @keydown="handleKeydown"
            @paste="handlePaste"
            @focus="handleFocus"
            @blur="handleBlur"
            :placeholder="placeholder"
          ></div>
        </div>

        <!-- Footer -->
        <div class="editor-footer">
          <div class="footer-left">
            <span class="word-count">{{ wordCount }} words</span>
            <span class="char-count">{{ charCount }} characters</span>
          </div>
          <div class="footer-right">
            <q-btn
              label="Cancel"
              flat
              color="grey-6"
              @click="$emit('close')"
              class="q-mr-sm"
            />
            <q-btn
              label="Save"
              color="primary"
              @click="saveDescription"
              :disable="!hasContent"
            />
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type { TimelineTag, SpatialAnnotation, Position } from '../types/annotations'

interface Props {
  annotation: TimelineTag | SpatialAnnotation
  position: Position
}

interface Emits {
  (e: 'save', description: string): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Template refs
const editorContainer = ref<HTMLElement>()
const editorElement = ref<HTMLElement>()

// State
const visible = ref(true)
const content = ref('')
const isBold = ref(false)
const isItalic = ref(false)
const isUnderline = ref(false)
const isFocused = ref(false)

// Computed
const placeholder = computed(() => {
  return `Add a detailed description for this ${getAnnotationType(props.annotation)}...`
})

const wordCount = computed(() => {
  const text = editorElement.value?.textContent || ''
  return text.trim() ? text.trim().split(/\s+/).length : 0
})

const charCount = computed(() => {
  return editorElement.value?.textContent?.length || 0
})

const hasContent = computed(() => {
  return (editorElement.value?.textContent || '').trim().length > 0
})

const editorStyle = computed(() => {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  // Calculate position
  let left = '50%'
  let top = '50%'
  let transform = 'translate(-50%, -50%)'
  
  // Try to position near the annotation if possible
  if (props.position.left && props.position.top) {
    const posLeft = parseInt(props.position.left)
    const posTop = parseInt(props.position.top)
    
    // Check if there's enough space
    if (posLeft + 400 < viewportWidth && posTop + 300 < viewportHeight) {
      left = props.position.left
      top = props.position.top
      transform = 'translate(20px, 20px)'
    }
  }
  
  return {
    position: 'fixed',
    left,
    top,
    transform,
    zIndex: 10005
  }
})

// Methods
const getAnnotationType = (annotation: TimelineTag | SpatialAnnotation): string => {
  return 'x' in annotation ? 'spatial annotation' : 'timeline tag'
}

const getAnnotationIcon = (annotation: TimelineTag | SpatialAnnotation): string => {
  return 'x' in annotation ? 'place' : 'bookmark'
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

const handleInput = () => {
  if (editorElement.value) {
    content.value = editorElement.value.innerHTML
    updateFormattingState()
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  // Handle keyboard shortcuts
  if (event.ctrlKey || event.metaKey) {
    switch (event.key.toLowerCase()) {
      case 'b':
        event.preventDefault()
        toggleBold()
        break
      case 'i':
        event.preventDefault()
        toggleItalic()
        break
      case 'u':
        event.preventDefault()
        toggleUnderline()
        break
      case 'enter':
        event.preventDefault()
        saveDescription()
        break
      case 'escape':
        event.preventDefault()
        emit('close')
        break
    }
  }
}

const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
}

const handleFocus = () => {
  isFocused.value = true
}

const handleBlur = () => {
  isFocused.value = false
  updateFormattingState()
}

const updateFormattingState = () => {
  isBold.value = document.queryCommandState('bold')
  isItalic.value = document.queryCommandState('italic')
  isUnderline.value = document.queryCommandState('underline')
}

// Formatting methods
const toggleBold = () => {
  document.execCommand('bold')
  updateFormattingState()
  editorElement.value?.focus()
}

const toggleItalic = () => {
  document.execCommand('italic')
  updateFormattingState()
  editorElement.value?.focus()
}

const toggleUnderline = () => {
  document.execCommand('underline')
  updateFormattingState()
  editorElement.value?.focus()
}

const insertBulletList = () => {
  document.execCommand('insertUnorderedList')
  editorElement.value?.focus()
}

const insertNumberedList = () => {
  document.execCommand('insertOrderedList')
  editorElement.value?.focus()
}

const insertLink = () => {
  const url = prompt('Enter URL:')
  if (url) {
    document.execCommand('createLink', false, url)
  }
  editorElement.value?.focus()
}

const insertCode = () => {
  const selection = window.getSelection()
  if (selection && selection.toString()) {
    document.execCommand('insertHTML', false, `<code>${selection.toString()}</code>`)
  } else {
    document.execCommand('insertHTML', false, '<code></code>')
  }
  editorElement.value?.focus()
}

const saveDescription = () => {
  const htmlContent = editorElement.value?.innerHTML || ''
  const textContent = editorElement.value?.textContent || ''
  
  // For now, we'll save the text content, but you could save HTML for rich formatting
  emit('save', textContent.trim())
}

// Initialize content
watch(() => props.annotation, (newAnnotation) => {
  if (newAnnotation && editorElement.value) {
    editorElement.value.textContent = newAnnotation.description || ''
    content.value = newAnnotation.description || ''
  }
}, { immediate: true })

// Focus editor when mounted
onMounted(async () => {
  await nextTick()
  if (editorElement.value) {
    editorElement.value.textContent = props.annotation.description || ''
    editorElement.value.focus()
    
    // Place cursor at end
    const range = document.createRange()
    const selection = window.getSelection()
    range.selectNodeContents(editorElement.value)
    range.collapse(false)
    selection?.removeAllRanges()
    selection?.addRange(range)
  }
})

// Handle click outside
const handleClickOutside = (event: MouseEvent) => {
  if (editorContainer.value && !editorContainer.value.contains(event.target as Node)) {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.google-docs-editor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  z-index: 10005;
  display: flex;
  align-items: center;
  justify-content: center;
}

.google-docs-editor {
  background: white;
  border-radius: 12px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
  width: 600px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: editorAppear 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes editorAppear {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.header-left {
  display: flex;
  align-items: center;
}

.annotation-title {
  font-weight: 600;
  font-size: 16px;
  color: #1a1a1a;
}

.close-btn {
  color: #666;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid #e0e0e0;
  background: white;
  gap: 4px;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.toolbar-btn {
  min-width: 32px;
  min-height: 32px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.toolbar-btn:hover {
  background: rgba(0, 0, 0, 0.04);
}

.editor-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  min-height: 200px;
}

.rich-text-editor {
  min-height: 150px;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  outline: none;
  font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.rich-text-editor:empty::before {
  content: attr(placeholder);
  color: #999;
  font-style: italic;
}

.rich-text-editor p {
  margin: 0 0 12px 0;
}

.rich-text-editor ul,
.rich-text-editor ol {
  margin: 12px 0;
  padding-left: 24px;
}

.rich-text-editor li {
  margin: 4px 0;
}

.rich-text-editor code {
  background: #f1f3f4;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 13px;
}

.rich-text-editor a {
  color: #1976d2;
  text-decoration: underline;
}

.editor-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.footer-left {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #666;
}

.footer-right {
  display: flex;
  align-items: center;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .google-docs-editor {
    width: 95vw;
    max-height: 85vh;
  }
  
  .editor-header {
    padding: 12px 16px;
  }
  
  .annotation-title {
    font-size: 14px;
  }
  
  .editor-toolbar {
    padding: 6px 12px;
    flex-wrap: wrap;
    gap: 2px;
  }
  
  .toolbar-btn {
    min-width: 28px;
    min-height: 28px;
  }
  
  .editor-content {
    padding: 16px;
  }
  
  .rich-text-editor {
    font-size: 16px; /* Prevent zoom on iOS */
  }
  
  .editor-footer {
    padding: 10px 16px;
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .footer-left {
    justify-content: center;
  }
  
  .footer-right {
    justify-content: center;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .google-docs-editor {
    background: #2d2d2d;
    color: white;
  }
  
  .editor-header,
  .editor-footer {
    background: #3a3a3a;
    border-color: #555;
  }
  
  .editor-toolbar {
    background: #2d2d2d;
    border-color: #555;
  }
  
  .rich-text-editor {
    color: #e0e0e0;
  }
  
  .rich-text-editor:empty::before {
    color: #aaa;
  }
  
  .rich-text-editor code {
    background: #444;
    color: #e0e0e0;
  }
  
  .footer-left {
    color: #aaa;
  }
}

/* Focus styles for accessibility */
.rich-text-editor:focus {
  outline: 2px solid #1976d2;
  outline-offset: 2px;
  border-radius: 4px;
}

.toolbar-btn:focus-visible {
  outline: 2px solid #1976d2;
  outline-offset: 2px;
}

/* Reduced motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .google-docs-editor {
    animation: none;
  }
  
  .toolbar-btn {
    transition: none;
  }
}
</style>