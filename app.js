let currentPage = 1;
let isLoading = false;
const gallery = document.getElementById("gallery");

const originalImagesCache = new Map();
const filteredImagesCache = new Map();

function createProcessButton(img) {
  const processButton = document.createElement("button");
  processButton.textContent = "Make picture worse";
  processButton.className = "adjust-button";

  const handleProcess = async (e) => {
    const activeProcessButton = e.target;

    const restoreButton = document.createElement("button");
    restoreButton.textContent = "Restore original";
    restoreButton.className = "restore-button adjust-button";
    restoreButton.addEventListener("click", handleRestore);

    originalImagesCache.set(restoreButton, {
      url: img.src,
    });

    const dataUrl = processImg(img);
    img.src = dataUrl;

    activeProcessButton.replaceWith(restoreButton);
  };

  const handleRestore = (e) => {
    const activeRestoreButton = e.target;

    const originalImgSrc = originalImagesCache.get(activeRestoreButton);
    img.src = originalImgSrc.url;

    const newProcessButton = document.createElement("button");
    newProcessButton.textContent = "Make picture worse";
    newProcessButton.className = "adjust-button";
    newProcessButton.addEventListener("click", handleProcess);

    activeRestoreButton.replaceWith(newProcessButton);
  };

  processButton.addEventListener("click", handleProcess);
  return processButton;
}

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

  const processButton = createProcessButton(img);

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

  // first check the cache
  if (filteredImagesCache.has(imageData)) {
    filtered = filteredImagesCache.get(imageData);
  } else {
    filtered = applyFiltersSequentially(imageData, canvas.width, canvas.height);
    // store the result to avoid recalculation
    filteredImagesCache.set(imageData, filtered);
  }

  ctx.putImageData(filtered, 0, 0);
  const dataUrl = canvas.toDataURL("image/jpeg");

  return dataUrl;
}

function loadPhotos(count = 10) {
  if (isLoading) return;

  isLoading = true;

  const startIndex = (currentPage - 1) * count;
  const photos = IMAGE_URLS.slice(startIndex, startIndex + count);

  photos.forEach((photo) => {
    const card = createPhotoCard(photo);
    gallery.appendChild(card);
  });

  isLoading = false;
  currentPage++;
}

window.addEventListener("scroll", () => {
  const gallery = document.getElementById("gallery");
  const cards = gallery.querySelectorAll(".photo-card");
  cards.forEach((card) => {
    // reset opacity for all cards before applying the new one
    card.style.opacity = "1";

    const rect = card.getBoundingClientRect();

    if (rect.bottom < 100) {
      // opacity transition for the cards getting out of view
      card.style.opacity = "0";
    }
  });

  if (
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 50 &&
    !isLoading
  ) {
    loadPhotos(10); // Load 10 more photos when near bottom
  }
});

const init = () => {
  void loadHeaderPhoto();
  loadPhotos(10);
};

init();
