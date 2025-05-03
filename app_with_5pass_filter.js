// function generatePattern(width, height, seed) {
//   const canvas = document.createElement("canvas");
//   canvas.width = width;
//   canvas.height = height;
//   const ctx = canvas.getContext("2d");

//   // Generate a unique color based on the seed
//   const hue = (seed * 137.5) % 360;
//   ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
//   ctx.fillRect(0, 0, width, height);

//   // Add some random shapes
//   for (let i = 0; i < 5; i++) {
//     const x = Math.random() * width;
//     const y = Math.random() * height;
//     const size = 20 + Math.random() * 60;

//     ctx.fillStyle = `hsl(${(hue + 180) % 360}, 70%, 50%)`;
//     ctx.beginPath();
//     ctx.arc(x, y, size, 0, Math.PI * 2);
//     ctx.fill();
//   }

//   return canvas.toDataURL();
// }

// const IMAGE_URLS = Array(100)
//   .fill()
//   .map((_, i) => ({
//     urls: {
//       regular: generatePattern(800, 600, i),
//     },
//     user: {
//       name: `Artist ${i + 1}`,
//     },
//     description: `Generated artwork ${i + 1}`,
//     alt_description: `Pattern ${i + 1}`,
//   }));

// const CACHE_SIZE = 1000;

// let photoCache = [];
// let currentPage = 1;
// let isLoading = false;
// let searchTimeout;
// let processingQueue = [];
// let isProcessing = false;

// const gallery = document.getElementById("gallery");
// const searchInput = document.getElementById("searchInput");
// const loadMoreBtn = document.getElementById("loadMore");
// const loadingIndicator = document.getElementById("loading");

// function createPhotoCard(photo) {
//   const card = document.createElement("div");
//   card.className = "photo-card";

//   const img = document.createElement("img");
//   img.src = photo.urls.regular;
//   img.alt = photo.alt_description || "Photo";

//   const info = document.createElement("div");
//   info.className = "photo-info";

//   const title = document.createElement("h3");
//   title.textContent = photo.user.name;

//   const description = document.createElement("p");
//   description.textContent = photo.description || "No description available";

//   const adjustButton = document.createElement("button");
//   adjustButton.textContent = "Adjust Brightness";
//   adjustButton.className = "adjust-button";
//   adjustButton.addEventListener("click", () => {
//     // console.log("adjust clicked");
//     // // Add to processing queue instead of processing immediately
//     // processingQueue.push({ photo, img });
//     // if (!isProcessing) {
//     //   processNextInQueue();
//     // }
//     processAll();
//   });

//   info.appendChild(title);
//   info.appendChild(description);
//   info.appendChild(adjustButton);
//   card.appendChild(img);
//   card.appendChild(info);

//   return card;
// }

// function processNextInQueue() {
//   if (processingQueue.length === 0) {
//     isProcessing = false;
//     return;
//   }

//   isProcessing = true;
//   const { photo, img } = processingQueue.shift();
//   processImage(photo, img, () => {
//     // Process next item in queue after current one is done
//     setTimeout(processNextInQueue, 0);
//   });
// }

// function processAll() {
//   // Get all image elements
//   const imageElements = document.querySelectorAll(".photo-card img");

//   console.time("Image Processing");

//   // Process them one by one (blocking the main thread)
//   for (let i = 0; i < imageElements.length; i++) {
//     const img = imageElements[i];

//     // Create canvas for processing
//     const canvas = document.createElement("canvas");
//     const ctx = canvas.getContext("2d");

//     // Set canvas dimensions to match image
//     // Force layout recalculation - Layout thrashing
//     const imgWidth = img.naturalWidth || img.offsetWidth;
//     const imgHeight = img.naturalHeight || img.offsetHeight;

//     canvas.width = imgWidth;
//     canvas.height = imgHeight;

//     // Draw image to canvas
//     ctx.drawImage(img, 0, 0, imgWidth, imgHeight);

//     // Get image data for pixel manipulation
//     const imageData = ctx.getImageData(0, 0, imgWidth, imgHeight);
//     const data = imageData.data;

//     // Apply multiple inefficient image processing operations
//     // 1. First pass: Calculate histogram (unnecessary but computationally expensive)
//     const histogram = calculateHistogram(data);

//     // 2. Second pass: Apply noise reduction (inefficient algorithm)
//     applyNoiseReduction(data, imgWidth, imgHeight);

//     // 3. Third pass: Apply color adjustments based on histogram
//     applyColorAdjustments(data, histogram);

//     // 4. Fourth pass: Apply sharpening filter
//     applySharpen(data, imgWidth, imgHeight);

//     // 5. Fifth pass: Apply vignette effect
//     applyVignette(data, imgWidth, imgHeight);

//     // Put processed image data back on canvas
//     ctx.putImageData(imageData, 0, 0);

//     // Replace original image with processed version
//     img.src = canvas.toDataURL("image/jpeg", 0.85);
//   }

//   console.timeEnd("Image Processing");
// }

// function processImage(photo, imgElement, callback) {
//   const canvas = document.createElement("canvas");
//   const ctx = canvas.getContext("2d");
//   const img = new Image();

//   img.onload = () => {
//     canvas.width = img.width;
//     canvas.height = img.height;

//     let a = 0;
//     for (let i = 0; i < 1_000_000 * 100; i++) {
//       a = Math.max(a, Math.sqrt(i));
//     }
//     console.log("a", a);
//     // Apply a realistic image effect
//     ctx.drawImage(img, 0, 0);

//     // Get image data for processing
//     const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//     const data = imageData.data;

//     // Apply a simple brightness adjustment
//     for (let i = 0; i < data.length; i += 4) {
//       data[i] = Math.min(255, data[i] * 1.2); // Red
//       data[i + 1] = Math.min(255, data[i + 1] * 1.2); // Green
//       data[i + 2] = Math.min(255, data[i + 2] * 1.2); // Blue
//     }

//     // Put the processed image data back
//     ctx.putImageData(imageData, 0, 0);

//     const processedData = canvas.toDataURL();
//     photoCache.push({
//       original: photo,
//       processed: processedData,
//       timestamp: Date.now(),
//     });

//     if (photoCache.length > CACHE_SIZE) {
//       photoCache.shift();
//     }

//     // Update the image with processed version
//     imgElement.src = processedData;

//     console.log("processed");
//     if (callback) callback();
//   };

//   img.src = photo.urls.regular;
// }

// async function loadPhotos(count = 10) {
//   if (isLoading) return;
//   isLoading = true;
//   loadingIndicator.style.display = "block";

//   const startIndex = (currentPage - 1) * count;
//   const photos = IMAGE_URLS.slice(startIndex, startIndex + count);

//   // Simulate network delay
//   await new Promise((resolve) => setTimeout(resolve, 1000));

//   photos.forEach((photo) => {
//     const card = createPhotoCard(photo);
//     gallery.appendChild(card);

//     // Force layout thrashing
//     const rect = card.getBoundingClientRect();
//     if (rect.bottom > window.innerHeight) {
//       card.style.marginTop = "20px";
//     }
//   });

//   isLoading = false;
//   loadingIndicator.style.display = "none";
//   currentPage++;
// }

// function searchPhotos(query) {
//   const cards = document.querySelectorAll(".photo-card");
//   // Inefficient search that causes layout thrashing
//   cards.forEach((card) => {
//     const title = card.querySelector("h3").textContent.toLowerCase();
//     const description = card.querySelector("p").textContent.toLowerCase();
//     const searchTerm = query.toLowerCase();

//     // Force layout thrashing by reading and writing styles in a loop
//     const rect = card.getBoundingClientRect();
//     if (title.includes(searchTerm) || description.includes(searchTerm)) {
//       card.style.display = "block";
//       card.style.marginTop = `${rect.height * 0.1}px`;
//     } else {
//       card.style.display = "none";
//     }
//   });
// }

// searchInput.addEventListener("input", (e) => {
//   clearTimeout(searchTimeout);
//   searchTimeout = setTimeout(() => {
//     searchPhotos(e.target.value);
//   }, 100);
// });

// loadMoreBtn.addEventListener("click", () => {
//   loadPhotos(20);
// });

// window.addEventListener("scroll", () => {
//   if (
//     window.innerHeight + window.scrollY >=
//     document.body.offsetHeight - 1000
//   ) {
//     loadPhotos(10);
//   }
// });

// loadPhotos(20);

// function calculateHistogram(data) {
//     const histogram = {
//         r: new Array(256).fill(0),
//         g: new Array(256).fill(0),
//         b: new Array(256).fill(0)
//     };
    
//     // O(n) operation on all pixels
//     for (let i = 0; i < data.length; i += 4) {
//         histogram.r[data[i]]++;
//         histogram.g[data[i + 1]]++;
//         histogram.b[data[i + 2]]++;
//     }
    
//     // Unnecessary cumulative calculations (more CPU work)
//     const cumulativeHistogram = {
//         r: new Array(256).fill(0),
//         g: new Array(256).fill(0),
//         b: new Array(256).fill(0)
//     };
    
//     for (let i = 0; i < 256; i++) {
//         cumulativeHistogram.r[i] = (i > 0 ? cumulativeHistogram.r[i-1] : 0) + histogram.r[i];
//         cumulativeHistogram.g[i] = (i > 0 ? cumulativeHistogram.g[i-1] : 0) + histogram.g[i];
//         cumulativeHistogram.b[i] = (i > 0 ? cumulativeHistogram.b[i-1] : 0) + histogram.b[i];
//     }
    
//     return { histogram, cumulativeHistogram };
// }

// // Inefficient noise reduction algorithm (second pass)
// function applyNoiseReduction(data, width, height) {
//     // Create a copy of the data (memory inefficient)
//     const origData = new Uint8ClampedArray(data);
    
//     // Apply a basic box blur filter - inefficient implementation
//     // This could be optimized with separable filters, but we're doing it the slow way
//     const kernelSize = 3;
//     const halfKernel = Math.floor(kernelSize / 2);
    
//     // O(n * k²) operation where k is kernel size - very inefficient for large images
//     for (let y = 0; y < height; y++) {
//         for (let x = 0; x < width; x++) {
//             let sumR = 0, sumG = 0, sumB = 0;
//             let count = 0;
            
//             // Apply kernel - inefficient nested loops
//             for (let ky = -halfKernel; ky <= halfKernel; ky++) {
//                 for (let kx = -halfKernel; kx <= halfKernel; kx++) {
//                     const posX = Math.min(Math.max(x + kx, 0), width - 1);
//                     const posY = Math.min(Math.max(y + ky, 0), height - 1);
                    
//                     const idx = (posY * width + posX) * 4;
                    
//                     sumR += origData[idx];
//                     sumG += origData[idx + 1];
//                     sumB += origData[idx + 2];
//                     count++;
//                 }
//             }
            
//             // Set average values
//             const idx = (y * width + x) * 4;
//             data[idx] = Math.round(sumR / count);
//             data[idx + 1] = Math.round(sumG / count);
//             data[idx + 2] = Math.round(sumB / count);
//         }
//     }
// }

// // Apply color adjustments based on histogram (third pass)
// function applyColorAdjustments(data, histogramData) {
//     const { histogram, cumulativeHistogram } = histogramData;
    
//     // Calculate maximum cumulative values
//     const maxR = cumulativeHistogram.r[255];
//     const maxG = cumulativeHistogram.g[255];
//     const maxB = cumulativeHistogram.b[255];
    
//     // Create LUTs for histogram equalization (unnecessary pre-computation)
//     const lutR = new Array(256);
//     const lutG = new Array(256);
//     const lutB = new Array(256);
    
//     for (let i = 0; i < 256; i++) {
//         lutR[i] = Math.round(cumulativeHistogram.r[i] / maxR * 255);
//         lutG[i] = Math.round(cumulativeHistogram.g[i] / maxG * 255);
//         lutB[i] = Math.round(cumulativeHistogram.b[i] / maxB * 255);
//     }
    
//     // Apply the LUTs to each pixel
//     for (let i = 0; i < data.length; i += 4) {
//         // Add some contrast and vibrance adjustments (more computation)
//         const r = data[i];
//         const g = data[i + 1];
//         const b = data[i + 2];
        
//         // Convert to HSL (expensive conversion)
//         const max = Math.max(r, g, b) / 255;
//         const min = Math.min(r, g, b) / 255;
//         let l = (max + min) / 2;
        
//         let h, s;
        
//         if (max === min) {
//             h = s = 0; // achromatic
//         } else {
//             const d = max - min;
//             s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
//             switch (max * 255) {
//                 case r:
//                     h = (g / 255 - b / 255) / d + (g < b ? 6 : 0);
//                     break;
//                 case g:
//                     h = (b / 255 - r / 255) / d + 2;
//                     break;
//                 case b:
//                     h = (r / 255 - g / 255) / d + 4;
//                     break;
//             }
            
//             h /= 6;
//         }
        
//         // Adjust saturation and lightness
//         s = Math.min(s * 1.2, 1); // Increase saturation
        
//         // Apply contrast curve to lightness (more computation)
//         l = 0.5 + (l - 0.5) * 1.3; // Increase contrast
        
//         // Convert back to RGB (expensive conversion)
//         let r1, g1, b1;
        
//         if (s === 0) {
//             r1 = g1 = b1 = l; // achromatic
//         } else {
//             const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
//             const p = 2 * l - q;
            
//             const hueToRgb = (p, q, t) => {
//                 if (t < 0) t += 1;
//                 if (t > 1) t -= 1;
//                 if (t < 1/6) return p + (q - p) * 6 * t;
//                 if (t < 1/2) return q;
//                 if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
//                 return p;
//             };
            
//             r1 = hueToRgb(p, q, h + 1/3);
//             g1 = hueToRgb(p, q, h);
//             b1 = hueToRgb(p, q, h - 1/3);
//         }
        
//         // Apply histogram equalization on top of HSL adjustments
//         data[i] = Math.round(r1 * 255 * lutR[r] / 255);
//         data[i + 1] = Math.round(g1 * 255 * lutG[g] / 255);
//         data[i + 2] = Math.round(b1 * 255 * lutB[b] / 255);
//     }
// }

// // Apply sharpening filter (fourth pass)
// function applySharpen(data, width, height) {
//     // Create a copy of the data (memory inefficient)
//     const origData = new Uint8ClampedArray(data);
    
//     // Sharpen kernel
//     const kernel = [
//         0, -1, 0,
//         -1, 5, -1,
//         0, -1, 0
//     ];
    
//     // Apply kernel convolution - inefficient implementation
//     for (let y = 1; y < height - 1; y++) {
//         for (let x = 1; x < width - 1; x++) {
//             let sumR = 0, sumG = 0, sumB = 0;
            
//             // Apply convolution
//             for (let ky = -1; ky <= 1; ky++) {
//                 for (let kx = -1; kx <= 1; kx++) {
//                     const idx = ((y + ky) * width + (x + kx)) * 4;
//                     const kernelIdx = (ky + 1) * 3 + (kx + 1);
                    
//                     sumR += origData[idx] * kernel[kernelIdx];
//                     sumG += origData[idx + 1] * kernel[kernelIdx];
//                     sumB += origData[idx + 2] * kernel[kernelIdx];
//                 }
//             }
            
//             // Set values with clamping
//             const idx = (y * width + x) * 4;
//             data[idx] = Math.min(255, Math.max(0, sumR));
//             data[idx + 1] = Math.min(255, Math.max(0, sumG));
//             data[idx + 2] = Math.min(255, Math.max(0, sumB));
//         }
//     }
// }

// // Apply vignette effect (fifth pass)
// function applyVignette(data, width, height) {
//     const centerX = width / 2;
//     const centerY = height / 2;
//     const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
    
//     // Precalculate a ton of unnecessary values (wasteful)
//     const distances = new Array(width * height);
//     for (let y = 0; y < height; y++) {
//         for (let x = 0; x < width; x++) {
//             const dx = x - centerX;
//             const dy = y - centerY;
//             distances[y * width + x] = Math.sqrt(dx * dx + dy * dy) / maxDistance;
//         }
//     }
    
//     // Apply vignette effect
//     for (let y = 0; y < height; y++) {
//         for (let x = 0; x < width; x++) {
//             const idx = (y * width + x) * 4;
            
//             // Use pre-calculated distance (inefficient memory access pattern)
//             const distance = distances[y * width + x];
            
//             // Apply a smooth falloff for the vignette
//             const falloff = Math.cos(distance * Math.PI * 0.5);
//             const vignetteAmount = falloff * falloff;
            
//             // Apply the vignette effect
//             data[idx] = data[idx] * vignetteAmount;
//             data[idx + 1] = data[idx + 1] * vignetteAmount;
//             data[idx + 2] = data[idx + 2] * vignetteAmount;
//         }
//     }
// }
