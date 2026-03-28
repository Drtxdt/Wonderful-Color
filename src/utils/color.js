import chroma from 'chroma-js';

export function getRandomHex() {
    return chroma.random().hex();
}

export function getTextColor(hex) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? 'black' : 'white';
}

export function generateScaleByRule(count) {
  let scale;
  const randomFlag = Math.random();

  if (randomFlag <= 0.5) {
    const base = chroma.random();
    const complement = base.set("hsl.h", (base.get("hsl.h") + 180) % 360);
    scale = chroma.scale([base, complement]).mode("lch");
  } else {
    const color1 = chroma.random();
    let color2 = chroma.random();
    while (chroma.distance(color1, color2) < 60) {
      color2 = chroma.random();
    }
    scale = chroma.scale([color1, color2]).mode("lch");
  }

  return Array.from({ length: count }, (_, i) => {
    return scale(i / (count - 1)).hex();
  });
}

export function mutateUnlockedByBase(colors, baseHex) {
  const [h, s, l] = chroma(baseHex).hsl();

  return colors.map((c) => {
    if (c.isLocked) return c;
    const newHue = (h + (Math.random() * 40 - 40) + 360) % 360;
    const newS = Math.min(1, Math.max(0, s + (Math.random() * 0.2 - 0.1)));
    const newL = Math.min(1, Math.max(0, l + (Math.random() * 0.2 - 0.1)));
    return { ...c, hex: chroma.hsl(newHue, newS, newL).hex() };
  });
}