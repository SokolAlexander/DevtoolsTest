function generatePattern(width, height, seed) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Generate a unique color based on the seed
  const hue = (seed * 137.5) % 360;
  ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
  ctx.fillRect(0, 0, width, height);

  // Add some random shapes
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 20 + Math.random() * 60;

    ctx.fillStyle = `hsl(${(hue + 180) % 360}, 70%, 50%)`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.toDataURL();
}

const IMAGE_URLS = Array(100)
  .fill()
  .map((_, i) => ({
    urls: {
      regular: `https://picsum.photos/id/${i}/1200/800`,
    },
    user: {
      name: `Photographer ${i + 1}`,
    },
    description: `Beautiful landscape photo ${i + 1}`,
    alt_description: `Nature photo ${i + 1}`,
  }));

const CACHE_SIZE = 1000;

let photoCache = [];
let currentPage = 1;
let isLoading = false;
let searchTimeout;
let processingQueue = [];
let isProcessing = false;

const gallery = document.getElementById("gallery");
const searchInput = document.getElementById("searchInput");
const loadMoreBtn = document.getElementById("loadMore");
const loadingIndicator = document.getElementById("loading");

const originalImages = new Map();

function createPhotoCard(photo) {
  const card = document.createElement("div");
  card.className = "photo-card";

  const img = document.createElement("img");
  img.src = photo.urls.regular;
  img.alt = photo.alt_description || "Photo";
  img.loading = "lazy";
  img.crossOrigin = "anonymous";

  const info = document.createElement("div");
  info.className = "photo-info";

  const title = document.createElement("h3");
  title.textContent = photo.user.name;

  const description = document.createElement("p");
  description.textContent = photo.description || "No description available";

  const processButton = document.createElement("button");
  processButton.textContent = "Make picture worse";
  processButton.className = "adjust-button";

  let activeBtnToDebug;

  const handleProcess = (e) => {
    const activeProcessButton = e.target;

    const restoreButton = document.createElement("button");
    restoreButton.textContent = "Restore original";
    restoreButton.className = "restore-button adjust-button";
    restoreButton.addEventListener("click", handleRestore);
    originalImages.set(restoreButton, img.src);

    processImg(img);

    console.log("originalImages", originalImages.keys().next().value);
    activeBtnToDebug = restoreButton;
    activeProcessButton.replaceWith(restoreButton);
  };

  const handleRestore = (e) => {
    const activeRestoreButton = e.target;

    console.log("same button?", activeBtnToDebug === activeRestoreButton);
    const originalImgSrc = originalImages.get(activeRestoreButton);

    console.log("originalImages", originalImgSrc);
    img.src = originalImgSrc;

    console.log("originalImagesSize", originalImages.size);
    const newProcessButton = document.createElement("button");
    newProcessButton.textContent = "Make picture worse";
    newProcessButton.className = "adjust-button";
    newProcessButton.addEventListener("click", handleProcess);

    activeRestoreButton.replaceWith(newProcessButton);
  };

  processButton.addEventListener("click", handleProcess);

  info.appendChild(title);
  info.appendChild(description);
  info.appendChild(processButton);
  card.appendChild(img);
  card.appendChild(info);

  return card;
}

function processImg(img) {
  console.time("Image Processing");

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const start = performance.now();
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Apply filters in sequence
  let filtered = imageData;
  filtered = gaussianBlurFilter(filtered, canvas.width, canvas.height);
  filtered = applySepia(filtered);
  filtered = applyVignette(filtered, canvas.width, canvas.height);
  filtered = applySharpen(filtered, canvas.width, canvas.height);

  ctx.putImageData(filtered, 0, 0);

  const end = performance.now();
  console.log(`Processing took ${Math.round(end - start)}ms`);

  img.src = canvas.toDataURL("image/jpeg");

  console.timeEnd("Image Processing");
}

function processImage(photo, imgElement, callback) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();

  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;

    let a = 0;
    for (let i = 0; i < 1_000_000 * 100; i++) {
      a = Math.max(a, Math.sqrt(i));
    }
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] * 1.2);
      data[i + 1] = Math.min(255, data[i + 1] * 1.2);
      data[i + 2] = Math.min(255, data[i + 2] * 1.2);
    }

    ctx.putImageData(imageData, 0, 0);

    const processedData = canvas.toDataURL();
    photoCache.push({
      original: photo,
      processed: processedData,
      timestamp: Date.now(),
    });

    if (photoCache.length > CACHE_SIZE) {
      photoCache.shift();
    }

    imgElement.src = processedData;

    console.log("processed");
    if (callback) callback();
  };

  img.src = photo.urls.regular;
}

async function loadPhotos(count = 10) {
  if (isLoading) return;
  isLoading = true;
  loadingIndicator.style.display = "block";

  const startIndex = (currentPage - 1) * count;
  const photos = IMAGE_URLS.slice(startIndex, startIndex + count);

  // Simulate network delay
  //   await new Promise((resolve) => setTimeout(resolve, 1000));

  photos.forEach((photo) => {
    const card = createPhotoCard(photo);
    gallery.appendChild(card);

    // Force layout thrashing
    const rect = card.getBoundingClientRect();
    if (rect.bottom > window.innerHeight) {
      card.style.marginTop = "20px";
    }
  });

  isLoading = false;
  loadingIndicator.style.display = "none";
  currentPage++;
}

function searchPhotos(query) {
  const cards = document.querySelectorAll(".photo-card");
  // Inefficient search that causes layout thrashing
  cards.forEach((card) => {
    const title = card.querySelector("h3").textContent.toLowerCase();
    const description = card.querySelector("p").textContent.toLowerCase();
    const searchTerm = query.toLowerCase();

    // Force layout thrashing by reading and writing styles in a loop
    const rect = card.getBoundingClientRect();
    if (title.includes(searchTerm) || description.includes(searchTerm)) {
      card.style.display = "block";
      card.style.marginTop = `${rect.height * 0.1}px`;
    } else {
      card.style.display = "none";
    }
  });
}

searchInput.addEventListener("input", (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchPhotos(e.target.value);
  }, 100);
});

loadMoreBtn.addEventListener("click", () => {
  loadPhotos(20);
});

window.addEventListener("scroll", () => {
  if (
    window.innerHeight + window.scrollY >=
    document.body.offsetHeight - 1000
  ) {
    loadPhotos(10);
  }
});

const init = () => {
  loadPhotos(20);
  void loadMainPhoto(20);
};

init();

function calculateHistogram(data) {
  const histogram = {
    r: new Array(256).fill(0),
    g: new Array(256).fill(0),
    b: new Array(256).fill(0),
  };

  // O(n) operation on all pixels
  for (let i = 0; i < data.length; i += 4) {
    histogram.r[data[i]]++;
    histogram.g[data[i + 1]]++;
    histogram.b[data[i + 2]]++;
  }

  // Unnecessary cumulative calculations (more CPU work)
  const cumulativeHistogram = {
    r: new Array(256).fill(0),
    g: new Array(256).fill(0),
    b: new Array(256).fill(0),
  };

  for (let i = 0; i < 256; i++) {
    cumulativeHistogram.r[i] =
      (i > 0 ? cumulativeHistogram.r[i - 1] : 0) + histogram.r[i];
    cumulativeHistogram.g[i] =
      (i > 0 ? cumulativeHistogram.g[i - 1] : 0) + histogram.g[i];
    cumulativeHistogram.b[i] =
      (i > 0 ? cumulativeHistogram.b[i - 1] : 0) + histogram.b[i];
  }

  return { histogram, cumulativeHistogram };
}

// Inefficient noise reduction algorithm (second pass)
function applyNoiseReduction(data, width, height) {
  // Create a copy of the data (memory inefficient)
  const origData = new Uint8ClampedArray(data);

  // Apply a basic box blur filter - inefficient implementation
  // This could be optimized with separable filters, but we're doing it the slow way
  const kernelSize = 3;
  const halfKernel = Math.floor(kernelSize / 2);

  // O(n * k²) operation where k is kernel size - very inefficient for large images
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sumR = 0,
        sumG = 0,
        sumB = 0;
      let count = 0;

      // Apply kernel - inefficient nested loops
      for (let ky = -halfKernel; ky <= halfKernel; ky++) {
        for (let kx = -halfKernel; kx <= halfKernel; kx++) {
          const posX = Math.min(Math.max(x + kx, 0), width - 1);
          const posY = Math.min(Math.max(y + ky, 0), height - 1);

          const idx = (posY * width + posX) * 4;

          sumR += origData[idx];
          sumG += origData[idx + 1];
          sumB += origData[idx + 2];
          count++;
        }
      }

      // Set average values
      const idx = (y * width + x) * 4;
      data[idx] = Math.round(sumR / count);
      data[idx + 1] = Math.round(sumG / count);
      data[idx + 2] = Math.round(sumB / count);
    }
  }
}

// Apply color adjustments based on histogram (third pass)
function applyColorAdjustments(data, histogramData) {
  const { histogram, cumulativeHistogram } = histogramData;

  // Calculate maximum cumulative values
  const maxR = cumulativeHistogram.r[255];
  const maxG = cumulativeHistogram.g[255];
  const maxB = cumulativeHistogram.b[255];

  // Create LUTs for histogram equalization (unnecessary pre-computation)
  const lutR = new Array(256);
  const lutG = new Array(256);
  const lutB = new Array(256);

  for (let i = 0; i < 256; i++) {
    lutR[i] = Math.round((cumulativeHistogram.r[i] / maxR) * 255);
    lutG[i] = Math.round((cumulativeHistogram.g[i] / maxG) * 255);
    lutB[i] = Math.round((cumulativeHistogram.b[i] / maxB) * 255);
  }

  // Apply the LUTs to each pixel
  for (let i = 0; i < data.length; i += 4) {
    // Add some contrast and vibrance adjustments (more computation)
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Convert to HSL (expensive conversion)
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    let l = (max + min) / 2;

    let h, s;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max * 255) {
        case r:
          h = (g / 255 - b / 255) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b / 255 - r / 255) / d + 2;
          break;
        case b:
          h = (r / 255 - g / 255) / d + 4;
          break;
      }

      h /= 6;
    }

    // Adjust saturation and lightness
    s = Math.min(s * 1.2, 1); // Increase saturation

    // Apply contrast curve to lightness (more computation)
    l = 0.5 + (l - 0.5) * 1.3; // Increase contrast

    // Convert back to RGB (expensive conversion)
    let r1, g1, b1;

    if (s === 0) {
      r1 = g1 = b1 = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      const hueToRgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      r1 = hueToRgb(p, q, h + 1 / 3);
      g1 = hueToRgb(p, q, h);
      b1 = hueToRgb(p, q, h - 1 / 3);
    }

    // Apply histogram equalization on top of HSL adjustments
    data[i] = Math.round((r1 * 255 * lutR[r]) / 255);
    data[i + 1] = Math.round((g1 * 255 * lutG[g]) / 255);
    data[i + 2] = Math.round((b1 * 255 * lutB[b]) / 255);
  }
}

// Apply sharpening filter (fourth pass)
function applySharpen(imageData, width, height) {
  const data = imageData.data;
  // Create a copy of the data (memory inefficient)
  const origData = new Uint8ClampedArray(data);

  // Sharpen kernel
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

  // Apply kernel convolution - inefficient implementation
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sumR = 0,
        sumG = 0,
        sumB = 0;

      // Apply convolution
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const kernelIdx = (ky + 1) * 3 + (kx + 1);

          sumR += origData[idx] * kernel[kernelIdx];
          sumG += origData[idx + 1] * kernel[kernelIdx];
          sumB += origData[idx + 2] * kernel[kernelIdx];
        }
      }

      // Set values with clamping
      const idx = (y * width + x) * 4;
      data[idx] = Math.min(255, Math.max(0, sumR));
      data[idx + 1] = Math.min(255, Math.max(0, sumG));
      data[idx + 2] = Math.min(255, Math.max(0, sumB));
    }
  }
  imageData.data.set(data);
  return imageData;
}

// Apply vignette effect (fifth pass)
function applyVignette(imageData, width, height) {
  const data = imageData.data;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

  // Precalculate a ton of unnecessary values (wasteful)
  const distances = new Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      distances[y * width + x] = Math.sqrt(dx * dx + dy * dy) / maxDistance;
    }
  }

  // Apply vignette effect
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Use pre-calculated distance (inefficient memory access pattern)
      const distance = distances[y * width + x];

      // Apply a smooth falloff for the vignette
      const falloff = Math.cos(distance * Math.PI * 0.5);
      const vignetteAmount = falloff * falloff;

      // Apply the vignette effect
      data[idx] = data[idx] * vignetteAmount;
      data[idx + 1] = data[idx + 1] * vignetteAmount;
      data[idx + 2] = data[idx + 2] * vignetteAmount;
    }
  }
  imageData.data.set(data);

  return imageData;
}

// Grayscale filter
function grayscaleFilter(imageData) {
  const data = imageData.data;
  const len = data.length;

  for (let i = 0; i < len; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = avg;
    data[i + 1] = avg;
    data[i + 2] = avg;
  }

  return imageData;
}

// Box Blur (3x3 kernel)
function boxBlurFilter(imageData, width, height) {
  const src = imageData.data;
  const out = new Uint8ClampedArray(src.length);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let r = 0,
        g = 0,
        b = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          r += src[idx];
          g += src[idx + 1];
          b += src[idx + 2];
        }
      }
      const i = (y * width + x) * 4;
      out[i] = r / 9;
      out[i + 1] = g / 9;
      out[i + 2] = b / 9;
      out[i + 3] = 255;
    }
  }

  imageData.data.set(out);
  return imageData;
}

// Sobel Edge Detection
function sobelEdgeFilter(imageData, width, height) {
  const src = imageData.data;
  const out = new Uint8ClampedArray(src.length);

  const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sx = 0,
        sy = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const val = src[idx]; // Grayscale assumed

          const kernelIndex = (ky + 1) * 3 + (kx + 1);
          sx += gx[kernelIndex] * val;
          sy += gy[kernelIndex] * val;
        }
      }

      const magnitude = Math.sqrt(sx * sx + sy * sy);
      const i = (y * width + x) * 4;
      out[i] = out[i + 1] = out[i + 2] = magnitude;
      out[i + 3] = 255;
    }
  }

  imageData.data.set(out);
  return imageData;
}

function gaussianBlurFilter(imageData, width, height) {
  const src = imageData.data;
  const out = new Uint8ClampedArray(src.length);

  // A simple 5x5 Gaussian kernel (normalized sum = 273)
  //   const kernel = [
  //     [1, 4, 7, 4, 1],
  //     [4, 16, 26, 16, 4],
  //     [7, 26, 41, 26, 7],
  //     [4, 16, 26, 16, 4],
  //     [1, 4, 7, 4, 1],
  //   ];
  const kernel = [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1],
  ];
  const kernelSum = 49;

  const kernelSize = 7;
  const half = Math.floor(kernelSize / 2);
  //   const kernelSum = 273;

  for (let y = half; y < height - half; y++) {
    for (let x = half; x < width - half; x++) {
      let r = 0,
        g = 0,
        b = 0;

      for (let ky = -half; ky <= half; ky++) {
        for (let kx = -half; kx <= half; kx++) {
          const px = x + kx;
          const py = y + ky;
          const pixelIndex = (py * width + px) * 4;
          const weight = kernel[ky + half][kx + half];

          r += src[pixelIndex] * weight;
          g += src[pixelIndex + 1] * weight;
          b += src[pixelIndex + 2] * weight;
        }
      }

      const i = (y * width + x) * 4;
      out[i] = r / kernelSum;
      out[i + 1] = g / kernelSum;
      out[i + 2] = b / kernelSum;
      out[i + 3] = 255;
    }
  }

  imageData.data.set(out);
  return imageData;
}

function tiltShiftFilter(imageData, width, height) {
  const src = new Uint8ClampedArray(imageData.data);
  const out = new Uint8ClampedArray(src.length);
  const bands = 20; // Divide image into this many horizontal slices
  const center = height / 2;
  const maxBlurRadius = 6;

  const bandHeight = Math.floor(height / bands);

  for (let band = 0; band < bands; band++) {
    const yStart = band * bandHeight;
    const yEnd = Math.min(yStart + bandHeight, height);

    // Blur intensity based on distance from center
    const bandCenter = (yStart + yEnd) / 2;
    const distFromFocus = Math.abs(bandCenter - center) / center; // 0 to 1
    const blurRadius = Math.round(distFromFocus * maxBlurRadius);

    // Process each row in the band
    for (let y = yStart; y < yEnd; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0,
          g = 0,
          b = 0,
          count = 0;

        // Simple horizontal box blur with radius
        for (let dx = -blurRadius; dx <= blurRadius; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= width) continue;

          const i = (y * width + xx) * 4;
          r += src[i];
          g += src[i + 1];
          b += src[i + 2];
          count++;
        }

        const i = (y * width + x) * 4;
        out[i] = r / count;
        out[i + 1] = g / count;
        out[i + 2] = b / count;
        out[i + 3] = 255;
      }
    }
  }

  imageData.data.set(out);
  return imageData;
}

function applySepia(imageData) {
  const data = imageData.data;
  const len = data.length;

  for (let i = 0; i < len; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Sepia formula
    const tr = 0.393 * r + 0.769 * g + 0.189 * b;
    const tg = 0.349 * r + 0.686 * g + 0.168 * b;
    const tb = 0.272 * r + 0.534 * g + 0.131 * b;

    data[i] = Math.min(255, tr);
    data[i + 1] = Math.min(255, tg);
    data[i + 2] = Math.min(255, tb);
  }

  return imageData;
}

async function loadMainPhoto() {
  console.time("Main Photo Load");
  const img = new Image();
  img.crossOrigin = "anonymous";

  try {
    // Create a loading indicator
    const loadingDiv = document.createElement("div");
    loadingDiv.textContent = "Loading main photo...";
    loadingDiv.style.position = "fixed";
    loadingDiv.style.top = "10px";
    loadingDiv.style.left = "50%";
    loadingDiv.style.transform = "translateX(-50%)";
    loadingDiv.style.padding = "10px";
    loadingDiv.style.background = "rgba(0,0,0,0.7)";
    loadingDiv.style.color = "white";
    loadingDiv.style.borderRadius = "5px";
    document.body.appendChild(loadingDiv);

    // Fetch and decode the image
    const response = await fetch(
      "https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg"
    );
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    img.onload = () => {
      console.timeEnd("Main Photo Load");
      loadingDiv.remove();
      URL.revokeObjectURL(objectUrl); // Clean up the object URL
    };

    img.onerror = (error) => {
      console.error("Error loading main photo:", error);
      loadingDiv.textContent = "Error loading photo";
      loadingDiv.style.background = "rgba(255,0,0,0.7)";
    };

    img.src = objectUrl;
    img.style.width = "100%";
    img.style.maxHeight = "80vh";
    img.style.objectFit = "contain";
    img.style.marginBottom = "20px";

    // Use the element with id "mainPhoto" instead of prepending
    const mainPhotoContainer = document.getElementById("mainPhoto");
    if (mainPhotoContainer) {
      mainPhotoContainer.innerHTML = ""; // Clear any existing content
      mainPhotoContainer.appendChild(img);
    } else {
      console.error('Element with id "mainPhoto" not found');
    }
  } catch (error) {
    console.error("Error in loadMainPhoto:", error);
  }
}

// Add a button to trigger the photo load
const loadMainPhotoBtn = document.createElement("button");
loadMainPhotoBtn.textContent = "Load Main Photo";
loadMainPhotoBtn.style.position = "fixed";
loadMainPhotoBtn.style.top = "10px";
loadMainPhotoBtn.style.right = "10px";
loadMainPhotoBtn.style.padding = "10px";
loadMainPhotoBtn.style.zIndex = "1000";
loadMainPhotoBtn.addEventListener("click", loadMainPhoto);
document.body.appendChild(loadMainPhotoBtn);
