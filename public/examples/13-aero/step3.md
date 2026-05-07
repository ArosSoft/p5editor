# Урок 3: Добавляем шайбу и управление

Отлично! Игроки появились! Теперь добавим шайбу и научим игроков перемещаться по щелчку мыши.

## Как управлять игроками?
Мы будем использовать клики мыши. Левый игрок управляется левой половиной поля, правый - правой.

## Добавляем шайбу и управление

```javascript
let puckRadius = 22;  // Радиус шайбы
let puck;             // Переменная для шайбы

function initPlayersAndPuck() {
  // ... код игроков из прошлого урока ...
  
  // Создаём шайбу в центре поля
  puck = {
    x: LOGIC_W / 2,   // Центр по ширине
    y: LOGIC_H / 2,   // Центр по высоте
    vx: 0,            // Скорость по X (пока 0)
    vy: 0             // Скорость по Y (пока 0)
  };
}

function draw() {
  background(20, 20, 40);
  noStroke();
  fill(15, 25, 50);
  rect(fieldLeft, fieldTop, fieldRight - fieldLeft, fieldBottom - fieldTop, 8);
  
  drawPlayer(leftPlayer);
  drawPlayer(rightPlayer);
  drawPuck();  // Рисуем шайбу
}

function drawPuck() {
  // Рисуем белую шайбу
  fill(255);
  noStroke();
  ellipse(puck.x, puck.y, puckRadius * 2);
}

function mousePressed() {
  // Левая половина экрана - управление левым игроком
  if (mouseX < LOGIC_W / 2) {
    leftPlayer.x = mouseX;
    leftPlayer.y = mouseY;
  } else {
    // Правая половина экрана - управление правым игроком
    rightPlayer.x = mouseX;
    rightPlayer.y = mouseY;
  }
}
```

![Шайба между игроками](images/step3.png)

## Что мы узнали:
- Как создать объект шайбы
- Как рисовать шайбу белым цветом
- Как управлять игроками кликами мыши

### Задание для самопроверки
Попробуй запустить игру и пощёлкать по разным частям экрана. Что происходит с игроками?