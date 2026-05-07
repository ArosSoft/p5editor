# Урок 2: Создаём игроков и шайбу

Отлично! Игровое поле готово. Теперь добавим игроков и шайбу - главные элементы игры.

## Что такие объекты в JavaScript?
Мы будем хранить параметры игроков и шайбы в виде объектов. Объект - это набор свойств, например координаты, цвет, размер.

## Создаём игроков
Добавим в код функцию создания игроков и шайбы:

```javascript
// Параметры игроков
let playerRadius = 32;  // Радиус игрока
let leftPlayer, rightPlayer;  // Две переменные для игроков

function setup() {
  createCanvas(LOGIC_W, LOGIC_H);
  calculateField();
  initPlayersAndPuck();  // Создаём игроков и шайбу
}

function draw() {
  background(20, 20, 40);
  
  // Рисуем поле
  noStroke();
  fill(15, 25, 50);
  rect(fieldLeft, fieldTop, fieldRight - fieldLeft, fieldBottom - fieldTop, 8);
  
  // Рисуем игроков
  drawPlayer(leftPlayer);   // Левый (синий) игрок
  drawPlayer(rightPlayer);  // Правый (красный) игрок
}

function initPlayersAndPuck() {
  // Создаём левого игрока (синий)
  leftPlayer = {
    x: fieldLeft + 20,      // Начинаем чуть правее левой границы
    y: LOGIC_H / 2,         // По центру по высоте
    color: [50, 100, 255]   // Синий цвет
  };
  
  // Создаём правого игрока (красный)
  rightPlayer = {
    x: fieldRight - 20,     // Чуть левее правой границы
    y: LOGIC_H / 2,
    color: [255, 60, 60]    // Красный цвет
  };
}

function drawPlayer(player) {
  // Рисуем кружок игрока
  fill(player.color[0], player.color[1], player.color[2]);
  noStroke();
  ellipse(player.x, player.y, playerRadius * 2);
}
```

![Два игрока на поле](images/step2.png)

## Что мы узнали:
- Как создавать объекты для хранения данных
- Как рисовать кружки разного цвета
- Как разместить игроков по разные стороны поля

### Задание для самопроверки
Попробуй изменить размер игроков (измени `playerRadius`). Или поменяй их цвета, используя другие значения RGB.