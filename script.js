const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');
const brushButtons = document.querySelectorAll('.brush-btn');
const colorButtons = document.querySelectorAll('.color-btn');
const typeButtons = document.querySelectorAll('.type-btn');
const zoomButtons = document.querySelectorAll('.zoom-btn');
const downloadBtn = document.querySelector('.download-btn');
const loadBtn = document.querySelector('.load-btn');
const imageLoader = document.getElementById('imageLoader');
const handToolBtn = document.getElementById('handTool');
const canvasSizeBtn = document.getElementById('canvasSizeBtn');
const sizeModal = document.getElementById('sizeModal');
const customWidth = document.getElementById('customWidth');
const customHeight = document.getElementById('customHeight');
const cancelSizeBtn = document.getElementById('cancelSize');
const confirmSizeBtn = document.getElementById('confirmSize');
const clearModal = document.getElementById('clearModal');
const cancelClearBtn = document.getElementById('cancelClear');
const confirmClearBtn = document.getElementById('confirmClear');

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
        // Store current canvas content and size
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(canvas, 0, 0);
        
        // Store current dimensions
        const currentWidth = canvas.width;
        const currentHeight = canvas.height;
        
        // Update zoom level
        zoomLevel = newZoom;
        
        // Update canvas style while keeping the actual dimensions
        canvas.style.width = `${currentWidth * zoomLevel}px`;
        canvas.style.height = `${currentHeight * zoomLevel}px`;
        
        // Update overlay image size if it exists
        if (overlayImage.src) {
            overlayImage.style.width = `${currentWidth * zoomLevel}px`;
            overlayImage.style.height = `${currentHeight * zoomLevel}px`;
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
    // Create a temporary canvas at actual canvas size
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Disable anti-aliasing on the temporary canvas
    tempCtx.imageSmoothingEnabled = false;
    
    // First fill with white background
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Draw the original canvas at its actual size
    tempCtx.drawImage(canvas, 0, 0);
    
    // Create a temporary link
    const link = document.createElement('a');
    // Get the canvas data as PNG
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
document.querySelector('.clear-btn').addEventListener('click', () => {
    clearModal.style.display = 'flex';
});

// Add this function with your other functions
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function loadImage(e) {
    const file = e.target.files[0];
    
    if (file) {
        const img = new Image();
        img.onload = function() {
            // Resize canvas to match image dimensions
            resizeCanvas(img.width, img.height);
            
            // Clear the current canvas and draw the loaded image
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = URL.createObjectURL(file);
    }
}

// Update the load button event listeners
loadBtn.addEventListener('click', () => {
    // Show current canvas dimensions in the alert
    alert('The canvas will be resized to match the image dimensions');
    imageLoader.click();
});
imageLoader.addEventListener('change', loadImage);

function resizeCanvas(width, height) {
    // Store the current canvas content
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);
    
    // Resize the main canvas
    canvas.width = width;
    canvas.height = height;
    
    // Clear and fill with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate offsets for centering
    const xOffset = (width - tempCanvas.width) / 2;
    const yOffset = (height - tempCanvas.height) / 2;
    
    // Calculate source coordinates for cropping
    const sourceX = xOffset < 0 ? Math.abs(xOffset) : 0;
    const sourceY = yOffset < 0 ? Math.abs(yOffset) : 0;
    const sourceWidth = Math.min(tempCanvas.width - sourceX * 2, width);
    const sourceHeight = Math.min(tempCanvas.height - sourceY * 2, height);
    
    // Calculate destination coordinates
    const destX = xOffset > 0 ? xOffset : 0;
    const destY = yOffset > 0 ? yOffset : 0;
    
    // Draw the old content
    ctx.drawImage(
        tempCanvas,
        sourceX, sourceY, sourceWidth, sourceHeight,
        destX, destY, sourceWidth, sourceHeight
    );
    
    // Update the canvas style dimensions based on zoom
    canvas.style.width = `${width * zoomLevel}px`;
    canvas.style.height = `${height * zoomLevel}px`;
    
    // Reset any transforms or offsets
    canvasOffsetX = 0;
    canvasOffsetY = 0;
    canvas.style.transform = `translate(${canvasOffsetX}px, ${canvasOffsetY}px)`;
}

// Add these event listeners with your other listeners
canvasSizeBtn.addEventListener('click', () => {
    // Set current canvas size as placeholder
    customWidth.placeholder = canvas.width;
    customHeight.placeholder = canvas.height;
    sizeModal.style.display = 'flex';
});

sizeModal.addEventListener('click', (e) => {
    if (e.target === sizeModal) {
        closeModal();
    }
});

cancelSizeBtn.addEventListener('click', () => {
    closeModal();
});

confirmSizeBtn.addEventListener('click', () => {
    const width = parseInt(customWidth.value) || canvas.width;
    const height = parseInt(customHeight.value) || canvas.height;
    
    if (width > 0 && height > 0 && width <= 2000 && height <= 2000) {
        // Resize the canvas
        resizeCanvas(width, height);
        
        // Close the modal
        closeModal();
    } else {
        alert('Please enter valid dimensions (1-2000 pixels)');
    }
});

function closeModal() {
    sizeModal.style.display = 'none';
    customWidth.value = '';
    customHeight.value = '';
}

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

// Add clear modal event listeners
cancelClearBtn.addEventListener('click', () => {
    clearModal.style.display = 'none';
});

confirmClearBtn.addEventListener('click', () => {
    clearCanvas();
    clearModal.style.display = 'none';
});

// Close on outside click
clearModal.addEventListener('click', (e) => {
    if (e.target === clearModal) {
        clearModal.style.display = 'none';
    }
});
