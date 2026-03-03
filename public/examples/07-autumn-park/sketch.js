// 🍂 ОСЕННИЙ ПАРК
// Падающие листья и деревья

let leaves = [];

function setup() {
  createCanvas(400, 400);
  
  // Создаём листья
  for (let i = 0; i < 30; i++) {
    leaves.push({
      x: random(width),
      y: random(height),
      size: random(5, 15),
      speed: random(1, 3),
      rotation: random(TWO_PI),
      rotSpeed: random(-0.05, 0.05)
    });
  }
}

function draw() {
  // Небо
  background(135, 206, 250);
  
  // Солнце
  fill(255, 200, 100);
  ellipse(350, 50, 50, 50);
  
  // Земля
  fill(139, 69, 19);
  rect(0, 300, width, 100);
  
  // Деревья
  for (let x = 50; x < width; x += 100) {
    // Ствол
    fill(101, 67, 33);
    rect(x - 10, 250, 20, 100);
    
    // Крона
    fill(255, 165, 0);
    ellipse(x, 200, 80, 60);
    ellipse(x - 20, 180, 60, 50);
    ellipse(x + 20, 180, 60, 50);
  }
  
  // Рисуем падающие листья
  for (let leaf of leaves) {
    leaf.y += leaf.speed;
    leaf.rotation += leaf.rotSpeed;
    
    if (leaf.y > height) {
      leaf.y = 0;
      leaf.x = random(width);
    }
    
    push();
    translate(leaf.x, leaf.y);
    rotate(leaf.rotation);
    
    fill(255, 100, 0, 200);
    noStroke();
    
    // Рисуем листик
    beginShape();
    for (let a = 0; a < TWO_PI; a += 0.5) {
      let r = leaf.size * (0.5 + 0.5 * sin(2 * a));
      let x = cos(a) * r;
      let y = sin(a) * r;
      vertex(x, y);
    }
    endShape(CLOSE);
    
    pop();
  }
}