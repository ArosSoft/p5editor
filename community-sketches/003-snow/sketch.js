let snowflakes = [];

function setup() {
  createCanvas(800, 600);
  for (let i = 0; i < 200; i++) {
    snowflakes.push({
      x: random(width),
      y: random(-height, 0),
      speed: random(1, 3),
      size: random(2, 6)
    });
  }
}

function draw() {
  background(20, 30, 60);
  noStroke();
  fill(255, 200);
  
  for (let flake of snowflakes) {
    ellipse(flake.x, flake.y, flake.size);
    flake.y += flake.speed;
    
    // Реакция на мышь
    let d = dist(flake.x, flake.y, mouseX, mouseY);
    if (d < 100) {
      flake.x += map(d, 0, 100, 2, 0);
    }
    
    if (flake.y > height) {
      flake.y = -10;
      flake.x = random(width);
    }
  }
}
