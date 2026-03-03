// 🌳 ВОЛШЕБНЫЙ ЛЕС
// Лес с мерцающими светлячками

let trees = [];
let fireflies = [];

function setup() {
  createCanvas(400, 400);
  
  // Создаём деревья
  for (let i = 0; i < 10; i++) {
    trees.push({
      x: random(width),
      y: height - random(50, 100),
      height: random(80, 150),
      width: random(20, 40)
    });
  }
  
  // Создаём светлячков
  for (let i = 0; i < 20; i++) {
    fireflies.push({
      x: random(width),
      y: random(height),
      speedX: random(-1, 1),
      speedY: random(-1, 1),
      brightness: random(100, 255)
    });
  }
}

function draw() {
  // Небо (градиент)
  for (let y = 0; y < height; y++) {
    let dark = map(y, 0, height, 50, 0);
    stroke(25, 25, 50 + dark);
    line(0, y, width, y);
  }
  
  // Рисуем траву
  fill(20, 80, 20);
  noStroke();
  rect(0, height - 50, width, 50);
  
  // Рисуем деревья
  for (let tree of trees) {
    // Ствол
    fill(101, 67, 33);
    rect(tree.x - tree.width/2, tree.y - tree.height, tree.width, tree.height);
    
    // Крона
    fill(34, 139, 34);
    ellipse(tree.x, tree.y - tree.height - 20, tree.width * 2, tree.width * 1.5);
    ellipse(tree.x - 15, tree.y - tree.height - 5, tree.width * 1.5, tree.width * 1.2);
    ellipse(tree.x + 15, tree.y - tree.height - 5, tree.width * 1.5, tree.width * 1.2);
  }
  
  // Рисуем светлячков
  for (let firefly of fireflies) {
    firefly.x += firefly.speedX;
    firefly.y += firefly.speedY;
    
    if (firefly.x < 0 || firefly.x > width) firefly.speedX *= -1;
    if (firefly.y < 0 || firefly.y > height) firefly.speedY *= -1;
    
    firefly.brightness = 150 + 105 * sin(frameCount * 0.1 + firefly.x);
    
    fill(255, 255, 100, firefly.brightness);
    noStroke();
    ellipse(firefly.x, firefly.y, 5, 5);
    
    fill(255, 255, 100, firefly.brightness * 0.3);
    ellipse(firefly.x, firefly.y, 15, 15);
  }
  
  // Луна
  fill(255, 255, 200);
  ellipse(350, 50, 40, 40);
}