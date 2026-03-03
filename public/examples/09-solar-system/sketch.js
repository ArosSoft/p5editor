// 🪐 СОЛНЕЧНАЯ СИСТЕМА
// Планеты вращаются вокруг Солнца

let planets = [];

function setup() {
  createCanvas(600, 400);
  
  planets.push(new Planet(color(200, 150, 100), 10, 80, 0.02)); // Меркурий
  planets.push(new Planet(color(255, 200, 100), 14, 120, 0.015)); // Венера
  planets.push(new Planet(color(100, 150, 255), 16, 160, 0.01)); // Земля
  planets.push(new Planet(color(255, 100, 100), 12, 200, 0.008)); // Марс
  planets.push(new Planet(color(200, 150, 100), 22, 260, 0.005)); // Юпитер
}

function draw() {
  background(0);
  
  // Звёзды
  fill(255);
  for (let i = 0; i < 50; i++) {
    let x = (i * 73) % width;
    let y = (i * 37) % height;
    let brightness = 128 + 127 * sin(frameCount * 0.05 + i);
    fill(brightness);
    ellipse(x, y, 2, 2);
  }
  
  push();
  translate(width/2, height/2);
  
  // Солнце
  for (let i = 3; i > 0; i--) {
    fill(255, 200, 0, 50);
    ellipse(0, 0, 60 + i * 20, 60 + i * 20);
  }
  fill(255, 255, 0);
  ellipse(0, 0, 50, 50);
  
  // Орбиты
  noFill();
  stroke(100);
  strokeWeight(0.5);
  for (let planet of planets) {
    ellipse(0, 0, planet.distance * 2, planet.distance * 2);
  }
  
  // Планеты
  for (let planet of planets) {
    planet.update();
    planet.show();
  }
  pop();
}

class Planet {
  constructor(c, r, d, s) {
    this.color = c;
    this.radius = r;
    this.distance = d;
    this.speed = s;
    this.angle = random(TWO_PI);
  }
  
  update() {
    this.angle += this.speed;
  }
  
  show() {
    let x = cos(this.angle) * this.distance;
    let y = sin(this.angle) * this.distance;
    fill(this.color);
    noStroke();
    ellipse(x, y, this.radius, this.radius);
  }
}