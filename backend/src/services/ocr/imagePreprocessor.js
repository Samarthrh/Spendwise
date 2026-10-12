const sharp = require('sharp');

/**
 * SpendWise Image Preprocessor for Receipts & Invoices
 * Automatically detects the receipt paper region to crop out distracting textured backgrounds
 * (e.g. tablecloths, bedsheets, carpets, dark countertops), then enhances contrast and sharpness.
 */
async function preprocessReceiptImage(imageBuffer) {
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const { width, height } = metadata;

    if (!width || !height) {
      return imageBuffer;
    }

    // Read raw RGB pixels to detect light receipt paper density
    const raw = await image.raw().toBuffer();
    const channels = metadata.channels || 3;

    const rowScores = new Array(height).fill(0);
    const colScores = new Array(width).fill(0);

    const step = 2; // Sample every 2 pixels for speed
    let paperPixelCount = 0;

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const idx = (y * width + x) * channels;
        const r = raw[idx];
        const g = raw[idx + 1];
        const b = raw[idx + 2];

        // White or light-grey receipt paper:
        // High luminance across R, G, B with low color saturation (|r-g| < 40 and |g-b| < 40)
        if (r > 135 && g > 135 && b > 125 && Math.abs(r - g) < 40 && Math.abs(g - b) < 40) {
          rowScores[y]++;
          colScores[x]++;
          paperPixelCount++;
        }
      }
    }

    // Determine if we should crop to receipt paper region
    let left = 0;
    let right = width - 1;
    let top = 0;
    let bottom = height - 1;

    // Minimum 15% width/height of paper pixels in a line to qualify as receipt section
    for (let y = 0; y < height; y++) {
      if (rowScores[y] > width * 0.12) {
        top = Math.max(0, y - 10);
        break;
      }
    }

    for (let y = height - 1; y >= 0; y--) {
      if (rowScores[y] > width * 0.12) {
        bottom = Math.min(height - 1, y + 10);
        break;
      }
    }

    for (let x = 0; x < width; x++) {
      if (colScores[x] > height * 0.12) {
        left = Math.max(0, x - 10);
        break;
      }
    }

    for (let x = width - 1; x >= 0; x--) {
      if (colScores[x] > height * 0.12) {
        right = Math.min(width - 1, x + 10);
        break;
      }
    }

    const cropWidth = right - left;
    const cropHeight = bottom - top;

    // Only crop if a significant bounding box was detected
    const shouldCrop =
      cropWidth >= width * 0.35 &&
      cropHeight >= height * 0.35 &&
      (cropHeight < height * 0.95 || cropWidth < width * 0.95);

    let pipeline = sharp(imageBuffer).rotate(); // auto-orient based on EXIF

    if (shouldCrop) {
      console.log(`[Preprocessor] Cropping isolated receipt paper region: ${cropWidth}x${cropHeight} at (${left}, ${top})`);
      pipeline = pipeline.extract({
        left,
        top,
        width: cropWidth,
        height: cropHeight,
      });
    }

    // Grayscale, normalize contrast, sharpen, and output PNG for optimal OCR recognition
    const processedBuffer = await pipeline
      .grayscale()
      .normalise()
      .sharpen()
      .png()
      .toBuffer();

    return processedBuffer;
  } catch (err) {
    console.warn('[Preprocessor] Warning: Image preprocessing failed, using original buffer:', err.message);
    return imageBuffer;
  }
}

module.exports = {
  preprocessReceiptImage,
};
