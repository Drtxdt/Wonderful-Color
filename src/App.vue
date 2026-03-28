<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";
import ColorTile from "./components/ColorTile.vue";
import { generateScaleByRule, mutateUnlockedByBase } from "./utils/color";

const colors = ref([
  { hex: "#FF5733", isLocked: false },
  { hex: "#33FF57", isLocked: false },
  { hex: "#3357FF", isLocked: false },
  { hex: "#F1C40F", isLocked: false },
  { hex: "#8E44AD", isLocked: false }
]);

function refreshColors() {
  const lockedColors = colors.value.filter((c) => c.isLocked);

  if (lockedColors.length === 0) {
    const nextHexes = generateScaleByRule(colors.value.length);
    colors.value = colors.value.map((c, i) => ({
      ...c,
      hex: nextHexes[i]
    }));
    return;
  }

  colors.value = mutateUnlockedByBase(colors.value, lockedColors[0].hex);
}

function toggleLock(index) {
  colors.value[index].isLocked = !colors.value[index].isLocked;
}

function readColorsFromHash() {
  const hash = window.location.hash.replace("#", "");
  if (!hash) return;
  const list = hash.split("-").map((h) => "#" + h);
  if (list.length !== colors.value.length) return;
  colors.value = colors.value.map((c, i) => ({ ...c, hex: list[i] || c.hex }));
}

function syncHash(newColors) {
  const hexString = newColors.map((c) => c.hex.replace("#", "")).join("-");
  window.history.replaceState(null, "", "#" + hexString);
}

function handleKeydown(event) {
  if (event.code === "Space") {
    event.preventDefault();
    refreshColors();
  }
}

watch(colors, (newColors) => {
  syncHash(newColors);
}, { deep: true });

onMounted(() => {
  readColorsFromHash();
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <div class="app">
    <ColorTile
      v-for="(color, index) in colors"
      :key="index"
      :color="color"
      @toggle-lock="toggleLock(index)"
    />
    <button id="fresh" @click="refreshColors">Refresh Colors</button>
  </div>
</template>