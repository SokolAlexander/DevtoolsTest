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

let currentPage = 1;
let isLoading = false;

const gallery = document.getElementById("gallery");
const loadMoreBtn = document.getElementById("loadMore");
const loadingIndicator = document.getElementById("loading");

const originalImages = new Map();
const imageDatas = [];
const imageDataMap = new Map();

function createPhotoCard(photo) {
  const card = document.createElement("div");
  card.className = "photo-card";

  const img = document.createElement("img");
  img.src = photo.urls.regular;
  img.alt = photo.alt_description || "Photo";
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

  const handleProcess = async (e) => {
    const activeProcessButton = e.target;

    const restoreButton = document.createElement("button");
    restoreButton.textContent = "Restore original";
    restoreButton.className = "restore-button adjust-button";
    restoreButton.addEventListener("click", handleRestore);

    // the element used as a key...
    // maybe overkill. A new image element is a new key
    originalImages.set(restoreButton, {
      url: img.src,
    });

    const dataUrl = processImg(img);
    img.src = dataUrl;

    activeProcessButton.replaceWith(restoreButton);
  };

  const handleRestore = (e) => {
    const activeRestoreButton = e.target;

    const originalImgSrc = originalImages.get(activeRestoreButton);
    img.src = originalImgSrc.url;

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
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let filtered = imageData;

  if (imageDataMap.has(imageData)) {
    filtered = imageDataMap.get(imageData);
  } else {
    // Apply filters in sequence
    filtered = gaussianBlurFilter(filtered, canvas.width, canvas.height);
    filtered = applySepia(filtered);
    filtered = applyVignette(filtered, canvas.width, canvas.height);
    filtered = applySharpen(filtered, canvas.width, canvas.height);

    // bad idea for a cache key :)
    imageDataMap.set(imageData, filtered);
  }

  ctx.putImageData(filtered, 0, 0);
  const dataUrl = canvas.toDataURL("image/jpeg");

  return dataUrl;
}

async function loadPhotos(count = 10) {
  if (isLoading) return;
  isLoading = true;
  loadingIndicator.style.display = "block";

  const startIndex = (currentPage - 1) * count;
  const photos = IMAGE_URLS.slice(startIndex, startIndex + count);

  photos.forEach((photo) => {
    const card = createPhotoCard(photo);
    gallery.appendChild(card);

    const rect = card.getBoundingClientRect();
    // not exactly easy to find in the devtools but a bad practice
    // overall - layout thrashing. Needs some improvement still
    if (rect.bottom > window.innerHeight) {
      card.style.marginTop = "20px";
    }
  });

  isLoading = false;
  loadingIndicator.style.display = "none";
  currentPage++;
}

/*
  ================================================
  FILTERS
  ================================================
*/
function applySharpen(imageData, width, height) {
  const data = imageData.data;
  const origData = new Uint8ClampedArray(data);

  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

  // Deliberately inefficient implementation
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sumR = 0,
        sumG = 0,
        sumB = 0;

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

function gaussianBlurFilter(imageData, width, height) {
  const src = imageData.data;
  const out = new Uint8ClampedArray(src.length);

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
  const img = new Image();
  img.crossOrigin = "anonymous";

  try {
    // Fetch and decode the image
    const response = await fetch(
      "https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg"
    );
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    // another leak, should be:
    // img.onload = () => {
    // URL.revokeObjectURL(objectUrl);
    // };

    img.src = objectUrl;
    img.style.width = "100%";
    img.style.maxHeight = "80vh";
    img.style.objectFit = "contain";
    img.style.marginBottom = "20px";

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

/*
  ================================================
  FILTERS END
  ================================================
*/

const init = () => {
  loadPhotos(20);
  void loadMainPhoto();
};

init();
