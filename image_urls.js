const IMAGE_URLS = Array(1000)
  .fill()
  .map((_, i) => ({
    urls: {
      regular: `https://picsum.photos/seed/${i}/1200/800`,
    },
    user: {
      name: `Photographer ${i + 1}`,
    },
    description: `Beautiful landscape photo ${i + 1}`,
    alt_description: `Nature photo ${i + 1}`,
  }));
