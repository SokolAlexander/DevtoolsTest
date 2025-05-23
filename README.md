# Infinite Photo Gallery

A simple photo gallery application that demonstrates various performance issues for learning Chrome DevTools.

## Setup

1. Open `index.html` in your browser or run `npm start` to use hot reload

## Description

The app itself is a simple infinite-scroll photo gallery, with an option to apply filters to any chosen photo, and restore it back.

### App explanation

- `filters.js` file contains the image filters implementations, and a function `applyFiltersSequentially`, which applies all of the filters in sequence.
- `image_urls.js` file creates an array of a 1000 of mock photos from picsum.
- `header_photo.js` file contains a function that loads a photo for the header and adds it to the document.
- `app.js` file contains the main logic - it's the main file you should be working on. It consists of several functions:
    - `loadPhotos` - this function takes a slice of the mocked photos array created in `image_urls.js` and creates and adds to DOM a number of "photo-card" HTML elements - an element with a photo, some text data, and a process button.
    - `createPhotoCard` - a helper function that creates 1 "photo-card" HTML element.
    - `createProcessButton` - a helper function that creates a process button for the "photo-card" element and sets up the click listeners for process and restore buttons.
    - `processImg` - a function that applies filters to a given photo (checks cache, calls `applyFiltersSequentially`, updates the img element with the filtered result).
    - window scroll listener - used to apply styles to the elements getting out of the viewport and load next batch of photos.
    - `init` - a function that initializes the app by calling `loadPhotos` and `loadHeaderPhoto`.

### Features and catches

#### Feature
- The app loads more photos when the scroll position is close enough to the bottom. The photos that are scrolling out of view (from the top) are hidden through opacity
#### Catch
- The opacity transition might be considered pretty if dumb, but in really it's just pretty dumb. The calculation and style assignment causes a write styles-read styles-write styles cycle for every card on screen (Layout thrashing);
-----------------

#### Feature
- The app loads a header image separately, since the image is quite big in size and we don't want to block the page with it's loading
#### Catch
- The header image is loaded after the page is loaded and causes a visible jump in the UI (Cumulative Layout Shift)
-----------------

#### Feature
- The app allows image processing by applying a set of filters
#### Catch
- The filters are implemented using very inefficient algorithms, and the processing is done on the main thread. This takes (depending on the CPU) a significant amount of time, blocking main thread and preventing next renders (Performance bottleneck)
-----------------

#### Feature
- The app allows restoration of the original image after processing - the original image url is stored in originalImagesCache map.
#### Catch
- The originalImagesCache uses a restore button html element as a key. The element for the restore button is recreated on every click of the process button, but the cache is never cleaned. This keeps both an html button element (that is removed from the document) and the cache value in the cache indefinetely (Memory leak)
-----------------

#### Feature
- The app caches the processed image data in filteredImagesCache map to not recalculate the result of processing the second time
#### Catch
- The key for the map is an imageData object received from the canvas. The object is recreated each time so a) there is never a cache hit and b) there results are never cleared from cache (Memory leak)

## Performance Issues to Investigate

Use Chrome DevTools to investigate:
- Memory usage in the Memory tab
- CPU performance in the Performance tab
- Layout shifts in the Performance tab
- Network requests in the Network tab 