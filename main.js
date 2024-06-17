let points = [];
let centroids = [];
let iterationCount = 0;
let iterationType = true;
let dragging = false;
let draggingCentroid = false;
let draggedPoint = null;
let POINT_RADIUS = 10;
let CENTROID_RADIUS = 20;
let menuActive = false;
let startX = 0;
let startY = 0;
let EPSILON = 0;


function setup() {
    let canvas = createCanvas(800, 600);
    canvas.parent('container');
    console.log("Canvas size:", canvas.width, "x", canvas.height);
    loadDataset('filled_circular_dataset.json');
}

function loadDataset(filePath) {
    fetch(filePath)
        .then(response => response.json())
        .then(data => {
            points = data.map(d => ({
                x: d.x * width,
                y: d.y * height,
                cluster: null,
                fixed: false
            }));
            const randomPoint = points[Math.floor(Math.random() * points.length)];
            centroids = [{
                x: randomPoint.x,
                y: randomPoint.y,
                color: [random(255), random(255), random(255)]
            }];
            iterationCount = 0;
            updateIterationDisplay();
            redraw();
        })
        .catch(error => console.error('Failed to load dataset:', error));
}

function draw() {
    background(255);
    drawPoints();
    drawCentroids();
}

function changeDataset() {
    let selector = document.getElementById('dataset-selector');
    let filePath = selector.value;
    loadDataset(filePath);
}


function drawPoints() {
    for (let point of points) {
        let color = point.color ? point.color : (point.cluster !== null ? centroids[point.cluster].color : [200, 200, 200]);
        fill(color);
        ellipse(point.x, point.y, POINT_RADIUS, POINT_RADIUS);

        if (point.fixed) {
            strokeWeight(3.5);
            ellipse(point.x, point.y, POINT_RADIUS + 4, POINT_RADIUS + 4);
            strokeWeight(1);
            stroke(0, 0, 0);
        }
    }
}


function drawCentroids() {
    for (let centroid of centroids) {
        fill(centroid.color);
        ellipse(centroid.x, centroid.y, CENTROID_RADIUS, CENTROID_RADIUS);
    }
}

function mousePressed() {
    if (menuActive) return;

    let centroidClicked = false;
    startX = mouseX;
    startY = mouseY;
    for (let i = 0; i < centroids.length; i++) {
        let d = dist(mouseX, mouseY, centroids[i].x, centroids[i].y);
        if (d < CENTROID_RADIUS) {
            dragging = true;
            draggingCentroid = true;
            draggedPoint = i;
            centroidClicked = true;
            break
        }

        if (!centroidClicked) {
            for (let i = points.length - 1; i >= 0; i--) {
                let d = dist(mouseX, mouseY, points[i].x, points[i].y);
                if (d < POINT_RADIUS) {
                    dragging = true;
                    draggedPoint = i;
                    centroidClicked = true;
                    break;
                }
            }
        }
    }
}

function mouseDragged() {
    if (dragging && draggedPoint != null) {
        let newX = constrain(mouseX, 0, width);
        let newY = constrain(mouseY, 0, height);
        if (!draggingCentroid) {
            points[draggedPoint].x = newX;
            points[draggedPoint].y = newY;
        } else {
            centroids[draggedPoint].x = newX;
            centroids[draggedPoint].y = newY;
        }
        // redraw();
    }
}

function mouseReleased() {
    let movedX = Math.abs(mouseX - startX);
    let movedY = Math.abs(mouseY - startY);


    if (dragging && !draggingCentroid && movedX <= EPSILON && movedY <= EPSILON) {
        showColorPalette(mouseX, mouseY, draggedPoint)
    }

    dragging = false;
    draggingCentroid = false;
    draggedPoint = null;
}

function showColorPalette(x, y, pointIndex) {
    closeColorPalette();

    let canvasRect = document.querySelector('canvas').getBoundingClientRect();
    let menuX = canvasRect.left + x;
    let menuY = canvasRect.top + y;
    let palette = document.createElement('div');
    palette.id = 'colorPalette';
    palette.style.position = 'absolute';
    palette.style.left = `${menuX + 20}px`;
    palette.style.top = `${menuY + 20}px`;
    palette.style.display = 'flex';
    palette.style.flexWrap = 'wrap';
    palette.style.width = '100px';
    palette.style.zIndex = '100';
    palette.style.padding = '5px';
    palette.style.boxShadow = '0 4px 8px rgba(0,0,0,0.5)';
    palette.style.background = '#FFF';
    document.body.appendChild(palette);

    setTimeout(() => {
        document.addEventListener('click', handleClickOutsidePalette, true);
    }, 0);


    centroids.forEach((centroid, index) => {
        let colorBlock = document.createElement('div');
        colorBlock.style.width = '20px';
        colorBlock.style.height = '20px';
        colorBlock.style.margin = '2px';
        colorBlock.style.backgroundColor = `rgb(${centroid.color[0]}, ${centroid.color[1]}, ${centroid.color[2]})`;
        colorBlock.style.cursor = 'pointer';
        colorBlock.onclick = () => {
            changePointCluster(pointIndex, index);
            closeColorPalette();
        };
        palette.appendChild(colorBlock);
    });

    let unfixBlock = document.createElement('div');
    unfixBlock.style.width = '20px';
    unfixBlock.style.height = '20px';
    unfixBlock.style.margin = '2px';
    unfixBlock.style.backgroundColor = '#ccc';
    unfixBlock.style.cursor = 'pointer';
    unfixBlock.innerHTML = '<span style="color: red; font-size: 20px; line-height: 20px;">×</span>';
    unfixBlock.onclick = () => {
        unfixPoint(pointIndex);
        closeColorPalette();
    };
    palette.appendChild(unfixBlock);
}

function closeColorPalette() {
    let existingPalette = document.getElementById('colorPalette');
    if (existingPalette) {
        document.body.removeChild(existingPalette);
    }
    document.removeEventListener('click', handleClickOutsidePalette, true);
}

function handleClickOutsidePalette(event) {
    let palette = document.getElementById('colorPalette');
    if (palette && !palette.contains(event.target)) {
        closeColorPalette();
    }
}


function unfixPoint(pointIndex) {
    if (pointIndex !== null && points[pointIndex]) {
        points[pointIndex].fixed = false;
        redraw();
    }
}


function changePointCluster(pointIndex, clusterIndex) {
    if (pointIndex !== null && points[pointIndex]) {
        points[pointIndex].cluster = clusterIndex;
        points[pointIndex].fixed = true;
        redraw();
    }
}

function updateIterationDisplay() {
    document.getElementById('iteration-display').innerText = `Iteration: ${iterationCount}`;
}

function nextIteration() {
    if (iterationType) {
        for (let point of points) {
            if (!point.fixed) {
                let minDist = Infinity;
                let clusterIndex = 0;
                for (let i = 0; i < centroids.length; i++) {
                    let d = dist(point.x, point.y, centroids[i].x, centroids[i].y);
                    if (d < minDist) {
                        minDist = d;
                        clusterIndex = i;
                    }
                }
                point.cluster = clusterIndex;
            }
        }
    } else {
        let sums = Array(centroids.length).fill().map(() => ({x: 0, y: 0, count: 0}));
        for (let point of points) {
            let cluster = point.cluster;
            sums[cluster].x += point.x;
            sums[cluster].y += point.y;
            sums[cluster].count++;
        }
        for (let i = 0; i < centroids.length; i++) {
            if (sums[i].count > 0) {
                centroids[i].x = sums[i].x / sums[i].count;
                centroids[i].y = sums[i].y / sums[i].count;
            }
        }
    }
    iterationType = !iterationType;
    document.querySelector('button').innerText = `Next Iteration (${iterationType ? "E" : "M"})`;
    iterationCount++;
    updateIterationDisplay();
    redraw();
}

function addCentroid() {
    const randomPoint = points[Math.floor(Math.random() * points.length)];
    centroids.push({
        x: randomPoint.x,
        y: randomPoint.y,
        color: [random(255), random(255), random(255)]
    });
    redraw();
}


function reset() {
    // loadDataset('filled_circular_dataset.json');
    changeDataset()
    document.querySelector('button').innerText = "Next Iteration (M)";
    iterationType = true;
}