// Define the color palette
const colorPalette = [
    "#6d001a", "#be0039", "#ff4500", "#ffa800", "#ffd635", "#fff8b8", "#00a368", "#00cc78", "#7eed56", 
    "#00756f", "#009eaa", "#00ccc0", "#2450a4", "#3690ea", "#51e9f4", "#493ac1", "#6a5cff", "#94b3ff",
    "#811e9f", "#b44ac0", "#e4abff", "#de107f", "#ff3881", "#ff99aa", "#6d482f", "#9c6926", "#ffb470",
    "#000000", "#515252", "#898d90", "#d4d7d9", "#ffffff"
];

// Utility function to find closest color in the palette
function getClosestColor(color) {
    const rgb = parseInt(color.slice(1), 16);
    let closest = colorPalette[0];
    let minDiff = Infinity;
    for (const paletteColor of colorPalette) {
        const paletteRgb = parseInt(paletteColor.slice(1), 16);
        const diff = Math.abs((rgb & 0xFF) - (paletteRgb & 0xFF)) +
                     Math.abs(((rgb >> 8) & 0xFF) - ((paletteRgb >> 8) & 0xFF)) +
                     Math.abs(((rgb >> 16) & 0xFF) - ((paletteRgb >> 16) & 0xFF));
        if (diff < minDiff) {
            minDiff = diff;
            closest = paletteColor;
        }
    }
    return closest;
}

// Function to process the image and convert to color data array
function processImage(callback) {
    
    const input = document.getElementById("imageInput").files[0];
    const startX = document.getElementById("startX");
    const startY = document.getElementById("startY");
    const sizeX = document.getElementById("sizeX");
    const sizeY = document.getElementById("sizeY");
    if (!input || !startX || !startY || !sizeX || !sizeY) return;
    const startXValue = parseInt(startX.value);
    const startYValue = parseInt(startY.value);
    const sizeXValue = parseInt(sizeX.value);
    const sizeYValue = parseInt(sizeY.value);

    const img = new Image();
    img.src = URL.createObjectURL(input);
    img.onload = () => {
        // Calculate scaled dimensions if the image is too large
        let { width, height } = img;
        if (width > sizeYValue || height > sizeXValue) {
            const aspectRatio = width / height;
            if (width > height) {
                width = sizeYValue;
                height = sizeYValue / aspectRatio;
            } else {
                height = sizeXValue;
                width = sizeXValue * aspectRatio;
            }
        }

        // Create a canvas with the new dimensions
        //const canvas = document.createElement("canvas");
        const canvas = document.getElementById("previewCanvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        // set transparent bg
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, width, height);

        // Get pixel data from the canvas
        const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const imageData = [];

        // Convert each pixel to the nearest palette color, ignoring transparent pixels
        for (let y = 0; y < canvas.height; y++) {
            const row = [];
            for (let x = 0; x < canvas.width; x++) {
                const index = (y * canvas.width + x) * 4; // RGBA pixel index

                const r = pixelData[index];
                const g = pixelData[index + 1];
                const b = pixelData[index + 2];
                const a = pixelData[index + 3]; // Alpha channel
                //console.log(r,g,b,a);
                // Ignore fully transparent pixels
                if (a === 0) {
                    row.push(null); // Push null for transparent pixels
                    continue;
                }

                // Convert RGB to hex color and get the closest palette color
                const hexColor = `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
                row.push(getClosestColor(hexColor)); // Assuming getClosestColor is defined elsewhere
            }
            imageData.push(row);
        }
        //console.log(imageData);
        //drawBitmap(imageData, startXValue, startYValue, cookieValue);
        //sendToServer(imageData, startXValue, startYValue);
        previewImage(imageData, canvas);
        // Call the callback function with the processed data
        if (callback) callback(imageData, startXValue, startYValue);
    };
}
function previewImage(imageData, canvas) {
    const ctx = canvas.getContext('2d');
    const pixelSize = 10; // Adjust pixel size for zoom effect

    for (let y = 0; y < imageData.length; y++) {
        for (let x = 0; x < imageData[y].length; x++) {
            const color = imageData[y][x];
            if (color) {
                ctx.fillStyle = color;
                ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
            }
        }
    }
}


async function sendToServer(imageData, startX, startY) {
    console.log("sent to server");
    const payload = JSON.stringify({ startX: startX, startY:startY, imageData: imageData });
    
    try {
        // Send POST request
        const response = await fetch("http://localhost:8080/proxy/task", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: payload
        });

        const result = await response.json();

        // Check if successful
        if (result.status == 200) {
            console.log(result.message);
        }else {
            console.error(result.message);
        }
    } catch (error) {
        console.error(`Failed to send the image to the bot. Error :`, error);
    }
}

// Updated submitTask to use a callback
function submitTask() {
    processImage((imageData, startXValue, startYValue) => {
        sendToServer(imageData, startXValue, startYValue);
    });
}