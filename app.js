const IMAGE_URLS = Array(100).fill().map((_, i) => ({
    urls: {
        regular: `https://picsum.photos/800/600?random=${i}`
    },
    user: {
        name: `Photographer ${i + 1}`
    },
    description: `Beautiful photo ${i + 1}`,
    alt_description: `Random photo ${i + 1}`
}));

const CACHE_SIZE = 1000;

let photoCache = [];
let currentPage = 1;
let isLoading = false;
let searchTimeout;

const gallery = document.getElementById('gallery');
const searchInput = document.getElementById('searchInput');
const loadMoreBtn = document.getElementById('loadMore');
const loadingIndicator = document.getElementById('loading');

function createPhotoCard(photo) {
    const card = document.createElement('div');
    card.className = 'photo-card';
    
    const img = document.createElement('img');
    img.src = photo.urls.regular;
    img.alt = photo.alt_description || 'Photo';
    
    const info = document.createElement('div');
    info.className = 'photo-info';
    
    const title = document.createElement('h3');
    title.textContent = photo.user.name;
    
    const description = document.createElement('p');
    description.textContent = photo.description || 'No description available';
    
    info.appendChild(title);
    info.appendChild(description);
    card.appendChild(img);
    card.appendChild(info);
    
    card.addEventListener('click', () => {
        processImage(photo);
    });
    
    return card;
}

function processImage(photo) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        for (let i = 0; i < 10; i++) {
            ctx.drawImage(img, 0, 0);
            ctx.filter = `blur(${i}px)`;
            ctx.drawImage(img, 0, 0);
        }
        
        const processedData = canvas.toDataURL();
        photoCache.push({
            original: photo,
            processed: processedData,
            timestamp: Date.now()
        });
        
        if (photoCache.length > CACHE_SIZE) {
            photoCache.shift();
        }
    };
    
    img.src = photo.urls.regular;
}

async function loadPhotos(count = 10) {
    if (isLoading) return;
    isLoading = true;
    loadingIndicator.style.display = 'block';
    
    const startIndex = (currentPage - 1) * count;
    const photos = IMAGE_URLS.slice(startIndex, startIndex + count);
    
    photos.forEach(photo => {
        const card = createPhotoCard(photo);
        gallery.appendChild(card);
        
        const rect = card.getBoundingClientRect();
        if (rect.bottom > window.innerHeight) {
            card.style.marginTop = '20px';
        }
    });
    
    isLoading = false;
    loadingIndicator.style.display = 'none';
    currentPage++;
}

function searchPhotos(query) {
    const cards = document.querySelectorAll('.photo-card');
    cards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('p').textContent.toLowerCase();
        const searchTerm = query.toLowerCase();
        
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        searchPhotos(e.target.value);
    }, 100);
});

loadMoreBtn.addEventListener('click', () => {
    loadPhotos(20);
});

window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
        loadPhotos(10);
    }
});

loadPhotos(20); 