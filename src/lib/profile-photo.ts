export const PHOTO_DIMENSION = 192;
export const MAX_PHOTO_BYTES = 32 * 1024;
export const MAX_SOURCE_BYTES = 8 * 1024 * 1024;

/** Re-encoding on canvas removes the original metadata and keeps only a thumbnail. */
export async function prepareProfilePhoto(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Escolha uma foto JPG, PNG ou WebP.");
  if (file.size > MAX_SOURCE_BYTES) throw new Error("Escolha uma foto de até 8 MB.");
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw new Error("Não foi possível abrir essa foto. Tente outra imagem JPG, PNG ou WebP."); }
  try {
    if (!bitmap.width || !bitmap.height) throw new Error("Essa imagem não tem dimensões válidas.");
    const canvas = document.createElement("canvas");
    canvas.width = PHOTO_DIMENSION; canvas.height = PHOTO_DIMENSION;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Seu navegador não conseguiu preparar a foto.");
    context.fillStyle = "#f4f3e9";
    context.fillRect(0, 0, PHOTO_DIMENSION, PHOTO_DIMENSION);
    const side = Math.min(bitmap.width, bitmap.height);
    context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side,
      0, 0, PHOTO_DIMENSION, PHOTO_DIMENSION);
    for (const quality of [0.85, 0.7, 0.5]) {
      const data = canvas.toDataURL("image/jpeg", quality);
      const bytes = Math.floor((data.length - "data:image/jpeg;base64,".length) * 3 / 4);
      if (data.startsWith("data:image/jpeg;base64,") && bytes <= MAX_PHOTO_BYTES) return data;
    }
    throw new Error("Não foi possível reduzir essa foto. Escolha outra imagem.");
  } finally { bitmap.close(); }
}
