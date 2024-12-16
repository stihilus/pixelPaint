const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');
const brushButtons = document.querySelectorAll('.brush-btn');
const colorButtons = document.querySelectorAll('.color-btn');
const typeButtons = document.querySelectorAll('.type-btn');
const zoomButtons = document.querySelectorAll('.zoom-btn');
const downloadBtn = document.querySelector('.download-btn');
const loadBtn = document.querySelector('.load-btn');
const imageLoader = document.getElementById('imageLoader');
const backgroundBtn = document.querySelector('.background-btn');
const backgroundLoader = document.getElementById('backgroundLoader');
const overlayImage = document.getElementById('overlayImage');
const handToolBtn = document.getElementById('handTool');

let isDrawing = false;
let brushSize = 3;
let currentColor = '#000000';
let currentPattern = 'solid';
let zoomLevel = 2;
let isHandToolActive = false;
let isDragging = false;
let lastX = 0;
let lastY = 0;
let canvasOffsetX = 0;
let canvasOffsetY = 0;

// Pattern definitions
const patterns = {
    solid: [
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 1]
    ],
    checker: [
        [1, 0, 1, 0],
        [0, 1, 0, 1],
        [1, 0, 1, 0],
        [0, 1, 0, 1]
    ],
    dots: [
        [1, 0, 1, 0],
        [0, 0, 0, 0],
        [1, 0, 1, 0],
        [0, 0, 0, 0]
    ],
    columns: [
        [1, 0, 1, 0],
        [1, 0, 1, 0],
        [1, 0, 1, 0],
        [1, 0, 1, 0]
    ],
    rows: [
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0]
    ]
};

// Disable anti-aliasing
ctx.imageSmoothingEnabled = false;

// Initialize canvas with white background
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, canvas.width, canvas.height);

function startDrawing(e) {
    if (isHandToolActive) return;
    isDrawing = true;
    draw(e);
}

function stopDrawing() {
    isDrawing = false;
}

function setZoom(newZoom) {
    if (newZoom >= 1 && newZoom <= 3) {
        zoomLevel = newZoom;
        
        // Store current canvas content
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(canvas, 0, 0);
        
        // Update canvas style
        canvas.style.width = `${480 * zoomLevel}px`;
        canvas.style.height = `${272 * zoomLevel}px`;
        
        // Update overlay image size if it exists
        if (overlayImage.src) {
            overlayImage.style.width = `${480 * zoomLevel}px`;
            overlayImage.style.height = `${272 * zoomLevel}px`;
        }
        
        // Restore canvas content
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(tempCanvas, 0, 0);
    }
}

function draw(e) {
    if (!isDrawing || isHandToolActive) return;

    const rect = canvas.getBoundingClientRect();
    // Adjust coordinates based on zoom level
    const x = Math.floor((e.clientX - rect.left) / zoomLevel);
    const y = Math.floor((e.clientY - rect.top) / zoomLevel);

    ctx.fillStyle = currentColor;
    
    const pattern = patterns[currentPattern];
    const patternOffsetX = Math.floor(x % 4);
    const patternOffsetY = Math.floor(y % 4);

    for (let i = 0; i < brushSize; i++) {
        for (let j = 0; j < brushSize; j++) {
            const patternX = (patternOffsetX + i) % 4;
            const patternY = (patternOffsetY + j) % 4;
            
            if (pattern[patternY][patternX] === 1) {
                ctx.fillRect(x + i, y + j, 1, 1);
            }
        }
    }
}

// Event listeners for drawing
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Add touch and pointer events for iPad Pencil support
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('touchcancel', stopDrawing);

// Prevent scrolling when touching the canvas
canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

function handleTouchStart(e) {
    if (isHandToolActive) return;
    
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    startDrawing(mouseEvent);
}

function handleTouchMove(e) {
    if (isHandToolActive) return;
    
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    draw(mouseEvent);
}

// Brush size selection
brushButtons.forEach(button => {
    button.addEventListener('click', () => {
        brushButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        brushSize = parseInt(button.dataset.size);
    });
});

// Color selection
colorButtons.forEach(button => {
    button.addEventListener('click', () => {
        colorButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentColor = button.dataset.color;
    });
});

// Brush type selection
typeButtons.forEach(button => {
    button.addEventListener('click', () => {
        typeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentPattern = button.dataset.pattern;
    });
});

// Add zoom button event listeners
zoomButtons.forEach(button => {
    button.addEventListener('click', () => {
        const direction = button.dataset.zoom;
        if (direction === 'in' && zoomLevel < 3) {
            setZoom(zoomLevel + 1);
        } else if (direction === 'out' && zoomLevel > 1) {
            setZoom(zoomLevel - 1);
        }
    });
});

// Initialize zoom
setZoom(2);

function downloadCanvas() {
    // Create a temporary canvas at 2x size
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 960;  // 480 * 2
    tempCanvas.height = 544; // 272 * 2
    const tempCtx = tempCanvas.getContext('2d');
    
    // Disable anti-aliasing on the temporary canvas
    tempCtx.imageSmoothingEnabled = false;
    
    // First fill with white background
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Draw the original canvas scaled up 2x
    tempCtx.scale(2, 2);
    tempCtx.drawImage(canvas, 0, 0);
    
    // Create a temporary link
    const link = document.createElement('a');
    // Get the scaled canvas data as PNG
    const dataUrl = tempCanvas.toDataURL('image/png');
    // Set the download attributes
    link.download = 'pixel-art.png';
    link.href = dataUrl;
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

downloadBtn.addEventListener('click', downloadCanvas);

// Add this event listener with your other initialization code
document.querySelector('.clear-btn').addEventListener('click', clearCanvas);

// Add this function with your other functions
function clearCanvas() {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function loadImage(e) {
    const file = e.target.files[0];
    
    if (file) {
        const img = new Image();
        img.onload = function() {
            // Check if image dimensions match the required size
            if (img.width === 960 && img.height === 544) {
                // Create a temporary canvas to draw the loaded image
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                const tempCtx = tempCanvas.getContext('2d');
                
                // Draw the image scaled down to the canvas size
                tempCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Clear the current canvas and draw the loaded image
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(tempCanvas, 0, 0);
            } else {
                alert('Please load a PNG image with dimensions 960x544 pixels.');
            }
        };
        img.src = URL.createObjectURL(file);
    }
}

// Add these event listeners with your other initialization code
loadBtn.addEventListener('click', () => imageLoader.click());
imageLoader.addEventListener('change', loadImage);

function toggleBackgroundImage() {
    backgroundLoader.click();
}

function loadBackgroundImage(e) {
    const file = e.target.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            overlayImage.src = event.target.result;
            overlayImage.style.display = 'block';
            
            // Update overlay image size based on zoom
            overlayImage.style.width = `${480 * zoomLevel}px`;
            overlayImage.style.height = `${272 * zoomLevel}px`;
        };
        reader.readAsDataURL(file);
    }
}

// Add these event listeners with your other initialization code
backgroundBtn.addEventListener('click', toggleBackgroundImage);
backgroundLoader.addEventListener('change', loadBackgroundImage);

// Add these event listeners with other button listeners
handToolBtn.addEventListener('click', () => {
    isHandToolActive = !isHandToolActive;
    handToolBtn.classList.toggle('active');
    if (isHandToolActive) {
        canvas.style.cursor = 'grab';
    } else {
        canvas.style.cursor = 'crosshair';
    }
});

// Add these mouse event listeners to handle canvas dragging
canvas.addEventListener('mousedown', (e) => {
    if (isHandToolActive) {
        isDragging = true;
        canvas.style.cursor = 'grabbing';
        lastX = e.clientX;
        lastY = e.clientY;
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (isHandToolActive && isDragging) {
        const deltaX = e.clientX - lastX;
        const deltaY = e.clientY - lastY;
        
        canvasOffsetX += deltaX;
        canvasOffsetY += deltaY;
        
        canvas.style.transform = `translate(${canvasOffsetX}px, ${canvasOffsetY}px)`;
        
        lastX = e.clientX;
        lastY = e.clientY;
    }
});

canvas.addEventListener('mouseup', () => {
    if (isHandToolActive) {
        isDragging = false;
        canvas.style.cursor = 'grab';
    }
});

canvas.addEventListener('mouseleave', () => {
    if (isHandToolActive) {
        isDragging = false;
        canvas.style.cursor = 'grab';
    }
});
