let mic;
let fft;

function setup() {
  createCanvas(600, 400);
  mic = new p5.AudioIn();
  mic.start();
  fft = new p5.FFT();
  fft.setInput(mic);
}

function draw() {
  background(20);
  
  let spectrum = fft.analyze();
  
  noStroke();
  fill(0, 200);
  
  beginShape();
  for (let i = 0; i < spectrum.length; i++) {
    let x = map(i, 0, spectrum.length, 0, width);
    let h = map(spectrum[i], 0, 255, 0, height);
    vertex(x, height - h);
  }
  endShape();
  
  stroke(255, 100);
  line(0, height / 2, width, height / 2);
}
