<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";
import ColorTile from "./components/ColorTile.vue";
import PaletteDebugPanel from "./components/PaletteDebugPanel.vue";
import { generatePalette, getDefaultPalette } from "./utils/color";
import { GENERATION_MODES, PALETTE_COUNT, STYLE_MODES } from "./config/palette";

const colors = ref(getDefaultPalette().map((hex) => ({ hex, isLocked: false })));
const generationMode = ref(GENERATION_MODES.SMART);
const styleMode = ref(STYLE_MODES.AUTO);
const contrastPriority = ref(false);
const showDebug = ref(false);
const paletteMeta = ref({
  generationMode: GENERATION_MODES.SMART,
  strategy: "-",
  styleMode: STYLE_MODES.AUTO,
  score: {
    total: 0,
    minPairDistance: 0,
    hueGapPenalty: 0,
    lightnessSpread: 0,
    saturationSpread: 0,
    readabilityPenalty: 0
  },
  minDistanceUsed: 0
});

const generationOptions = [
  { value: GENERATION_MODES.SMART, label: "智能" },
  { value: GENERATION_MODES.GRADIENT, label: "渐变" }
];

const styleOptions = [
  { value: STYLE_MODES.AUTO, label: "自动混合" },
  { value: STYLE_MODES.SOFT, label: "柔和高级" },
  { value: STYLE_MODES.VIVID, label: "鲜艳活力" }
];

function buildLocks(currentColors) {
  return currentColors
    .map((color, index) => ({ ...color, index }))
    .filter((item) => item.isLocked)
    .map((item) => ({ index: item.index, hex: item.hex }));
}

function applyPalette(hexes) {
  colors.value = colors.value.map((color, index) => ({
    ...color,
    hex: hexes[index] || color.hex
  }));
}

function generateAndApplyPalette() {
  const result = generatePalette({
    count: PALETTE_COUNT,
    generationMode: generationMode.value,
    styleMode: styleMode.value,
    contrastPriority: contrastPriority.value,
    locks: buildLocks(colors.value)
  });

  applyPalette(result.hexes);
  paletteMeta.value = result;
}

function refreshColors() {
  generateAndApplyPalette();
}

function toggleLock(index) {
  colors.value[index].isLocked = !colors.value[index].isLocked;
}

function readColorsFromHash() {
  const hash = window.location.hash.replace("#", "");
  if (!hash) return false;
  const list = hash.split("-").map((h) => "#" + h);
  if (list.length !== PALETTE_COUNT) return false;
  colors.value = colors.value.map((c, i) => ({ ...c, hex: list[i] || c.hex }));
  return true;
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

  if (event.key.toLowerCase() === "d") {
    showDebug.value = !showDebug.value;
  }
}

watch(colors, (newColors) => {
  syncHash(newColors);
}, { deep: true });

watch([generationMode, styleMode, contrastPriority], () => {
  generateAndApplyPalette();
});

onMounted(() => {
  const hashLoaded = readColorsFromHash();
  document.addEventListener("keydown", handleKeydown);
  if (!hashLoaded) {
    generateAndApplyPalette();
  }
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
    <PaletteDebugPanel
      :generation-mode="generationMode"
      :style-mode="styleMode"
      :contrast-priority="contrastPriority"
      :show-debug="showDebug"
      :generation-options="generationOptions"
      :style-options="styleOptions"
      :palette-meta="paletteMeta"
      @update:generation-mode="generationMode = $event"
      @update:style-mode="styleMode = $event"
      @update:contrast-priority="contrastPriority = $event"
      @update:show-debug="showDebug = $event"
    />
    <button id="fresh" @click="refreshColors">Refresh Colors</button>
  </div>
</template>