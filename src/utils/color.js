import chroma from "chroma-js";
import {
  GENERATION_MODES,
  GENERATOR_CONFIG,
  PALETTE_COUNT,
  STRATEGIES,
  STYLE_MODES
} from "../config/palette";

export function getRandomHex() {
  return chroma.random().hex();
}

export function getTextColor(hex) {
  const color = chroma(hex);
  const contrastWithBlack = chroma.contrast(color, "#000");
  const contrastWithWhite = chroma.contrast(color, "#fff");
  return contrastWithBlack >= contrastWithWhite ? "black" : "white";
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeHue(hue) {
  return ((hue % 360) + 360) % 360;
}

function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

function normalizeMode(styleMode) {
  if (styleMode === STYLE_MODES.SOFT || styleMode === STYLE_MODES.VIVID) {
    return styleMode;
  }

  return Math.random() < 0.5 ? STYLE_MODES.SOFT : STYLE_MODES.VIVID;
}

function normalizeGenerationMode(generationMode) {
  if (generationMode === GENERATION_MODES.GRADIENT) {
    return GENERATION_MODES.GRADIENT;
  }
  return GENERATION_MODES.SMART;
}

function pickWeighted(weightMap) {
  const entries = Object.entries(weightMap);
  const total = entries.reduce((acc, [, weight]) => acc + weight, 0);
  let randomValue = Math.random() * total;

  for (const [name, weight] of entries) {
    randomValue -= weight;
    if (randomValue <= 0) {
      return name;
    }
  }

  return entries[entries.length - 1][0];
}

function sortedHueGaps(hues) {
  const sorted = hues.map(normalizeHue).sort((a, b) => a - b);
  const gaps = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const current = sorted[i];
    const next = i === sorted.length - 1 ? sorted[0] + 360 : sorted[i + 1];
    gaps.push(next - current);
  }
  return gaps;
}

function chooseAnchorHue(locks, fallbackHue) {
  if (!locks.length) {
    return fallbackHue;
  }

  return chroma(locks[Math.floor(Math.random() * locks.length)].hex).get("hsl.h");
}

function getProfile(mode) {
  return GENERATOR_CONFIG.modeProfiles[mode];
}

function findNearestLock(locks, index, direction) {
  if (direction === "left") {
    for (let i = locks.length - 1; i >= 0; i -= 1) {
      if (locks[i].index < index) {
        return locks[i];
      }
    }
    return null;
  }

  for (let i = 0; i < locks.length; i += 1) {
    if (locks[i].index > index) {
      return locks[i];
    }
  }
  return null;
}

function strategyOffsets(strategy, count) {
  switch (strategy) {
    case STRATEGIES.ANALOGOUS:
      return [-44, -20, 0, 20, 44].slice(0, count);
    case STRATEGIES.COMPLEMENTARY:
      return [0, 28, 180, 208, 152].slice(0, count);
    case STRATEGIES.SPLIT_COMPLEMENTARY:
      return [0, 150, 210, 24, -24].slice(0, count);
    case STRATEGIES.TRIADIC:
      return [0, 120, 240, 24, 264].slice(0, count);
    case STRATEGIES.TETRADIC:
      return [0, 90, 180, 270, 36].slice(0, count);
    case STRATEGIES.MONOCHROME:
      return [0, 0, 0, 0, 0].slice(0, count);
    case STRATEGIES.HYBRID:
    default:
      return [0, 45, 160, 220, -30].slice(0, count);
  }
}

function buildLightnessRamp(profile, count, strategy) {
  const base = Array.from({ length: count }, (_, index) => {
    const ratio = count === 1 ? 0.5 : index / (count - 1);
    return profile.lightnessMin + ratio * (profile.lightnessMax - profile.lightnessMin);
  });

  if (strategy === STRATEGIES.MONOCHROME) {
    return base;
  }

  return Math.random() > 0.5 ? base.reverse() : base;
}

function buildChromaProfile(profile, count, strategy) {
  if (strategy === STRATEGIES.MONOCHROME) {
    return Array.from({ length: count }, (_, index) => {
      const ratio = count === 1 ? 0.5 : index / (count - 1);
      return profile.chromaMin + ratio * (profile.chromaMax - profile.chromaMin);
    });
  }

  return Array.from({ length: count }, (_, index) => {
    const wave = Math.sin((index / Math.max(1, count - 1)) * Math.PI);
    const center = (profile.chromaMin + profile.chromaMax) / 2;
    const amplitude = (profile.chromaMax - profile.chromaMin) / 2;
    return clamp(center + (wave - 0.5) * amplitude + randomInRange(-8, 8), profile.chromaMin, profile.chromaMax);
  });
}

function buildStrategyPalette({ count, strategy, mode, locks }) {
  const profile = getProfile(mode);
  const fallbackHue = randomInRange(0, 360);
  const anchorHue = chooseAnchorHue(locks, fallbackHue);
  const offsets = strategyOffsets(strategy, count);
  const lightnessRamp = buildLightnessRamp(profile, count, strategy);
  const chromaRamp = buildChromaProfile(profile, count, strategy);

  return Array.from({ length: count }, (_, index) => {
    const hue = normalizeHue(anchorHue + offsets[index] + randomInRange(-GENERATOR_CONFIG.lockHueTolerance, GENERATOR_CONFIG.lockHueTolerance));
    const lightness = clamp(lightnessRamp[index] + randomInRange(-4, 4), profile.lightnessMin, profile.lightnessMax);
    const chromaValue = clamp(chromaRamp[index], profile.chromaMin, profile.chromaMax);
    return chroma.lch(lightness, chromaValue, hue).hex();
  });
}

function applyLockConstraints(hexes, locks) {
  const nextHexes = [...hexes];
  for (const lock of locks) {
    if (lock.index >= 0 && lock.index < nextHexes.length) {
      nextHexes[lock.index] = chroma(lock.hex).hex();
    }
  }
  return nextHexes;
}

function scorePalette(hexes, minDistance, contrastPriority) {
  const colors = hexes.map((hex) => chroma(hex));
  const hues = colors.map((color) => normalizeHue(color.get("hsl.h") || 0));
  const lightnessValues = colors.map((color) => color.luminance());
  const saturationValues = colors.map((color) => color.get("hsl.s") || 0);

  let minPairDistance = Number.POSITIVE_INFINITY;
  let distancePenalty = 0;

  for (let i = 0; i < colors.length; i += 1) {
    for (let j = i + 1; j < colors.length; j += 1) {
      const distance = chroma.distance(colors[i], colors[j], "lab");
      minPairDistance = Math.min(minPairDistance, distance);
      if (distance < minDistance) {
        distancePenalty += (minDistance - distance) * 1.8;
      }
    }
  }

  const hueGaps = sortedHueGaps(hues);
  const targetGap = 360 / hues.length;
  const hueGapPenalty = hueGaps.reduce((acc, gap) => acc + Math.abs(gap - targetGap), 0) / hues.length;

  const lightnessSpread = Math.max(...lightnessValues) - Math.min(...lightnessValues);
  const saturationSpread = Math.max(...saturationValues) - Math.min(...saturationValues);

  let readabilityPenalty = 0;
  for (const color of colors) {
    const contrastBlack = chroma.contrast(color, "#000");
    const contrastWhite = chroma.contrast(color, "#fff");
    const bestContrast = Math.max(contrastBlack, contrastWhite);
    if (bestContrast < 4.5) {
      readabilityPenalty += (4.5 - bestContrast) * 26;
    }
  }

  let total = 100;
  total -= distancePenalty;
  total -= hueGapPenalty * 0.5;
  total -= readabilityPenalty;
  total += lightnessSpread * 14;
  total += saturationSpread * 8;
  total += contrastPriority ? minPairDistance * 1.4 : minPairDistance * 0.9;

  return {
    total,
    minPairDistance,
    hueGapPenalty,
    lightnessSpread,
    saturationSpread,
    readabilityPenalty
  };
}

function optimizeUnlockedSlots(hexes, locks, minDistance, mode) {
  const profile = getProfile(mode);
  const lockedIndexSet = new Set(locks.map((lock) => lock.index));
  const output = [...hexes];

  for (let index = 0; index < output.length; index += 1) {
    if (lockedIndexSet.has(index)) {
      continue;
    }

    let best = output[index];
    let bestScore = -Infinity;
    const currentHue = chroma(output[index]).get("hsl.h");

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const h = normalizeHue(currentHue + randomInRange(-28, 28));
      const c = randomInRange(profile.chromaMin, profile.chromaMax);
      const l = randomInRange(profile.lightnessMin, profile.lightnessMax);
      const candidate = chroma.lch(l, c, h).hex();
      const probe = [...output];
      probe[index] = candidate;
      const score = scorePalette(probe, minDistance, false).total;

      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    }

    output[index] = best;
  }

  return output;
}

function resolveStrategy(mode) {
  const weightMap = GENERATOR_CONFIG.strategyWeights[mode];
  return pickWeighted(weightMap);
}

function generateCandidates({ count, mode, locks, contrastPriority, candidateCount }) {
  const minDistance = contrastPriority
    ? GENERATOR_CONFIG.minDistance.contrastPriority
    : GENERATOR_CONFIG.minDistance.default;

  const candidates = [];

  for (let i = 0; i < candidateCount; i += 1) {
    const strategy = resolveStrategy(mode);
    const generated = buildStrategyPalette({ count, strategy, mode, locks });
    const lockedApplied = applyLockConstraints(generated, locks);
    const optimized = optimizeUnlockedSlots(lockedApplied, locks, minDistance, mode);
    const score = scorePalette(optimized, minDistance, contrastPriority);

    candidates.push({
      hexes: optimized,
      strategy,
      score,
      mode
    });
  }

  return candidates;
}

function chooseBest(candidates) {
  return candidates.reduce((best, current) => {
    if (!best || current.score.total > best.score.total) {
      return current;
    }
    return best;
  }, null);
}

function driftFromColor(hex, mode) {
  const profile = getProfile(mode);
  const [h, s, l] = chroma(hex).hsl();
  const newHue = normalizeHue(h + randomInRange(-GENERATOR_CONFIG.gradient.lockDriftHue, GENERATOR_CONFIG.gradient.lockDriftHue));
  const newS = clamp(s + randomInRange(-0.14, 0.14), 0.15, 0.92);
  const newL = clamp(
    l + randomInRange(-GENERATOR_CONFIG.gradient.lockDriftLightness / 100, GENERATOR_CONFIG.gradient.lockDriftLightness / 100),
    profile.lightnessMin / 100,
    profile.lightnessMax / 100
  );
  return chroma.hsl(newHue, newS, newL).hex();
}

function buildGradientFromUnlocked(count) {
  let scale;

  if (Math.random() <= 0.5) {
    const base = chroma.random();
    const complement = base.set("hsl.h", normalizeHue(base.get("hsl.h") + 180));
    scale = chroma.scale([base, complement]).mode("lch");
  } else {
    const color1 = chroma.random();
    let color2 = chroma.random();
    while (chroma.distance(color1, color2, "lab") < GENERATOR_CONFIG.gradient.minDualDistance) {
      color2 = chroma.random();
    }
    scale = chroma.scale([color1, color2]).mode("lch");
  }

  return Array.from({ length: count }, (_, index) => {
    const t = count === 1 ? 0.5 : index / (count - 1);
    return scale(t).hex();
  });
}

function buildGradientWithLocks(count, locks, mode) {
  const output = new Array(count).fill(null);
  const sortedLocks = [...locks].sort((a, b) => a.index - b.index);

  for (const lock of sortedLocks) {
    output[lock.index] = chroma(lock.hex).hex();
  }

  for (let index = 0; index < count; index += 1) {
    if (output[index]) {
      continue;
    }

    const leftLock = findNearestLock(sortedLocks, index, "left");
    const rightLock = findNearestLock(sortedLocks, index, "right");

    if (leftLock && rightLock) {
      const t = (index - leftLock.index) / (rightLock.index - leftLock.index);
      output[index] = chroma.scale([leftLock.hex, rightLock.hex]).mode("lch")(t).hex();
      continue;
    }

    if (leftLock) {
      const rightAnchor = driftFromColor(leftLock.hex, mode);
      const t = (index - leftLock.index) / Math.max(1, count - 1 - leftLock.index);
      output[index] = chroma.scale([leftLock.hex, rightAnchor]).mode("lch")(t).hex();
      continue;
    }

    if (rightLock) {
      const leftAnchor = driftFromColor(rightLock.hex, mode);
      const t = index / Math.max(1, rightLock.index);
      output[index] = chroma.scale([leftAnchor, rightLock.hex]).mode("lch")(t).hex();
      continue;
    }

    output[index] = getRandomHex();
  }

  return output;
}

function generateGradientPalette({ count, styleMode, locks, contrastPriority }) {
  const mode = normalizeMode(styleMode);
  const minDistance = contrastPriority
    ? GENERATOR_CONFIG.minDistance.contrastPriority
    : GENERATOR_CONFIG.minDistance.default;

  const raw = locks.length === 0
    ? buildGradientFromUnlocked(count)
    : buildGradientWithLocks(count, locks, mode);
  const lockedApplied = applyLockConstraints(raw, locks);
  const optimized = optimizeUnlockedSlots(lockedApplied, locks, minDistance, mode);
  const score = scorePalette(optimized, minDistance, contrastPriority);

  return {
    hexes: optimized,
    strategy: "gradient",
    styleMode: mode,
    score,
    generationMode: GENERATION_MODES.GRADIENT,
    minDistanceUsed: minDistance
  };
}

export function generatePalette(options = {}) {
  const count = options.count ?? PALETTE_COUNT;
  const locks = Array.isArray(options.locks) ? options.locks : [];
  const styleMode = options.styleMode ?? STYLE_MODES.AUTO;
  const contrastPriority = Boolean(options.contrastPriority);
  const generationMode = normalizeGenerationMode(options.generationMode);

  if (generationMode === GENERATION_MODES.GRADIENT) {
    return generateGradientPalette({
      count,
      styleMode,
      locks,
      contrastPriority
    });
  }

  const normalizedMode = normalizeMode(styleMode);
  const candidateCount = options.candidateCount
    ?? (locks.length > 0 ? GENERATOR_CONFIG.candidateCount.withLocks : GENERATOR_CONFIG.candidateCount.default);

  const candidates = generateCandidates({
    count,
    mode: normalizedMode,
    locks,
    contrastPriority,
    candidateCount
  });

  const best = chooseBest(candidates);

  return {
    hexes: best.hexes,
    strategy: best.strategy,
    styleMode: normalizedMode,
    score: best.score,
    generationMode: GENERATION_MODES.SMART,
    minDistanceUsed: contrastPriority
      ? GENERATOR_CONFIG.minDistance.contrastPriority
      : GENERATOR_CONFIG.minDistance.default
  };
}

export function getDefaultPalette() {
  const result = generatePalette({
    count: PALETTE_COUNT,
    styleMode: STYLE_MODES.AUTO,
    generationMode: GENERATION_MODES.SMART,
    locks: []
  });

  return result.hexes;
}