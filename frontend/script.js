// Define the color palette
const colorPalette = [
    "#6d001a", "#be0039", "#ff4500", "#ffa800", "#ffd635", "#fff8b8", "#00a368", "#00cc78", "#7eed56", 
    "#00756f", "#009eaa", "#00ccc0", "#2450a4", "#3690ea", "#51e9f4", "#493ac1", "#6a5cff", "#94b3ff",
    "#811e9f", "#b44ac0", "#e4abff", "#de107f", "#ff3881", "#ff99aa", "#6d482f", "#9c6926", "#ffb470",
    "#000000", "#515252", "#898d90", "#d4d7d9", "#ffffff"
];
// Maximum width and height for the image
const maxWidth = 40;  // Adjust based on your requirements
const maxHeight = 40; // Adjust based on your requirements

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
function processImage() {
    const input = document.getElementById("imageInput").files[0];
    const cookie = document.getElementById("cookie");
    const startX = document.getElementById("startX");
    const startY = document.getElementById("startY");
    if (!input || !cookie || !startX || !startY ) return;
    const cookieValue = cookie.value;
    const startXValue = parseInt(startX.value);
    const startYValue = parseInt(startY.value);

    const img = new Image();
    img.src = URL.createObjectURL(input);
    img.onload = () => {
        // Calculate scaled dimensions if the image is too large
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height;
            if (width > height) {
                width = maxWidth;
                height = maxWidth / aspectRatio;
            } else {
                height = maxHeight;
                width = maxHeight * aspectRatio;
            }
        }

        // Create a canvas with the new dimensions
        const canvas = document.createElement("canvas");
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

        drawBitmap(imageData, startXValue, startYValue, cookieValue);
    };
}

// Draw function with cookie and success check
async function drawBitmap(imageData, startX, startY, cookie) {
    // Loop through the image data
    for (let y = 0; y < imageData.length; y++) {
        for (let x = 0; x < imageData[y].length; x++) {
            const color = imageData[y][x];
            const posX = startX + x;
            const posY = startY + y;

            if (color == null) continue;

            // Prepare payload
            const payload = JSON.stringify({ x: posX, y: posY, color: color, cookie: cookie });
            
            try {
                // Send POST request
                const response = await fetch("http://localhost:8080/proxy/draw", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: payload
                });
                /*
                const response = await fetch("https://place.liste.bdekraken.fr/api/place/tile/draw", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Cookie": `krakookie=${cookie}`
                    },
                    body: payload
                });
                */
                const result = await response.json();

                // Check if successful
                if (result.success) {
                    console.log(`Placed pixel at (${posX}, ${posY}) with color ${color}`);
                } else {
                    console.error(`Failed to place pixel at (${posX}, ${posY}):`, result);
                }
            } catch (error) {
                console.error(`Failed to place pixel at (${posX}, ${posY}):`, error);
            }

            // Random delay between 10 to 20 seconds
            const delay = Math.floor(Math.random() * 10 + 10) * 1000;
            console.log(`Delay : ${delay} ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}