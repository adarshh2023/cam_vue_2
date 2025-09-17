<template>
  <q-dialog v-model="isVisible" persistent>
    <q-card style="min-width: 300px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          <q-icon 
            :name="annotationType === 'timeline' ? 'bookmark' : 'place'" 
            :color="annotationType === 'timeline' ? 'primary' : 'negative'"
            class="q-mr-sm"
          />
          {{ annotationType === 'timeline' ? 'Timeline Tag' : 'Spatial Annotation' }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <div class="text-body2 text-grey-7 q-mb-md">
          <q-icon name="access_time" class="q-mr-xs" />
          Time: {{ formatTime(timestamp) }}
          <span v-if="coordinates" class="q-ml-md">
            <q-icon name="my_location" class="q-mr-xs" />
            Position: ({{ Math.round(coordinates.x) }}%, {{ Math.round(coordinates.y) }}%)
          </span>
        </div>

        <div class="text-subtitle2 q-mb-md">Select annotation type:</div>
        <div class="row q-gutter-sm">
          <q-btn
            v-for="value in predefinedValues"
            :key="value"
            :label="value"
            :color="getButtonColor(value)"
            :outline="selectedValue !== value"
            :unelevated="selectedValue === value"
            @click="selectedValue = value"
            class="col-auto"
          />
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="grey-7" @click="handleCancel" />
        <q-btn 
          label="Save" 
          color="primary" 
          :disable="!selectedValue"
          @click="handleSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { PREDEFINED_VALUES, type AnnotationValue } from '../types/annotations'

interface Props {
  modelValue: boolean
  annotationType: 'timeline' | 'spatial'
  timestamp: number
  coordinates?: { x: number; y: number } | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', value: AnnotationValue): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isVisible = ref(false)
const selectedValue = ref<AnnotationValue | null>(null)
const predefinedValues = [...PREDEFINED_VALUES]

// Watch for modal visibility changes
watch(() => props.modelValue, (newValue) => {
  isVisible.value = newValue
  if (newValue) {
    selectedValue.value = null
  }
})

watch(isVisible, (newValue) => {
  emit('update:modelValue', newValue)
})

const handleSave = () => {
  if (selectedValue.value) {
    emit('save', selectedValue.value)
    isVisible.value = false
  }
}

const handleCancel = () => {
  emit('cancel')
  isVisible.value = false
}

const getButtonColor = (value: AnnotationValue): string => {
  switch (value) {
    case 'Red Flag': return 'red'
    case 'Yellow Flag': return 'orange'
    case 'Green Flag': return 'green'
    case 'Others': return 'grey'
    default: return 'primary'
  }
}

const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const ms = milliseconds % 1000
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${Math.floor(ms / 10).toString().padStart(2, '0')}`
}
</script>