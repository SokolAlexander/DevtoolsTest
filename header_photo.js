async function loadHeaderPhoto() {
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
    img.className = "header-image";

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
