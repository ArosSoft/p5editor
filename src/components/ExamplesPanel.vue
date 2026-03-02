<!-- 
  Компонент ExamplesPanel - панель с примерами графики
  Появляется слева от редактора кода при нажатии на кнопку "Примеры"
  Содержит список ссылок на разные примеры, отсортированные по темам
-->

<script setup lang="ts">
// Определяем свойства, которые можно передать в компонент
// theme - текущая тема (тёмная или светлая)
defineProps<{ 
  theme?: 'dark' | 'light' 
}>()

// Определяем события, которые может вызывать компонент
// loadExample - когда пользователь выбирает пример для загрузки
// close - когда нужно закрыть панель
const emit = defineEmits<{ 
  (e: 'loadExample', code: string): void,
  (e: 'close'): void 
}>()

// ============================================
// ТЕМА 1: ВРЕМЕНА ГОДА И ПРИРОДА (8 примеров)
// ============================================

// Пример 1.1: Снеговик
// Рисуем весёлого снеговика с шляпой, глазами, носом-морковкой и пуговицами
const snowmanCode = `// ☃️ СНЕГОВИК - Пример на тему "Зима"
// Рисуем весёлого снеговика с анимацией снегопада

function setup() {
  createCanvas(400, 400);
}

function draw() {
  // Рисуем синее небо (фон)
  background(135, 206, 235); // Голубой цвет
  
  // Рисуем снег на земле - белый овал внизу
  fill(255);
  noStroke();
  ellipse(200, 350, 400, 100);
  
  // Рисуем тело снеговика - три белых круга
  fill(255); // Белый цвет
  stroke(200); // Светло-серая обводка
  strokeWeight(2);
  
  // Нижняя часть (самая большая)
  ellipse(200, 280, 120, 120);
  // Средняя часть
  ellipse(200, 200, 90, 90);
  // Голова (верхняя часть)
  ellipse(200, 130, 70, 70);
  
  // Рисуем шляпу - чёрный цилиндр
  fill(0); // Чёрный цвет
  noStroke();
  // Поля шляпы
  rect(160, 90, 80, 10);
  // Верх шляпы (цилиндр)
  rect(175, 40, 50, 50);
  
  // Рисуем глаза - два чёрных кружка
  fill(0);
  ellipse(185, 120, 8, 8);
  ellipse(215, 120, 8, 8);
  
  // Рисуем нос-морковку - оранжевый треугольник
  fill(255, 165, 0); // Оранжевый
  triangle(200, 135, 220, 130, 200, 145);
  
  // Рисуем рот - три маленьких кружка (улыбка)
  fill(0);
  ellipse(190, 150, 3, 3);
  ellipse(200, 155, 3, 3);
  ellipse(210, 150, 3, 3);
  
  // Рисуем пуговицы на животе
  fill(0);
  ellipse(200, 180, 8, 8);
  ellipse(200, 210, 8, 8);
  ellipse(200, 240, 8, 8);
  
  // Рисуем руки - коричневые палочки
  stroke(139, 69, 19); // Коричневый
  strokeWeight(4);
  // Левая рука
  line(160, 190, 100, 170);
  // Правая рука
  line(240, 190, 300, 170);
  
  // Добавляем падающий снег (точки)
  stroke(255);
  strokeWeight(2);
  for (let i = 0; i < 10; i++) {
    // Используем синус для анимации - снежинки падают вниз
    let x = 50 + i * 35 + sin(frameCount * 0.02 + i) * 10;
    let y = (frameCount * 0.5 + i * 30) % 400;
    point(x, y);
  }
}`

// Пример 1.2: Новогодняя ёлка
const treeCode = `// 🎄 НОВОГОДНЯЯ ЁЛКА - Пример на тему "Зима"
// Рисуем нарядную ёлку с игрушками и мигающей гирляндой

function setup() {
  createCanvas(400, 400);
}

function draw() {
  // Рисуем фон - зимнее небо
  background(25, 25, 112); // Тёмно-синий (ночное небо)
  
  // Рисуем снег на земле
  fill(255);
  noStroke();
  rect(0, 300, 400, 100);
  
  // Рисуем ствол ёлки - коричневый прямоугольник
  fill(139, 69, 19); // Коричневый
  rect(180, 240, 40, 80);
  
  // Рисуем ярусы ёлки - зелёные треугольники
  fill(34, 139, 34); // Лесной зелёный
  noStroke();
  
  // Нижний ярус (самый большой)
  triangle(50, 250, 350, 250, 200, 120);
  // Средний ярус
  triangle(80, 190, 320, 190, 200, 80);
  // Верхний ярус
  triangle(110, 140, 290, 140, 200, 40);
  
  // Рисуем звезду на макушке
  fill(255, 215, 0); // Золотой
  star(200, 30, 15, 30, 5);
  
  // Рисуем ёлочные игрушки - разноцветные кружки
  // Красные игрушки
  fill(255, 0, 0);
  ellipse(150, 220, 15, 15);
  ellipse(250, 180, 15, 15);
  
  // Синие игрушки
  fill(0, 0, 255);
  ellipse(230, 230, 15, 15);
  ellipse(170, 150, 15, 15);
  
  // Жёлтые игрушки
  fill(255, 255, 0);
  ellipse(200, 200, 15, 15);
  ellipse(120, 170, 15, 15);
  
  // Зелёные игрушки (поярче, чем ёлка)
  fill(0, 255, 0);
  ellipse(280, 200, 15, 15);
  
  // Рисуем гирлянду - разноцветные точки
  for (let i = 0; i < 8; i++) {
    // Меняем цвет в зависимости от счётчика кадров (мигание)
    if ((frameCount + i) % 30 < 15) {
      fill(255, 0, 0); // Красный
    } else {
      fill(0, 0, 255); // Синий
    }
    
    // Рисуем точки по спирали вокруг ёлки
    let x = 200 + 80 * cos(i * 0.8 + frameCount * 0.05);
    let y = 150 + 60 * sin(i * 0.8 + frameCount * 0.05);
    ellipse(x, y, 10, 10);
  }
  
  // Рисуем падающий снег
  fill(255);
  for (let i = 0; i < 20; i++) {
    let x = (i * 37 + frameCount) % 400;
    let y = (i * 23 + frameCount * 2) % 400;
    ellipse(x, y, 3, 3);
  }
}

// Функция для рисования звезды
function star(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}`

// Пример 1.3: Волшебный лес
const forestCode = `// 🌳 ВОЛШЕБНЫЙ ЛЕС - Пример на тему "Природа"
// Лес с мерцающими светлячками и луной

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
  // Небо (градиент от тёмно-синего к чёрному)
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
}`

// Пример 1.4: Подводный мир
const underwaterCode = `// 🌊 ПОДВОДНЫЙ МИР - Пример на тему "Природа"
// Рыбки плавают в океане, пузырьки поднимаются вверх

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
    b.size *= 1.01;
    
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
    triangle(fishy.x - fishy.size/2, fishy.y,
             fishy.x - fishy.size/2 - 10, fishy.y - 5,
             fishy.x - fishy.size/2 - 10, fishy.y + 5);
  }
}`

// Пример 1.5: Цветущий сад
const gardenCode = `// 🌸 ЦВЕТУЩИЙ САД - Пример на тему "Природа"
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
}`

// Пример 1.6: Гроза
const stormCode = `// ⛈️ ГРОЗА - Пример на тему "Погода"
// Дождь, молнии и тучи

let raindrops = [];
let lightning = 0;

function setup() {
  createCanvas(400, 400);
  
  // Создаём капли дождя
  for (let i = 0; i < 100; i++) {
    raindrops.push({
      x: random(width),
      y: random(height),
      speed: random(5, 10),
      length: random(10, 20)
    });
  }
}

function draw() {
  // Тёмное небо
  background(30, 30, 50);
  
  // Молния (случайно вспыхивает)
  if (random() < 0.005) {
    lightning = 255;
  }
  
  if (lightning > 0) {
    fill(255, 255, 255, lightning);
    rect(0, 0, width, height);
    lightning -= 5;
  }
  
  // Рисуем тучи
  fill(50, 50, 70);
  noStroke();
  ellipse(100, 80, 150, 80);
  ellipse(200, 60, 200, 100);
  ellipse(300, 80, 150, 80);
  
  // Рисуем дождь
  stroke(200, 200, 255, 150);
  strokeWeight(2);
  for (let drop of raindrops) {
    drop.y += drop.speed;
    if (drop.y > height) {
      drop.y = 0;
      drop.x = random(width);
    }
    
    line(drop.x, drop.y, drop.x, drop.y + drop.length);
  }
  
  // Лужи внизу
  fill(100, 100, 200, 100);
  rect(0, height - 20, width, 20);
  
  // Круги на лужах от капель
  fill(255, 255, 255, 100);
  for (let i = 0; i < 5; i++) {
    let x = (frameCount * 2 + i * 50) % width;
    ellipse(x, height - 15, 5, 5);
  }
}`

// Пример 1.7: Осенний парк
const autumnCode = `// 🍂 ОСЕННИЙ ПАРК - Пример на тему "Времена года"
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
    
    // Крона (жёлто-оранжевая)
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
}`

// Пример 1.8: Пустыня
const desertCode = `// 🏜️ ПУСТЫНЯ - Пример на тему "Природа"
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
  
  // Барханы (волны песка)
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
  
  // Мираж (мерцание)
  fill(255, 255, 255, 50 * sin(frameCount * 0.1));
  rect(0, 200, width, 50);
}`

// ============================================
// ТЕМА 2: КОСМОС (4 примера)
// ============================================

// Пример 2.1: Солнечная система
const solarSystemCode = `// 🪐 СОЛНЕЧНАЯ СИСТЕМА - Пример на тему "Космос"
// Планеты вращаются вокруг Солнца

let planets = [];

function setup() {
  createCanvas(600, 400);
  
  planets.push(new Planet(color(200, 150, 100), 10, 80, 0.02)); // Меркурий
  planets.push(new Planet(color(255, 200, 100), 14, 120, 0.015)); // Венера
  planets.push(new Planet(color(100, 150, 255), 16, 160, 0.01)); // Земля
  planets.push(new Planet(color(255, 100, 100), 12, 200, 0.008)); // Марс
  planets.push(new Planet(color(200, 150, 100), 22, 260, 0.005)); // Юпитер
}

function draw() {
  background(0);
  
  // Звёзды
  fill(255);
  for (let i = 0; i < 50; i++) {
    let x = (i * 73) % width;
    let y = (i * 37) % height;
    let brightness = 128 + 127 * sin(frameCount * 0.05 + i);
    fill(brightness);
    ellipse(x, y, 2, 2);
  }
  
  push();
  translate(width/2, height/2);
  
  // Солнце
  for (let i = 3; i > 0; i--) {
    fill(255, 200, 0, 50);
    ellipse(0, 0, 60 + i * 20, 60 + i * 20);
  }
  fill(255, 255, 0);
  ellipse(0, 0, 50, 50);
  
  // Орбиты
  noFill();
  stroke(100);
  strokeWeight(0.5);
  for (let planet of planets) {
    ellipse(0, 0, planet.distance * 2, planet.distance * 2);
  }
  
  // Планеты
  for (let planet of planets) {
    planet.update();
    planet.show();
  }
  pop();
}

class Planet {
  constructor(c, r, d, s) {
    this.color = c;
    this.radius = r;
    this.distance = d;
    this.speed = s;
    this.angle = random(TWO_PI);
  }
  
  update() {
    this.angle += this.speed;
  }
  
  show() {
    let x = cos(this.angle) * this.distance;
    let y = sin(this.angle) * this.distance;
    fill(this.color);
    noStroke();
    ellipse(x, y, this.radius, this.radius);
  }
}`

// Пример 2.2: Звёздное небо
const starsCode = `// ⭐ ЗВЁЗДНОЕ НЕБО - Пример на тему "Космос"
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
  
  // Случайно добавляем падающие звёзды
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
  
  // Точки созвездия
  let points = [
    [100, 100], [120, 80], [140, 70], [160, 80],
    [180, 90], [170, 120], [150, 110]
  ];
  
  // Соединяем линии
  for (let i = 0; i < points.length - 1; i++) {
    line(points[i][0], points[i][1], points[i+1][0], points[i+1][1]);
  }
  
  // Рисуем точки
  for (let p of points) {
    fill(255, 255, 200);
    ellipse(p[0], p[1], 5, 5);
  }
}`

// Пример 2.3: Луноход
const moonRoverCode = `// 🚀 ЛУНОХОД - Пример на тему "Космос"
// Луноход ездит по поверхности Луны

let roverX = 200;
let roverY = 300;
let roverAngle = 0;

function setup() {
  createCanvas(400, 400);
}

function draw() {
  // Космос
  background(0);
  
  // Луна (поверхность)
  fill(100);
  rect(0, 320, width, 80);
  
  // Кратеры
  fill(80);
  ellipse(50, 340, 40, 20);
  ellipse(150, 330, 60, 30);
  ellipse(300, 350, 50, 25);
  
  // Звёзды
  fill(255);
  for (let i = 0; i < 50; i++) {
    ellipse((i * 27) % width, (i * 13) % 300, 2, 2);
  }
  
  // Земля в небе
  fill(0, 0, 255);
  ellipse(350, 100, 30, 30);
  fill(0, 255, 0);
  ellipse(340, 95, 10, 10);
  fill(255);
  ellipse(345, 90, 5, 5);
  
  // Луноход
  push();
  translate(roverX, roverY);
  rotate(roverAngle);
  
  // Корпус
  fill(200);
  rect(-20, -10, 40, 20);
  
  // Кабина
  fill(100, 200, 255);
  rect(-15, -20, 30, 15);
  
  // Колёса
  fill(50);
  ellipse(-15, 5, 10, 10);
  ellipse(15, 5, 10, 10);
  ellipse(-15, -15, 8, 8);
  ellipse(15, -15, 8, 8);
  
  // Антенна
  stroke(255);
  strokeWeight(1);
  line(10, -25, 20, -35);
  fill(255, 0, 0);
  ellipse(20, -35, 3, 3);
  
  pop();
  
  // Управление
  if (keyIsDown(LEFT_ARROW)) {
    roverX -= 2;
    roverAngle = -0.1;
  } else if (keyIsDown(RIGHT_ARROW)) {
    roverX += 2;
    roverAngle = 0.1;
  } else {
    roverAngle = 0;
  }
  
  // Границы
  roverX = constrain(roverX, 50, 350);
}`

// Пример 2.4: Инопланетяне
const aliensCode = `// 👽 ИНОПЛАНЕТЯНЕ - Пример на тему "Космос"
// Летающие тарелки прилетели на Землю

let ufos = [];

function setup() {
  createCanvas(400, 400);
  
  for (let i = 0; i < 3; i++) {
    ufos.push({
      x: random(width),
      y: random(100, 200),
      speed: random(1, 3),
      direction: 1
    });
  }
}

function draw() {
  // Небо
  background(0, 0, 50);
  
  // Звёзды
  fill(255);
  for (let i = 0; i < 50; i++) {
    ellipse(random(width), random(200), 2, 2);
  }
  
  // Земля (поверхность)
  fill(34, 139, 34);
  rect(0, 300, width, 100);
  
  // Домики на Земле
  fill(150);
  rect(50, 250, 40, 50);
  rect(150, 250, 40, 50);
  rect(250, 250, 40, 50);
  rect(350, 250, 40, 50);
  
  // Крыши
  fill(200, 0, 0);
  triangle(50, 250, 90, 250, 70, 220);
  triangle(150, 250, 190, 250, 170, 220);
  triangle(250, 250, 290, 250, 270, 220);
  triangle(350, 250, 390, 250, 370, 220);
  
  // НЛО
  for (let ufo of ufos) {
    ufo.x += ufo.speed * ufo.direction;
    if (ufo.x > width - 50 || ufo.x < 50) {
      ufo.direction *= -1;
    }
    
    // Корпус НЛО
    fill(200, 200, 255);
    ellipse(ufo.x, ufo.y, 60, 20);
    ellipse(ufo.x, ufo.y - 10, 30, 15);
    
    // Огоньки
    fill(255, 0, 0);
    ellipse(ufo.x - 20, ufo.y, 5, 5);
    fill(0, 255, 0);
    ellipse(ufo.x, ufo.y, 5, 5);
    fill(0, 0, 255);
    ellipse(ufo.x + 20, ufo.y, 5, 5);
    
    // Луч света
    fill(255, 255, 255, 50);
    triangle(ufo.x - 15, ufo.y, ufo.x + 15, ufo.y, ufo.x, ufo.y + 50);
  }
  
  // Счётчик НЛО
  fill(255);
  textSize(16);
  text("НЛО на орбите: " + ufos.length, 10, 30);
}`

// ============================================
// ТЕМА 3: ИГРЫ (5 примеров)
// ============================================

// Пример 3.1: Поймай шарик
const catchGameCode = `// 🎮 ПОЙМАЙ ШАРИК - Игра
// Лови шарики мышкой, пока они не упали

let balls = [];
let score = 0;
let misses = 0;
let gameOver = false;

function setup() {
  createCanvas(400, 400);
  textAlign(CENTER, CENTER);
}

function draw() {
  background(200);
  
  if (!gameOver) {
    if (random() < 0.02) {
      balls.push({
        x: random(50, width - 50),
        y: 30,
        size: random(20, 40),
        speed: random(1, 3),
        color: color(random(255), random(255), random(255))
      });
    }
    
    for (let i = balls.length - 1; i >= 0; i--) {
      let ball = balls[i];
      ball.y += ball.speed;
      
      fill(ball.color);
      noStroke();
      ellipse(ball.x, ball.y, ball.size, ball.size);
      
      let d = dist(mouseX, mouseY, ball.x, ball.y);
      if (d < ball.size / 2) {
        balls.splice(i, 1);
        score++;
      }
      
      if (ball.y > height + ball.size) {
        balls.splice(i, 1);
        misses++;
      }
    }
    
    if (misses >= 3) {
      gameOver = true;
    }
    
    fill(0);
    textSize(20);
    text("Счёт: " + score, 100, 30);
    text("Промахи: " + misses + "/3", 300, 30);
  } else {
    fill(0);
    textSize(40);
    text("ИГРА ОКОНЧЕНА!", width/2, height/2 - 30);
    textSize(30);
    text("Твой счёт: " + score, width/2, height/2 + 20);
    textSize(16);
    text("Нажми R чтобы начать заново", width/2, height/2 + 60);
  }
}

function keyPressed() {
  if (key === 'r' && gameOver) {
    balls = [];
    score = 0;
    misses = 0;
    gameOver = false;
  }
}`

// Пример 3.2: Змейка
const snakeGameCode = `// 🐍 ЗМЕЙКА - Классическая игра
// Управляй змейкой стрелками, ешь яблоки

let snake = [];
let food;
let direction = 'right';
let gameOver = false;
let score = 0;

function setup() {
  createCanvas(400, 400);
  frameRate(10);
  
  // Начальная змейка
  snake.push(createVector(200, 200));
  snake.push(createVector(180, 200));
  snake.push(createVector(160, 200));
  
  newFood();
}

function draw() {
  background(0);
  
  if (!gameOver) {
    // Движение змейки
    let head = snake[0].copy();
    
    if (direction == 'right') head.x += 20;
    else if (direction == 'left') head.x -= 20;
    else if (direction == 'up') head.y -= 20;
    else if (direction == 'down') head.y += 20;
    
    // Проверка столкновений
    if (head.x < 0 || head.x >= width || head.y < 0 || head.y >= height) {
      gameOver = true;
    }
    
    for (let part of snake) {
      if (head.x == part.x && head.y == part.y) {
        gameOver = true;
      }
    }
    
    snake.unshift(head);
    
    // Еда
    if (head.x == food.x && head.y == food.y) {
      score++;
      newFood();
    } else {
      snake.pop();
    }
    
    // Рисуем еду
    fill(255, 0, 0);
    ellipse(food.x + 10, food.y + 10, 15, 15);
    
    // Рисуем змейку
    for (let part of snake) {
      fill(0, 255, 0);
      rect(part.x, part.y, 18, 18);
    }
    
    // Счёт
    fill(255);
    textSize(16);
    text("Счёт: " + score, 10, 30);
  } else {
    fill(255);
    textSize(30);
    text("ИГРА ОКОНЧЕНА", width/2, height/2);
    textSize(20);
    text("Счёт: " + score, width/2, height/2 + 40);
    textSize(16);
    text("Нажми R для новой игры", width/2, height/2 + 70);
  }
}

function newFood() {
  let cols = width / 20;
  let rows = height / 20;
  food = createVector(floor(random(cols)) * 20,
                      floor(random(rows)) * 20);
}

function keyPressed() {
  if (keyCode === UP_ARROW && direction != 'down') direction = 'up';
  else if (keyCode === DOWN_ARROW && direction != 'up') direction = 'down';
  else if (keyCode === LEFT_ARROW && direction != 'right') direction = 'left';
  else if (keyCode === RIGHT_ARROW && direction != 'left') direction = 'right';
  else if (key === 'r' && gameOver) {
    gameOver = false;
    score = 0;
    snake = [];
    snake.push(createVector(200, 200));
    snake.push(createVector(180, 200));
    snake.push(createVector(160, 200));
    direction = 'right';
    newFood();
  }
}`

// Пример 3.3: Пинг-понг
const pongGameCode = `// 🏓 ПИНГ-ПОНГ - Игра для двоих
// Игрок 1: W/S, Игрок 2: стрелки вверх/вниз

let ball;
let leftPaddle, rightPaddle;
let leftScore = 0, rightScore = 0;

function setup() {
  createCanvas(400, 400);
  
  ball = {
    x: width/2,
    y: height/2,
    vx: 3,
    vy: 3,
    size: 10
  };
  
  leftPaddle = {
    y: height/2 - 40,
    w: 10,
    h: 80
  };
  
  rightPaddle = {
    y: height/2 - 40,
    w: 10,
    h: 80
  };
}

function draw() {
  background(0);
  
  // Движение мяча
  ball.x += ball.vx;
  ball.y += ball.vy;
  
  // Отскок от стен
  if (ball.y < 0 || ball.y > height) {
    ball.vy *= -1;
  }
  
  // Отскок от ракеток
  if (ball.x < 30 && ball.x > 20 &&
      ball.y > leftPaddle.y &&
      ball.y < leftPaddle.y + leftPaddle.h) {
    ball.vx *= -1;
    ball.vx *= 1.1;
    ball.vy *= 1.1;
  }
  
  if (ball.x > width - 30 && ball.x < width - 20 &&
      ball.y > rightPaddle.y &&
      ball.y < rightPaddle.y + rightPaddle.h) {
    ball.vx *= -1;
    ball.vx *= 1.1;
    ball.vy *= 1.1;
  }
  
  // Голы
  if (ball.x < 0) {
    rightScore++;
    resetBall();
  }
  if (ball.x > width) {
    leftScore++;
    resetBall();
  }
  
  // Управление
  if (keyIsDown(87)) leftPaddle.y -= 5; // W
  if (keyIsDown(83)) leftPaddle.y += 5; // S
  if (keyIsDown(UP_ARROW)) rightPaddle.y -= 5;
  if (keyIsDown(DOWN_ARROW)) rightPaddle.y += 5;
  
  // Границы ракеток
  leftPaddle.y = constrain(leftPaddle.y, 0, height - leftPaddle.h);
  rightPaddle.y = constrain(rightPaddle.y, 0, height - rightPaddle.h);
  
  // Рисуем
  fill(255);
  ellipse(ball.x, ball.y, ball.size, ball.size);
  
  rect(20, leftPaddle.y, leftPaddle.w, leftPaddle.h);
  rect(width - 30, rightPaddle.y, rightPaddle.w, rightPaddle.h);
  
  // Линия посередине
  stroke(255);
  strokeWeight(2);
  line(width/2, 0, width/2, height);
  
  // Счёт
  textSize(32);
  text(leftScore, width/4, 50);
  text(rightScore, 3*width/4, 50);
}

function resetBall() {
  ball.x = width/2;
  ball.y = height/2;
  ball.vx = 3 * (random() > 0.5 ? 1 : -1);
  ball.vy = 3 * (random() > 0.5 ? 1 : -1);
}`

// Пример 3.4: Лабиринт
const mazeGameCode = `// 🧩 ЛАБИРИНТ - Игра
// Найди выход из лабиринта

let maze = [];
let player = { x: 1, y: 1 };
let exit = { x: 18, y: 18 };
let cellSize = 20;

function setup() {
  createCanvas(400, 400);
  
  // Создаём простой лабиринт (1 - стена, 0 - проход)
  for (let i = 0; i < 20; i++) {
    maze[i] = [];
    for (let j = 0; j < 20; j++) {
      maze[i][j] = 1;
    }
  }
  
  // Проходы
  for (let i = 1; i < 19; i++) {
    for (let j = 1; j < 19; j++) {
      if (i % 2 == 0 && j % 2 == 0) {
        maze[i][j] = 0;
      }
    }
  }
  
  // Дополнительные проходы
  maze[2][3] = 0;
  maze[4][5] = 0;
  maze[6][7] = 0;
  maze[8][9] = 0;
  maze[10][11] = 0;
  maze[12][13] = 0;
  maze[14][15] = 0;
  maze[16][17] = 0;
  
  maze[1][1] = 0; // Старт
  maze[18][18] = 0; // Выход
}

function draw() {
  background(200);
  
  // Рисуем лабиринт
  for (let i = 0; i < 20; i++) {
    for (let j = 0; j < 20; j++) {
      if (maze[i][j] == 1) {
        fill(100);
        rect(i * cellSize, j * cellSize, cellSize, cellSize);
      }
    }
  }
  
  // Выход
  fill(0, 255, 0);
  rect(exit.x * cellSize, exit.y * cellSize, cellSize, cellSize);
  
  // Игрок
  fill(255, 0, 0);
  ellipse(player.x * cellSize + cellSize/2,
          player.y * cellSize + cellSize/2,
          cellSize - 2, cellSize - 2);
  
  // Проверка победы
  if (player.x == exit.x && player.y == exit.y) {
    fill(0);
    textSize(30);
    text("ТЫ ПОБЕДИЛ!", 100, 200);
  }
}

function keyPressed() {
  if (keyCode === UP_ARROW && player.y > 0 &&
      maze[player.x][player.y - 1] == 0) {
    player.y--;
  }
  if (keyCode === DOWN_ARROW && player.y < 19 &&
      maze[player.x][player.y + 1] == 0) {
    player.y++;
  }
  if (keyCode === LEFT_ARROW && player.x > 0 &&
      maze[player.x - 1][player.y] == 0) {
    player.x--;
  }
  if (keyCode === RIGHT_ARROW && player.x < 19 &&
      maze[player.x + 1][player.y] == 0) {
    player.x++;
  }
}`

// Пример 3.5: Космический стрелок
const shooterGameCode = `// 👾 КОСМИЧЕСКИЙ СТРЕЛОК - Игра
// Стреляй по врагам пробелом

let ship = { x: 200, y: 350 };
let bullets = [];
let enemies = [];
let score = 0;
let gameOver = false;

function setup() {
  createCanvas(400, 400);
  
  for (let i = 0; i < 5; i++) {
    enemies.push({
      x: 50 + i * 60,
      y: 50,
      size: 20,
      speed: 1,
      direction: 1
    });
  }
}

function draw() {
  background(0);
  
  if (!gameOver) {
    // Кораблик
    fill(0, 255, 0);
    triangle(ship.x - 15, ship.y, ship.x + 15, ship.y, ship.x, ship.y - 20);
    
    // Пули
    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].y -= 5;
      fill(255, 255, 0);
      ellipse(bullets[i].x, bullets[i].y, 5, 5);
      
      if (bullets[i].y < 0) {
        bullets.splice(i, 1);
      }
    }
    
    // Враги
    let edge = false;
    for (let enemy of enemies) {
      enemy.x += enemy.speed * enemy.direction;
      if (enemy.x < 20 || enemy.x > width - 20) {
        edge = true;
      }
    }
    
    if (edge) {
      for (let enemy of enemies) {
        enemy.direction *= -1;
        enemy.y += 10;
      }
    }
    
    // Проверка столкновений
    for (let i = enemies.length - 1; i >= 0; i--) {
      for (let j = bullets.length - 1; j >= 0; j--) {
        let d = dist(enemies[i].x, enemies[i].y, bullets[j].x, bullets[j].y);
        if (d < 15) {
          enemies.splice(i, 1);
          bullets.splice(j, 1);
          score += 10;
          break;
        }
      }
    }
    
    // Рисуем врагов
    for (let enemy of enemies) {
      fill(255, 0, 0);
      rect(enemy.x - 10, enemy.y - 10, 20, 20);
      fill(255);
      ellipse(enemy.x - 4, enemy.y - 4, 3, 3);
      ellipse(enemy.x + 4, enemy.y - 4, 3, 3);
    }
    
    // Проверка проигрыша
    for (let enemy of enemies) {
      if (enemy.y > ship.y - 20) {
        gameOver = true;
      }
    }
    
    if (enemies.length == 0) {
      gameOver = true;
    }
    
    // Счёт
    fill(255);
    textSize(16);
    text("Счёт: " + score, 10, 30);
  } else {
    fill(255);
    textSize(30);
    text("ИГРА ОКОНЧЕНА", 80, 200);
    textSize(20);
    text("Счёт: " + score, 150, 250);
  }
}

function keyPressed() {
  if (keyCode === LEFT_ARROW && ship.x > 30) ship.x -= 10;
  if (keyCode === RIGHT_ARROW && ship.x < width - 30) ship.x += 10;
  if (key === ' ') {
    bullets.push({ x: ship.x, y: ship.y - 20 });
  }
}`

// ============================================
// ТЕМА 4: ГЕОМЕТРИЧЕСКИЕ УЗОРЫ (6 примеров)
// ============================================

// Пример 4.1: Радужная спираль
const rainbowSpiralCode = `// 🌈 РАДУЖНАЯ СПИРАЛЬ - Геометрический узор
// Анимированная спираль с переливающимися цветами

function setup() {
  createCanvas(400, 400);
  colorMode(HSB, 360, 100, 100);
  noFill();
  strokeWeight(2);
}

function draw() {
  background(0);
  
  translate(width/2, height/2);
  
  beginShape();
  for (let i = 0; i < 200; i++) {
    let angle = i * 0.3 + frameCount * 0.02;
    let radius = i * 1.5;
    let x = cos(angle) * radius;
    let y = sin(angle) * radius;
    
    let hue = (angle * 50 + frameCount * 2) % 360;
    stroke(hue, 80, 100);
    
    point(x, y);
    vertex(x, y);
  }
  endShape();
  
  for (let i = 0; i < 50; i++) {
    let angle = i * 0.5 + frameCount * 0.03;
    let radius = 150 + 50 * sin(angle + frameCount * 0.05);
    let x = cos(angle * 2) * radius;
    let y = sin(angle * 2) * radius;
    
    let hue = (angle * 100 + frameCount) % 360;
    stroke(hue, 80, 100);
    ellipse(x, y, 5, 5);
  }
}`

// Пример 4.2: Цветная мозаика
const mosaicCode = `// 🧩 ЦВЕТНАЯ МОЗАИКА - Геометрический узор
// Случайные цвета каждую секунду

let cells = [];

function setup() {
  createCanvas(400, 400);
  createMosaic();
  setInterval(createMosaic, 1000);
}

function createMosaic() {
  cells = [];
  let cellSize = 20;
  
  for (let x = 0; x < width; x += cellSize) {
    for (let y = 0; y < height; y += cellSize) {
      cells.push({
        x: x,
        y: y,
        size: cellSize,
        color: color(random(255), random(255), random(255))
      });
    }
  }
}

function draw() {
  background(0);
  
  for (let cell of cells) {
    fill(cell.color);
    noStroke();
    rect(cell.x, cell.y, cell.size, cell.size);
  }
  
  stroke(255, 50);
  strokeWeight(1);
  for (let x = 0; x <= width; x += 20) {
    line(x, 0, x, height);
  }
  for (let y = 0; y <= height; y += 20) {
    line(0, y, width, y);
  }
}`

// Пример 4.3: Круги на воде
const circlesCode = `// 💧 КРУГИ НА ВОДЕ - Геометрический узор
// Расходящиеся круги как от капель

let ripples = [];

function setup() {
  createCanvas(400, 400);
}

function draw() {
  // Вода
  for (let y = 0; y < height; y++) {
    let blue = map(y, 0, height, 100, 200);
    stroke(0, 0, blue);
    line(0, y, width, y);
  }
  
  // Добавляем новый круг при клике
  if (mouseIsPressed) {
    ripples.push({
      x: mouseX,
      y: mouseY,
      size: 10,
      alpha: 255
    });
  }
  
  // Рисуем круги
  for (let i = ripples.length - 1; i >= 0; i--) {
    let r = ripples[i];
    r.size += 2;
    r.alpha -= 2;
    
    if (r.alpha <= 0) {
      ripples.splice(i, 1);
      continue;
    }
    
    noFill();
    stroke(255, 255, 255, r.alpha);
    strokeWeight(2);
    ellipse(r.x, r.y, r.size, r.size);
    ellipse(r.x, r.y, r.size * 0.7, r.size * 0.7);
  }
  
  // Счётчик кругов
  fill(255);
  textSize(12);
  text("Кругов: " + ripples.length, 10, 30);
}`

// Пример 4.4: Мандала
const mandalaCode = `// 🕉️ МАНДАЛА - Геометрический узор
// Симметричный узор с вращением

let angle = 0;

function setup() {
  createCanvas(400, 400);
  colorMode(HSB, 360, 100, 100);
}

function draw() {
  background(0);
  
  translate(width/2, height/2);
  
  for (let i = 0; i < 12; i++) {
    push();
    rotate(i * TWO_PI / 12 + angle);
    
    let hue = (i * 30 + frameCount) % 360;
    stroke(hue, 80, 100);
    strokeWeight(2);
    noFill();
    
    // Основные узоры
    ellipse(100, 0, 50, 50);
    
    // Маленькие кружки
    fill(hue, 80, 100);
    noStroke();
    ellipse(150, 0, 10, 10);
    
    // Линии
    stroke(hue, 80, 100);
    line(50, 0, 120, 30);
    line(50, 0, 120, -30);
    
    pop();
  }
  
  // Центр
  fill(255, 255, 255);
  noStroke();
  ellipse(0, 0, 30, 30);
  
  angle += 0.005;
}`

// Пример 4.5: Клеточный автомат
const automatonCode = `// 🧬 КЛЕТОЧНЫЙ АВТОМАТ - Геометрический узор
// Правило 30 - математическая красота

let cells = [];
let cellSize = 5;
let generation = 0;

function setup() {
  createCanvas(400, 400);
  
  let total = width / cellSize;
  for (let i = 0; i < total; i++) {
    cells[i] = 0;
  }
  cells[floor(total/2)] = 1; // Одна клетка в центре
}

function draw() {
  // Правило 30: 00011110 в двоичной = 30 в десятичной
  let rule = 30;
  
  // Рисуем текущее поколение
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] == 1) {
      fill(0);
    } else {
      fill(255);
    }
    rect(i * cellSize, generation * cellSize, cellSize, cellSize);
  }
  
  // Вычисляем следующее поколение
  let next = [];
  for (let i = 0; i < cells.length; i++) {
    let left = cells[(i - 1 + cells.length) % cells.length];
    let center = cells[i];
    let right = cells[(i + 1) % cells.length];
    
    // Превращаем тройку в число от 0 до 7
    let index = (left << 2) | (center << 1) | right;
    
    // Проверяем бит в правиле
    next[i] = (rule >> index) & 1;
  }
  
  cells = next;
  generation++;
  
  if (generation * cellSize > height) {
    noLoop();
  }
}`

// Пример 4.6: Фрактальное дерево
const fractalTreeCode = `// 🌳 ФРАКТАЛЬНОЕ ДЕРЕВО - Геометрический узор
// Дерево, которое растёт само в себя

let angle = 0;

function setup() {
  createCanvas(400, 400);
  angleMode(DEGREES);
}

function draw() {
  background(0, 50, 0);
  
  translate(width/2, height);
  stroke(255);
  
  // Рисуем дерево
  branch(100, 0);
  
  angle = 30 + 20 * sin(frameCount * 0.01);
}

function branch(len, level) {
  strokeWeight(map(level, 0, 10, 10, 1));
  stroke(255 - level * 20, 255 - level * 20, 255 - level * 20);
  
  line(0, 0, 0, -len);
  translate(0, -len);
  
  if (len > 4) {
    push();
    rotate(angle);
    branch(len * 0.7, level + 1);
    pop();
    
    push();
    rotate(-angle);
    branch(len * 0.7, level + 1);
    pop();
  }
}`

// ============================================
// ТЕМА 5: ИНТЕРАКТИВ (4 примера)
// ============================================

// Пример 5.1: Рисование мышкой
const drawingCode = `// 🖌️ РИСОВАНИЕ МЫШКОЙ - Интерактив
// Рисуй мышкой, меняй цвета цифрами 1-6

let drawing = false;
let brushColor;
let brushSize = 10;

function setup() {
  createCanvas(400, 400);
  background(255);
  brushColor = color(0, 0, 255);
}

function draw() {
  if (drawing && mouseIsPressed) {
    noStroke();
    fill(brushColor);
    ellipse(mouseX, mouseY, brushSize, brushSize);
  }
  
  fill(0);
  textSize(12);
  text("Кисть: " + brushSize + "px", 10, height - 20);
  
  fill(brushColor);
  ellipse(width - 30, height - 30, 20, 20);
  
  // Подсказки
  fill(0);
  text("1-6: цвет | ↑/↓: размер | Пробел: очистить", 10, 30);
}

function mousePressed() {
  drawing = true;
}

function mouseReleased() {
  drawing = false;
}

function keyPressed() {
  if (key === '1') brushColor = color(255, 0, 0);
  if (key === '2') brushColor = color(0, 255, 0);
  if (key === '3') brushColor = color(0, 0, 255);
  if (key === '4') brushColor = color(255, 255, 0);
  if (key === '5') brushColor = color(255, 0, 255);
  if (key === '6') brushColor = color(0);
  
  if (keyCode === UP_ARROW) brushSize += 2;
  if (keyCode === DOWN_ARROW) brushSize = max(2, brushSize - 2);
  
  if (key === ' ') {
    background(255);
  }
}`

// Пример 5.2: Часы
const clockCode = `// ⏰ ЧАСЫ - Интерактив
// Аналоговые часы с реальным временем

function setup() {
  createCanvas(400, 400);
  angleMode(DEGREES);
}

function draw() {
  background(255);
  
  translate(200, 200);
  
  // Циферблат
  fill(240);
  stroke(0);
  strokeWeight(3);
  ellipse(0, 0, 300, 300);
  
  // Цифры
  fill(0);
  noStroke();
  textSize(20);
  textAlign(CENTER, CENTER);
  
  for (let i = 1; i <= 12; i++) {
    let angle = i * 30 - 90;
    let x = 120 * cos(angle);
    let y = 120 * sin(angle);
    text(i, x, y);
  }
  
  // Метки минут
  stroke(100);
  strokeWeight(1);
  for (let i = 0; i < 60; i++) {
    let angle = i * 6 - 90;
    let x1 = 130 * cos(angle);
    let y1 = 130 * sin(angle);
    let x2 = 140 * cos(angle);
    let y2 = 140 * sin(angle);
    line(x1, y1, x2, y2);
  }
  
  // Время
  let h = hour();
  let m = minute();
  let s = second();
  
  let hourAngle = (h % 12) * 30 + m * 0.5 - 90;
  let minuteAngle = m * 6 - 90;
  let secondAngle = s * 6 - 90;
  
  // Часовая стрелка
  stroke(0);
  strokeWeight(6);
  let hourX = 70 * cos(hourAngle);
  let hourY = 70 * sin(hourAngle);
  line(0, 0, hourX, hourY);
  
  // Минутная стрелка
  stroke(0);
  strokeWeight(4);
  let minuteX = 100 * cos(minuteAngle);
  let minuteY = 100 * sin(minuteAngle);
  line(0, 0, minuteX, minuteY);
  
  // Секундная стрелка
  stroke(255, 0, 0);
  strokeWeight(2);
  let secondX = 120 * cos(secondAngle);
  let secondY = 120 * sin(secondAngle);
  line(0, 0, secondX, secondY);
  
  // Центр
  fill(0);
  noStroke();
  ellipse(0, 0, 15, 15);
  
  // Цифровое время
  resetMatrix();
  fill(0);
  textSize(20);
  textAlign(CENTER);
  text(nf(h, 2) + ":" + nf(m, 2) + ":" + nf(s, 2), 200, 350);
}`

// Пример 5.3: Снежинки (интерактив)
const snowflakesCode = `// ❄️ СНЕЖИНКИ - Интерактив
// Создавай снежинки мышкой

let snowflakes = [];

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(50, 50, 100);
  
  for (let i = snowflakes.length - 1; i >= 0; i--) {
    let s = snowflakes[i];
    s.y += s.speed;
    s.angle += 0.02;
    
    if (s.y > height) {
      snowflakes.splice(i, 1);
      continue;
    }
    
    push();
    translate(s.x, s.y);
    rotate(s.angle);
    
    // Рисуем снежинку
    stroke(255);
    strokeWeight(2);
    for (let j = 0; j < 6; j++) {
      rotate(60);
      line(0, 0, 0, s.size);
      line(0, s.size * 0.5, s.size * 0.3, s.size * 0.7);
      line(0, s.size * 0.5, -s.size * 0.3, s.size * 0.7);
    }
    
    pop();
  }
  
  // Подсказка
  fill(255);
  textSize(16);
  text("Кликни мышкой чтобы создать снежинку", 50, 30);
  text("Снежинок: " + snowflakes.length, 150, 60);
}

function mousePressed() {
  snowflakes.push({
    x: mouseX,
    y: mouseY,
    size: random(10, 30),
    speed: random(1, 3),
    angle: 0
  });
}`

// Пример 5.4: Музыкальный визуализатор
const musicCode = `// 🎵 МУЗЫКАЛЬНЫЙ ВИЗУАЛИЗАТОР - Интерактив
// Двигай мышкой чтобы менять звук (без звука - просто визуализация)

let particles = [];

function setup() {
  createCanvas(400, 400);
  for (let i = 0; i < 50; i++) {
    particles.push({
      x: random(width),
      y: random(height),
      vx: random(-1, 1),
      vy: random(-1, 1),
      size: random(5, 15)
    });
  }
}

function draw() {
  background(0, 50);
  
  // Создаём волны от мыши
  let mouseForce = createVector(mouseX - width/2, mouseY - height/2);
  mouseForce.normalize();
  
  for (let p of particles) {
    // Движение
    p.x += p.vx;
    p.y += p.vy;
    
    // Отскок от стен
    if (p.x < 0 || p.x > width) p.vx *= -1;
    if (p.y < 0 || p.y > height) p.vy *= -1;
    
    // Влияние мыши
    let dir = createVector(p.x - mouseX, p.y - mouseY);
    let dist = dir.mag();
    if (dist < 100) {
      dir.normalize();
      p.vx += dir.x * 0.1;
      p.vy += dir.y * 0.1;
    }
    
    // Ограничение скорости
    p.vx = constrain(p.vx, -3, 3);
    p.vy = constrain(p.vy, -3, 3);
    
    // Цвет зависит от скорости
    let r = map(p.vx, -3, 3, 0, 255);
    let g = map(p.vy, -3, 3, 0, 255);
    let b = map(dist, 0, 200, 255, 0);
    
    fill(r, g, b, 200);
    noStroke();
    ellipse(p.x, p.y, p.size, p.size);
  }
  
  // Эффект мыши
  noFill();
  stroke(255, 100);
  ellipse(mouseX, mouseY, 100, 100);
  ellipse(mouseX, mouseY, 50, 50);
  
  // Подсказка
  fill(255);
  textSize(12);
  text("Двигай мышкой - частицы реагируют!", 10, 30);
}`

// ============================================
// ТЕМА 6: ПРАЗДНИКИ (4 примера)
// ============================================

// Пример 6.1: Флаг России
const russianFlagCode = `// 🇷🇺 ФЛАГ РОССИИ - Праздничный пример
// Триколор: белый, синий, красный

function setup() {
  createCanvas(400, 300);
}

function draw() {
  background(255, 255, 255);
  
  noStroke();
  fill(0, 0, 255);
  rect(0, 100, 400, 100);
  
  fill(255, 0, 0);
  rect(0, 200, 400, 100);
  
  fill(0);
  textSize(24);
  textAlign(CENTER, CENTER);
  
  fill(255);
  text('Флаг России', 200, 50);
  
  textSize(16);
  text('Белый - верх', 200, 150);
  text('Синий - середина', 200, 200);
  text('Красный - низ', 200, 250);
}`

// Пример 6.2: Салют
const fireworksCode = `// 🎆 САЛЮТ - Праздничный пример
// Разноцветные фейерверки

let fireworks = [];

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(0, 50);
  
  if (random() < 0.05) {
    fireworks.push({
      x: random(100, 300),
      y: random(100, 300),
      particles: [],
      exploded: false
    });
  }
  
  for (let i = fireworks.length - 1; i >= 0; i--) {
    let f = fireworks[i];
    
    if (!f.exploded) {
      fill(255);
      ellipse(f.x, f.y, 10, 10);
      f.y -= 2;
      
      if (f.y < 100) {
        f.exploded = true;
        for (let j = 0; j < 20; j++) {
          f.particles.push({
            x: f.x,
            y: f.y,
            vx: random(-3, 3),
            vy: random(-3, 3),
            color: color(random(255), random(255), random(255)),
            life: 255
          });
        }
      }
    } else {
      for (let j = f.particles.length - 1; j >= 0; j--) {
        let p = f.particles[j];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 5;
        
        if (p.life <= 0) {
          f.particles.splice(j, 1);
          continue;
        }
        
        fill(p.color);
        noStroke();
        ellipse(p.x, p.y, 5, 5);
      }
      
      if (f.particles.length == 0) {
        fireworks.splice(i, 1);
      }
    }
  }
  
  fill(255);
  textSize(16);
  text("С Новым Годом!", 120, 30);
}`

// Пример 6.3: День рождения
const birthdayCode = `// 🎂 ДЕНЬ РОЖДЕНИЯ - Праздничный пример
// Торт и шарики

let balloons = [];

function setup() {
  createCanvas(400, 400);
  
  for (let i = 0; i < 5; i++) {
    balloons.push({
      x: 50 + i * 70,
      y: 300,
      size: 30,
      color: color(random(255), random(255), random(255))
    });
  }
}

function draw() {
  background(135, 206, 235);
  
  // Солнце
  fill(255, 255, 0);
  ellipse(350, 50, 50, 50);
  
  // Торт
  fill(255, 200, 150);
  rect(150, 250, 100, 50);
  rect(140, 230, 120, 20);
  
  // Свечи
  fill(255, 255, 255);
  rect(175, 210, 5, 20);
  rect(195, 210, 5, 20);
  rect(215, 210, 5, 20);
  
  // Огоньки
  fill(255, 0, 0);
  ellipse(177, 205, 5, 5);
  ellipse(197, 205, 5, 5);
  ellipse(217, 205, 5, 5);
  
  // Шарики
  for (let ball of balloons) {
    ball.y -= 0.5;
    if (ball.y < 50) ball.y = 300;
    
    fill(ball.color);
    ellipse(ball.x, ball.y, ball.size, ball.size);
    
    // Верёвочка
    stroke(0);
    line(ball.x, ball.y + ball.size/2, ball.x, ball.y + 30);
  }
  
  // Подпись
  fill(255);
  textSize(24);
  text("С Днём Рождения!", 100, 100);
}`

// Пример 6.4: Хэллоуин
const halloweenCode = `// 🎃 ХЭЛЛОУИН - Праздничный пример
// Тыквы и привидения

let ghosts = [];

function setup() {
  createCanvas(400, 400);
  
  for (let i = 0; i < 3; i++) {
    ghosts.push({
      x: random(width),
      y: random(height),
      speed: random(1, 3)
    });
  }
}

function draw() {
  background(0);
  
  // Луна
  fill(255, 255, 200);
  ellipse(350, 50, 40, 40);
  
  // Тыквы
  for (let x = 100; x < 300; x += 100) {
    fill(255, 100, 0);
    ellipse(x, 300, 60, 50);
    
    fill(0, 255, 0);
    rect(x - 5, 280, 3, 10);
    
    fill(0);
    ellipse(x - 10, 295, 5, 5);
    ellipse(x + 10, 295, 5, 5);
    
    fill(255, 0, 0);
    triangle(x - 5, 305, x + 5, 305, x, 315);
  }
  
  // Привидения
  for (let ghost of ghosts) {
    ghost.x += ghost.speed;
    if (ghost.x > width) ghost.x = 0;
    
    fill(255, 255, 255, 200);
    noStroke();
    ellipse(ghost.x, ghost.y, 30, 40);
    
    fill(0);
    ellipse(ghost.x - 8, ghost.y - 5, 3, 3);
    ellipse(ghost.x + 8, ghost.y - 5, 3, 3);
  }
  
  fill(255, 100, 0);
  textSize(24);
  text("Happy Halloween!", 100, 100);
}`

// ============================================
// ТЕМА 7: АНИМАЦИЯ (2 примера)
// ============================================

// Пример 7.1: Падающие звёзды
const fallingStarsCode = `// ⭐ ПАДАЮЩИЕ ЗВЁЗДЫ - Анимация
// Звёзды падают с неба и исчезают

let stars = [];

function setup() {
  createCanvas(400, 400);
  
  for (let i = 0; i < 5; i++) {
    stars.push(new Star());
  }
}

function draw() {
  for (let y = 0; y < height; y++) {
    let dark = map(y, 0, height, 20, 0);
    stroke(0, 0, dark);
    line(0, y, width, y);
  }
  
  for (let i = stars.length - 1; i >= 0; i--) {
    stars[i].update();
    stars[i].show();
    
    if (stars[i].y > height + 20) {
      stars.splice(i, 1);
    }
  }
  
  if (random() < 0.05) {
    stars.push(new Star());
  }
  
  fill(255);
  textSize(12);
  text("Звёзд на экране: " + stars.length, 10, 30);
}

class Star {
  constructor() {
    this.x = random(width);
    this.y = random(-100, 0);
    this.speed = random(2, 5);
    this.size = random(5, 15);
    this.brightness = 255;
  }
  
  update() {
    this.y += this.speed;
    this.brightness *= 0.99;
  }
  
  show() {
    push();
    translate(this.x, this.y);
    
    fill(255, 255, 100, this.brightness);
    noStroke();
    ellipse(0, 0, this.size, this.size);
    
    stroke(255, 255, 100, this.brightness * 0.7);
    strokeWeight(1);
    for (let i = 0; i < 8; i++) {
      let angle = i * PI / 4;
      let x1 = cos(angle) * this.size / 2;
      let y1 = sin(angle) * this.size / 2;
      let x2 = cos(angle) * this.size;
      let y2 = sin(angle) * this.size;
      line(x1, y1, x2, y2);
    }
    
    pop();
  }
}`

// Пример 7.2: Бегущий человек
const runnerCode = `// 🏃 БЕГУЩИЙ ЧЕЛОВЕК - Анимация
// Человечек бежит по экрану

let x = 0;
let frame = 0;

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(135, 206, 235);
  
  // Земля
  fill(34, 139, 34);
  rect(0, 300, width, 100);
  
  // Облака
  fill(255);
  ellipse(50, 50, 40, 20);
  ellipse(70, 40, 40, 20);
  ellipse(90, 50, 40, 20);
  
  ellipse(250, 80, 40, 20);
  ellipse(270, 70, 40, 20);
  ellipse(290, 80, 40, 20);
  
  // Солнце
  fill(255, 255, 0);
  ellipse(350, 50, 40, 40);
  
  // Бегущий человек
  push();
  translate(x, 250);
  
  // Тело
  fill(0);
  ellipse(0, -20, 20, 30);
  
  // Голова
  ellipse(0, -45, 15, 15);
  
  // Ноги (анимация)
  let legOffset = sin(frame * 0.5) * 10;
  line(0, -5, -10, 10 + legOffset);
  line(0, -5, 10, 10 - legOffset);
  
  // Руки
  line(0, -20, -10, -30);
  line(0, -20, 10, -30);
  
  pop();
  
  x += 2;
  if (x > width + 50) x = -50;
  
  frame++;
  
  fill(255);
  textSize(16);
  text("Бегущий человек", 10, 30);
}`

// Функция загрузки примера в редактор
function loadExample(code: string) {
  emit('loadExample', code)
}

// Функция закрытия панели
function closePanel() {
  emit('close')
}
</script>

<template>
  <!-- 
    Основной контейнер панели с примерами
    Класс theme определяет цветовую тему (тёмную или светлую)
  -->
  <div class="examples-panel" :class="`theme-${theme}`">
    <!-- Заголовок панели -->
    <div class="panel-header">
      <h3 class="panel-title">
        <span class="title-icon">🎨</span>
        Галерея примеров (33 шт.)
      </h3>
      <!-- Кнопка закрытия панели (крестик) -->
      <button class="close-btn" @click="closePanel" title="Закрыть панель примеров">
        <span class="close-icon">✕</span>
      </button>
    </div>
    
    <!-- Описание панели -->
    <div class="panel-description">
      Нажми на любой пример, чтобы загрузить его код в редактор
    </div>
    
    <!-- Список примеров по темам -->
    <div class="examples-list">
      
      <!-- ТЕМА 1: ВРЕМЕНА ГОДА И ПРИРОДА (8 примеров) -->
      <div class="theme-section">
        <div class="theme-header">
          <span class="theme-icon">🌍</span>
          <span class="theme-title">Времена года и природа (8)</span>
        </div>
      </div>
      
      <!-- Пример 1.1: Снеговик -->
      <div class="example-card" @click="loadExample(snowmanCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <circle cx="50" cy="65" r="20" fill="white" stroke="#666" stroke-width="1"/>
            <circle cx="50" cy="40" r="15" fill="white" stroke="#666" stroke-width="1"/>
            <circle cx="50" cy="20" r="10" fill="white" stroke="#666" stroke-width="1"/>
            <circle cx="45" cy="17" r="1.5" fill="black"/>
            <circle cx="55" cy="17" r="1.5" fill="black"/>
            <polygon points="50,22 60,20 50,25" fill="orange"/>
            <rect x="42" y="8" width="16" height="4" fill="black"/>
            <rect x="45" y="2" width="10" height="6" fill="black"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">☃️ Снеговик</h4>
          <p class="card-desc">Весёлый снеговик с шляпой и падающим снегом</p>
          <div class="card-tags">
            <span class="tag">зима</span>
            <span class="tag">снег</span>
            <span class="tag">анимация</span>
          </div>
        </div>
      </div>
      
      <!-- Пример 1.2: Новогодняя ёлка -->
      <div class="example-card" @click="loadExample(treeCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <polygon points="50,10 30,35 70,35" fill="green"/>
            <polygon points="50,25 25,50 75,50" fill="green"/>
            <polygon points="50,40 20,65 80,65" fill="green"/>
            <rect x="45" y="65" width="10" height="15" fill="brown"/>
            <circle cx="40" cy="30" r="3" fill="red"/>
            <circle cx="60" cy="40" r="3" fill="blue"/>
            <circle cx="35" cy="55" r="3" fill="yellow"/>
            <polygon points="50,5 53,12 60,12 54,17 57,25 50,20 43,25 46,17 40,12 47,12" fill="gold"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">🎄 Новогодняя ёлка</h4>
          <p class="card-desc">Нарядная ёлка с игрушками и мигающей гирляндой</p>
          <div class="card-tags">
            <span class="tag">зима</span>
            <span class="tag">праздник</span>
            <span class="tag">мигание</span>
          </div>
        </div>
      </div>
      
      <!-- Пример 1.3: Волшебный лес -->
      <div class="example-card" @click="loadExample(forestCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <rect x="30" y="50" width="5" height="30" fill="brown"/>
            <circle cx="32" cy="45" r="12" fill="green"/>
            <rect x="60" y="40" width="5" height="40" fill="brown"/>
            <circle cx="62" cy="35" r="12" fill="green"/>
            <circle cx="20" cy="30" r="3" fill="yellow"/>
            <circle cx="80" cy="60" r="3" fill="yellow"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">🌳 Волшебный лес</h4>
          <p class="card-desc">Лес с мерцающими светлячками</p>
          <div class="card-tags">
            <span class="tag">природа</span>
            <span class="tag">светлячки</span>
            <span class="tag">атмосфера</span>
          </div>
        </div>
      </div>
      
      <!-- Пример 1.4: Подводный мир -->
      <div class="example-card" @click="loadExample(underwaterCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <circle cx="30" cy="40" r="10" fill="orange"/>
            <circle cx="60" cy="60" r="8" fill="blue"/>
            <circle cx="40" cy="70" r="6" fill="yellow"/>
            <circle cx="70" cy="30" r="4" fill="red"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">🌊 Подводный мир</h4>
          <p class="card-desc">Рыбки и пузырьки в океане</p>
          <div class="card-tags">
            <span class="tag">море</span>
            <span class="tag">рыбки</span>
            <span class="tag">анимация</span>
          </div>
        </div>
      </div>
      
      <!-- Пример 1.5: Цветущий сад -->
      <div class="example-card" @click="loadExample(gardenCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <circle cx="30" cy="40" r="5" fill="red"/>
            <circle cx="50" cy="30" r="5" fill="yellow"/>
            <circle cx="70" cy="50" r="5" fill="blue"/>
            <circle cx="40" cy="70" r="5" fill="purple"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">🌸 Цветущий сад</h4>
          <p class="card-desc">Цветы колышутся на ветру</p>
          <div class="card-tags">
            <span class="tag">весна</span>
            <span class="tag">цветы</span>
            <span class="tag">бабочки</span>
          </div>
        </div>
      </div>
      
      <!-- Пример 1.6: Гроза -->
      <div class="example-card" @click="loadExample(stormCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <rect x="20" y="20" width="60" height="30" fill="gray"/>
            <line x1="30" y1="60" x2="30" y2="80" stroke="blue"/>
            <line x1="50" y1="60" x2="50" y2="80" stroke="blue"/>
            <line x1="70" y1="60" x2="70" y2="80" stroke="blue"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">⛈️ Гроза</h4>
          <p class="card-desc">Дождь, молнии и тучи</p>
          <div class="card-tags">
            <span class="tag">погода</span>
            <span class="tag">дождь</span>
            <span class="tag">молния</span>
          </div>
        </div>
      </div>
      
      <!-- Пример 1.7: Осенний парк -->
      <div class="example-card" @click="loadExample(autumnCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <rect x="40" y="40" width="5" height="30" fill="brown"/>
            <circle cx="42" cy="35" r="15" fill="orange"/>
            <circle cx="20" cy="60" r="3" fill="red"/>
            <circle cx="60" cy="50" r="3" fill="yellow"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">🍂 Осенний парк</h4>
          <p class="card-desc">Падающие листья и деревья</p>
          <div class="card-tags">
            <span class="tag">осень</span>
            <span class="tag">листья</span>
            <span class="tag">ветер</span>
          </div>
        </div>
      </div>
      
      <!-- Пример 1.8: Пустыня -->
      <div class="example-card" @click="loadExample(desertCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <rect x="20" y="40" width="5" height="20" fill="green"/>
            <rect x="50" y="30" width="5" height="30" fill="green"/>
            <rect x="70" y="45" width="5" height="15" fill="green"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">🏜️ Пустыня</h4>
          <p class="card-desc">Кактусы, песок и миражи</p>
          <div class="card-tags">
            <span class="tag">пустыня</span>
            <span class="tag">кактусы</span>
            <span class="tag">мираж</span>
          </div>
        </div>
      </div>
      
      <!-- ТЕМА 2: КОСМОС (4 примера) -->
      <div class="theme-section">
        <div class="theme-header">
          <span class="theme-icon">🚀</span>
          <span class="theme-title">Космос (4)</span>
        </div>
      </div>
      
      <!-- Пример 2.1: Солнечная система -->
      <div class="example-card" @click="loadExample(solarSystemCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <circle cx="50" cy="50" r="12" fill="yellow"/>
            <circle cx="65" cy="35" r="3" fill="orange"/>
            <circle cx="75" cy="50" r="4" fill="lightblue"/>
            <circle cx="60" cy="70" r="5" fill="red"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">🪐 Солнечная система</h4>
          <p class="card-desc">Планеты вращаются вокруг Солнца</p>
          <div class="card-tags">
            <span class="tag">космос</span>
            <span class="tag">планеты</span>
            <span class="tag">орбиты</span>
          </div>
        </div>
      </div>
      
      <!-- Пример 2.2: Звёздное небо -->
      <div class="example-card" @click="loadExample(starsCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <circle cx="20" cy="20" r="2" fill="white"/>
            <circle cx="40" cy="30" r="3" fill="white"/>
            <circle cx="70" cy="40" r="2" fill="white"/>
            <circle cx="30" cy="70" r="2" fill="white"/>
            <circle cx="60" cy="60" r="3" fill="white"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">⭐ Звёздное небо</h4>
          <p class="card-desc">Мерцающие звёзды и созвездия</p>
          <div class="card-tags">
            <span class="tag">звёзды</span>
            <span class="tag">созвездия</span>
            <span class="tag">мерцание</span>
          </div>
        </div>
      </div>
      
      <!-- Пример 2.3: Луноход -->
      <div class="example-card" @click="loadExample(moonRoverCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <rect x="30" y="40" width="30" height="15" fill="gray"/>
            <circle cx="35" cy="55" r="5" fill="black"/>
            <circle cx="55" cy="55" r="5" fill="black"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">🚀 Луноход</h4>
          <p class="card-desc">Управляй луноходом стрелками</p>
          <div class="card-tags">
            <span class="tag">управление</span>
            <span class="tag">луна</span>
            <span class="tag">транспорт</span>
          </div>
        </div>
      </div>
      
      <!-- Пример 2.4: Инопланетяне -->
      <div class="example-card" @click="loadExample(aliensCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <ellipse cx="50" cy="40" rx="20" ry="10" fill="silver"/>
            <ellipse cx="50" cy="30" rx="10" ry="5" fill="silver"/>
            <circle cx="40" cy="35" r="2" fill="green"/>
            <circle cx="60" cy="35" r="2" fill="green"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">👽 Инопланетяне</h4>
          <p class="card-desc">НЛО прилетели на Землю</p>
          <div class="card-tags">
            <span class="tag">НЛО</span>
            <span class="tag">пришельцы</span>
            <span class="tag">фантастика</span>
          </div>
        </div>
      </div>
      
      <!-- ТЕМА 3: ИГРЫ (5 примеров) -->
      <div class="theme-section">
        <div class="theme-header">
          <span class="theme-icon">🎮</span>
          <span class="theme-title">Игры (5)</span>
        </div>
      </div>
      
      <!-- Пример 3.1: Поймай шарик -->
      <div class="example-card" @click="loadExample(catchGameCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <circle cx="30" cy="30" r="10" fill="red"/>
            <circle cx="60" cy="50" r="10" fill="blue"/>
            <circle cx="40" cy="70" r="10" fill="green"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">🎮 Поймай шарик</h4>
          <p class="card-desc">Лови шарики мышкой, не дай упасть</p>
          <div class="card-tags">
            <span class="tag">игра</span>
            <span class="tag">мышь</span>
            <span class="tag">счёт</span>
          </div>
        </div>
      </div>
      
      <!-- Пример 3.2: Змейка -->
      <div class="example-card" @click="loadExample(snakeGameCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <rect x="20" y="20" width="10" height="10" fill="green"/>
            <rect x="30" y="20" width="10" height="10" fill="green"/>
            <rect x="40" y="20" width="10" height="10" fill="green"/>
            <circle cx="45" cy="25" r="3" fill="red"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">🐍 Змейка</h4>
          <p class="card-desc">Классическая игра - ешь яблоки</p>
          <div class="card-tags">
            <span class="tag">игра</span>
            <span class="tag">стрелки</span>
            <span class="tag">классика</span>
          </div>
        </div>
      </div>
      
      <!-- Пример 3.3: Пинг-понг -->
      <div class="example-card" @click="loadExample(pongGameCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <rect x="10" y="30" width="5" height="20" fill="white"/>
            <rect x="85" y="40" width="5" height="20" fill="white"/>
            <circle cx="50" cy="50" r="5" fill="white"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">🏓 Пинг-понг</h4>
          <p class="card-desc">Игра для двоих (W/S и стрелки)</p>
          <div class="card-tags">
            <span class="tag">игра</span>
            <span class="tag">двоих</span>
            <span class="tag">спорт</span>
          </div>
        </div>
      </div>
      
      <!-- Пример 3.4: Лабиринт -->
      <div class="example-card" @click="loadExample(mazeGameCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <rect x="10" y="10" width="10" height="10" fill="gray"/>
            <rect x="30" y="30" width="10" height="10" fill="gray"/>
            <circle cx="15" cy="15" r="3" fill="red"/>
            <circle cx="75" cy="75" r="3" fill="green"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">🧩 Лабиринт</h4>
          <p class="card-desc">Найди выход из лабиринта</p>
          <div class="card-tags">
            <span class="tag">игра</span>
            <span class="tag">лабиринт</span>
            <span class="tag">стрелки</span>
          </div>
        </div>
      </div>
      
      <!-- Пример 3.5: Космический стрелок -->
      <div class="example-card" @click="loadExample(shooterGameCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <triangle points="50,10 40,30 60,30" fill="green"/>
            <rect x="45" y="70" width="10" height="20" fill="red"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">👾 Космический стрелок</h4>
          <p class="card-desc">Стреляй по врагам пробелом</p>
          <div class="card-tags">
            <span class="tag">игра</span>
            <span class="tag">стрельба</span>
            <span class="tag">космос</span>
          </div>
        </div>
      </div>
      
      <!-- ТЕМА 4: ГЕОМЕТРИЧЕСКИЕ УЗОРЫ (6 примеров) -->
      <div class="theme-section">
        <div class="theme-header">
          <span class="theme-icon">🔷</span>
          <span class="theme-title">Геометрические узоры (6)</span>
        </div>
      </div>
      
      <!-- Пример 4.1: Радужная спираль -->
      <div class="example-card" @click="loadExample(rainbowSpiralCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <path d="M50,50 Q60,30 70,40 Q80,50 70,60 Q60,70 40,60 Q30,50 50,50" 
                  fill="none" stroke="red" stroke-width="2"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">🌈 Радужная спираль</h4>
          <p class="card-desc">Спираль с переливающимися цветами</p>
          <div class="card-tags">
            <span class="tag">радуга</span>
            <span class="tag">спираль</span>
            <span class="tag">анимация</span>
          </div>
        </div>
      </div>
      
      <!-- Пример 4.2: Цветная мозаика -->
      <div class="example-card" @click="loadExample(mosaicCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <rect x="10" y="10" width="15" height="15" fill="red"/>
            <rect x="30" y="10" width="15" height="15" fill="blue"/>
            <rect x="50" y="10" width="15" height="15" fill="green"/>
            <rect x="10" y="30" width="15" height="15" fill="yellow"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">🧩 Цветная мозаика</h4>
          <p class="card-desc">Случайные цвета каждую секунду</p>
          <div class="card-tags">
            <span class="tag">узор</span>
            <span class="tag">квадраты</span>
            <span class="tag">случайность</span>
          </div>
        </div>
      </div>
      
      <!-- Пример 4.3: Круги на воде -->
      <div class="example-card" @click="loadExample(circlesCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <circle cx="50" cy="50" r="20" fill="none" stroke="blue" stroke-width="2"/>
            <circle cx="50" cy="50" r="30" fill="none" stroke="blue" stroke-width="1"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">💧 Круги на воде</h4>
          <p class="card-desc">Круги расходятся от клика мыши</p>
          <div class="card-tags">
            <span class="tag">интерактив</span>
            <span class="tag">круги</span>
            <span class="tag">вода</span>
          </div>
        </div>
      </div>
      
      <!-- Пример 4.4: Мандала -->
      <div class="example-card" @click="loadExample(mandalaCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <circle cx="50" cy="50" r="20" fill="none" stroke="purple"/>
            <circle cx="50" cy="50" r="30" fill="none" stroke="blue"/>
            <circle cx="50" cy="50" r="40" fill="none" stroke="red"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">🕉️ Мандала</h4>
          <p class="card-desc">Симметричный узор с вращением</p>
          <div class="card-tags">
            <span class="tag">симметрия</span>
            <span class="tag">вращение</span>
            <span class="tag">узор</span>
          </div>
        </div>
      </div>
      
      <!-- Пример 4.5: Клеточный автомат -->
      <div class="example-card" @click="loadExample(automatonCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <rect x="10" y="10" width="5" height="5" fill="black"/>
            <rect x="20" y="10" width="5" height="5" fill="black"/>
            <rect x="15" y="20" width="5" height="5" fill="black"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">🧬 Клеточный автомат</h4>
          <p class="card-desc">Математическая красота (Правило 30)</p>
          <div class="card-tags">
            <span class="tag">математика</span>
            <span class="tag">клетки</span>
            <span class="tag">узор</span>
          </div>
        </div>
      </div>
      
      <!-- Пример 4.6: Фрактальное дерево -->
      <div class="example-card" @click="loadExample(fractalTreeCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <line x1="50" y1="80" x2="50" y2="40" stroke="brown"/>
            <line x1="50" y1="60" x2="30" y2="40" stroke="green"/>
            <line x1="50" y1="60" x2="70" y2="40" stroke="green"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">🌳 Фрактальное дерево</h4>
          <p class="card-desc">Дерево, растущее само в себя</p>
          <div class="card-tags">
            <span class="tag">фрактал</span>
            <span class="tag">дерево</span>
            <span class="tag">математика</span>
          </div>
        </div>
      </div>
      
      <!-- ТЕМА 5: ИНТЕРАКТИВ (4 примера) -->
      <div class="theme-section">
        <div class="theme-header">
          <span class="theme-icon">🖱️</span>
          <span class="theme-title">Интерактив (4)</span>
        </div>
      </div>
      
      <!-- Пример 5.1: Рисование мышкой -->
      <div class="example-card" @click="loadExample(drawingCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <circle cx="30" cy="30" r="10" fill="red"/>
            <circle cx="50" cy="50" r="10" fill="blue"/>
            <circle cx="70" cy="70" r="10" fill="green"/>
            <line x1="20" y1="80" x2="80" y2="20" stroke="black"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">🖌️ Рисование мышкой</h4>
          <p class="card-desc">Рисуй, меняй цвет цифрами 1-6</p>
          <div class="card-tags">
            <span class="tag">рисование</span>
            <span class="tag">мышь</span>
            <span class="tag">творчество</span>
          </div>
        </div>
      </div>
      
      <!-- Пример 5.2: Часы -->
      <div class="example-card" @click="loadExample(clockCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <circle cx="50" cy="50" r="40" fill="white" stroke="black"/>
            <line x1="50" y1="50" x2="50" y2="20" stroke="black"/>
            <line x1="50" y1="50" x2="70" y2="50" stroke="black"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">⏰ Часы</h4>
          <p class="card-desc">Аналоговые часы с реальным временем</p>
          <div class="card-tags">
            <span class="tag">время</span>
            <span class="tag">часы</span>
            <span class="tag">реальное</span>
          </div>
        </div>
      </div>
      
      <!-- Пример 5.3: Снежинки (интерактив) -->
      <div class="example-card" @click="loadExample(snowflakesCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <path d="M50,20 L50,30 M40,25 L60,25" stroke="white"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">❄️ Снежинки</h4>
          <p class="card-desc">Создавай снежинки кликом мыши</p>
          <div class="card-tags">
            <span class="tag">снег</span>
            <span class="tag">интерактив</span>
            <span class="tag">зима</span>
          </div>
        </div>
      </div>
      
      <!-- Пример 5.4: Музыкальный визуализатор -->
      <div class="example-card" @click="loadExample(musicCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <circle cx="30" cy="30" r="5" fill="red"/>
            <circle cx="50" cy="50" r="5" fill="blue"/>
            <circle cx="70" cy="70" r="5" fill="green"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">🎵 Музыкальный визуализатор</h4>
          <p class="card-desc">Частицы реагируют на мышь</p>
          <div class="card-tags">
            <span class="tag">частицы</span>
            <span class="tag">музыка</span>
            <span class="tag">интерактив</span>
          </div>
        </div>
      </div>
      
      <!-- ТЕМА 6: ПРАЗДНИКИ (4 примера) -->
      <div class="theme-section">
        <div class="theme-header">
          <span class="theme-icon">🎉</span>
          <span class="theme-title">Праздники (4)</span>
        </div>
      </div>
      
      <!-- Пример 6.1: Флаг России -->
      <div class="example-card" @click="loadExample(russianFlagCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <rect x="10" y="15" width="80" height="20" fill="white" stroke="black"/>
            <rect x="10" y="35" width="80" height="20" fill="blue" stroke="black"/>
            <rect x="10" y="55" width="80" height="20" fill="red" stroke="black"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">🇷🇺 Флаг России</h4>
          <p class="card-desc">Триколор: белый, синий, красный</p>
          <div class="card-tags">
            <span class="tag">Россия</span>
            <span class="tag">флаг</span>
            <span class="tag">символ</span>
          </div>
        </div>
      </div>
      
      <!-- Пример 6.2: Салют -->
      <div class="example-card" @click="loadExample(fireworksCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <circle cx="30" cy="30" r="2" fill="red"/>
            <circle cx="40" cy="20" r="2" fill="blue"/>
            <circle cx="50" cy="30" r="2" fill="green"/>
            <circle cx="60" cy="40" r="2" fill="yellow"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">🎆 Салют</h4>
          <p class="card-desc">Разноцветные фейерверки</p>
          <div class="card-tags">
            <span class="tag">праздник</span>
            <span class="tag">фейерверк</span>
            <span class="tag">анимация</span>
          </div>
        </div>
      </div>
      
      <!-- Пример 6.3: День рождения -->
      <div class="example-card" @click="loadExample(birthdayCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <rect x="30" y="50" width="40" height="20" fill="pink"/>
            <circle cx="40" cy="40" r="5" fill="red"/>
            <circle cx="50" cy="40" r="5" fill="blue"/>
            <circle cx="60" cy="40" r="5" fill="green"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">🎂 День рождения</h4>
          <p class="card-desc">Торт и воздушные шарики</p>
          <div class="card-tags">
            <span class="tag">праздник</span>
            <span class="tag">торт</span>
            <span class="tag">шарики</span>
          </div>
        </div>
      </div>
      
      <!-- Пример 6.4: Хэллоуин -->
      <div class="example-card" @click="loadExample(halloweenCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <ellipse cx="50" cy="50" rx="20" ry="15" fill="orange"/>
            <circle cx="40" cy="45" r="2" fill="black"/>
            <circle cx="60" cy="45" r="2" fill="black"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">🎃 Хэллоуин</h4>
          <p class="card-desc">Тыквы и привидения</p>
          <div class="card-tags">
            <span class="tag">хэллоуин</span>
            <span class="tag">тыква</span>
            <span class="tag">привидения</span>
          </div>
        </div>
      </div>
      
      <!-- ТЕМА 7: АНИМАЦИЯ (2 примера) -->
      <div class="theme-section">
        <div class="theme-header">
          <span class="theme-icon">🎬</span>
          <span class="theme-title">Анимация (2)</span>
        </div>
      </div>
      
      <!-- Пример 7.1: Падающие звёзды -->
      <div class="example-card" @click="loadExample(fallingStarsCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <circle cx="30" cy="30" r="5" fill="yellow"/>
            <circle cx="60" cy="50" r="5" fill="yellow"/>
            <circle cx="40" cy="70" r="5" fill="yellow"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">⭐ Падающие звёзды</h4>
          <p class="card-desc">Звёзды падают и исчезают</p>
          <div class="card-tags">
            <span class="tag">анимация</span>
            <span class="tag">звёзды</span>
            <span class="tag">падение</span>
          </div>
        </div>
      </div>
      
      <!-- Пример 7.2: Бегущий человек -->
      <div class="example-card" @click="loadExample(runnerCode)">
        <div class="card-preview">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <circle cx="50" cy="40" r="5" fill="black"/>
            <line x1="50" y1="45" x2="50" y2="60" stroke="black"/>
            <line x1="50" y1="50" x2="40" y2="55" stroke="black"/>
            <line x1="50" y1="50" x2="60" y2="55" stroke="black"/>
          </svg>
        </div>
        <div class="card-info">
          <h4 class="card-title">🏃 Бегущий человек</h4>
          <p class="card-desc">Человечек бежит по экрану</p>
          <div class="card-tags">
            <span class="tag">анимация</span>
            <span class="tag">бег</span>
            <span class="tag">человек</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Подсказка внизу панели -->
    <div class="panel-footer">
      <span class="hint-icon">💡</span>
      <span class="hint-text">Всего 33 примера в 7 темах! Кликни по карточке — код загрузится и запустится!</span>
    </div>
  </div>
</template>

<style scoped>
/* 
  Стили для панели примеров
  Здесь описано, как будет выглядеть наша панель
*/

/* Основной контейнер панели */
.examples-panel {
  width: 360px;
  height: 100%;
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(10px);
  border-right: 1px solid #404040;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s;
  animation: slideIn 0.3s ease;
  z-index: 20;
}

/* Стили для светлой темы */
.examples-panel.theme-light {
  background: rgba(255, 255, 255, 0.95);
  border-right-color: #e0e0e0;
}

/* Заголовок панели */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.theme-light .panel-header {
  border-bottom-color: rgba(0, 0, 0, 0.1);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: white;
}

.theme-light .panel-title {
  color: #333;
}

.title-icon {
  font-size: 20px;
}

/* Кнопка закрытия */
.close-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 18px;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.theme-light .close-btn {
  color: rgba(0, 0, 0, 0.6);
}

.theme-light .close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: black;
}

/* Описание панели */
.panel-description {
  padding: 10px 15px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(0, 0, 0, 0.2);
}

.theme-light .panel-description {
  color: rgba(0, 0, 0, 0.6);
  border-bottom-color: rgba(0, 0, 0, 0.05);
  background: rgba(0, 0, 0, 0.02);
}

/* Список примеров */
.examples-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Заголовок темы */
.theme-section {
  margin-top: 5px;
  margin-bottom: 5px;
}

.theme-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(100, 108, 255, 0.2);
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #646cff;
  border-left: 3px solid #646cff;
}

.theme-light .theme-header {
  background: rgba(100, 108, 255, 0.1);
  color: #646cff;
}

.theme-icon {
  font-size: 18px;
}

.theme-title {
  font-size: 14px;
}

/* Карточка примера */
.example-card {
  display: flex;
  gap: 12px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  margin-left: 10px;
}

.example-card:hover {
  background: rgba(100, 108, 255, 0.2);
  border-color: #646cff;
  transform: translateX(5px);
}

.theme-light .example-card {
  background: rgba(0, 0, 0, 0.02);
}

.theme-light .example-card:hover {
  background: rgba(100, 108, 255, 0.1);
}

/* Область превью */
.card-preview {
  width: 60px;
  height: 60px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.theme-light .card-preview {
  background: rgba(255, 255, 255, 0.5);
}

/* Информация о примере */
.card-info {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 2px 0;
  color: white;
}

.theme-light .card-title {
  color: #333;
}

.card-desc {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 4px 0;
  line-height: 1.3;
}

.theme-light .card-desc {
  color: rgba(0, 0, 0, 0.7);
}

/* Теги примера */
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.tag {
  font-size: 8px;
  padding: 1px 4px;
  background: rgba(100, 108, 255, 0.2);
  border-radius: 8px;
  color: #646cff;
  text-transform: lowercase;
}

.theme-light .tag {
  background: rgba(100, 108, 255, 0.1);
}

/* Подвал панели */
.panel-footer {
  padding: 10px 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.theme-light .panel-footer {
  border-top-color: rgba(0, 0, 0, 0.1);
  color: rgba(0, 0, 0, 0.5);
}

.hint-icon {
  font-size: 12px;
}

.hint-text {
  flex: 1;
}

/* Анимация появления */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Стили для скроллбара */
.examples-list::-webkit-scrollbar {
  width: 5px;
}

.examples-list::-webkit-scrollbar-track {
  background: transparent;
}

.examples-list::-webkit-scrollbar-thumb {
  background: rgba(100, 108, 255, 0.3);
  border-radius: 3px;
}

.examples-list::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 108, 255, 0.5);
}
</style>