// 🏜️ ПУСТЫНЯ
// Реалистичные кактусы, барханы и эффекты пустыни

let cacti = [];
let sandDunes = [];
let tumbleweeds = [];
let timeOfDay = 0; // 0-24 часа

function setup() {
  createCanvas(400, 400);
  
  // Создаём барханы (разные слои)
  for (let i = 0; i < 8; i++) {
    sandDunes.push({
      x: random(-50, width + 50),
      y: random(250, 350),
      width: random(150, 300),
      height: random(20, 60),
      speed: random(0.1, 0.3)
    });
  }
  
  // Создаём кактусы разных видов
  for (let i = 0; i < 8; i++) {
    cacti.push(createCactus(50 + i * 45, 300 + random(-20, 20)));
  }
  
  // Создаём перекати-поле
  for (let i = 0; i < 3; i++) {
    tumbleweeds.push({
      x: random(width),
      y: random(250, 350),
      size: random(15, 30),
      speedX: random(0.5, 1.5),
      speedY: random(-0.2, 0.2),
      rotation: random(TWO_PI),
      rotSpeed: random(-0.02, 0.02)
    });
  }
}

function createCactus(x, y) {
  let type = random(['saguaro', 'barrel', 'prickly']);
  return {
    x: x,
    y: y,
    type: type,
    height: type === 'saguaro' ? random(80, 150) : 
            type === 'barrel' ? random(40, 70) : random(20, 40),
    width: type === 'saguaro' ? random(15, 25) : 
            type === 'barrel' ? random(30, 50) : random(40, 60),
    arms: type === 'saguaro' ? floor(random(0, 4)) : 0,
    color: type === 'saguaro' ? color(34, 139, 34) :
           type === 'barrel' ? color(60, 120, 40) : color(40, 100, 30),
    spineDensity: random(0.5, 1.5)
  };
}

function draw() {
  // Меняем время суток (медленный цикл)
  timeOfDay = (timeOfDay + 0.001) % 24;
  
  // Рисуем небо с градиентом в зависимости от времени
  drawSky();
  
  // Солнце или луна
  drawSunMoon();
  
  // Дальние барханы
  drawDistantDunes();
  
  // Основной песок с текстурой
  drawSand();
  
  // Ближние барханы
  drawSandDunes();
  
  // Тени от кактусов
  drawCactusShadows();
  
  // Рисуем кактусы
  for (let cactus of cacti) {
    drawCactus(cactus);
  }
  
  // Перекати-поле
  drawTumbleweeds();
  
  // Мираж (только в жаркое время дня)
  if (timeOfDay > 6 && timeOfDay < 18) {
    drawMirage();
  }
  
  // Песок летит
  drawSandParticles();
}

function drawSky() {
  // Цвет неба в зависимости от времени
  let skyColor;
  let horizonColor;
  
  if (timeOfDay < 6 || timeOfDay > 18) {
    // Ночь
    skyColor = color(20, 20, 40);
    horizonColor = color(40, 30, 50);
  } else if (timeOfDay < 7 || timeOfDay > 17) {
    // Рассвет/закат
    skyColor = color(255, 120, 80);
    horizonColor = color(200, 100, 60);
  } else {
    // День
    skyColor = color(135, 190, 235);
    horizonColor = color(255, 200, 150);
  }
  
  // Градиент неба
  for (let i = 0; i <= height; i++) {
    let inter = map(i, 0, height * 0.7, 0, 1);
    let c = lerpColor(skyColor, horizonColor, inter);
    stroke(c);
    line(0, i, width, i);
  }
  
  // Звезды ночью
  if (timeOfDay < 6 || timeOfDay > 20) {
    drawStars();
  }
}

function drawStars() {
  noStroke();
  for (let i = 0; i < 50; i++) {
    let x = (i * 37) % width;
    let y = (i * 23) % (height * 0.5);
    let brightness = 100 + 155 * sin(frameCount * 0.01 + i);
    fill(255, 255, 255, brightness);
    ellipse(x, y, random(1, 3), random(1, 3));
  }
}

function drawSunMoon() {
  let x = map(timeOfDay, 0, 24, 0, width + 100) - 50;
  let y = map(sin(timeOfDay * PI / 12), -1, 1, 100, 300);
  
  if (timeOfDay < 6 || timeOfDay > 18) {
    // Луна
    fill(240, 240, 255);
    ellipse(x, y, 30, 30);
    // Кратеры
    fill(220, 220, 240);
    ellipse(x - 5, y - 5, 5, 5);
    ellipse(x + 8, y + 3, 8, 8);
  } else {
    // Солнце с ореолом
    for (let i = 3; i > 0; i--) {
      fill(255, 200, 100, 30 - i * 5);
      ellipse(x, y, 50 + i * 20, 50 + i * 20);
    }
    fill(255, 255, 100);
    ellipse(x, y, 40, 40);
  }
}

function drawDistantDunes() {
  // Дальний план (холмы)
  noStroke();
  fill(210, 180, 140, 150);
  beginShape();
  vertex(0, 250);
  for (let x = 0; x < width; x += 20) {
    let y = 230 + 20 * noise(x * 0.01, frameCount * 0.001);
    vertex(x, y);
  }
  vertex(width, 250);
  vertex(width, 300);
  vertex(0, 300);
  endShape(CLOSE);
}

function drawSand() {
  // Основной песок с текстурой
  noStroke();
  fill(238, 203, 173);
  rect(0, 280, width, 120);
  
  // Текстура песка (мелкие точки)
  stroke(200, 170, 140);
  strokeWeight(1);
  for (let i = 0; i < 200; i++) {
    let x = random(width);
    let y = random(280, 380);
    point(x, y);
  }
  
  // Темные полосы в песке
  stroke(180, 150, 120, 50);
  for (let y = 290; y < 380; y += 15) {
    line(0, y + random(-3, 3), width, y + random(-3, 3));
  }
}

function drawSandDunes() {
  noStroke();
  
  // Сортируем барханы по глубине
  sandDunes.sort((a, b) => a.y - b.y);
  
  for (let dune of sandDunes) {
    // Цвет песка меняется в зависимости от освещения
    let sandColor;
    if (timeOfDay < 7 || timeOfDay > 17) {
      sandColor = color(230, 170, 120, 200);
    } else {
      sandColor = color(245, 215, 170, 220);
    }
    
    fill(sandColor);
    
    // Рисуем бархан
    beginShape();
    vertex(dune.x - dune.width/2, dune.y);
    for (let x = dune.x - dune.width/2; x < dune.x + dune.width/2; x += 10) {
      let y = dune.y - dune.height * 
              (1 - pow((x - dune.x) / (dune.width/2), 2));
      vertex(x, y);
    }
    vertex(dune.x + dune.width/2, dune.y);
    vertex(dune.x + dune.width/2, dune.y + 20);
    vertex(dune.x - dune.width/2, dune.y + 20);
    endShape(CLOSE);
    
    // Светлая сторона бархана
    fill(255, 235, 200, 100);
    beginShape();
    vertex(dune.x - dune.width/2, dune.y);
    for (let x = dune.x - dune.width/2; x < dune.x; x += 5) {
      let y = dune.y - dune.height * 
              (1 - pow((x - dune.x) / (dune.width/2), 2));
      vertex(x, y);
    }
    vertex(dune.x, dune.y);
    endShape(CLOSE);
  }
}

function drawCactusShadows() {
  // Тени от кактусов
  noStroke();
  fill(0, 0, 0, 30);
  for (let cactus of cacti) {
    let shadowLength = map(timeOfDay, 0, 24, 50, 150);
    let shadowX = cactus.x + 20 * cos(timeOfDay * PI / 12);
    beginShape();
    vertex(cactus.x - 10, cactus.y);
    vertex(cactus.x + 10, cactus.y);
    vertex(shadowX + 15, cactus.y + shadowLength);
    vertex(shadowX - 15, cactus.y + shadowLength);
    endShape(CLOSE);
  }
}

function drawCactus(cactus) {
  push();
  translate(cactus.x, cactus.y);
  
  if (cactus.type === 'saguaro') {
    drawSaguaro(cactus);
  } else if (cactus.type === 'barrel') {
    drawBarrelCactus(cactus);
  } else {
    drawPricklyPear(cactus);
  }
  
  pop();
}

function drawSaguaro(cactus) {
  // Основной ствол
  fill(cactus.color);
  noStroke();
  rect(-cactus.width/2, -cactus.height, cactus.width, cactus.height);
  
  // Верхушка
  ellipse(0, -cactus.height, cactus.width * 0.8, cactus.width * 0.5);
  
  // Руки
  for (let i = 0; i < cactus.arms; i++) {
    let armHeight = -cactus.height + 30 + i * 25;
    let armLength = random(20, 30);
    
    if (i % 2 === 0) {
      // Левая рука
      rect(-cactus.width/2 - armLength, armHeight, armLength, 10);
      ellipse(-cactus.width/2 - armLength, armHeight + 5, 10, 10);
    } else {
      // Правая рука
      rect(cactus.width/2, armHeight, armLength, 10);
      ellipse(cactus.width/2 + armLength, armHeight + 5, 10, 10);
    }
  }
  
  // Иголки
  drawSpines(cactus);
  
  // Цветы (редко)
  if (random(100) < 5) {
    fill(255, 200, 200);
    ellipse(random(-5, 5), -cactus.height - 5, 8, 8);
    fill(255, 100, 100);
    ellipse(random(-3, 3), -cactus.height - 7, 4, 4);
  }
}

function drawBarrelCactus(cactus) {
  // Бочкообразный кактус
  fill(cactus.color);
  noStroke();
  ellipse(0, -cactus.height/2, cactus.width, cactus.height);
  
  // Ребра
  stroke(20, 80, 20);
  strokeWeight(1);
  for (let i = 0; i < 5; i++) {
    let xOffset = map(i, 0, 4, -cactus.width/3, cactus.width/3);
    line(xOffset, -cactus.height + 10, xOffset, -10);
  }
  
  drawSpines(cactus);
}

function drawPricklyPear(cactus) {
  // Опунция
  fill(cactus.color);
  noStroke();
  
  // Несколько "лепешек"
  for (let i = 0; i < 5; i++) {
    let xOffset = (i - 2) * 12;
    let yOffset = -cactus.height/2 + i * 8;
    ellipse(xOffset, yOffset, 25, 15);
  }
  
  drawSpines(cactus);
}

function drawSpines(cactus) {
  stroke(150, 100, 50);
  strokeWeight(0.5);
  
  let spineCount = floor(20 * cactus.spineDensity);
  
  for (let i = 0; i < spineCount; i++) {
    let x = random(-cactus.width/2 - 5, cactus.width/2 + 5);
    let y = random(-cactus.height, 0);
    
    if (dist(0, y, x, 0) < cactus.width/2 + 5) {
      line(x, y, 
           x + random(-5, 5), y + random(-5, 5));
    }
  }
}

function drawTumbleweeds() {
  for (let weed of tumbleweeds) {
    weed.x += weed.speedX;
    weed.y += weed.speedY;
    weed.rotation += weed.rotSpeed;
    
    // Возвращаем если улетел за край
    if (weed.x > width + 50) weed.x = -50;
    if (weed.x < -50) weed.x = width + 50;
    
    push();
    translate(weed.x, weed.y);
    rotate(weed.rotation);
    
    // Перекати-поле
    noStroke();
    fill(180, 140, 100, 200);
    
    // Клубок из веток
    for (let i = 0; i < 8; i++) {
      let angle = i * PI/4;
      let x1 = cos(angle) * weed.size * 0.5;
      let y1 = sin(angle) * weed.size * 0.5;
      let x2 = cos(angle + 0.5) * weed.size;
      let y2 = sin(angle + 0.5) * weed.size;
      
      stroke(140, 100, 70);
      strokeWeight(1);
      line(x1, y1, x2, y2);
    }
    
    pop();
  }
}

function drawMirage() {
  // Эффект миража
  let intensity = 0.3 + 0.2 * sin(frameCount * 0.02);
  
  for (let i = 0; i < 5; i++) {
    let y = 200 + i * 30 + 5 * sin(frameCount * 0.05 + i);
    fill(255, 255, 255, 20 * intensity);
    noStroke();
    rect(50, y, width - 100, 15);
  }
  
  // Искаженное отражение
  stroke(255, 255, 255, 30 * intensity);
  strokeWeight(1);
  for (let x = 0; x < width; x += 20) {
    let offset = 5 * sin(x * 0.02 + frameCount * 0.02);
    line(x, 200 + offset, x + 10, 220 + offset);
  }
}

function drawSandParticles() {
  // Летящий песок
  noStroke();
  for (let i = 0; i < 30; i++) {
    let x = (frameCount * 0.5 + i * 20) % width;
    let y = 300 + 20 * sin(frameCount * 0.02 + i);
    
    fill(220, 180, 140, random(50, 150));
    ellipse(x, y, random(1, 3), random(1, 2));
  }
}