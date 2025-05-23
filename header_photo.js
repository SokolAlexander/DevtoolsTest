async function loadHeaderPhoto() {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.className = "header-image";

  const mainPhotoContainer = document.getElementById("mainPhoto");
  if (!mainPhotoContainer) {
    console.error('Element with id "mainPhoto" not found');
    return;
  }

  mainPhotoContainer.classList.add("loading");
  // Clear any existing content and add the image
  mainPhotoContainer.innerHTML = "";
  mainPhotoContainer.appendChild(img);

  try {
    // Fetch and decode the image
    const response = await fetch(
      "https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg"
    );
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    // Set up load handler before setting src
    img.onload = () => {
      img.classList.add("loaded");
      mainPhotoContainer.classList.remove("loading");
      URL.revokeObjectURL(objectUrl);
    };

    img.src = objectUrl;
  } catch (error) {
    console.error("Error in loadHeaderPhoto:", error);
  }
}
