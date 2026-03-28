<script setup>
import { getTextColor } from "../utils/color";

const props = defineProps({
  color: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(["toggle-lock"]);
</script>

<template>
  <div class="color-box" :style="{ backgroundColor: color.hex }">
    <div class="content" :style="{ color: getTextColor(color.hex) }">
      <span class="hex">{{ color.hex.toUpperCase() }}</span>
      <button class="lock-btn" @click="emit('toggle-lock')">
        <i class="material-icons">
          {{ color.isLocked ? 'lock' : 'lock_open' }}
        </i>
      </button>
    </div>
  </div>
</template>