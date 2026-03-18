let hue = 0;

function setup() {
  createCanvas(800, 600);
  colorMode(HSB, 360, 100, 100);
  noStroke();
}

function draw() {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let h = (hue + x + y) % 360;
      fill(h, 80, 100);
      rect(x, y, 1, 1);
    }
  }
  hue += 0.5;
}
