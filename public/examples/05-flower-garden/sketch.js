// 🌸 ЦВЕТУЩИЙ САД
// Цветы растут и колышутся на ветру

let flowers = [];

function setup() {
  createCanvas(400, 400);
  
  // Создаём цветы
  for (let i = 0; i < 15; i++) {
    flowers.push({
      x: random(50, 350),
      y: random(200, 350),
      petalColor: color(random(255), random(255), random(255)),
      centerColor: color(255, 255, 0),
      size: random(20, 40),
      angle: 0
    });
  }
}

function draw() {
  // Небо
  background(135, 206, 235);
  
  // Солнце
  fill(255, 255, 0);
  ellipse(350, 50, 60, 60);
  
  // Трава
  fill(34, 139, 34);
  rect(0, 200, width, 200);
  
  // Рисуем цветы
  for (let flower of flowers) {
    flower.angle = sin(frameCount * 0.02 + flower.x) * 0.1;
    
    push();
    translate(flower.x, flower.y);
    rotate(flower.angle);
    
    // Стебель
    stroke(34, 139, 34);
    strokeWeight(2);
    line(0, 0, 0, 50);
    
    // Лепестки
    noStroke();
    for (let i = 0; i < 6; i++) {
      let angle = i * PI/3;
      fill(flower.petalColor);
      ellipse(cos(angle) * flower.size/2,
              sin(angle) * flower.size/2,
              flower.size/2, flower.size/2);
    }
    
    // Центр цветка
    fill(flower.centerColor);
    ellipse(0, 0, flower.size/2, flower.size/2);
    
    pop();
  }
  
  // Бабочки
  for (let i = 0; i < 3; i++) {
    let x = 100 + i * 100 + sin(frameCount * 0.05 + i) * 20;
    let y = 100 + cos(frameCount * 0.03 + i) * 20;
    
    fill(255, 0, 255);
    ellipse(x - 5, y, 10, 5);
    ellipse(x + 5, y, 10, 5);
    ellipse(x, y - 2, 5, 5);
  }
}