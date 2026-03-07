// 🌊 ПОДВОДНЫЙ МИР
// Рыбки плавают в океане
// Сделай больше рыб, добавь песок и водоросли

let fish = [];
let bubbles = [];

function setup() {
  createCanvas(400, 400);

  // Создаём рыбок
  for (let i = 0; i < 5; i++) {
    fish.push({
      x: random(width),
      y: random(height),
      size: random(20, 40),
      speed: random(1, 3),
      color: color(random(100, 255), random(100, 255), random(100, 255))
    });
  }
}

function draw() {
  // Вода (градиент)
  for (let y = 0; y < height; y++) {
    let blue = map(y, 0, height, 100, 200);
    stroke(0, 0, blue);
    line(0, y, width, y);
  }

  // Рисуем пузырьки
  for (let i = bubbles.length - 1; i >= 0; i--) {
    let b = bubbles[i];
    b.y -= b.speed;

    fill(255, 255, 255, 150);
    noStroke();
    ellipse(b.x, b.y, b.size, b.size);

    if (b.y < 0) {
      bubbles.splice(i, 1);
    }
  }

  // Добавляем новые пузырьки
  if (random() < 0.1) {
    bubbles.push({
      x: random(width),
      y: height,
      size: random(5, 15),
      speed: random(1, 3)
    });
  }

  // Рисуем рыбок
  for (let fishy of fish) {
    fishy.x += fishy.speed;
    if (fishy.x > width + 50) fishy.x = -50;

    fill(fishy.color);
    noStroke();

    // Тело рыбки
    ellipse(fishy.x, fishy.y, fishy.size, fishy.size * 0.6);
    // Глаз
    fill(0);
    ellipse(fishy.x + fishy.size * 0.2, fishy.y - 2, 3, 3);
    // Хвост
    fill(fishy.color);
    triangle(fishy.x - fishy.size / 2, fishy.y,
      fishy.x - fishy.size / 2 - 10, fishy.y - 5,
      fishy.x - fishy.size / 2 - 10, fishy.y + 5);
  }
}
