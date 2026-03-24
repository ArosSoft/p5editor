// 🏜️ ПУСТЫНЯ С ВЕТРОМ
// Кактусы в пустыне

let cacti = [];
let windStrength = 0;

function setup() {
  createCanvas(400, 400);

  // Создаём один кактус (большой и ближний)
  cacti.push(createCactus(150, 340));
}

function createCactus(x, y) {
  return {
    x: x,
    y: y,
    type: 'saguaro',
    height: random(120, 180),
    width: random(20, 35),
    arms: floor(random(2, 5)),
    color: color(40, 140, 40)
  };
}

function draw() {
  noLoop();
  // Обновляем силу ветра через шум Перлина (плавные изменения)
  windStrength = map(noise(frameCount * 0.003), 0, 1, 0.5, 2.5);

  // Небо (голубой градиент)
  drawSky();

  // Солнце
  drawSun();

  // Дальние барханы
  drawDistantDunes();

  // Основной песок
  fill(235, 200, 170);
  noStroke();
  rect(0, 290, width, 110);

  // Тени от кактусов
  drawShadows();

  // Рисуем кактусы
  for (let cactus of cacti) {
    drawCactus(cactus);
  }
}

// ==================== НЕБО И СОЛНЦЕ ====================

function drawSky() {
  // Градиент неба от голубого к светло-оранжевому
  for (let y = 0; y < height * 0.7; y++) {
    let inter = map(y, 0, height * 0.7, 0, 1);
    let c = lerpColor(color(100, 160, 230), color(255, 210, 160), inter);
    stroke(c);
    line(0, y, width, y);
  }
}

function drawSun() {
  // Ореол солнца
  noStroke();
  for (let i = 4; i > 0; i--) {
    fill(255, 220, 100, 25 - i * 5);
    ellipse(340, 60, 55 + i * 18, 55 + i * 18);
  }
  // Само солнце
  fill(255, 240, 120);
  ellipse(340, 60, 50, 50);
}

function drawDistantDunes() {
  // Несколько слоёв барханов для глубины (от дальних к ближним)
  let layers = [{
      baseY: 220,
      height: 20,
      color: [180, 160, 140],
      alpha: 80,
      noiseScale: 0.008
    },
    {
      baseY: 235,
      height: 28,
      color: [190, 165, 140],
      alpha: 110,
      noiseScale: 0.012
    },
    {
      baseY: 250,
      height: 35,
      color: [200, 170, 140],
      alpha: 150,
      noiseScale: 0.018
    },
    {
      baseY: 265,
      height: 42,
      color: [210, 175, 140],
      alpha: 190,
      noiseScale: 0.025
    }
  ];

  for (let layer of layers) {
    noStroke();
    fill(layer.color[0], layer.color[1], layer.color[2], layer.alpha);

    beginShape();
    vertex(0, height);
    vertex(0, layer.baseY);

    for (let x = 0; x <= width; x += 8) {
      // Шум Перлина для плавных волн дюн
      let n = noise(x * layer.noiseScale, layer.baseY * 0.01);
      let y = layer.baseY + layer.height * (n - 0.5) * 2;
      vertex(x, y);
    }

    vertex(width, layer.baseY);
    vertex(width, height);
    endShape(CLOSE);
  }
}

// ==================== ТЕНИ ====================

function drawShadows() {
  // Тени от кактусов (влево, т.к. солнце справа-вверху)
  noStroke();
  fill(0, 0, 0, 40);

  for (let cactus of cacti) {
    let shadowLength = cactus.height * 0.6;
    let shadowX = cactus.x - shadowLength * 0.7;

    beginShape();
    vertex(cactus.x - cactus.width / 2, cactus.y);
    vertex(cactus.x + cactus.width / 2, cactus.y);
    vertex(shadowX + cactus.width, cactus.y + shadowLength);
    vertex(shadowX - cactus.width, cactus.y + shadowLength);
    endShape(CLOSE);
  }
}

// ==================== КАКТУСЫ ====================

function drawCactus(cactus) {
  push();
  translate(cactus.x, cactus.y);
  drawSaguaro(cactus);
  pop();
}

function drawSaguaro(cactus) {
  // Основной ствол
  fill(cactus.color);
  noStroke();
  rect(-cactus.width / 2, -cactus.height, cactus.width, cactus.height, 5);

  // Верхушка (закруглённая)
  ellipse(0, -cactus.height, cactus.width * 0.9, cactus.width * 0.6);

  // Руки-ветви
  for (let i = 0; i < cactus.arms; i++) {
    let armY = -cactus.height + 25 + i * 30;
    let armLen = 20 + i * 5;

    if (i % 2 === 0) {
      // Левая рука
      rect(-cactus.width / 2 - armLen, armY - 6, armLen + 8, 12, 4);
      ellipse(-cactus.width / 2 - armLen, armY, 12, 12);
    } else {
      // Правая рука
      rect(cactus.width / 2 - 8, armY - 6, armLen + 8, 12, 4);
      ellipse(cactus.width / 2 + armLen, armY, 12, 12);
    }
  }

  // Иголки (редкие)
  drawSpines(cactus);
}

function drawSpines(cactus) {
  stroke(70, 70, 70);
  strokeWeight(0.8);

  let spineCount = floor(15);

  for (let i = 0; i < spineCount; i++) {
    let x = random(-cactus.width / 2, cactus.width / 2);
    let y = random(-cactus.height, 0);

    // Рисуем иголку только если внутри контура кактуса
    if (abs(x) < cactus.width / 2 - 2 && y > -cactus.height + 5) {
      let angle = random(TWO_PI);
      let len = random(3, 6);
      line(x, y, x + cos(angle) * len, y + sin(angle) * len);
    }
  }
}
