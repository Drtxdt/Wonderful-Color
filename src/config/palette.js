export const PALETTE_COUNT = 5;

export const STYLE_MODES = {
  SOFT: "soft",
  VIVID: "vivid",
  AUTO: "auto"
};

export const GENERATION_MODES = {
  SMART: "smart",
  GRADIENT: "gradient"
};

export const STRATEGIES = {
  ANALOGOUS: "analogous",
  COMPLEMENTARY: "complementary",
  SPLIT_COMPLEMENTARY: "split-complementary",
  TRIADIC: "triadic",
  TETRADIC: "tetradic",
  MONOCHROME: "monochrome",
  HYBRID: "hybrid"
};

export const GENERATOR_CONFIG = {
  candidateCount: {
    default: 18,
    withLocks: 24
  },
  minDistance: {
    default: 34,
    contrastPriority: 42
  },
  lockHueTolerance: 8,
  gradient: {
    minDualDistance: 58,
    lockDriftHue: 28,
    lockDriftLightness: 12,
    lockDriftChroma: 16
  },
  modeProfiles: {
    soft: {
      lightnessMin: 30,
      lightnessMax: 85,
      chromaMin: 24,
      chromaMax: 62
    },
    vivid: {
      lightnessMin: 24,
      lightnessMax: 82,
      chromaMin: 40,
      chromaMax: 92
    }
  },
  strategyWeights: {
    soft: {
      analogous: 0.24,
      monochrome: 0.17,
      "split-complementary": 0.16,
      complementary: 0.14,
      triadic: 0.12,
      tetradic: 0.07,
      hybrid: 0.1
    },
    vivid: {
      triadic: 0.22,
      complementary: 0.2,
      "split-complementary": 0.18,
      tetradic: 0.14,
      analogous: 0.11,
      monochrome: 0.05,
      hybrid: 0.1
    }
  }
};
