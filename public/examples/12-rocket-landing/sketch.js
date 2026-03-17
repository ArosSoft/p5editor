// ========== ПЛАНЕТЫ ==========
const PLANETS = {
    moon: {
      name: 'ЛУНА',
      emoji: '🌙',
      gravity: 0.022,
      thrustPower: 0.10,
      windMax: 0,
      windKmhMax: 0,
      windEffect: 0,
      fuelMax: 250,
      safeLandingSpeed: 4.5,
      safeLandingAngle: 0.55,
      hardLandingSpeed: 3.0,
      perfectLandingSpeed: 1.2,
      atmosphere: false,
      skyTop: [3, 3, 12],
      skyBottom: [8, 8, 20],
      terrainColor: [120, 120, 115],
      terrainStroke: [160, 155, 145],
      terrainDetail: [140, 135, 125],
      surfaceNoise: 0.7,
      cloudCount: 0,
      starBrightness: 1.8,
      description: 'Нет атмосферы, слабая гравитация',
      bgObjects: 'earth'
    },
    mars: {
      name: 'МАРС',
      emoji: '🔴',
      gravity: 0.032,
      thrustPower: 0.11,
      windMax: 0.0015,
      windKmhMax: 15,
      windEffect: 0.06,
      fuelMax: 300,
      safeLandingSpeed: 4.5,
      safeLandingAngle: 0.50,
      hardLandingSpeed: 3.0,
      perfectLandingSpeed: 1.2,
      atmosphere: true,
      skyTop: [35, 12, 8],
      skyBottom: [70, 35, 20],
      terrainColor: [140, 60, 30],
      terrainStroke: [170, 80, 40],
      terrainDetail: [160, 70, 35],
      surfaceNoise: 0.6,
      cloudCount: 3,
      starBrightness: 0.5,
      description: 'Тонкая атмосфера, лёгкий ветер',
      bgObjects: 'phobos'
    },
    venus: {
      name: 'ВЕНЕРА',
      emoji: '🟡',
      gravity: 0.065,
      thrustPower: 0.16,
      windMax: 0.0015,
      windKmhMax: 18,
      windEffect: 0.07,
      fuelMax: 400,
      safeLandingSpeed: 5.0,
      safeLandingAngle: 0.50,
      hardLandingSpeed: 3.5,
      perfectLandingSpeed: 1.5,
      atmosphere: true,
      skyTop: [50, 40, 8],
      skyBottom: [100, 75, 18],
      terrainColor: [100, 80, 30],
      terrainStroke: [130, 100, 40],
      terrainDetail: [110, 90, 35],
      surfaceNoise: 0.4,
      cloudCount: 7,
      starBrightness: 0.08,
      description: 'Плотная атмосфера, сильная гравитация',
      bgObjects: 'haze'
    },
    earth: {
      name: 'ЗЕМЛЯ',
      emoji: '🌍',
      gravity: 0.035,
      thrustPower: 0.11,
      windMax: 0.0015,
      windKmhMax: 15,
      windEffect: 0.06,
      fuelMax: 300,
      safeLandingSpeed: 4.5,
      safeLandingAngle: 0.50,
      hardLandingSpeed: 3.0,
      perfectLandingSpeed: 1.2,
      atmosphere: true,
      skyTop: [5, 5, 30],
      skyBottom: [25, 18, 55],
      terrainColor: [40, 35, 30],
      terrainStroke: [70, 60, 50],
      terrainDetail: [50, 45, 35],
      surfaceNoise: 0.6,
      cloudCount: 5,
      starBrightness: 0.9,
      description: 'Стандартные условия',
      bgObjects: 'none'
    }
  };
  
  // ========== ГЛОБАЛЬНЫЕ ==========
  const ROTATION_SPEED = 0.04;
  const WIND_CHANGE_LIMIT = 0.02;
  
  let currentPlanet = null;
  let P = null;
  
  let rocket, stars = [],
    particles = [],
    dustParticles = [],
    windLines = [];
  let heatParticles = [],
    rcsParticles = [];
  let terrain = [],
    landingPad;
  let gameState = 'menu';
  let shakeAmount = 0;
  let explosionParticles = [];
  let wind = 0,
    clouds = [],
    camera_y = 0;
  let landingRating = '',
    legSquish = 0;
  let windMinuteStart = 0,
    windMinuteStartFrame = 0;
  
  let autopilotOn = false;
  let autopilotPhase = 'IDLE';
  let autopilotDebug = [];
  let autopilotRequested = false;
  
  let testResults = null,
    showTestPanel = false;
  let menuHover = null;
  let engineGlow = 0;
  let trailPoints = [];
  
  function setup() {
    createCanvas(800, 600);
    textFont('monospace');
  }
  
  function draw() {
    if (gameState === 'menu') {
      drawPlanetMenu();
      return;
    }
    drawGame();
  }
  
  // ========== МЕНЮ ==========
  function drawPlanetMenu() {
    drawMenuBg();
    textAlign(CENTER, CENTER);
    noStroke();
    let pulse = sin(frameCount * 0.03) * 4;
    textSize(36);
    fill(255);
    text('🚀 ПОСАДКА НА ПЛАНЕТЫ', width / 2, 55 + pulse);
    textSize(13);
    fill(140, 170, 210);
    text('Выберите планету для посадки', width / 2, 90);
  
    let keys = Object.keys(PLANETS);
    let cardW = 170,
      cardH = 260,
      gap = 12;
    let totalW = keys.length * cardW + (keys.length - 1) * gap;
    let startX = (width - totalW) / 2;
    let cardY = 120;
    menuHover = null;
  
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i],
        pl = PLANETS[key];
      let cx = startX + i * (cardW + gap);
      let hov = mouseX > cx && mouseX < cx + cardW && mouseY > cardY && mouseY <
        cardY + cardH;
      if (hov) menuHover = key;
      let anim = hov ? sin(frameCount * 0.1) * 3 : 0;
      let cy = cardY - anim;
  
      fill(0, 0, 0, 50);
      noStroke();
      rect(cx + 3, cy + 3, cardW, cardH, 12);
      if (hov) {
        fill(35, 42, 60, 245);
        stroke(90, 140, 255);
        strokeWeight(2);
      } else {
        fill(22, 28, 42, 225);
        stroke(55, 65, 85);
        strokeWeight(1);
      }
      rect(cx, cy, cardW, cardH, 12);
  
      let py2 = cy + 55;
      if (hov) {
        fill(pl.skyBottom[0], pl.skyBottom[1], pl.skyBottom[2], 25);
        noStroke();
        ellipse(cx + cardW / 2, py2, 80, 80);
      }
      drawPlanetIcon(cx + cardW / 2, py2, 30, key);
  
      textSize(16);
      fill(hov ? color(100, 200, 255) : color(200, 210, 230));
      noStroke();
      text(pl.name, cx + cardW / 2, cy + 100);
  
      textSize(9);
      fill(150, 160, 180);
      let yy = cy + 122;
      let gStr = pl.gravity < 0.025 ? 'Слабая' : pl.gravity < 0.04 ? 'Средняя' :
        pl.gravity < 0.06 ? 'Сильная' : 'Очень сильная';
      text(`Гравитация: ${gStr}`, cx + cardW / 2, yy);
      yy += 15;
      text(pl.windMax > 0 ? `Ветер: до ${pl.windKmhMax} км/ч` : 'Ветер: нет', cx +
        cardW / 2, yy);
      yy += 15;
      text(`Топливо: ${pl.fuelMax}`, cx + cardW / 2, yy);
      yy += 15;
      text(`Макс.скор: ${pl.safeLandingSpeed} м/с`, cx + cardW / 2, yy);
      yy += 18;
  
      textSize(8);
      fill(110, 130, 160);
      text(pl.description, cx + cardW / 2, yy);
      yy += 16;
  
      let diff = getDifficulty(key);
      let dC = [color(0, 255, 100), color(100, 255, 0), color(255, 255, 0), color(
        255, 150, 0), color(255, 50, 50)];
      let dL = ['Легко', 'Просто', 'Средне', 'Сложно', 'Хардкор'];
      fill(dC[diff]);
      textSize(10);
      text(dL[diff], cx + cardW / 2, yy);
      yy += 12;
      fill(30);
      noStroke();
      rect(cx + 25, yy, cardW - 50, 4, 2);
      fill(dC[diff]);
      rect(cx + 25, yy, (cardW - 50) * (diff + 1) / 5, 4, 2);
    }
    textSize(11);
    fill(90, 110, 140);
    textAlign(CENTER);
    text('Кликните или нажмите 1-4', width / 2, height - 50);
  }
  
  function drawMenuBg() {
    for (let y = 0; y < height; y++) {
      let t = y / height;
      stroke(lerp(4, 12, t), lerp(4, 8, t), lerp(25, 35, t));
      line(0, y, width, y);
    }
    randomSeed(42);
    noStroke();
    for (let i = 0; i < 120; i++) {
      let sx = random(width),
        sy = random(height);
      fill(255, 255, 220, random(80, 220) * (0.7 + 0.3 * sin(frameCount * 0.02 +
        i)));
      ellipse(sx, sy, random(0.5, 2.2));
    }
    randomSeed(frameCount + millis());
  }
  
  function drawPlanetIcon(x, y, r, key) {
    noStroke();
    if (key === 'moon') {
      fill(180, 180, 175);
      ellipse(x, y, r * 2);
      fill(148, 148, 142, 90);
      ellipse(x - 7, y - 4, 11, 9);
      ellipse(x + 9, y + 7, 7, 6);
    } else if (key === 'mars') {
      fill(175, 75, 38);
      ellipse(x, y, r * 2);
      fill(195, 95, 48, 70);
      ellipse(x - 4, y + 3, 18, 13);
    } else if (key === 'venus') {
      fill(195, 175, 75);
      ellipse(x, y, r * 2);
      fill(215, 195, 95, 50);
      ellipse(x, y - 4, r * 2.1, 10);
      ellipse(x, y + 4, r * 2, 8);
    } else {
      fill(28, 75, 175);
      ellipse(x, y, r * 2);
      fill(38, 135, 55);
      ellipse(x - 7, y - 2, 16, 13);
      ellipse(x + 5, y + 7, 12, 9);
      fill(255, 255, 255, 50);
      ellipse(x + 4, y - 10, 14, 5);
    }
    fill(255, 255, 255, 25);
    ellipse(x - r * 0.3, y - r * 0.3, r * 0.7, r * 0.5);
  }
  
  function getDifficulty(key) {
    let pl = PLANETS[key];
    let s = pl.gravity / 0.018 + pl.windMax / 0.001 - pl.safeLandingSpeed / 2.5 -
      pl.fuelMax / 220 + pl.windEffect * 3;
    if (s < 2) return 0;
    if (s < 3.5) return 1;
    if (s < 5) return 2;
    if (s < 7) return 3;
    return 4;
  }
  
  // ========== ИНИЦИАЛИЗАЦИЯ ==========
  function selectPlanet(key) {
    currentPlanet = key;
    P = PLANETS[key];
    initGame();
  }
  
  function initGame() {
    rocket = {
      x: random(150, width - 150),
      y: 80,
      vx: random(-0.2, 0.2),
      vy: 0,
      angle: 0,
      angularVel: 0,
      fuel: P.fuelMax,
      fuelMax: P.fuelMax,
      thrusting: false,
      thrustingLeft: false,
      thrustingRight: false,
      width: 20,
      height: 50
    };
  
    stars = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: random(width),
        y: random(height * 3),
        size: random(0.4, 2.2) * P.starBrightness,
        brightness: random(140, 255),
        twinkle: random(TWO_PI)
      });
    }
  
    clouds = [];
    for (let i = 0; i < P.cloudCount; i++) {
      clouds.push({
        x: random(width),
        y: random(80, 400),
        w: random(70, 190),
        h: random(18, 45),
        speed: random(-0.12, 0.12)
      });
    }
  
    generateTerrain();
  
    particles = [];
    dustParticles = [];
    explosionParticles = [];
    heatParticles = [];
    rcsParticles = [];
    windLines = [];
    if (P.windMax > 0)
      for (let i = 0; i < 18; i++) windLines.push(createWindLine());
  
    trailPoints = [];
    gameState = 'playing';
    shakeAmount = 0;
    wind = random(-P.windMax, P.windMax);
    windMinuteStart = wind;
    windMinuteStartFrame = frameCount;
  
    autopilotOn = autopilotRequested;
    autopilotPhase = 'IDLE';
    autopilotDebug = [];
    landingRating = '';
    legSquish = 0;
    camera_y = 0;
    showTestPanel = false;
    testResults = null;
    engineGlow = 0;
  }
  
  function generateTerrain() {
    terrain = [];
    let noiseOff = random(1000);
    let rawTerrain = [];
    let baseH = height - 80;
  
    for (let x = 0; x <= width; x += 4) {
      let tn = noise(x * 0.004 + noiseOff) * 100 * P.surfaceNoise + noise(x *
        0.018 + noiseOff) * 25 * P.surfaceNoise;
      rawTerrain.push({
        x: x,
        y: baseH - tn
      });
    }
  
    let padWidth = 100;
    let bestIdx = 0,
      bestFlatness = 99999;
    let margin = 8;
  
    for (let i = margin; i < rawTerrain.length - margin - Math.ceil(padWidth /
      4); i++) {
      let maxY = -9999,
        minY = 9999;
      let span = Math.ceil(padWidth / 4) + 2;
      for (let j = i - 1; j <= i + span + 1; j++) {
        if (j >= 0 && j < rawTerrain.length) {
          maxY = max(maxY, rawTerrain[j].y);
          minY = min(minY, rawTerrain[j].y);
        }
      }
      let flatness = maxY - minY;
      let centerDist = abs((rawTerrain[i].x + padWidth / 2) - width / 2);
      flatness += centerDist * 0.01;
      if (flatness < bestFlatness) {
        bestFlatness = flatness;
        bestIdx = i;
      }
    }
  
    let padCenterX = rawTerrain[bestIdx].x + padWidth / 2;
    let avgY = 0,
      cnt = 0;
    let span2 = Math.ceil(padWidth / 4) + 2;
    for (let j = bestIdx - 1; j <= bestIdx + span2 + 1; j++) {
      if (j >= 0 && j < rawTerrain.length) {
        avgY += rawTerrain[j].y;
        cnt++;
      }
    }
    avgY /= cnt;
  
    for (let i = 0; i < rawTerrain.length; i++) {
      let dist = abs(rawTerrain[i].x - padCenterX);
      let influence = max(0, 1 - dist / (padWidth / 2 + 60));
      influence = pow(influence, 1.5);
      rawTerrain[i].y = lerp(rawTerrain[i].y, avgY, influence);
    }
  
    terrain = rawTerrain;
    landingPad = {
      x: padCenterX - padWidth / 2,
      w: padWidth,
      y: avgY
    };
  }
  
  // ========== ИГРА ==========
  function drawGame() {
    let targetCamY = max(0, rocket.y - height / 3);
    camera_y = lerp(camera_y, targetCamY, 0.05);
  
    let sx = 0,
      sy = 0;
    if (shakeAmount > 0) {
      sx = random(-shakeAmount, shakeAmount);
      sy = random(-shakeAmount, shakeAmount);
      shakeAmount *= 0.9;
      if (shakeAmount < 0.2) shakeAmount = 0;
    }
  
    push();
    translate(sx, sy);
    drawBackground();
    push();
    translate(0, -camera_y);
    drawStars();
    drawBgObjects();
    drawClouds();
    if (P.windMax > 0) updateWindLines();
    drawTerrain();
    drawLandingPad();
    updateParticles();
    updateDustParticles();
    updateHeatParticles();
    updateRCSParticles();
    updateExplosionParticles();
    updateTrail();
    if (gameState !== 'crashed') drawRocket2();
    if (autopilotOn && gameState === 'playing') drawAutopilotOverlay();
    pop();
    drawHUD();
    drawAutopilotBtn();
    drawTestBtn();
    drawMenuBtn();
    if (showTestPanel && testResults) drawTestPanel();
    pop();
  
    if (autopilotOn && gameState === 'playing') {
      runAutopilot();
    }
  
    if (gameState === 'playing') {
      updatePhysics();
      checkCollision();
      if (P.atmosphere) spawnAmbientDust();
    }
    if (gameState === 'landed' && legSquish > 0) {
      legSquish *= 0.92;
      if (legSquish < 0.05) legSquish = 0;
    }
  
    for (let c of clouds) {
      c.x += c.speed + wind * 100;
      if (c.x > width + c.w) c.x = -c.w;
      if (c.x < -c.w) c.x = width + c.w;
    }
  }
  
  // ========== НОВЫЙ АВТОПИЛОТ ==========
  function runAutopilot() {
    if (gameState !== 'playing' || rocket.fuel <= 0) return;
  
    let r = rocket;
    let padCX = landingPad.x + landingPad.w / 2;
    let padY = landingPad.y;
    let rocketBottom = r.y + r.height / 2 + 12;
  
    // Основные параметры
    let alt = padY - rocketBottom; // Высота над площадкой
    let dX = padCX - r.x; // Расстояние до центра площадки
    let aDX = abs(dX); // Абсолютное расстояние
  
    // Физические константы
    let thrust = P.thrustPower;
    let gravity = P.gravity;
    let maxDecel = thrust -
    gravity; // Максимальное торможение при вертикальном положении
  
    autopilotDebug = [];
  
    // ===== ФАЗА 1: Определение режима =====
    let phase;
    if (alt < 3 && aDX < 8 && r.vy > 0 && r.vy < 1.5 && abs(r.angle) < 0.2) {
      phase = 'TOUCHDOWN';
    } else if (alt < 25 && aDX < 15) {
      phase = 'FINAL';
    } else if (aDX > 25) {
      phase = 'APPROACH';
    } else {
      phase = 'DESCENT';
    }
    autopilotPhase = phase;
  
    // ===== ФАЗА 2: Расчёт желаемых скоростей =====
    let targetVx = 0;
    let targetVy = 0;
  
    if (phase === 'APPROACH') {
      // Летим к площадке
      // Горизонтальная скорость пропорциональна расстоянию
      let maxHSpeed = min(3.0, sqrt(aDX * 0.08));
      targetVx = sign(dX) * maxHSpeed;
  
      // Вертикальная: поддерживаем высоту или слегка снижаемся
      if (alt > 150) {
        targetVy = 1.5; // Можно снижаться
      } else if (alt > 80) {
        targetVy = 0.5;
      } else {
        targetVy = -0.3; // Держим высоту или набираем
      }
    } else if (phase === 'DESCENT') {
      // Над площадкой - снижаемся
      targetVx = dX * 0.03; // Мягкая коррекция позиции
      targetVx = constrain(targetVx, -0.8, 0.8);
  
      // Безопасная скорость снижения
      let safeVy = sqrt(2 * maxDecel * max(alt, 1)) * 0.6;
      if (alt > 100) targetVy = min(2.5, safeVy);
      else if (alt > 50) targetVy = min(1.8, safeVy);
      else targetVy = min(1.2, safeVy);
    } else if (phase === 'FINAL') {
      // Финальный заход
      targetVx = dX * 0.02;
      targetVx = constrain(targetVx, -0.3, 0.3);
  
      // Очень медленное снижение
      if (alt > 15) targetVy = 0.8;
      else if (alt > 8) targetVy = 0.5;
      else targetVy = 0.3;
    } else {
      // TOUCHDOWN - касание
      targetVx = 0;
      targetVy = 0.2;
    }
  
    // ===== ФАЗА 3: Контроль угла (для горизонтальной скорости) =====
    let vxError = targetVx - r.vx;
  
    // Компенсация ветра
    let windCompensation = wind * P.windEffect * 25;
  
    // Целевой угол для достижения нужной Vx
    let targetAngle = -vxError * 0.4 - windCompensation;
  
    // Ограничение угла в зависимости от фазы
    let maxAngle;
    if (phase === 'APPROACH') maxAngle = 0.4;
    else if (phase === 'DESCENT') maxAngle = 0.25;
    else if (phase === 'FINAL') maxAngle = 0.12;
    else maxAngle = 0.05;
  
    targetAngle = constrain(targetAngle, -maxAngle, maxAngle);
  
    // Если ракета сильно наклонена - приоритет на выравнивание
    if (abs(r.angle) > 0.5) targetAngle = 0;
  
    // PD-контроллер угла
    let angleError = targetAngle - r.angle;
    let angleCorrection = angleError * 8.0 - r.angularVel * 15.0;
  
    // Применяем RCS
    r.thrustingLeft = angleCorrection < -0.01;
    r.thrustingRight = angleCorrection > 0.01;
  
    if (r.thrustingLeft) r.angularVel -= ROTATION_SPEED * 0.12;
    if (r.thrustingRight) r.angularVel += ROTATION_SPEED * 0.12;
  
    // ===== ФАЗА 4: Контроль тяги (для вертикальной скорости) =====
    let vyError = r.vy - targetVy; // Положительный = падаем слишком быстро
  
    // Базовая тяга для компенсации гравитации
    let cosAngle = cos(r.angle);
    if (cosAngle < 0.3) cosAngle = 0.3; // Защита от деления на малое число
  
    let hoverThrust = gravity / (thrust * cosAngle); // Тяга для зависания
  
    // Коррекция на основе ошибки скорости
    let thrustCorrection = vyError * 2.5;
  
    // Итоговая команда тяги
    let thrustCommand = hoverThrust + thrustCorrection;
  
    // Экстренное торможение если падаем слишком быстро
    let safeSpeed = sqrt(2 * maxDecel * max(alt, 1)) * 0.7;
    if (r.vy > safeSpeed && alt < 200) {
      thrustCommand = 1.0;
      autopilotDebug.push('⚠️ ТОРМОЖЕНИЕ');
    }
  
    // Если сильно наклонены - уменьшаем тягу (сначала выровняться)
    if (abs(r.angle) > 0.4) {
      thrustCommand *= 0.3;
      autopilotDebug.push('⚠️ СТАБИЛИЗАЦИЯ');
    }
  
    // Фаза касания - выключаем двигатель
    if (phase === 'TOUCHDOWN' && r.vy < 0.8 && r.vy > 0) {
      thrustCommand = 0;
    }
  
    // Не тормозить если летим вверх
    if (r.vy < -0.5 && alt > 30) {
      thrustCommand = 0;
    }
  
    // Применяем тягу
    r.thrusting = thrustCommand > 0.1 && r.fuel > 0;
  
    if (r.thrusting) {
      let actualThrust = thrust * min(thrustCommand, 1.0);
      r.vx += -sin(r.angle) * actualThrust;
      r.vy += -cos(r.angle) * actualThrust;
      r.fuel -= 0.5;
      spawnThrustParticles(r, actualThrust);
  
      // Пыль при низкой высоте
      if (alt < 50) {
        spawnDust(r.x, padY - 2, 1, r.vx);
      }
    }
  
    // RCS визуализация
    if (r.thrustingLeft || r.thrustingRight) {
      spawnRCS(r, r.thrustingLeft, r.thrustingRight);
    }
  
    // Отладочная информация
    autopilotDebug.push(`Фаза: ${phase}`);
    autopilotDebug.push(`Высота: ${alt.toFixed(1)}м`);
    autopilotDebug.push(`До центра: ${dX.toFixed(1)}м`);
    autopilotDebug.push(`Vy: ${r.vy.toFixed(2)} → ${targetVy.toFixed(2)}`);
    autopilotDebug.push(`Vx: ${r.vx.toFixed(2)} → ${targetVx.toFixed(2)}`);
    autopilotDebug.push(`Угол: ${degrees(r.angle).toFixed(1)}°`);
    autopilotDebug.push(`Топливо: ${(r.fuel/r.fuelMax*100).toFixed(0)}%`);
  }
  
  function sign(x) {
    return x > 0 ? 1 : x < 0 ? -1 : 0;
  }
  
  // ========== ФИЗИКА ==========
  function updatePhysics() {
    let r = rocket;
  
    if (!autopilotOn) {
      r.thrusting = false;
      r.thrustingLeft = false;
      r.thrustingRight = false;
  
      if (keyIsDown(UP_ARROW) || keyIsDown(87)) {
        if (r.fuel > 0) {
          r.vx += -sin(r.angle) * P.thrustPower;
          r.vy += -cos(r.angle) * P.thrustPower;
          r.fuel -= 0.5;
          r.thrusting = true;
          spawnThrustParticles(r, P.thrustPower);
          let gY = getTerrainHeightAt(r.x);
          if (gY - (r.y + r.height / 2 + 12) < 50) spawnDust(r.x, gY - 2, 2, r
          .vx);
        }
      }
      if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) r.angularVel -= ROTATION_SPEED *
        0.1;
      if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) r.angularVel +=
        ROTATION_SPEED * 0.1;
    }
  
    r.vy += P.gravity;
    r.vx += wind * P.windEffect;
    r.x += r.vx;
    r.y += r.vy;
    r.angle += r.angularVel;
    r.angularVel *= 0.96;
  
    if (r.x < 25) {
      r.x = 25;
      r.vx *= -0.3;
    }
    if (r.x > width - 25) {
      r.x = width - 25;
      r.vx *= -0.3;
    }
  
    updateWindLimited();
  
    if (frameCount % 3 === 0 && gameState === 'playing') {
      trailPoints.push({
        x: r.x,
        y: r.y,
        life: 60
      });
      if (trailPoints.length > 80) trailPoints.shift();
    }
  }
  
  function checkCollision() {
    let r = rocket;
    let bY = r.y + r.height / 2 + 12;
    let pad = landingPad;
  
    if (bY >= pad.y && r.x > pad.x && r.x < pad.x + pad.w) {
      let speed = sqrt(r.vx * r.vx + r.vy * r.vy);
      if (speed < P.safeLandingSpeed && abs(r.angle) < P.safeLandingAngle) {
        gameState = 'landed';
        if (speed < P.perfectLandingSpeed) {
          landingRating = 'ИДЕАЛЬНАЯ';
          shakeAmount = 0;
          legSquish = 0.1;
          spawnDust(r.x, pad.y - 2, 4, r.vx);
        } else if (speed < P.hardLandingSpeed) {
          landingRating = 'НОРМАЛЬНАЯ';
          shakeAmount = 2;
          legSquish = 0.4;
          spawnDust(r.x, pad.y - 2, 10, r.vx);
        } else {
          landingRating = 'ЖЁСТКАЯ';
          shakeAmount = 5;
          legSquish = 0.85;
          for (let i = 0; i < 12; i++) {
            particles.push({
              x: r.x + random(-12, 12),
              y: pad.y,
              vx: random(-2, 2),
              vy: random(-2, -0.5),
              life: random(10, 22),
              maxLife: 22,
              size: random(1, 3),
              type: 'spark'
            });
          }
          spawnDust(r.x, pad.y - 2, 18, r.vx);
        }
        r.y = pad.y - r.height / 2 - 12 + legSquish * 5;
        r.vx = 0;
        r.vy = 0;
        r.angle *= 0.3;
        r.angularVel = 0;
        r.thrusting = false;
      } else {
        crash();
      }
      return;
    }
  
    for (let i = 0; i < terrain.length - 1; i++) {
      let t1 = terrain[i],
        t2 = terrain[i + 1];
      if (r.x >= t1.x && r.x <= t2.x) {
        let tY = lerp(t1.y, t2.y, (r.x - t1.x) / (t2.x - t1.x));
        if (bY >= tY) {
          crash();
          return;
        }
      }
    }
  }
  
  function crash() {
    gameState = 'crashed';
    shakeAmount = 18;
    for (let i = 0; i < 100; i++) {
      let a = random(TWO_PI),
        sp = random(1, 9);
      explosionParticles.push({
        x: rocket.x,
        y: rocket.y,
        vx: cos(a) * sp,
        vy: sin(a) * sp - random(1, 4),
        life: random(40, 120),
        maxLife: 120,
        size: random(2, 9),
        color: random() > 0.4 ? color(255, random(80, 220), 0) : color(200,
          random(40, 100), 0),
        type: random() > 0.7 ? 'debris' : 'fire'
      });
    }
    for (let i = 0; i < 35; i++) {
      let a = random(TWO_PI),
        sp = random(0.4, 3);
      explosionParticles.push({
        x: rocket.x + random(-12, 12),
        y: rocket.y + random(-12, 12),
        vx: cos(a) * sp,
        vy: sin(a) * sp - random(0.5, 2),
        life: random(60, 160),
        maxLife: 160,
        size: random(5, 18),
        color: color(90, 90, 90),
        type: 'smoke'
      });
    }
    spawnDust(rocket.x, getTerrainHeightAt(rocket.x) - 2, 30, rocket.vx);
  }
  
  // ========== УТИЛИТЫ ==========
  function getTerrainHeightAt(px) {
    px = constrain(px, 0, width);
    for (let i = 0; i < terrain.length - 1; i++) {
      if (px >= terrain[i].x && px <= terrain[i + 1].x) {
        let t = (px - terrain[i].x) / (terrain[i + 1].x - terrain[i].x);
        return lerp(terrain[i].y, terrain[i + 1].y, t);
      }
    }
    return height;
  }
  
  function getWindKmh() {
    return P.windMax === 0 ? 0 : (wind / P.windMax) * P.windKmhMax;
  }
  
  function updateWindLimited() {
    if (P.windMax === 0) {
      wind = 0;
      return;
    }
    let fpm = 3600;
    if (frameCount - windMinuteStartFrame >= fpm) {
      windMinuteStart = wind;
      windMinuteStartFrame = frameCount;
    }
    wind += random(-0.0001, 0.0001);
    let ad = P.windMax * WIND_CHANGE_LIMIT;
    wind = constrain(wind, windMinuteStart - ad, windMinuteStart + ad);
    wind = constrain(wind, -P.windMax, P.windMax);
  }
  
  // ========== ЧАСТИЦЫ ==========
  function spawnThrustParticles(r, power) {
    let count = max(1, floor(power * 18));
    for (let i = 0; i < count; i++) {
      let px = r.x + sin(r.angle) * (r.height / 2);
      let py = r.y + cos(r.angle) * (r.height / 2);
      particles.push({
        x: px + random(-3, 3),
        y: py + random(-2, 2),
        vx: sin(r.angle) * random(1, 3) * power * 8 + random(-0.5, 0.5),
        vy: cos(r.angle) * random(1, 3) * power * 8 + random(-0.5, 0.5),
        life: random(15, 35),
        maxLife: 35,
        size: random(2, 5),
        type: 'thrust'
      });
    }
    if (random() < 0.3 * power) {
      let hx = r.x + sin(r.angle) * (r.height / 2 + 8);
      let hy = r.y + cos(r.angle) * (r.height / 2 + 8);
      heatParticles.push({
        x: hx + random(-5, 5),
        y: hy + random(-5, 5),
        vx: random(-0.3, 0.3),
        vy: random(-0.3, 0.1),
        life: random(8, 18),
        maxLife: 18,
        size: random(8, 20)
      });
    }
  }
  
  function spawnRCS(r, left, right) {
    if (frameCount % 2 !== 0) return;
    if (right) {
      let px = r.x + cos(r.angle) * (r.width / 2 + 2) - sin(r.angle) * (-r
        .height / 2 + 15);
      let py = r.y - sin(r.angle) * (r.width / 2 + 2) + cos(r.angle) * (-r
        .height / 2 + 15);
      rcsParticles.push({
        x: px,
        y: py,
        vx: cos(r.angle) * 1.5,
        vy: -sin(r.angle) * 1.5,
        life: 8,
        maxLife: 8,
        size: 3
      });
    }
    if (left) {
      let px = r.x - cos(r.angle) * (r.width / 2 + 2) - sin(r.angle) * (-r
        .height / 2 + 15);
      let py = r.y + sin(r.angle) * (r.width / 2 + 2) + cos(r.angle) * (-r
        .height / 2 + 15);
      rcsParticles.push({
        x: px,
        y: py,
        vx: -cos(r.angle) * 1.5,
        vy: sin(r.angle) * 1.5,
        life: 8,
        maxLife: 8,
        size: 3
      });
    }
  }
  
  function createWindLine() {
    return {
      x: random(width),
      y: random(camera_y, camera_y + height),
      len: random(18, 55),
      life: random(28, 75),
      speedMul: random(0.7, 1.7),
      alpha: random(18, 60)
    };
  }
  
  function updateWindLines() {
    let inten = P.windMax > 0 ? abs(wind) / P.windMax : 0;
    let wC = currentPlanet === 'venus' ? [215, 175, 95] : currentPlanet ===
      'mars' ? [195, 145, 115] : [175, 215, 250];
    for (let i = windLines.length - 1; i >= 0; i--) {
      let wl = windLines[i];
      wl.x += wind * 500 * wl.speedMul + (wind >= 0 ? 0.4 : -0.4);
      wl.life--;
      if (wl.x < -100 || wl.x > width + 100 || wl.life <= 0 || wl.y < camera_y -
        50 || wl.y > camera_y + height + 50) {
        windLines[i] = createWindLine();
        windLines[i].y = random(camera_y, camera_y + height);
        continue;
      }
      let a = wl.alpha * (0.3 + inten * 0.7);
      stroke(wC[0], wC[1], wC[2], a);
      strokeWeight(1);
      let dir = wind >= 0 ? 1 : -1;
      line(wl.x, wl.y, wl.x + wl.len * dir, wl.y);
    }
  }
  
  function spawnDust(x, y, amt, srcVx) {
    let c = P.terrainDetail;
    for (let i = 0; i < amt; i++) {
      dustParticles.push({
        x: x + random(-18, 18),
        y: y + random(-3, 3),
        vx: random(-0.5, 0.5) + wind * 180 + (srcVx || 0) * 0.2,
        vy: random(-1.1, -0.2),
        life: random(18, 45),
        maxLife: 45,
        size: random(4, 9),
        color: c
      });
    }
  }
  
  function updateDustParticles() {
    for (let i = dustParticles.length - 1; i >= 0; i--) {
      let p = dustParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.98;
      p.vy += 0.014;
      p.life--;
      p.size *= 1.01;
      let a = map(p.life, 0, p.maxLife, 0, 85);
      let c = p.color || [140, 120, 90];
      noStroke();
      fill(c[0], c[1], c[2], a);
      ellipse(p.x, p.y, p.size * 1.3, p.size);
      if (p.life <= 0) dustParticles.splice(i, 1);
    }
  }
  
  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      let p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02;
      p.life--;
      p.size *= 0.97;
      noStroke();
      let a = map(p.life, 0, p.maxLife, 0, 255);
      if (p.type === 'spark') fill(255, 255, 100, a);
      else {
        let t = 1 - p.life / p.maxLife;
        fill(255, lerp(200, 40, t), 0, a);
      }
      ellipse(p.x, p.y, p.size);
      if (p.life <= 0) particles.splice(i, 1);
    }
  }
  
  function updateHeatParticles() {
    for (let i = heatParticles.length - 1; i >= 0; i--) {
      let p = heatParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      p.size *= 1.03;
      let a = map(p.life, 0, p.maxLife, 0, 50);
      noStroke();
      fill(255, 200, 100, a);
      ellipse(p.x, p.y, p.size, p.size * 0.7);
      if (p.life <= 0) heatParticles.splice(i, 1);
    }
  }
  
  function updateRCSParticles() {
    for (let i = rcsParticles.length - 1; i >= 0; i--) {
      let p = rcsParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      p.size *= 0.92;
      let a = map(p.life, 0, p.maxLife, 0, 180);
      noStroke();
      fill(255, 255, 200, a);
      ellipse(p.x, p.y, p.size);
      if (p.life <= 0) rcsParticles.splice(i, 1);
    }
  }
  
  function updateExplosionParticles() {
    for (let i = explosionParticles.length - 1; i >= 0; i--) {
      let p = explosionParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.04;
      p.vx *= 0.99;
      p.life--;
      let a = map(p.life, 0, p.maxLife, 0, 255);
      noStroke();
      if (p.type === 'smoke') {
        p.size *= 1.01;
        fill(red(p.color), green(p.color), blue(p.color), a * 0.45);
      } else fill(red(p.color), green(p.color), blue(p.color), a);
      ellipse(p.x, p.y, p.size);
      if (p.life <= 0) explosionParticles.splice(i, 1);
    }
  }
  
  function updateTrail() {
    noStroke();
    for (let i = trailPoints.length - 1; i >= 0; i--) {
      let tp = trailPoints[i];
      tp.life--;
      if (tp.life <= 0) {
        trailPoints.splice(i, 1);
        continue;
      }
      let a = map(tp.life, 0, 60, 0, 30);
      fill(150, 200, 255, a);
      ellipse(tp.x, tp.y, 3, 3);
    }
  }
  
  function spawnAmbientDust() {
    if (P.windMax === 0) return;
    let ws = abs(wind) / P.windMax;
    if (ws < 0.3 || random() > 0.2 * ws) return;
    let x = random(width),
      gY = getTerrainHeightAt(x);
    dustParticles.push({
      x: x,
      y: gY - random(2, 7),
      vx: wind * 200 + random(-0.25, 0.25),
      vy: random(-0.35, -0.05),
      life: random(16, 30),
      maxLife: 30,
      size: random(3, 6),
      color: P.terrainDetail
    });
  }
  
  // ========== РИСОВАНИЕ ==========
  function drawBackground() {
    for (let y = 0; y < height; y++) {
      let wY = y + camera_y;
      let t = constrain(map(wY, 0, height, 0, 1), 0, 1);
      stroke(lerp(P.skyTop[0], P.skyBottom[0], t), lerp(P.skyTop[1], P.skyBottom[
        1], t), lerp(P.skyTop[2], P.skyBottom[2], t));
      line(0, y, width, y);
    }
  }
  
  function drawStars() {
    if (P.starBrightness <= 0) return;
    noStroke();
    for (let s of stars) {
      s.twinkle += 0.02;
      fill(255, 255, 220, s.brightness * (0.7 + 0.3 * sin(s.twinkle)) * P
        .starBrightness);
      ellipse(s.x, s.y, s.size);
    }
  }
  
  function drawBgObjects() {
    noStroke();
    if (P.bgObjects === 'earth') {
      let ex = width - 110,
        ey = 70;
      fill(25, 70, 170, 190);
      ellipse(ex, ey, 48, 48);
      fill(35, 130, 50, 140);
      ellipse(ex - 7, ey - 3, 16, 13);
      ellipse(ex + 5, ey + 7, 12, 9);
      fill(255, 255, 255, 35);
      ellipse(ex + 4, ey - 11, 15, 5);
    } else if (P.bgObjects === 'phobos') {
      fill(145, 125, 105, 170);
      ellipse(width - 95, 55, 14, 11);
    } else if (P.bgObjects === 'haze') {
      for (let y = 0; y < height; y += 25) {
        fill(170, 150, 75, 6 + sin((y + camera_y) * 0.01 + frameCount * 0.004) *
          4);
        rect(0, y, width, 25);
      }
    }
  }
  
  function drawClouds() {
    if (P.cloudCount <= 0) return;
    noStroke();
    let cA = currentPlanet === 'venus' ? 22 : currentPlanet === 'mars' ? 8 : 14;
    let cC = currentPlanet === 'venus' ? [215, 195, 115] : currentPlanet ===
      'mars' ? [195, 155, 125] : [255, 255, 255];
    for (let c of clouds) {
      fill(cC[0], cC[1], cC[2], cA);
      for (let i = 0; i < 5; i++) {
        ellipse(c.x + (i - 2) * c.w * 0.2, c.y + sin(i * 1.5) * c.h * 0.3, c.w *
          0.4 + sin(i) * 10, c.h * 0.6);
      }
    }
  }
  
  function drawTerrain() {
    fill(P.terrainColor[0], P.terrainColor[1], P.terrainColor[2]);
    stroke(P.terrainStroke[0], P.terrainStroke[1], P.terrainStroke[2]);
    strokeWeight(2);
    beginShape();
    for (let t of terrain) vertex(t.x, t.y);
    vertex(width, height + 200);
    vertex(0, height + 200);
    endShape(CLOSE);
    noStroke();
    for (let i = 0; i < terrain.length - 1; i += 2) {
      fill(P.terrainDetail[0], P.terrainDetail[1], P.terrainDetail[2], 90);
      ellipse(terrain[i].x, terrain[i].y + 4, 7, 3);
    }
  }
  
  function drawLandingPad() {
    let pad = landingPad;
    fill(75, 75, 85);
    stroke(115, 115, 125);
    strokeWeight(2);
    rect(pad.x, pad.y - 5, pad.w, 10, 3);
    stroke(195, 195, 45);
    strokeWeight(3);
    for (let i = 0; i <= 4; i++) {
      let sx = pad.x + 12 + (pad.w - 24) * i / 4;
      line(sx, pad.y - 3, sx, pad.y + 3);
    }
    noStroke();
    let blink = sin(frameCount * 0.1) > 0;
    fill(blink ? color(0, 255, 0) : color(0, 90, 0));
    ellipse(pad.x + 6, pad.y, 7, 7);
    ellipse(pad.x + pad.w - 6, pad.y, 7, 7);
    if (blink) {
      fill(0, 255, 0, 25);
      ellipse(pad.x + 6, pad.y, 22, 22);
      ellipse(pad.x + pad.w - 6, pad.y, 22, 22);
    }
    if (gameState === 'playing') {
      let aY = pad.y - 42 - sin(frameCount * 0.05) * 10;
      fill(255, 255, 0, 140);
      noStroke();
      triangle(pad.x + pad.w / 2 - 9, aY - 11, pad.x + pad.w / 2 + 9, aY - 11, pad
        .x + pad.w / 2, aY + 6);
    }
  }
  
  function drawRocket2() {
    let r = rocket;
    push();
    translate(r.x, r.y);
    rotate(r.angle);
    let w = r.width,
      h = r.height;
  
    if (r.thrusting && r.fuel > 0) engineGlow = lerp(engineGlow, 1, 0.2);
    else engineGlow = lerp(engineGlow, 0, 0.15);
  
    if (engineGlow > 0.05) {
      noStroke();
      fill(255, 130, 30, 30 * engineGlow);
      ellipse(0, h / 2 + 12, 50 * engineGlow, 70 * engineGlow);
    }
  
    fill(0, 0, 0, 20);
    noStroke();
    ellipse(2, 0, w + 4, h + 8);
    stroke(160, 162, 175);
    strokeWeight(1);
    for (let yy = -h / 2 + 15; yy < h / 2 - 5; yy += 2) {
      let t2 = map(yy, -h / 2 + 15, h / 2 - 5, 0, 1);
      let shade = lerp(235, 195, t2);
      fill(shade, shade, shade + 8);
      noStroke();
      let bw = w;
      if (yy < -h / 2 + 20) bw = map(yy, -h / 2 + 15, -h / 2 + 20, w * 0.5, w);
      rect(-bw / 2, yy, bw, 3);
    }
  
    stroke(155, 155, 168);
    strokeWeight(1);
    noFill();
    beginShape();
    vertex(-w / 2, h / 2 - 5);
    vertex(-w / 2, -h / 2 + 15);
    vertex(-w / 4, -h / 2 + 5);
    vertex(0, -h / 2);
    vertex(w / 4, -h / 2 + 5);
    vertex(w / 2, -h / 2 + 15);
    vertex(w / 2, h / 2 - 5);
    endShape(CLOSE);
  
    fill(200, 55, 55);
    noStroke();
    beginShape();
    vertex(-w / 4 + 1, -h / 2 + 6);
    vertex(0, -h / 2 + 1);
    vertex(w / 4 - 1, -h / 2 + 6);
    endShape(CLOSE);
    fill(22, 45, 145);
    noStroke();
    rect(-w / 2 + 2, -4, w - 4, 9, 1);
    fill(200, 55, 55, 120);
    rect(-w / 2 + 2, 8, w - 4, 3, 1);
  
    fill(110, 180, 255);
    stroke(80, 85, 105);
    strokeWeight(1);
    ellipse(0, -h / 2 + 18, 9, 9);
    fill(220, 240, 255, 180);
    noStroke();
    ellipse(-1.5, -h / 2 + 16.5, 3.5, 3);
    fill(100, 170, 245);
    stroke(75, 80, 100);
    strokeWeight(0.7);
    ellipse(0, -h / 2 + 28, 6, 6);
  
    fill(90, 90, 100);
    stroke(65, 65, 75);
    strokeWeight(1);
    beginShape();
    vertex(-w / 2, h / 2 - 5);
    vertex(-w / 2 - 4, h / 2 + 1);
    vertex(w / 2 + 4, h / 2 + 1);
    vertex(w / 2, h / 2 - 5);
    endShape(CLOSE);
  
    fill(190, 50, 50);
    stroke(145, 35, 35);
    strokeWeight(1);
    beginShape();
    vertex(-w / 2, h / 2 - 5);
    vertex(-w / 2 - 9, h / 2 + 6);
    vertex(-w / 2 - 6, h / 2 - 16);
    endShape(CLOSE);
    beginShape();
    vertex(w / 2, h / 2 - 5);
    vertex(w / 2 + 9, h / 2 + 6);
    vertex(w / 2 + 6, h / 2 - 16);
    endShape(CLOSE);
  
    fill(70, 70, 78);
    stroke(50, 50, 58);
    strokeWeight(1);
    rect(-5, h / 2 - 1, 10, 6, 1);
    fill(55, 55, 62);
    rect(-3, h / 2 + 2, 6, 3, 1);
  
    if (r.thrusting && r.fuel > 0) drawFlame(0, h / 2 + 5, 1.0);
  
    let sq = legSquish;
    let lLen = 13 - sq * 7,
      lSpr = 13 + sq * 5,
      fLen = 5 + sq * 2;
    stroke(115, 115, 125);
    strokeWeight(2);
    noFill();
    line(-w / 2, h / 2 - 3, -w / 2 - lSpr, h / 2 + lLen);
    line(-w / 2 - lSpr, h / 2 + lLen, -w / 2 - lSpr - fLen, h / 2 + lLen);
    line(w / 2, h / 2 - 3, w / 2 + lSpr, h / 2 + lLen);
    line(w / 2 + lSpr, h / 2 + lLen, w / 2 + lSpr + fLen, h / 2 + lLen);
  
    if (autopilotOn) {
      if (r.thrustingLeft) {
        noStroke();
        fill(255, 200, 50, 220);
        ellipse(w / 2 + 3, -h / 2 + 20, 5, 7);
        fill(255, 100, 0, 160);
        ellipse(w / 2 + 6, -h / 2 + 20, 8, 4);
      }
      if (r.thrustingRight) {
        noStroke();
        fill(255, 200, 50, 220);
        ellipse(-w / 2 - 3, -h / 2 + 20, 5, 7);
        fill(255, 100, 0, 160);
        ellipse(-w / 2 - 6, -h / 2 + 20, 8, 4);
      }
    }
    pop();
  }
  
  function drawFlame(fx, fy, power) {
    noStroke();
    let f = random(0.65, 1.35) * power;
    let fL = 22 * f,
      fW = 13 * f;
    fill(255, 90, 0, 180 * power);
    triangle(-fW / 2 + fx, fy, fx, fy + fL + random(-6, 6), fW / 2 + fx, fy);
    fill(255, 170, 0, 210 * power);
    triangle(-fW / 3 + fx, fy, fx, fy + fL * 0.7 + random(-4, 4), fW / 3 + fx,
    fy);
    fill(255, 250, 195, 240 * power);
    triangle(-fW / 5 + fx, fy, fx, fy + fL * 0.4 + random(-2, 2), fW / 5 + fx,
    fy);
  }
  
  function drawAutopilotOverlay() {
    let simX = rocket.x,
      simY = rocket.y,
      simVx = rocket.vx,
      simVy = rocket.vy;
    noFill();
    stroke(0, 255, 100, 50);
    strokeWeight(1);
    beginShape();
    for (let i = 0; i < 80; i++) {
      simVy += P.gravity;
      simX += simVx;
      simY += simVy;
      vertex(simX, simY);
      if (simY > landingPad.y) break;
    }
    endShape();
    stroke(255, 255, 0, 22);
    strokeWeight(1);
    line(rocket.x, rocket.y, landingPad.x + landingPad.w / 2, landingPad.y);
  }
  
  // ========== HUD ==========
  function drawHUD() {
    let r = rocket;
    let speed = sqrt(r.vx * r.vx + r.vy * r.vy);
    let altP = landingPad.y - (r.y + r.height / 2 + 12);
    let fuelPct = r.fuel / r.fuelMax;
  
    fill(0, 0, 0, 140);
    noStroke();
    rect(10, 10, 200, 16, 5);
    textFont('monospace');
    textSize(10);
    textAlign(LEFT);
    fill(P.skyBottom[0] + 90, P.skyBottom[1] + 90, P.skyBottom[2] + 90);
    text(`${P.emoji} ${P.name}`, 18, 22);
  
    fill(0, 0, 0, 140);
    rect(10, 30, 250, 122, 10);
    textSize(13);
    fill(0, 255, 0);
    text(`ВЫСОТА: ${max(0, altP).toFixed(1)} м`, 25, 52);
    text(`СКОРОСТЬ: ${speed.toFixed(2)} м/с`, 25, 72);
    text(`Vx: ${r.vx.toFixed(2)}  Vy: ${r.vy.toFixed(2)}`, 25, 92);
    text(`УГОЛ: ${degrees(r.angle).toFixed(1)}°`, 25, 112);
    text(`ТОПЛИВО:`, 25, 135);
    fill(45);
    rect(110, 123, 118, 14, 3);
    fill(fuelPct > 0.3 ? color(0, 195, 0) : fuelPct > 0.1 ? color(255, 195, 0) :
      color(255, 45, 0));
    rect(110, 123, 118 * fuelPct, 14, 3);
    fill(255, 255, 255, 180);
    textSize(9);
    textAlign(CENTER);
    text(`${(fuelPct * 100).toFixed(0)}%`, 169, 134);
    textAlign(LEFT);
  
    fill(0, 0, 0, 140);
    noStroke();
    rect(10, 157, 250, 22, 10);
    textSize(10);
    fill(95, 195, 250);
    text(
      `Допуск: < ${P.safeLandingSpeed} м/с | < ${degrees(P.safeLandingAngle).toFixed(0)}°`,
      25, 172);
  
    if (P.windMax > 0) drawWindIndicator(10, 185, 250, 45);
  
    fill(0, 0, 0, 140);
    noStroke();
    rect(width - 180, 10, 170, 88, 10);
    textSize(12);
    textAlign(LEFT);
    let sC = speed < P.perfectLandingSpeed ? color(0, 255, 200) : speed < P
      .hardLandingSpeed ? color(0, 255, 0) : speed < P.safeLandingSpeed ? color(
        255, 195, 0) : color(255, 45, 45);
    fill(sC);
    text(
      `Скорость: ${speed < P.safeLandingSpeed ? '✓' : '✗'} ${speed.toFixed(1)}`,
      width - 165, 33);
    textSize(9);
    if (speed < P.perfectLandingSpeed) {
      fill(0, 255, 200);
      text('идеально', width - 65, 46);
    } else if (speed < P.hardLandingSpeed) {
      fill(0, 255, 0);
      text('нормально', width - 65, 46);
    } else if (speed < P.safeLandingSpeed) {
      fill(255, 195, 0);
      text('жёстко', width - 65, 46);
    } else {
      fill(255, 45, 45);
      text('опасно!', width - 65, 46);
    }
  
    textSize(12);
    let aS = abs(r.angle) < P.safeLandingAngle;
    fill(aS ? color(0, 255, 0) : color(255, 45, 0));
    text(`Угол:     ${aS ? '✓' : '✗'} ${degrees(abs(r.angle)).toFixed(1)}°`,
      width - 165, 68);
  
    let bX = width - 165,
      bY = 78,
      bW = 150,
      bH = 9;
    fill(28);
    noStroke();
    rect(bX, bY, bW, bH, 3);
    let mxS = 7;
    fill(0, 195, 195, 90);
    rect(bX, bY, bW * P.perfectLandingSpeed / mxS, bH, 3, 0, 0, 3);
    fill(0, 195, 0, 90);
    rect(bX + bW * P.perfectLandingSpeed / mxS, bY, bW * (P.hardLandingSpeed - P
      .perfectLandingSpeed) / mxS, bH);
    fill(255, 195, 0, 90);
    rect(bX + bW * P.hardLandingSpeed / mxS, bY, bW * (P.safeLandingSpeed - P
      .hardLandingSpeed) / mxS, bH);
    fill(255, 45, 45, 90);
    rect(bX + bW * P.safeLandingSpeed / mxS, bY, bW * (1 - P.safeLandingSpeed /
      mxS), bH, 0, 3, 3, 0);
    let sPos = constrain(speed / mxS, 0, 1) * bW;
    fill(255);
    noStroke();
    triangle(bX + sPos - 3, bY, bX + sPos + 3, bY, bX + sPos, bY + bH);
  
    fill(0, 0, 0, 110);
    noStroke();
    rect(width / 2 - 200, height - 33, 400, 26, 8);
    fill(175);
    textSize(10);
    textAlign(CENTER);
    text(
      '↑/W — тяга  ←→/AD — вращение  P — автопилот  T — тест  M — меню  R — рестарт',
      width / 2, height - 16);
  
    if (gameState === 'landed') drawLandedScreen(speed, fuelPct);
    if (gameState === 'crashed') drawCrashedScreen();
    if (gameState === 'playing') drawDirIndicator();
  }
  
  function drawWindIndicator(x, y, w2, h2) {
    let wK = getWindKmh(),
      aW = abs(wK);
    fill(18, 22, 32, 195);
    stroke(55, 65, 85);
    strokeWeight(1);
    rect(x, y, w2, h2, 4);
    noStroke();
    fill(145, 175, 215);
    textSize(10);
    textAlign(LEFT, TOP);
    text('ВЕТЕР', x + 5, y + 3);
    let wC2 = aW < 8 ? color(95, 250, 145) : aW < 20 ? color(250, 215, 95) :
      color(250, 95, 95);
    fill(wC2);
    textSize(11);
    textAlign(RIGHT, TOP);
    let wD = wK > 0 ? '→' : wK < 0 ? '←' : '•';
    text(`${wD} ${aW.toFixed(1)} км/ч`, x + w2 - 5, y + 3);
    let bY2 = y + 18,
      bH2 = h2 - 24,
      bW2 = w2 - 10,
      bX2 = x + 5;
    fill(28, 32, 42);
    noStroke();
    rect(bX2, bY2, bW2, bH2, 3);
    let cX = bX2 + bW2 / 2;
    stroke(75, 85, 105);
    strokeWeight(1);
    line(cX, bY2 + 2, cX, bY2 + bH2 - 2);
    let wOff = (wind / P.windMax) * (bW2 / 2 - 4);
    let iX = cX + wOff;
    fill(wC2);
    noStroke();
    triangle(iX, bY2 + 2, iX - 4, bY2 + bH2 - 2, iX + 4, bY2 + bH2 - 2);
  }
  
  function drawLandedScreen(speed, fuelPct) {
    let bgC, tC, tT, em;
    if (landingRating === 'ИДЕАЛЬНАЯ') {
      bgC = color(0, 75, 55, 75);
      tC = color(0, 255, 200);
      em = '🏆';
      tT = 'ИДЕАЛЬНАЯ ПОСАДКА!';
    } else if (landingRating === 'НОРМАЛЬНАЯ') {
      bgC = color(0, 95, 0, 75);
      tC = color(0, 255, 100);
      em = '🎉';
      tT = 'ПОСАДКА УСПЕШНА!';
    } else {
      bgC = color(95, 75, 0, 75);
      tC = color(255, 195, 0);
      em = '⚠️';
      tT = 'ЖЁСТКАЯ ПОСАДКА!';
    }
    fill(bgC);
    rect(0, 0, width, height);
    fill(0, 0, 0, 175);
    rect(width / 2 - 190, height / 2 - 85, 380, 175, 15);
    textAlign(CENTER);
    textSize(26);
    fill(tC);
    text(`${em} ${tT}`, width / 2, height / 2 - 45);
    textSize(13);
    fill(145, 175, 215);
    text(`${P.emoji} ${P.name}`, width / 2, height / 2 - 20);
    textSize(14);
    fill(200);
    text(`Скорость: ${speed.toFixed(2)} м/с — ${landingRating}`, width / 2,
      height / 2 + 5);
    text(`Топливо: ${(fuelPct * 100).toFixed(0)}%`, width / 2, height / 2 + 25);
    textSize(22);
    let st2 = landingRating === 'ИДЕАЛЬНАЯ' ? '⭐⭐⭐' : landingRating ===
      'НОРМАЛЬНАЯ' ? '⭐⭐' : '⭐';
    fill(255, 255, 0);
    text(st2, width / 2, height / 2 + 52);
    if (autopilotOn) {
      textSize(11);
      fill(95, 195, 250);
      text('Автопилот', width / 2, height / 2 + 68);
    }
    textSize(12);
    fill(255, 255, 0);
    text('R — новый полёт | M — выбор планеты', width / 2, height / 2 + 85);
  }
  
  function drawCrashedScreen() {
    fill(95, 0, 0, 55);
    rect(0, 0, width, height);
    fill(0, 0, 0, 175);
    rect(width / 2 - 175, height / 2 - 60, 350, 120, 15);
    textAlign(CENTER);
    textSize(30);
    fill(255, 45, 45);
    text('💥 КРУШЕНИЕ!', width / 2, height / 2 - 18);
    textSize(12);
    fill(145, 175, 215);
    text(`${P.emoji} ${P.name}`, width / 2, height / 2 + 5);
    textSize(13);
    fill(200);
    text('Ракета не пережила посадку...', width / 2, height / 2 + 25);
    textSize(13);
    fill(255, 255, 0);
    text('R — новый полёт | M — выбор планеты', width / 2, height / 2 + 50);
  }
  
  function drawDirIndicator() {
    let pCX = landingPad.x + landingPad.w / 2;
    let dx = pCX - rocket.x,
      dy = landingPad.y - rocket.y;
    let dist = sqrt(dx * dx + dy * dy);
    if (dist <= 180) return;
    let ang = atan2(dy, dx);
    push();
    translate(width - 80, height - 105);
    fill(0, 0, 0, 110);
    ellipse(0, 0, 55, 55);
    stroke(255, 255, 0);
    strokeWeight(2);
    line(0, 0, cos(ang) * 18, sin(ang) * 18);
    fill(255, 255, 0);
    noStroke();
    push();
    translate(cos(ang) * 18, sin(ang) * 18);
    rotate(ang);
    triangle(5, 0, -3, -4, -3, 4);
    pop();
    fill(200);
    textSize(9);
    textAlign(CENTER);
    noStroke();
    text(`${dist.toFixed(0)}м`, 0, 40);
    pop();
  }
  
  function drawAutopilotBtn() {
    let bx = width / 2 - 72,
      by = 10,
      bw = 145,
      bh = 34;
    let hov = mouseX > bx && mouseX < bx + bw && mouseY > by && mouseY < by + bh;
    if (autopilotOn) {
      let p = sin(frameCount * 0.1) * 28;
      fill(0, 145 + p, 45, 215);
      stroke(0, 255, 95);
    } else if (hov && gameState === 'playing') {
      fill(75, 75, 115, 215);
      stroke(145, 145, 250);
    } else {
      fill(38, 38, 55, 195);
      stroke(95, 95, 135);
    }
    strokeWeight(2);
    rect(bx, by, bw, bh, 8);
    textAlign(CENTER, CENTER);
    textSize(12);
    noStroke();
    fill(autopilotOn ? 255 : (gameState === 'playing' ? color(195, 195, 250) :
      color(95)));
    text(autopilotOn ? '🤖 АВТОПИЛОТ ВКЛ' : '🤖 АВТОПИЛОТ', bx + bw / 2, by + bh /
      2);
  
    if (autopilotOn && gameState === 'playing') {
      let phaseColors = {
        'APPROACH': color(255, 195, 45),
        'DESCENT': color(95, 195, 250),
        'FINAL': color(255, 145, 45),
        'TOUCHDOWN': color(0, 255, 95)
      };
      let phaseNames = {
        'APPROACH': 'НАВЕДЕНИЕ',
        'DESCENT': 'СНИЖЕНИЕ',
        'FINAL': 'ФИНАЛ',
        'TOUCHDOWN': 'КАСАНИЕ'
      };
      fill(0, 0, 0, 145);
      noStroke();
      rect(bx - 8, by + bh + 4, bw + 16, 18, 5);
      fill(phaseColors[autopilotPhase] || color(150));
      textSize(10);
      textAlign(CENTER);
      text('▸ ' + (phaseNames[autopilotPhase] || autopilotPhase), bx + bw / 2,
        by + bh + 13);
  
      if (autopilotDebug.length > 0) {
        fill(0, 0, 0, 130);
        noStroke();
        rect(bx - 30, by + bh + 25, bw + 60, autopilotDebug.length * 11 + 6, 5);
        fill(0, 255, 0, 200);
        textSize(9);
        textAlign(LEFT);
        for (let i = 0; i < autopilotDebug.length; i++) {
          text(autopilotDebug[i], bx - 22, by + bh + 36 + i * 11);
        }
      }
    }
  }
  
  function drawTestBtn() {
    let bx = width - 118,
      by = height - 70,
      bw = 108,
      bh = 26;
    let hov = mouseX > bx && mouseX < bx + bw && mouseY > by && mouseY < by + bh;
    fill(hov ? color(55, 55, 95, 215) : color(28, 28, 48, 195));
    stroke(75, 75, 135);
    strokeWeight(1);
    rect(bx, by, bw, bh, 6);
    textAlign(CENTER, CENTER);
    textSize(10);
    noStroke();
    fill(175, 175, 250);
    text('🧪 ТЕСТ (T)', bx + bw / 2, by + bh / 2);
  }
  
  function drawMenuBtn() {
    let bx = 10,
      by = height - 70,
      bw = 108,
      bh = 26;
    let hov = mouseX > bx && mouseX < bx + bw && mouseY > by && mouseY < by + bh;
    fill(hov ? color(75, 55, 55, 215) : color(38, 28, 28, 195));
    stroke(135, 75, 75);
    strokeWeight(1);
    rect(bx, by, bw, bh, 6);
    textAlign(CENTER, CENTER);
    textSize(10);
    noStroke();
    fill(250, 175, 175);
    text('◀ МЕНЮ (M)', bx + bw / 2, by + bh / 2);
  }
  
  // ========== ТЕСТЫ ==========
  function runVirtualTest() {
    let res = {
      total: 50,
      landed: 0,
      crashed: 0,
      fuelLeft: [],
      speeds: [],
      scenarios: [],
      ratings: {
        perfect: 0,
        normal: 0,
        hard: 0
      }
    };
    for (let t = 0; t < res.total; t++) {
      let r = simulateOne(t);
      res.scenarios.push(r);
      if (r.success) {
        res.landed++;
        res.fuelLeft.push(r.fuelLeft);
        res.speeds.push(r.finalSpeed);
        if (r.finalSpeed < P.perfectLandingSpeed) res.ratings.perfect++;
        else if (r.finalSpeed < P.hardLandingSpeed) res.ratings.normal++;
        else res.ratings.hard++;
      } else res.crashed++;
    }
    res.successRate = (res.landed / res.total * 100).toFixed(1);
    res.avgFuel = res.fuelLeft.length > 0 ? (res.fuelLeft.reduce((a, b) => a +
      b) / res.fuelLeft.length).toFixed(1) : 0;
    res.avgSpeed = res.speeds.length > 0 ? (res.speeds.reduce((a, b) => a + b) /
      res.speeds.length).toFixed(2) : 0;
    return res;
  }
  
  function simulateOne(seed) {
    let thrust = P.thrustPower;
    let gravity = P.gravity;
    let maxDecel = thrust - gravity;
  
    let sim = {
      x: 80 + (seed * 137) % 540,
      y: 80,
      vx: (seed % 10 - 5) * 0.1,
      vy: 0,
      angle: 0,
      angularVel: 0,
      fuel: P.fuelMax,
      w: 20,
      h: 50
    };
    let sW = P.windMax > 0 ? ((seed * 31) % 100 - 50) / 50 * P.windMax : 0;
    let sPadX = 150 + (seed * 73) % 450,
      sPadY = height - 130;
  
    for (let st = 0; st < 8000; st++) {
      let bOff = sim.h / 2 + 12;
      let alt = sPadY - (sim.y + bOff);
      let dX = sPadX - sim.x,
        aDX = abs(dX);
  
      if (alt <= 0) {
        let sp = sqrt(sim.vx * sim.vx + sim.vy * sim.vy);
        let ok = aDX < 50 && sp < P.safeLandingSpeed && abs(sim.angle) < P
          .safeLandingAngle;
        return {
          success: ok,
          fuelLeft: sim.fuel / P.fuelMax * 100,
          finalSpeed: sp,
          steps: st,
          reason: ok ? 'ok' : (aDX >= 50 ? 'miss' : sp >= P.safeLandingSpeed ?
            'fast' : 'angle')
        };
      }
      if (sim.fuel <= 0) return {
        success: false,
        fuelLeft: 0,
        finalSpeed: 99,
        steps: st,
        reason: 'fuel'
      };
  
      // Определяем фазу
      let phase;
      if (alt < 3 && aDX < 8 && sim.vy > 0 && sim.vy < 1.5 && abs(sim.angle) <
        0.2) phase = 'TOUCHDOWN';
      else if (alt < 25 && aDX < 15) phase = 'FINAL';
      else if (aDX > 25) phase = 'APPROACH';
      else phase = 'DESCENT';
  
      // Целевые скорости
      let targetVx = 0,
        targetVy = 0;
      if (phase === 'APPROACH') {
        targetVx = sign(dX) * min(3.0, sqrt(aDX * 0.08));
        targetVy = alt > 150 ? 1.5 : alt > 80 ? 0.5 : -0.3;
      } else if (phase === 'DESCENT') {
        targetVx = constrain(dX * 0.03, -0.8, 0.8);
        let safeVy = sqrt(2 * maxDecel * max(alt, 1)) * 0.6;
        targetVy = alt > 100 ? min(2.5, safeVy) : alt > 50 ? min(1.8, safeVy) :
          min(1.2, safeVy);
      } else if (phase === 'FINAL') {
        targetVx = constrain(dX * 0.02, -0.3, 0.3);
        targetVy = alt > 15 ? 0.8 : alt > 8 ? 0.5 : 0.3;
      } else {
        targetVx = 0;
        targetVy = 0.2;
      }
  
      // Контроль угла
      let vxError = targetVx - sim.vx;
      let windComp = sW * P.windEffect * 25;
      let targetAngle = -vxError * 0.4 - windComp;
      let maxAngle = phase === 'APPROACH' ? 0.4 : phase === 'DESCENT' ? 0.25 :
        phase === 'FINAL' ? 0.12 : 0.05;
      targetAngle = constrain(targetAngle, -maxAngle, maxAngle);
      if (abs(sim.angle) > 0.5) targetAngle = 0;
  
      let angleCorr = (targetAngle - sim.angle) * 8.0 - sim.angularVel * 15.0;
      if (angleCorr < -0.01) sim.angularVel -= ROTATION_SPEED * 0.12;
      if (angleCorr > 0.01) sim.angularVel += ROTATION_SPEED * 0.12;
  
      // Контроль тяги
      let vyError = sim.vy - targetVy;
      let cosAngle = max(cos(sim.angle), 0.3);
      let hoverThrust = gravity / (thrust * cosAngle);
      let thrustCmd = hoverThrust + vyError * 2.5;
      let safeSpeed = sqrt(2 * maxDecel * max(alt, 1)) * 0.7;
      if (sim.vy > safeSpeed && alt < 200) thrustCmd = 1.0;
      if (abs(sim.angle) > 0.4) thrustCmd *= 0.3;
      if (phase === 'TOUCHDOWN' && sim.vy < 0.8 && sim.vy > 0) thrustCmd = 0;
      if (sim.vy < -0.5 && alt > 30) thrustCmd = 0;
  
      if (thrustCmd > 0.1 && sim.fuel > 0) {
        let actThrust = thrust * min(thrustCmd, 1.0);
        sim.vx += -sin(sim.angle) * actThrust;
        sim.vy += -cos(sim.angle) * actThrust;
        sim.fuel -= 0.5;
      }
  
      sim.vy += gravity;
      sim.vx += sW * P.windEffect;
      sim.x += sim.vx;
      sim.y += sim.vy;
      sim.angle += sim.angularVel;
      sim.angularVel *= 0.96;
      if (sim.x < 25) {
        sim.x = 25;
        sim.vx *= -0.3;
      }
      if (sim.x > width - 25) {
        sim.x = width - 25;
        sim.vx *= -0.3;
      }
    }
    return {
      success: false,
      fuelLeft: 0,
      finalSpeed: 99,
      steps: 8000,
      reason: 'timeout'
    };
  }
  
  function drawTestPanel() {
    let r2 = testResults;
    let px = width / 2 - 205,
      py = height / 2 - 175,
      pw = 410,
      ph = 320;
    fill(0, 0, 0, 235);
    stroke(95, 95, 195);
    strokeWeight(2);
    rect(px, py, pw, ph, 12);
    textAlign(CENTER);
    noStroke();
    textSize(13);
    fill(95, 195, 250);
    text(`🧪 ТЕСТ — ${P.emoji} ${P.name} (50 сценариев)`, px + pw / 2, py + 25);
    textSize(13);
    let sc2 = r2.successRate >= 90 ? color(0, 255, 95) : r2.successRate >= 70 ?
      color(255, 195, 0) : color(255, 45, 45);
    fill(sc2);
    text(`Успешность: ${r2.successRate}% (${r2.landed}/${r2.total})`, px + pw / 2,
      py + 50);
    fill(200);
    textSize(11);
    text(`Ср. топливо: ${r2.avgFuel}% | Ср. скорость: ${r2.avgSpeed} м/с`, px +
      pw / 2, py + 72);
    let ry2 = py + 92;
    textSize(10);
    fill(0, 255, 200);
    text(`Идеальных: ${r2.ratings.perfect}`, px + pw / 2, ry2);
    fill(95, 255, 95);
    text(`Нормальных: ${r2.ratings.normal}`, px + pw / 2, ry2 + 16);
    fill(255, 195, 0);
    text(`Жёстких: ${r2.ratings.hard}`, px + pw / 2, ry2 + 32);
    let bY3 = py + 145;
    textSize(9);
    fill(145);
    textAlign(LEFT);
    text('Результаты:', px + 18, bY3);
    bY3 += 14;
    let bW3 = (pw - 36) / r2.total;
    for (let i = 0; i < r2.scenarios.length; i++) {
      let s = r2.scenarios[i];
      if (s.success) {
        if (s.finalSpeed < P.perfectLandingSpeed) fill(0, 255, 200);
        else if (s.finalSpeed < P.hardLandingSpeed) fill(0, 200, 45);
        else fill(255, 195, 0);
      } else {
        if (s.reason === 'miss') fill(255, 95, 0);
        else if (s.reason === 'fast') fill(255, 45, 45);
        else if (s.reason === 'angle') fill(195, 45, 195);
        else fill(95, 95, 95);
      }
      noStroke();
      rect(px + 18 + i * bW3, bY3, bW3 - 1, 18);
    }
    bY3 += 28;
    textSize(8);
    fill(0, 255, 200);
    rect(px + 18, bY3, 8, 8);
    fill(195);
    text('Идеал', px + 30, bY3 + 8);
    fill(0, 200, 45);
    rect(px + 75, bY3, 8, 8);
    fill(195);
    text('Норм', px + 87, bY3 + 8);
    fill(255, 195, 0);
    rect(px + 130, bY3, 8, 8);
    fill(195);
    text('Жёстко', px + 142, bY3 + 8);
    fill(255, 95, 0);
    rect(px + 195, bY3, 8, 8);
    fill(195);
    text('Мимо', px + 207, bY3 + 8);
    fill(255, 45, 45);
    rect(px + 248, bY3, 8, 8);
    fill(195);
    text('Быстро', px + 260, bY3 + 8);
    fill(195, 45, 195);
    rect(px + 310, bY3, 8, 8);
    fill(195);
    text('Угол', px + 322, bY3 + 8);
    textAlign(CENTER);
    textSize(10);
    fill(255, 255, 0);
    text('T или клик для закрытия', px + pw / 2, py + ph - 12);
  }
  
  // ========== ВВОД ==========
  function mousePressed() {
    if (gameState === 'menu') {
      if (menuHover) selectPlanet(menuHover);
      return;
    }
    let bx = width / 2 - 72,
      by = 10,
      bw = 145,
      bh = 34;
    if (mouseX > bx && mouseX < bx + bw && mouseY > by && mouseY < by + bh) {
      if (gameState === 'playing') toggleAutopilot();
      return;
    }
    let tbx = width - 118,
      tby = height - 70,
      tbw = 108,
      tbh = 26;
    if (mouseX > tbx && mouseX < tbx + tbw && mouseY > tby && mouseY < tby +
      tbh) {
      toggleTest();
      return;
    }
    let mbx = 10,
      mby = height - 70,
      mbw = 108,
      mbh = 26;
    if (mouseX > mbx && mouseX < mbx + mbw && mouseY > mby && mouseY < mby +
      mbh) {
      gameState = 'menu';
      return;
    }
    if (showTestPanel) showTestPanel = false;
  }
  
  function toggleAutopilot() {
    autopilotOn = !autopilotOn;
    autopilotRequested = autopilotOn;
    if (!autopilotOn) {
      rocket.thrusting = false;
      rocket.thrustingLeft = false;
      rocket.thrustingRight = false;
    }
  }
  
  function toggleTest() {
    if (!showTestPanel) {
      testResults = runVirtualTest();
      showTestPanel = true;
    } else showTestPanel = false;
  }
  
  function keyPressed() {
    if (gameState === 'menu') {
      if (key === '1') selectPlanet('moon');
      if (key === '2') selectPlanet('mars');
      if (key === '3') selectPlanet('venus');
      if (key === '4') selectPlanet('earth');
      return;
    }
    if (key === 'r' || key === 'R' || key === 'к' || key === 'К') initGame();
    if (key === 'm' || key === 'M' || key === 'ь' || key === 'Ь') gameState =
      'menu';
    if ((key === 'p' || key === 'P' || key === 'з' || key === 'З') &&
      gameState === 'playing') toggleAutopilot();
    if (key === 't' || key === 'T' || key === 'е' || key === 'Е') {
      if (P) toggleTest();
    }
  }
  
  function windowResized() {
    resizeCanvas(800, 600);
  }
  