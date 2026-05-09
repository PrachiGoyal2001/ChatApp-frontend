<template>
  <div class="attachment-overlay">
    <!-- Header -->
    <div class="preview-header row items-center justify-between">
      <div class="text-subtitle1 text-bold ellipsis">
        {{ activeFile?.name }}
      </div>

      <q-btn
        icon="close"
        flat
        round
        dense
        color="white"
        @click="$emit('close')"
      />
    </div>

    <!-- Main Preview -->
    <div class="preview-body flex flex-center">
      <!-- Image -->
      <img
        v-if="activeFile?.type?.startsWith('image/')"
        :src="activePreview"
        class="main-preview-image"
      />

      <!-- Non Image -->
      <div v-else class="non-image-preview">
        <q-icon name="description" size="80px" color="white" />
        <div class="q-mt-md text-white">
          {{ activeFile?.name }}
        </div>
      </div>
    </div>

    <!-- Bottom Preview Strip -->
    <div class="preview-footer row items-center no-wrap">
      <!-- Small Preview -->
      <div
  v-for="(file, index) in files"
  :key="index"
  class="thumb-wrapper"
  :class="{ active: selectedIndex === index }"
>
  <!-- Remove -->
  <q-btn
    icon="close"
    round
    dense
    flat
    size="8px"
    class="remove-thumb-btn"
    @click.stop="$emit('remove-file', index)"
  />

  <!-- Select -->
  <div
    class="thumb-content"
    @click="selectFile(index)"
  >
    <img
      v-if="file.type.startsWith('image/')"
      :src="getPreview(file)"
      class="thumb-image"
    />

    <div
      v-else
      class="thumb-file flex flex-center"
    >
      <q-icon
        name="description"
        color="white"
        size="24px"
      />
    </div>
  </div>
</div>

      <!-- Add More -->
      <div class="thumb-wrapper add-more" @click="$emit('add-more')">
        <q-icon name="add" size="28px" color="white" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  files: {
    type: Array,
    default: () => [],
  },
});

defineEmits(["close", "add-more"]);

const selectedIndex = ref(0);

const activeFile = computed(() => props.files[selectedIndex.value]);

const activePreview = computed(() => {
  if (!activeFile.value) return "";

  return URL.createObjectURL(activeFile.value);
});

const selectFile = (index) => {
  selectedIndex.value = index;
};

const getPreview = (file) => {
  return URL.createObjectURL(file);
};

watch(
  () => props.files,
  () => {
    selectedIndex.value = 0;
  },
);
</script>

<style scoped>
.attachment-overlay {
  position: absolute;
  inset: 0;

  z-index: 100;

  display: flex;
  flex-direction: column;

  overflow: hidden;

  background: rgba(15, 23, 42, 0.96);
  backdrop-filter: blur(12px);
}

.preview-header {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  color: white;
}

.preview-body {
  flex: 1;
  overflow: hidden;
  padding: 20px;
}

.main-preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;

  border-radius: 12px;
}

.non-image-preview {
  text-align: center;
}

.preview-footer {
  gap: 12px;
  overflow-x: auto;

  padding: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);

  background: rgba(255, 255, 255, 0.03);
}

.thumb-wrapper {
  min-width: 70px;
  width: 70px;
  height: 70px;

  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;

  border: 2px solid transparent;

  transition: all 0.25s ease;
}

.thumb-wrapper.active {
  border-color: #22c55e;
}

.thumb-image,
.thumb-file {
  width: 100%;
  height: 100%;
  object-fit: cover;

  background: rgba(255, 255, 255, 0.06);
}

.add-more {
  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(255, 255, 255, 0.08);
}
.thumb-wrapper {
  position: relative;
}

.thumb-content {
  width: 100%;
  height: 100%;
}

.remove-thumb-btn {
  position: absolute;
  top: 2px;
  right: 2px;

  z-index: 5;

  background: rgba(0, 0, 0, 0.7);
  color: white;
}
</style>