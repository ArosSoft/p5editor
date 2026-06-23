// a few years ago, it was the christmas festive season, i stumbled upon a present (for somebody else),
// which was a book full of empty spirals. Closer inspection learned that it was not just one spiral line,
// but actually two very fine lines, that sometimes diverged and converged. When you drew the line (haha)
// an image appeared when looking at it from a distance. Here i made code to mimick that sort of
// drawing, sometimes referred to as Spiroglyphics.
// Spiraling In Control © 2025 by Toon Beerten is licensed under CC BY-NC 4.0.

let images = [];
let currentIndex = 0;
let img;

// base canvas resolution (other parameters to start with are calculated from this)
let canvas_reso = 700; // example; set to 500 or 1000, etc.

// raw linear formulas
let turns_f   = 0.04 * canvas_reso + 20;        // floats
let samples_f = 30 * canvas_reso - 5000;
let minW_f    = 0.001 * canvas_reso;
let maxW_f    = 0.004 * canvas_reso + 3;

// clamps and final conversions
let turns   = Math.max(Math.round(turns_f), 6);                // at least 6 turns
let samples = Math.max(Math.round(samples_f), 2000);           // at least 2k samples
let minWidth = Math.max(minW_f, 0.1);
let maxWidth = Math.max(maxW_f, minWidth + 0.1);               // ensure max>min
let a = 0; // inner radius (pixels)

// Progressive drawing state
let thetaMax, b, maxRadius;
let currentStep = 0;
let speedSlider, speedLabel;
let controlPanel;
let canvas;

function preload() {
  images[0] = loadImage("https://sun9-32.userapi.com/s/v1/ig2/GvjgkONDOiPxDMNBG_bpwS2gRYKkjZbYOQMduITbA-r3bZDhk0MvjqIb-VILLes9FOGedZZPFUdiDdRUzyFnsi8j.jpg?quality=95&crop=0,0,1941,1628&as=32x27,48x40,72x60,108x91,160x134,240x201,360x302,480x403,540x453,640x537,720x604,1080x906,1280x1074,1440x1208,1941x1628&from=bu&u=ly9_p-x3iktmBjpUkGlQ8ulzyPEjcGJ1S1C20FEVfls&cs=1941x0");
}

function setup() {
  canvas = createCanvas(canvas_reso, canvas_reso);
  pixelDensity(1);
  background(255);

  // start with the first image
  img = images[currentIndex];
  resetDrawing();

  stroke(0);
  strokeCap(ROUND);
  noFill();

  // center the canvas in the window
  centerCanvas();

  // make a container for controls
  controlPanel = createDiv();
  controlPanel.style("display", "flex");
  controlPanel.style("flex-direction", "column");
  controlPanel.style("align-items", "flex-start");
  controlPanel.style("font-family", "sans-serif");
  controlPanel.style("font-size", "14px");

  // label + slider
  speedLabel = createP("Drawing speed:");
  speedLabel.parent(controlPanel);
  speedLabel.style("margin", "4px 0px");

  speedSlider = createSlider(0.5, 500, 10, 5);
  speedSlider.parent(controlPanel);
  speedSlider.style("width", "200px");
  speedSlider.style("margin-bottom", "12px");

  positionControls();
}

function draw() {
  translate(width / 2, height / 2);

  let segmentsPerFrame = speedSlider.value();
  let stepsThisFrame = min(segmentsPerFrame, samples - currentStep);

  for (let n = 0; n < stepsThisFrame; n++) {
    let i = currentStep;

    // Spiral segment start/end
    const theta1 = map(i, 0, samples, 0, thetaMax);
    const r1 = a + b * theta1;
    const x1 = r1 * cos(theta1);
    const y1 = r1 * sin(theta1);

    const theta2 = map(i + 1, 0, samples, 0, thetaMax);
    const r2 = a + b * theta2;
    const x2 = r2 * cos(theta2);
    const y2 = r2 * sin(theta2);

    // Midpoint
    const xm = (x1 + x2) * 0.5;
    const ym = (y1 + y2) * 0.5;

    // Map midpoint to image coordinates
    const u = floor(map(xm, -maxRadius, maxRadius, 0, img.width - 1));
    const v = floor(map(ym, -maxRadius, maxRadius, 0, img.height - 1));

    if (u >= 0 && u < img.width && v >= 0 && v < img.height) {
      const idx = 4 * (v * img.width + u);
      const bright = img.pixels[idx] / 255.0;
      const w = map(1 - bright, 0, 1, minWidth, maxWidth);

      strokeWeight(w);
      line(x1, y1, x2, y2);
    }

    currentStep++;
  }

  // Stop when done
  if (currentStep >= samples) {
    noLoop();
  }
}

function mousePressed() {
  // switch to next image
  currentIndex = (currentIndex + 1) % images.length;
  img = images[currentIndex];
  resetDrawing();
}

function resetDrawing() {
  background(255);
  currentStep = 0;

  // prepare the new image
  img.resize(720, 720);   // normalize size
  img.filter(GRAY);
  img.loadPixels();

  // recalc spiral parameters
  maxRadius = min(width, height) * 0.45;
  thetaMax = TWO_PI * turns;
  b = (maxRadius - a) / thetaMax;

  loop(); // restart draw loop
}

function windowResized() {
  centerCanvas();
  positionControls();
}

// ---- helpers ----
function centerCanvas() {
  let x = (windowWidth - width) / 2;
  let y = (windowHeight - height) / 2;
  canvas.position(x, y);
}

function positionControls() {
  let cpos = canvas.position();
  controlPanel.position(cpos.x + width + 20, cpos.y); // 20px right of canvas
}