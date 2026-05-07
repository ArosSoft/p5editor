# Урок 8: Фоновые частицы и финальные штрихи

Почти готово! Добавим красивый фон с движущимися частицами, соединяющимися линиями.

## Что такое фоновые частицы?
Это маленькие точки, которые движутся по экрану и соединяются линиями, создавая космический эффект.

## Добавляем фоновые частицы

```javascript
let backgroundPoints = [];
let numPoints = 50;    // Количество частиц
let maxLineDist = 110; // Максимальное расстояние для соединения линией

function setup() {
  createCanvas(LOGIC_W, LOGIC_H);
  calculateField();
  initPlayersAndPuck();
  initBackgroundPoints();
}

function initBackgroundPoints() {
  // Создаём частицы со случайными параметрами
  for (let i = 0; i < numPoints; i++) {
    backgroundPoints.push({
      x: random(fieldLeft, fieldRight),
      y: random(fieldTop, fieldBottom),
      vx: random(-1.2, 1.2),  // Скорость по X
      vy: random(-1.2, 1.2),  // Скорость по Y
      radius: random(2, 3.5), // Размер
      color: [random(100, 255), random(100, 255), random(100, 255)] // Цвет
    });
  }
}

function updateBackgroundPoints() {
  // Обновляем позицию и проверяем отскок от стен
  for (let p of backgroundPoints) {
    p.x += p.vx;
    p.y += p.vy;
    
    // Отскок от стен
    if (p.x - p.radius < fieldLeft) {
      p.x = fieldLeft + p.radius;
      p.vx = abs(p.vx);
    }
    if (p.x + p.radius > fieldRight) {
      p.x = fieldRight - p.radius;
      p.vx = -abs(p.vx);
    }
    if (p.y - p.radius < fieldTop) {
      p.y = fieldTop + p.radius;
      p.vy = abs(p.vy);
    }
    if (p.y + p.radius > fieldBottom) {
      p.y = fieldBottom - p.radius;
      p.vy = -abs(p.vy);
    }
  }
}

function drawBackgroundPointsAndLines() {
  // Рисуем линии между близкими частицами
  for (let i = 0; i < backgroundPoints.length; i++) {
    for (let j = i + 1; j < backgroundPoints.length; j++) {
      let p1 = backgroundPoints[i];
      let p2 = backgroundPoints[j];
      let d = dist(p1.x, p1.y, p2.x, p2.y);
      
      if (d < maxLineDist) {
        strokeWeight(map(d, 0, maxLineDist, 2, 0.3));
        stroke(200, 200, 255, 40);
        line(p1.x, p1.y, p2.x, p2.y);
      }
    }
  }
  
  // Рисуем сами частицы
  noStroke();
  for (let p of backgroundPoints) {
    fill(p.color[0], p.color[1], p.color[2], 180);
    ellipse(p.x, p.y, p.radius * 2);
  }
}
```

![Фоновые частицы](images/step8.png)

## Что мы узнали:
- Как создать анимированный фон
- Как рисовать линии между близкими объектами
- Как использовать случайные значения для создания разнообразия

## Поздравляем! Игра готова! 🎉

Ты созрел(а) настоящего разработчика игр! У тебя есть:
- Двухигровая игра для совместной игры
- Физика движения и столкновений
- Система счёта и ворота
- Красивые визуальные эффекты
- Анимированный фон

### Финальное задание
Попробуй изменить параметры частиц. Что получится, если увеличить `numPoints` или `maxLineDist`? Experiment!