<template>
  <q-card class="pdf-section q-mb-md">
    <q-card-section>
      <div class="text-h6 q-mb-md">
        <q-icon name="picture_as_pdf" color="white" class="q-mr-sm" />
        Add PDF for Annotation
      </div>
      
      <div class="pdf-input-options">
        <!-- File Upload -->
        <q-btn
          icon="upload"
          label="Upload PDF"
          color="white"
          text-color="primary"
          size="lg"
          @click="triggerPdfUpload"
          class="q-mr-md q-mb-sm"
        />
        
        <!-- URL Input -->
        <q-btn
          icon="link"
          label="Load from URL"
          color="white"
          text-color="secondary"
          size="lg"
          @click="showUrlDialog = true"
          class="q-mb-sm"
        />
        
        <input
          ref="pdfUpload"
          type="file"
          accept=".pdf,application/pdf"
          @change="handlePdfUpload"
          style="display: none"
        />
      </div>
      
      <!-- Sample PDFs -->
      <div class="sample-pdfs q-mt-md">
        <div class="text-body2 q-mb-sm text-white-7">Or try a sample PDF:</div>
        <div class="sample-options">
          <q-btn
            flat
            dense
            color="white"
            label="Research Paper"
            @click="loadSamplePdf('research')"
            class="q-mr-sm q-mb-xs"
          />
          <q-btn
            flat
            dense
            color="white"
            label="User Manual"
            @click="loadSamplePdf('manual')"
            class="q-mr-sm q-mb-xs"
          />
          <q-btn
            flat
            dense
            color="white"
            label="Financial Report"
            @click="loadSamplePdf('report')"
            class="q-mb-xs"
          />
        </div>
      </div>
    </q-card-section>
    
    <!-- URL Input Dialog -->
    <q-dialog v-model="showUrlDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Load PDF from URL</div>
        </q-card-section>
        
        <q-card-section>
          <q-input
            v-model="pdfUrl"
            label="PDF URL"
            placeholder="https://example.com/document.pdf"
            outlined
            @keyup.enter="loadPdfFromUrl"
          />
        </q-card-section>
        
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="showUrlDialog = false" />
          <q-btn
            color="primary"
            label="Load PDF"
            @click="loadPdfFromUrl"
            :disable="!pdfUrl.trim()"
            :loading="loadingUrl"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    
    <!-- Loading State -->
    <q-inner-loading :showing="loading">
      <q-spinner-gears size="50px" color="white" />
      <div class="text-white q-mt-md">Processing PDF...</div>
    </q-inner-loading>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Emits {
  (e: 'pdf-selected', pdfUrl: string): void
}

const emit = defineEmits<Emits>()

const pdfUpload = ref<HTMLInputElement>()
const showUrlDialog = ref(false)
const pdfUrl = ref('')
const loading = ref(false)
const loadingUrl = ref(false)

// Sample PDFs (you would replace these with actual sample PDF URLs)
const samplePdfs = {
  research: 'https://arxiv.org/pdf/2301.00001.pdf',
  manual: 'https://www.adobe.com/content/dam/acom/en/devnet/pdf/pdfs/PDF32000_2008.pdf',
  report: 'https://www.sec.gov/Archives/edgar/data/320193/000032019322000007/aapl-20220924.pdf'
}

const triggerPdfUpload = () => {
  pdfUpload.value?.click()
}

const handlePdfUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file && file.type === 'application/pdf') {
    loading.value = true
    try {
      // Create object URL for the PDF file
      const pdfObjectUrl = URL.createObjectURL(file)
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      emit('pdf-selected', pdfObjectUrl)
      console.log('PDF uploaded successfully:', file.name)
    } catch (error) {
      console.error('Error processing PDF:', error)
      alert('Error processing PDF file. Please try again.')
    } finally {
      loading.value = false
    }
  } else {
    alert('Please select a valid PDF file.')
  }
  
  // Reset input
  if (target) {
    target.value = ''
  }
}

const loadPdfFromUrl = async () => {
  if (!pdfUrl.value.trim()) return
  
  loadingUrl.value = true
  try {
    // Validate URL format
    const url = new URL(pdfUrl.value.trim())
    
    // Check if URL ends with .pdf or contains pdf in path
    if (!url.pathname.toLowerCase().includes('.pdf') && !url.searchParams.has('pdf')) {
      throw new Error('URL does not appear to be a PDF file')
    }
    
    // Emit the URL directly - the PDF viewer will handle loading
    emit('pdf-selected', url.toString())
    console.log('PDF URL loaded:', url.toString())
    
    showUrlDialog.value = false
    pdfUrl.value = ''
  } catch (error) {
    console.error('Error loading PDF from URL:', error)
    alert('Invalid URL or unable to load PDF. Please check the URL and try again.')
  } finally {
    loadingUrl.value = false
  }
}

const loadSamplePdf = (type: 'research' | 'manual' | 'report') => {
  const url = samplePdfs[type]
  emit('pdf-selected', url)
  console.log('Sample PDF loaded:', type, url)
}
</script>

<style scoped>
.pdf-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: relative;
}

.pdf-input-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.sample-pdfs {
  border-top: 1px solid rgba(255,255,255,0.2);
  padding-top: 16px;
}

.sample-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.text-white-7 {
  opacity: 0.7;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .pdf-input-options {
    flex-direction: column;
    align-items: center;
  }
  
  .sample-options {
    justify-content: center;
  }
}

/* Loading overlay */
.q-inner-loading {
  background: rgba(0,0,0,0.3);
  backdrop-filter: blur(4px);
}
</style>