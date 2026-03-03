// ⛈️ ГРОЗА
// Дождь, молнии и тучи

let raindrops = [];
let lightning = 0;

function setup() {
  createCanvas(400, 400);
  
  // Создаём капли дождя
  for (let i = 0; i < 100; i++) {
    raindrops.push({
      x: random(width),
      y: random(height),
      speed: random(5, 10),
      length: random(10, 20)
    });
  }
}

function draw() {
  // Тёмное небо
  background(30, 30, 50);
  
  // Молния
  if (random() < 0.005) {
    lightning = 255;
  }
  
  if (lightning > 0) {
    fill(255, 255, 255, lightning);
    rect(0, 0, width, height);
    lightning -= 5;
  }
  
  // Рисуем тучи
  fill(50, 50, 70);
  noStroke();
  ellipse(100, 80, 150, 80);
  ellipse(200, 60, 200, 100);
  ellipse(300, 80, 150, 80);
  
  // Рисуем дождь
  stroke(200, 200, 255, 150);
  strokeWeight(2);
  for (let drop of raindrops) {
    drop.y += drop.speed;
    if (drop.y > height) {
      drop.y = 0;
      drop.x = random(width);
    }
    
    line(drop.x, drop.y, drop.x, drop.y + drop.length);
  }
  
  // Лужи внизу
  fill(100, 100, 200, 100);
  rect(0, height - 20, width, 20);
  
  // Круги на лужах
  fill(255, 255, 255, 100);
  for (let i = 0; i < 5; i++) {
    let x = (frameCount * 2 + i * 50) % width;
    ellipse(x, height - 15, 5, 5);
  }
}