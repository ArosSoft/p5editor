# Урок 4: Движение шайбы и отскок от стен

Отлично! Игроки могут двигаться! Теперь научим шайбу летать и отскакивать от стен.

## Как работает движение в играх?
Мы будем использовать простую физику: каждый кадр шайба смещается на `vx` пикселей по горизонтали и `vy` по вертикали.

## Добавляем физику шайбы

```javascript
let puckSpeed = 8;  // Скорость шайбы

function draw() {
  // ... остальной код ...
  
  updatePuck();  // Обновляем позицию шайбы
  drawPuck();
}

function updatePuck() {
  // Перемещаем шайбу
  puck.x += puck.vx;
  puck.y += puck.vy;
  
  // Отскок от верхней стены
  if (puck.y - puckRadius < fieldTop) {
    puck.y = fieldTop + puckRadius;  // Возвращаем за стену
    puck.vy = abs(puck.vy);          // Меняем направление (делаем положительным)
  }
  
  // Отскок от нижней стены
  if (puck.y + puckRadius > fieldBottom) {
    puck.y = fieldBottom - puckRadius;
    puck.vy = -abs(puck.vy);         // Меняем направление (делаем отрицательным)
  }
  
  // Отскок от левой стены
  if (puck.x - puckRadius < fieldLeft) {
    puck.x = fieldLeft + puckRadius;
    puck.vx = abs(puck.vx);
  }
  
  // Отскок от правой стены
  if (puck.x + puckRadius > fieldRight) {
    puck.x = fieldRight - puckRadius;
    puck.vx = -abs(puck.vx);
  }
}

// Добавим начальное движение шайбы в setup()
function setup() {
  createCanvas(LOGIC_W, LOGIC_H);
  calculateField();
  initPlayersAndPuck();
  
  // Даем шайбе начальную скорость
  puck.vx = 5;
  puck.vy = 3;
}
```

![Летящая шайба](images/step4.gif)

## Что мы узнали:
- Как реализовать движение объекта
- Как проверять столкновения со стенами
- Как отражать объект от стен

### Задание для самопроверки
Попробуй изменить начальную скорость шайбы. Что произойдёт, если задать большие значения?