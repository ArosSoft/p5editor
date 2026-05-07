# Урок 6: Ворота и счёт

Отлично! Шайба отскакивает от игроков! Теперь добавим ворота и систему счёта.

## Как работают ворота в аэрохокке?
Ворота находятся в центре верх и низ. Если шайба пролетает мимо ворот - это гол!

## Добавляем ворота

```javascript
let goalHeight = 200;    // Высота ворот
let goalTop, goalBottom; // Границы ворот
let leftScore = 0;       // Счёт синего игрока
let rightScore = 0;      // Счёт красного игрока

function calculateField() {
  // ... предыдущий код ...
  
  // Вычисляем границы ворот
  goalTop = (LOGIC_H - goalHeight) / 2;
  goalBottom = goalTop + goalHeight;
}

function updatePuck() {
  // ... предыдущий код ...
  
  // Проверяем голы
  // Гол против левого игрока (шайба ушла мимо левых ворот)
  if (puck.x - puckRadius <= fieldLeft && puck.y > goalTop && puck.y < goalBottom) {
    rightScore++;  // Очко правому игроку
    resetPuckPosition();
  }
  
  // Гол против правого игрока (шайба ушла мимо правых ворот)
  if (puck.x + puckRadius >= fieldRight && puck.y > goalTop && puck.y < goalBottom) {
    leftScore++;   // Очко левому игроку
    resetPuckPosition();
  }
}

function resetPuckPosition() {
  puck.x = LOGIC_W / 2;
  puck.y = LOGIC_H / 2;
  puck.vx = 0;
  puck.vy = 0;
}

function draw() {
  // ... рисуем поле и игроков ...
  
  // Рисуем счёт
  fill(255);
  textSize(32);
  textAlign(CENTER, CENTER);
  text(leftScore, LOGIC_W/2 - 50, 30);
  text(':', LOGIC_W/2, 30);
  text(rightScore, LOGIC_W/2 + 50, 30);
  
  // Рисуем ворота (красные прямоугольники)
  fill(255, 50, 50, 100);
  noStroke();
  rect(fieldLeft - 15, goalTop, 15, goalHeight);   // Левые ворота
  rect(fieldRight, goalTop, 15, goalHeight);        // Правые ворота
}
```

![Ворота и счёт](images/step6.png)

## Что мы узнали:
- Как определить, что шайба попала в ворота
- Как вести счёт
- Как рисовать ворота на поле

### Задание для самопроверки
Попробуй изменить количество очков для победы. Добавь условие, что игра заканчивается, когда кто-то набрал 5 очков.