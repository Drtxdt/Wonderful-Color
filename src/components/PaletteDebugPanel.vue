<script setup>
const props = defineProps({
  generationMode: {
    type: String,
    required: true
  },
  styleMode: {
    type: String,
    required: true
  },
  contrastPriority: {
    type: Boolean,
    required: true
  },
  showDebug: {
    type: Boolean,
    required: true
  },
  generationOptions: {
    type: Array,
    required: true
  },
  styleOptions: {
    type: Array,
    required: true
  },
  paletteMeta: {
    type: Object,
    required: true
  }
});

const emit = defineEmits([
  "update:generationMode",
  "update:styleMode",
  "update:contrastPriority",
  "update:showDebug"
]);

function onGenerationModeChange(event) {
  emit("update:generationMode", event.target.value);
}

function onStyleModeChange(event) {
  emit("update:styleMode", event.target.value);
}

function onContrastPriorityChange(event) {
  emit("update:contrastPriority", event.target.checked);
}

function toggleDebug() {
  emit("update:showDebug", !props.showDebug);
}
</script>

<template>
  <div class="toolbar" role="group" aria-label="palette-controls">
    <label class="control">
      <span>模式</span>
      <select :value="generationMode" @change="onGenerationModeChange">
        <option
          v-for="option in generationOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    </label>
    <label class="control">
      <span>风格</span>
      <select :value="styleMode" @change="onStyleModeChange">
        <option
          v-for="option in styleOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    </label>
    <label class="control checkbox">
      <input :checked="contrastPriority" type="checkbox" @change="onContrastPriorityChange" />
      <span>强对比优先</span>
    </label>
    <button class="debug-toggle" @click="toggleDebug">
      {{ showDebug ? "隐藏评分" : "显示评分" }}
    </button>
  </div>

  <div v-if="showDebug" class="meta-panel">
    <div>生成: {{ paletteMeta.generationMode }}</div>
    <div>策略: {{ paletteMeta.strategy }}</div>
    <div>模式: {{ paletteMeta.styleMode }}</div>
    <div>总分: {{ paletteMeta.score.total.toFixed(1) }}</div>
    <div>最小色距: {{ paletteMeta.score.minPairDistance.toFixed(1) }}</div>
    <div>目标阈值: {{ paletteMeta.minDistanceUsed }}</div>
  </div>
</template>
