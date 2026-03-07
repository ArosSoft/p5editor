// ⭐ ЗВЁЗДНОЕ НЕБО
// Мерцающие звёзды и созвездия

let stars = [];
let shootingStars = [];

function setup() {
  createCanvas(400, 400);
  
  // Создаём звёзды
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(1, 3),
      brightness: random(100, 255),
      twinkleSpeed: random(0.01, 0.05)
    });
  }
}

function draw() {
  background(0);
  
  // Рисуем звёзды
  for (let star of stars) {
    star.brightness = 150 + 105 * sin(frameCount * star.twinkleSpeed + star.x);
    fill(255, 255, 255, star.brightness);
    noStroke();
    ellipse(star.x, star.y, star.size, star.size);
  }
  
  // Рисуем падающие звёзды
  for (let i = shootingStars.length - 1; i >= 0; i--) {
    let s = shootingStars[i];
    s.x += s.vx;
    s.y += s.vy;
    s.life -= 2;
    
    if (s.life <= 0) {
      shootingStars.splice(i, 1);
    }
    
    stroke(255, 255, 255, s.life);
    strokeWeight(2);
    line(s.x, s.y, s.x - s.vx * 2, s.y - s.vy * 2);
  }
  
  // Добавляем падающие звёзды
  if (random() < 0.01) {
    shootingStars.push({
      x: random(width),
      y: 0,
      vx: random(-2, 2),
      vy: random(5, 10),
      life: 255
    });
  }
  
  // Рисуем созвездие Большой Медведицы
  stroke(255, 255, 255, 100);
  strokeWeight(1);
  noFill();
  
  let points = [
    [70, 67], [100, 65], [120, 70], [157, 80],
    [160, 108], [200, 110], [210, 79], [157, 80]
    
    
  ];
  
  for (let i = 0; i < points.length - 1; i++) {
    line(points[i][0], points[i][1], points[i+1][0], points[i+1][1]);
  }
  
  for (let p of points) {
    fill(255, 255, 200);
    ellipse(p[0], p[1], 5, 5);
  }
}