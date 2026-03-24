// Глобальная переменная - массив для хранения всех планет
let planets = [];

// Класс Planet - чертёж для создания планет
class Planet {
  constructor(c, r, d, s, hasRings, name) {
    this.color = c;           // Цвет планеты
    this.radius = r;          // Радиус в пикселях
    this.distance = d;        // Расстояние от Солнца
    this.speed = s;           // Скорость вращения
    this.angle = random(TWO_PI); // Случайный угол старта
    this.hasRings = hasRings; // Есть ли кольца (для Сатурна)
    this.name = name;         // Название планеты
  }

  // Метод update() - движение планеты по орбите
  update() {
    this.angle += this.speed;
  }

  // Метод show() - рисование планеты
  show() {
    let x = cos(this.angle) * this.distance;
    let y = sin(this.angle) * this.distance;
    
    // Рисуем кольца (если есть) ДО планеты
    if (this.hasRings) {
      noFill();
      stroke(200, 180, 150, 150);
      strokeWeight(3);
      ellipse(x, y, this.radius * 2.5, this.radius * 2.5);
    }
    
    // Рисуем планету
    fill(this.color);
    noStroke();
    ellipse(x, y, this.radius, this.radius);
    
    // Рисуем название планеты
    fill(255);
    textSize(10);
    textAlign(CENTER);
    text(this.name, x, y - this.radius - 5);
  }
}

// Функция setup() - выполняется один раз при запуске
function setup() {
  createCanvas(600, 600);

  // Добавляем планеты в массив
  // Параметры: color(R, G, B), radius, distance, speed, hasRings, name
  
  planets.push(new Planet(color(200, 150, 100), 10, 80, 0.02, false, "Меркурий"));
  planets.push(new Planet(color(255, 200, 100), 14, 120, 0.015, false, "Венера"));
  planets.push(new Planet(color(100, 150, 255), 16, 160, 0.01, false, "Земля"));
  planets.push(new Planet(color(255, 100, 100), 12, 200, 0.008, false, "Марс"));
  planets.push(new Planet(color(200, 150, 100), 22, 260, 0.005, false, "Юпитер"));
  planets.push(new Planet(color(210, 180, 140), 20, 320, 0.004, true, "Сатурн"));
  planets.push(new Planet(color(150, 200, 200), 18, 380, 0.003, false, "Уран"));
  planets.push(new Planet(color(100, 100, 255), 17, 440, 0.002, false, "Нептун"));
}

// Функция draw() - выполняется бесконечно (~60 раз в секунду)
function draw() {
  // Очистка экрана (чёрный фон)
  background(0);
  
  // Сохраняем текущее состояние трансформации
  push();
  
  // Перемещаем центр координат в середину холста
  translate(width / 2, height / 2);
  
  // Рисуем Солнце с эффектом свечения
  // 3 полупрозрачных круга для свечения
  for (let i = 3; i > 0; i--) {
    fill(255, 200, 0, 50);
    ellipse(0, 0, 60 + i * 20, 60 + i * 20);
  }
  // Само Солнце (яркое)
  fill(255, 255, 0);
  ellipse(0, 0, 50, 50);
  
  // Рисуем орбиты планет
  noFill();
  stroke(100);
  strokeWeight(0.5);
  for (let planet of planets) {
    ellipse(0, 0, planet.distance * 2, planet.distance * 2);
  }
  
  // Обновляем и рисуем каждую планету
  for (let planet of planets) {
    planet.update();
    planet.show();
  }
  
  // Восстанавливаем состояние трансформации
  pop();
}
