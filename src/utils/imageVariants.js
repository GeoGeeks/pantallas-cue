import { withBase } from "../config/agenda.js";

const availableImageFiles = new Set(
  Object.keys(import.meta.glob("/public/images/**/*.{avif,webp,png,jpg,jpeg}", { eager: false })).map((filePath) =>
    filePath.replace(/^\/public\//, ""),
  ),
);

export function getResponsiveImageProps(baseFileName, variants = [], sizes = undefined) {
  const basePath = `images/${baseFileName}`;
  const validVariants = variants.filter(({ file }) => availableImageFiles.has(`images/${file}`));

  const srcSet = validVariants.length
    ? validVariants
        .map(({ file, width }) => `${withBase(`images/${file}`)} ${width}w`)
        .join(", ")
    : undefined;

  return {
    src: withBase(basePath),
    ...(srcSet ? { srcSet, sizes } : {}),
  };
}
