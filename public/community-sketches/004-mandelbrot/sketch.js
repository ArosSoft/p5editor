let zoom = 200;
let offsetX = width / 2;
let offsetY = height / 2;
let maxIter = 50;

function setup() {
  createCanvas(600, 600);
  colorMode(HSB, 360, 100, 100);
}

function draw() {
  loadPixels();
  
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let a = (x - offsetX) / zoom;
      let b = (y - offsetY) / zoom;
      let ca = a;
      let cb = b;
      let n = 0;
      
      while (n < maxIter) {
        let aa = a * a - b * b;
        let bb = 2 * a * b;
        a = aa + ca;
        b = bb + cb;
        if (a * a + b * b > 4) break;
        n++;
      }
      
      let bright = map(n, 0, maxIter, 0, 1);
      if (n === maxIter) bright = 0;
      
      let idx = (x + y * width) * 4;
      pixels[idx] = bright * 255;
      pixels[idx + 1] = bright * 100;
      pixels[idx + 2] = bright * 200;
      pixels[idx + 3] = 255;
    }
  }
  updatePixels();
}
