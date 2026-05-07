// Игра "Аэрохоккей"
// Логический размер 800x450, масштабирование, кнопка полноэкранного режима
// Обратный отсчёт только в самом начале (без затемнения), пауза 1 сек после гола without countdown

let LOGIC_W = 800;
let LOGIC_H = 450;

let padding = 25;
let goalHeight = 200;
let maxScore = 3;

// Границы игрового поля (логические координаты)
let fieldLeft, fieldRight, fieldTop, fieldBottom;
let goalTop, goalBottom;

// Свойства игроков
let playerRadius = 32;
let leftPlayer, rightPlayer;
let playerSpeed = 8;

// Свойства шайбы
let puck;
let puckRadius = 22;
let puckBaseSpeed = 7;
let puckSpeedMultiplier = 1;

// Счёт
let leftScore = 0;
let rightScore = 0;

// Состояние игры
let gameOver = false;
let winner = '';
let gameActive = false;      // true когда шайба движется
let countdown = 0;           // 3,2,1,0 для начального отсчёта
let countdownTimer = 0;      // таймер для начального отсчёта
let freezeTimer = 0;         // таймер для паузы после гола

// Фоновые частицы (логические координаты)
let backgroundPoints = [];
let numPoints = 50;
let maxLineDist = 110;

// Прямоугольник кнопки полноэкранного режима (логические координаты)
let buttonRect;

function setup() {
  createCanvas(LOGIC_W, LOGIC_H);
  calculateField();         // рассчитать границы поля
  initPlayersAndPuck();     // инициализировать игроков и шайбу
  initBackgroundPoints();   // инициализировать фоновые точки
  initButton();             // инициализировать кнопку
  startInitialCountdown();  // только при запуске программы
}

function calculateField() {
  // Установка границ игрового поля
  fieldLeft = padding;
  fieldRight = LOGIC_W - padding;
  fieldTop = padding;
  fieldBottom = LOGIC_H - padding;
  // Ворота по центру по вертикали
  goalTop = (LOGIC_H - goalHeight) / 2;
  goalBottom = goalTop + goalHeight;
}

function initButton() {
  buttonRect = {
    x: LOGIC_W / 2 - 60,
    y: LOGIC_H - 35,
    w: 120,
    h: 28
  };
}

function initPlayersAndPuck() {
  // Синий игрок (слева)
  leftPlayer = {
    x: fieldLeft,
    y: LOGIC_H / 2,
    targetX: fieldLeft,
    targetY: LOGIC_H / 2,
    color: [50, 100, 255],
    side: 'left'
  };
  // Красный игрок (справа)
  rightPlayer = {
    x: fieldRight,
    y: LOGIC_H / 2,
    targetX: fieldRight,
    targetY: LOGIC_H / 2,
    color: [255, 60, 60],
    side: 'right'
  };
  resetPuckPosition();  // сбросить позицию шайбы
}

function initBackgroundPoints() {
  // Создание фоновых частиц с случайными параметрами
  backgroundPoints = [];
  for (let i = 0; i < numPoints; i++) {
    backgroundPoints.push({
      x: random(fieldLeft, fieldRight),
      y: random(fieldTop, fieldBottom),
      vx: random(-1.2, 1.2),   // скорость по X
      vy: random(-1.2, 1.2),   // скорость по Y
      radius: random(2, 3.5),   // радиус частицы
      color: [random(100, 255), random(100, 255), random(100, 255)]  // случайный цвет
    });
  }
}

function resetPuckPosition() {
  // Сброс шайбы в центр поля
  puck = {
    x: LOGIC_W / 2,
    y: LOGIC_H / 2,
    vx: 0,
    vy: 0,
    color: [255,255,255],
    glowColor: [200,220,255]
  };
}

function startInitialCountdown() {
  // Начальный обратный отсчёт перед стартом игры
  countdown = 3;
  countdownTimer = millis();
  gameActive = false;      // игра не активна во время отсчёта
  freezeTimer = 0;
  resetPuckPosition();
  puck.vx = 0;
  puck.vy = 0;
}

function startGameplay() {
  // Запуск игры после отсчёта
  gameActive = true;
  // Случайное направление шайбы в начале
  let targetSide = random() < 0.5 ? 'left' : 'right';
  let targetX = targetSide === 'left' ? fieldLeft : fieldRight;
  let targetY = random(goalTop + puckRadius, goalBottom - puckRadius);
  let startX = LOGIC_W / 2;
  let startY = LOGIC_H / 2;
  let dx = targetX - startX;
  let dy = targetY - startY;
  let dist = sqrt(dx*dx+dy*dy);
  // Нормализация вектора скорости
  puck.vx = (dx/dist) * puckBaseSpeed;
  puck.vy = (dy/dist) * puckBaseSpeed;
  puckSpeedMultiplier = 1;
  countdownTimer = 0; // завершить отображение отсчёта
}

function releasePuckAfterFreeze() {
  // Освобождение шайбы после паузы (забитый гол)
  gameActive = true;
  freezeTimer = 0;
  // Дать случайное направление
  let targetSide = random() < 0.5 ? 'left' : 'right';
  let targetX = targetSide === 'left' ? fieldLeft : fieldRight;
  let targetY = random(goalTop + puckRadius, goalBottom - puckRadius);
  let startX = LOGIC_W / 2;
  let startY = LOGIC_H / 2;
  let dx = targetX - startX;
  let dy = targetY - startY;
  let dist = sqrt(dx*dx+dy*dy);
  puck.vx = (dx/dist) * puckBaseSpeed;
  puck.vy = (dy/dist) * puckBaseSpeed;
  puckSpeedMultiplier = 1;
}

function handleGoal(whichPlayer) {
  // Обработка забитого гола
  if (whichPlayer === 'left') {
    leftScore++;  // гол синим (левым) в ворота красного
    if (leftScore >= maxScore) {
      gameOver = true;
      winner = 'Blue';
      gameActive = false;
      return;
    }
  } else {
    rightScore++;  // гол красным (правым) в ворота синего
    if (rightScore >= maxScore) {
      gameOver = true;
      winner = 'Red';
      gameActive = false;
      return;
    }
  }
  // Остановить шайбу в центре на 1 секунду
  gameActive = false;
  resetPuckPosition();
  freezeTimer = millis();
}

function updateBackgroundPoints() {
  // Обновление позиций фоновых частиц и отскок от стен
  for (let p of backgroundPoints) {
    p.x += p.vx;
    p.y += p.vy;
    // Отскок от левой стены
    if (p.x - p.radius < fieldLeft) {
      p.x = fieldLeft + p.radius;
      p.vx = abs(p.vx);
    }
    // Отскок от правой стены
    if (p.x + p.radius > fieldRight) {
      p.x = fieldRight - p.radius;
      p.vx = -abs(p.vx);
    }
    // Отскок от верхней стены
    if (p.y - p.radius < fieldTop) {
      p.y = fieldTop + p.radius;
      p.vy = abs(p.vy);
    }
    // Отскок от нижней стены
    if (p.y + p.radius > fieldBottom) {
      p.y = fieldBottom - p.radius;
      p.vy = -abs(p.vy);
    }
  }
}

function drawBackgroundPointsAndLines() {
  strokeWeight(1);
  // Отрисовка линий между близкими частицами
  for (let i = 0; i < backgroundPoints.length; i++) {
    for (let j = i + 1; j < backgroundPoints.length; j++) {
      let p1 = backgroundPoints[i];
      let p2 = backgroundPoints[j];
      let d = dist(p1.x, p1.y, p2.x, p2.y);
      if (d < maxLineDist) {
        // Толщина линии зависит от расстояния
        let lineWeight = map(d, 0, maxLineDist, 2, 0.3);
        let c1 = p1.color;
        let c2 = p2.color;
        // Средний цвет для линии
        stroke((c1[0]+c2[0])/2, (c1[1]+c2[1])/2, (c1[2]+c2[2])/2, 40);
        strokeWeight(lineWeight);
        line(p1.x, p1.y, p2.x, p2.y);
      }
    }
  }
  // Отрисовка самих частиц
  noStroke();
  for (let p of backgroundPoints) {
    fill(p.color[0], p.color[1], p.color[2], 180);
    ellipse(p.x, p.y, p.radius * 2);
  }
}

function draw() {
  push();
  let scaleX = width / LOGIC_W;
  let scaleY = height / LOGIC_H;
  let scaleFactor = min(scaleX, scaleY);
  let offsetX = (width - LOGIC_W * scaleFactor) / 2;
  let offsetY = (height - LOGIC_H * scaleFactor) / 2;
  translate(offsetX, offsetY);
  scale(scaleFactor);
  
  background(20, 20, 40);

  // Обновление таймеров
  if (!gameOver && freezeTimer > 0) {
    if (millis() - freezeTimer >= 1000) {
      releasePuckAfterFreeze();
    }
  }

  if (!gameOver && countdownTimer > 0 && countdown > 0) {
    let elapsed = millis() - countdownTimer;
    if (elapsed >= 1000) {
      countdown--;
      countdownTimer = millis();
      if (countdown === 0) {
        startGameplay();
      }
    }
  }

  // Обновление игроков и шайбы
  if (!gameOver) {
    movePlayer(leftPlayer);
    movePlayer(rightPlayer);
    if (gameActive) {
      updatePuck();
    }
  }
  
  updateBackgroundPoints();
  
  drawField();
  drawGlowBorders();
  drawBackgroundPointsAndLines();
  drawGoals();
  drawPuck();
  drawPlayer(leftPlayer);
  drawPlayer(rightPlayer);
  drawScore();
  drawFullscreenButton();
  
  if (gameOver) {
    drawGameOver();
  } else if (countdownTimer > 0 && countdown > 0 && !gameActive) {
    // показывать цифры отсчёта только в начале, без затемнения
    drawCountdown();
  }
  
  pop();
}

function movePlayer(player) {
  let dx = player.targetX - player.x;
  let dy = player.targetY - player.y;
  let dist = sqrt(dx*dx+dy*dy);
  if (dist > 1) {
    let speed = playerSpeed;
    if (dist < speed) {
      player.x = player.targetX;
      player.y = player.targetY;
    } else {
      player.x += dx/dist * speed;
      player.y += dy/dist * speed;
    }
  }
  if (player.side === 'left') {
    player.x = constrain(player.x, fieldLeft, LOGIC_W/2 - playerRadius);
  } else {
    player.x = constrain(player.x, LOGIC_W/2 + playerRadius, fieldRight);
  }
  player.y = constrain(player.y, fieldTop + playerRadius, fieldBottom - playerRadius);
}

function updatePuck() {
  let currentSpeed = puckBaseSpeed * puckSpeedMultiplier;
  let speedMag = sqrt(puck.vx*puck.vx + puck.vy*puck.vy);
  if (speedMag > 0) {
    let nvx = puck.vx / speedMag;
    let nvy = puck.vy / speedMag;
    puck.vx = nvx * currentSpeed;
    puck.vy = nvy * currentSpeed;
  }
  puck.x += puck.vx;
  puck.y += puck.vy;

  // Отскок от верхней стены
  if (puck.y - puckRadius < fieldTop) {
    puck.y = fieldTop + puckRadius;
    puck.vy = abs(puck.vy);
  }
  // Отскок от нижней стены
  if (puck.y + puckRadius > fieldBottom) {
    puck.y = fieldBottom - puckRadius;
    puck.vy = -abs(puck.vy);
  }

  // Голы (шайба в ворота)
  if (puck.x - puckRadius <= fieldLeft && puck.y > goalTop && puck.y < goalBottom) {
    handleGoal('right');
    return;
  }
  if (puck.x + puckRadius >= fieldRight && puck.y > goalTop && puck.y < goalBottom) {
    handleGoal('left');
    return;
  }

  // Левая/правая стены (не ворота)
  if (puck.x - puckRadius < fieldLeft && !(puck.y > goalTop && puck.y < goalBottom)) {
    puck.x = fieldLeft + puckRadius;
    puck.vx = abs(puck.vx);
  }
  if (puck.x + puckRadius > fieldRight && !(puck.y > goalTop && puck.y < goalBottom)) {
    puck.x = fieldRight - puckRadius;
    puck.vx = -abs(puck.vx);
  }

  checkPlayerCollision(leftPlayer);
  checkPlayerCollision(rightPlayer);
}

function checkPlayerCollision(player) {
  let dx = puck.x - player.x;
  let dy = puck.y - player.y;
  let dist = sqrt(dx*dx+dy*dy);
  let minDist = playerRadius + puckRadius;
  if (dist < minDist && dist > 0) {
    let overlap = minDist - dist;
    let nx = dx/dist;
    let ny = dy/dist;
    puck.x += nx*overlap;
    puck.y += ny*overlap;
    let dot = puck.vx*nx + puck.vy*ny;
    let pdx = player.targetX - player.x;
    let pdy = player.targetY - player.y;
    let playerMoving = sqrt(pdx*pdx+pdy*pdy) > 1;
    if (dot < 0) {
      puck.vx -= 2*dot*nx;
      puck.vy -= 2*dot*ny;
    }
    if (playerMoving) {
      let spd = sqrt(pdx*pdx+pdy*pdy);
      puck.vx += pdx / max(spd,1) * 2;
      puck.vy += pdy / max(spd,1) * 2;
    }
    let newSpeed = sqrt(puck.vx*puck.vx + puck.vy*puck.vy);
    let minS = puckBaseSpeed * puckSpeedMultiplier * 0.7;
    if (newSpeed < minS) {
      puck.vx = puck.vx/newSpeed * minS;
      puck.vy = puck.vy/newSpeed * minS;
    }
  }
}

function mousePressed() {
  let scaleX = width / LOGIC_W;
  let scaleY = height / LOGIC_H;
  let scaleFactor = min(scaleX, scaleY);
  let offsetX = (width - LOGIC_W * scaleFactor) / 2;
  let offsetY = (height - LOGIC_H * scaleFactor) / 2;
  let logicalX = (mouseX - offsetX) / scaleFactor;
  let logicalY = (mouseY - offsetY) / scaleFactor;

  // Кнопка полноэкранного режима
  if (logicalX >= buttonRect.x && logicalX <= buttonRect.x + buttonRect.w &&
      logicalY >= buttonRect.y && logicalY <= buttonRect.y + buttonRect.h) {
    toggleFullscreen();
    return;
  }

  if (logicalX < 0 || logicalX > LOGIC_W || logicalY < 0 || logicalY > LOGIC_H) return;

  if (gameOver) {
    // Сброс всей игры
    leftScore = 0;
    rightScore = 0;
    gameOver = false;
    winner = '';
    startInitialCountdown();
    leftPlayer.targetX = fieldLeft;
    leftPlayer.targetY = LOGIC_H/2;
    rightPlayer.targetX = fieldRight;
    rightPlayer.targetY = LOGIC_H/2;
    return;
  }

  // Запретить перемещение игроков во время отсчёта или паузы
  if (!gameActive && (countdownTimer > 0 || freezeTimer > 0)) return;

  if (logicalX < LOGIC_W/2) {
    leftPlayer.targetX = constrain(logicalX, fieldLeft, LOGIC_W/2 - playerRadius);
    leftPlayer.targetY = constrain(logicalY, fieldTop + playerRadius, fieldBottom - playerRadius);
  } else {
    rightPlayer.targetX = constrain(logicalX, LOGIC_W/2 + playerRadius, fieldRight);
    rightPlayer.targetY = constrain(logicalY, fieldTop + playerRadius, fieldBottom - playerRadius);
  }
}

function toggleFullscreen() {
  let fs = fullscreen();
  fullscreen(!fs);
  if (!fs) {
    resizeCanvas(windowWidth, windowHeight);
  } else {
    resizeCanvas(LOGIC_W, LOGIC_H);
  }
}

function keyPressed() {
  if (key === 'f' || key === 'F') {
    toggleFullscreen();
  }
}

function windowResized() {
  if (!fullscreen()) {
    resizeCanvas(LOGIC_W, LOGIC_H);
  } else {
    resizeCanvas(windowWidth, windowHeight);
  }
}

// ---- функции отрисовки ----
function drawField() {
  noStroke();
  fill(15,25,50);
  rect(fieldLeft, fieldTop, fieldRight-fieldLeft, fieldBottom-fieldTop, 8);
  for (let i=0;i<5;i++) {
    let alpha = map(i,0,4,30,5);
    fill(30,50,80,alpha);
    rect(fieldLeft+i*2, fieldTop+i*2, fieldRight-fieldLeft-i*4, fieldBottom-fieldTop-i*4, 8-i*0.5);
  }
  stroke(60,100,160,100);
  strokeWeight(2);
  drawingContext.setLineDash([8,8]);
  line(LOGIC_W/2, fieldTop, LOGIC_W/2, fieldBottom);
  drawingContext.setLineDash([]);
  noFill();
  stroke(60,100,160,80);
  strokeWeight(2);
  ellipse(LOGIC_W/2, LOGIC_H/2, 100, 100);
}

function drawGlowBorders() {
  noFill();
  for (let i=6;i>0;i--) {
    let alpha = map(i,0,6,30,150);
    strokeWeight(i*2);
    stroke(100,180,255,alpha);
    line(fieldLeft,fieldTop,fieldRight,fieldTop);
    line(fieldLeft,fieldBottom,fieldRight,fieldBottom);
    line(fieldLeft,fieldTop,fieldLeft,goalTop);
    line(fieldLeft,goalBottom,fieldLeft,fieldBottom);
    line(fieldRight,fieldTop,fieldRight,goalTop);
    line(fieldRight,goalBottom,fieldRight,fieldBottom);
  }
  strokeWeight(3);
  stroke(100,200,255,200);
  line(fieldLeft,fieldTop,fieldRight,fieldTop);
  line(fieldLeft,fieldBottom,fieldRight,fieldBottom);
  line(fieldLeft,fieldTop,fieldLeft,goalTop);
  line(fieldLeft,goalBottom,fieldLeft,fieldBottom);
  line(fieldRight,fieldTop,fieldRight,goalTop);
  line(fieldRight,goalBottom,fieldRight,fieldBottom);
}

function drawGoals() {
  for (let i=7;i>0;i--) {
    let alpha = map(i,0,7,30,180);
    noFill();
    strokeWeight(i);
    stroke(255,80,80,alpha);
    rect(fieldLeft-3, goalTop, 6, goalHeight);
    rect(fieldRight-3, goalTop, 6, goalHeight);
  }
  fill(40,10,10,100);
  noStroke();
  rect(fieldLeft-15, goalTop, 15, goalHeight);
  rect(fieldRight, goalTop, 15, goalHeight);
  stroke(60,20,20,80);
  strokeWeight(1);
  for (let y=goalTop; y<=goalBottom; y+=15) {
    line(fieldLeft-15, y, fieldLeft, y);
    line(fieldRight, y, fieldRight+15, y);
  }
  for (let x=fieldLeft-15; x<=fieldLeft; x+=8) {
    line(x, goalTop, x, goalBottom);
  }
  for (let x=fieldRight; x<=fieldRight+15; x+=8) {
    line(x, goalTop, x, goalBottom);
  }
}

function drawPlayer(player) {
  for (let i=3;i>0;i--) {
    let alpha = map(i,0,3,80,255);
    let r = playerRadius - i*3;
    fill(player.color[0], player.color[1], player.color[2], alpha);
    noStroke();
    ellipse(player.x, player.y, r*2);
  }
  fill(player.color[0], player.color[1], player.color[2]);
  noStroke();
  ellipse(player.x, player.y, playerRadius*2);
  fill(255,255,255,120);
  ellipse(player.x - playerRadius*0.25, player.y - playerRadius*0.3,
          playerRadius*0.7, playerRadius*0.5);
}

function drawPuck() {
  for (let i=2;i>0;i--) {
    let alpha = map(i,0,2,15,40);
    let r = puckRadius + i*3;
    fill(180,210,255,alpha);
    noStroke();
    ellipse(puck.x, puck.y, r*2);
  }
  fill(220,240,255);
  noStroke();
  ellipse(puck.x, puck.y, puckRadius*2);
  fill(255,255,255,200);
  ellipse(puck.x - puckRadius*0.2, puck.y - puckRadius*0.25,
          puckRadius*0.8, puckRadius*0.6);
}

function drawScore() {
  fill(0,0,0,150);
  noStroke();
  rect(LOGIC_W/2-100, 5, 200, 45, 10);
  textAlign(CENTER,CENTER);
  textSize(28);
  textStyle(BOLD);
  fill(80,140,255);
  text(leftScore, LOGIC_W/2-40, 27);
  fill(200,200,200);
  text('—', LOGIC_W/2, 27);
  fill(255,100,100);
  text(rightScore, LOGIC_W/2+40, 27);
  for (let i=0;i<maxScore;i++) {
    let dotX1 = LOGIC_W/2-65 + i*15;
    let dotX2 = LOGIC_W/2+15 + i*15;
    if (i<leftScore) fill(80,140,255,200);
    else fill(60,60,80,100);
    ellipse(dotX1, 40, 6, 6);
    if (i<rightScore) fill(255,100,100,200);
    else fill(60,60,80,100);
    ellipse(dotX2, 40, 6, 6);
  }
}

function drawFullscreenButton() {
  let fs = fullscreen();
  let buttonText = fs ? "Оконный" : "Во весь экран";
  fill(40, 40, 60, 220);
  stroke(100, 180, 255, 200);
  strokeWeight(1.5);
  rect(buttonRect.x, buttonRect.y, buttonRect.w, buttonRect.h, 5);
  fill(200, 220, 255);
  textSize(14);
  textAlign(CENTER, CENTER);
  noStroke();
  text(buttonText, buttonRect.x + buttonRect.w/2, buttonRect.y + buttonRect.h/2);
  fill(150, 150, 180, 180);
  textSize(10);
  text("(F)", buttonRect.x + buttonRect.w/2, buttonRect.y + buttonRect.h + 10);
}

function drawCountdown() {
  // без затемнения фона, просто большие цифры
  textAlign(CENTER, CENTER);
  textSize(250);
  fill(0, 255, 0, 255);
  text(countdown, LOGIC_W/2, LOGIC_H/2);
}

function drawGameOver() {
  fill(0,0,0,50);
  rect(0,0,LOGIC_W,LOGIC_H);
  textAlign(CENTER,CENTER);
  textSize(48);
  textStyle(BOLD);
  let winColor = winner==='Blue' ? [80,140,255] : [255,100,100];
  let winnerText = winner==='Blue' ? 'Синий' : 'Красный';
  for (let i=4;i>0;i--) {
    fill(winColor[0], winColor[1], winColor[2], 30+i*15);
    textSize(48+i*3);
    text(winnerText+' побеждает!', LOGIC_W/2, LOGIC_H/2-20);
  }
  fill(winColor[0], winColor[1], winColor[2]);
  textSize(48);
  text(winnerText+' побеждает!', LOGIC_W/2, LOGIC_H/2-20);
  fill(255,255,255,200);
  textSize(18);
  textStyle(NORMAL);
  text('Нажмите в любом месте, чтобы играть снова', LOGIC_W/2, LOGIC_H/2+40);
}