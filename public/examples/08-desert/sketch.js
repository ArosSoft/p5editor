// 🏜️ ПУСТЫНЯ
// Кактусы, песок и миражи

let cactus = [];

function setup() {
  createCanvas(400, 400);
  
  // Создаём кактусы
  for (let i = 0; i < 5; i++) {
    cactus.push({
      x: 50 + i * 80,
      y: 300,
      height: random(50, 100),
      arms: random(0, 2)
    });
  }
}

function draw() {
  // Небо
  background(255, 200, 150);
  
  // Солнце
  fill(255, 255, 0);
  ellipse(350, 50, 40, 40);
  
  // Песок
  fill(255, 204, 102);
  rect(0, 300, width, 100);
  
  // Барханы
  fill(255, 204, 102);
  noStroke();
  for (let i = 0; i < 5; i++) {
    let y = 300 + 20 * sin(frameCount * 0.02 + i);
    ellipse(100 + i * 100, y, 150, 30);
  }
  
  // Рисуем кактусы
  for (let c of cactus) {
    // Основной стебель
    fill(34, 139, 34);
    rect(c.x - 10, c.y - c.height, 20, c.height);
    
    // Руки
    if (c.arms > 0) {
      rect(c.x - 25, c.y - c.height + 30, 20, 10);
      rect(c.x + 5, c.y - c.height + 50, 20, 10);
    }
    
    // Иголки
    stroke(0);
    strokeWeight(1);
    for (let i = 0; i < 10; i++) {
      let x = c.x - 5 + random(10);
      let y = c.y - c.height + random(c.height);
      line(x, y, x + random(-5, 5), y + random(-5, 5));
    }
  }
  
  // Мираж
  fill(255, 255, 255, 50 * sin(frameCount * 0.1));
  rect(0, 200, width, 50);
}