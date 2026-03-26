# Ввод с клавиатуры: `keyPressed()`, `keyCode`

## 📌 Что это такое?

p5.js позволяет реагировать на нажатия клавиш:

| Функция / Переменная | Зачем нужна |
|---------------------|-------------|
| `keyPressed()` | Срабатывает при нажатии любой клавиши |
| `key` | Содержит символ (букву, цифру) |
| `keyCode` | Код специальной клавиши (стрелки, Enter, etc.) |
| `keyIsDown(code)` | Проверяет, нажата ли клавиша прямо сейчас |

---

## Пример 1: Печатаем на холсте

**Файл:** `sketch_04.js`

```javascript
let message = "Нажми любую клавишу!";

function setup() {
  createCanvas(400, 400);
  textAlign(CENTER, CENTER);
  textSize(20);
}

function draw() {
  background(220);
  fill(0);
  text(message, width/2, height/2);
}

// Эта функция вызывается при нажатии любой клавиши
function keyPressed() {
  message = "Ты нажал: " + key;
  console.log("Нажата клавиша:", key);
}
```

### 🔍 Как это работает:

1. `keyPressed()` — специальная функция, p5.js вызывает её автоматически
2. `key` содержит символ, который нажал пользователь
3. Меняем `message` и на следующем кадре она отрисуется

---

## Пример 2: Управление стрелками

**Файл:** `sketch_05.js`

```javascript
let x = 200;
let y = 200;
let size = 50;

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  fill(255, 0, 0);
  ellipse(x, y, size);
}

function keyPressed() {
  // Стрелка вверх
  if (keyCode === UP_ARROW) {
    y = y - 20;
    console.log("Вверх");
  }
  // Стрелка вниз
  else if (keyCode === DOWN_ARROW) {
    y = y + 20;
    console.log("Вниз");
  }
  // Стрелка влево
  else if (keyCode === LEFT_ARROW) {
    x = x - 20;
    console.log("Влево");
  }
  // Стрелка вправо
  else if (keyCode === RIGHT_ARROW) {
    x = x + 20;
    console.log("Вправо");
  }
}
```

### 🎮 Коды клавиш:

| Клавиша | Код |
|---------|-----|
| ↑ | `UP_ARROW` |
| ↓ | `DOWN_ARROW` |
| ← | `LEFT_ARROW` |
| → | `RIGHT_ARROW` |
| Enter | `ENTER` |
| Пробел | `SPACE` |
| Escape | `ESCAPE` |

---

## Пример 3: Плавное движение (keyIsDown)

**Файл:** `sketch_06.js`

```javascript
let x = 200;
let y = 200;
let speed = 5;

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  
  // Проверяем, нажаты ли клавиши ПРЯМО СЕЙЧАС
  if (keyIsDown(LEFT_ARROW)) {
    x = x - speed;
  }
  if (keyIsDown(RIGHT_ARROW)) {
    x = x + speed;
  }
  if (keyIsDown(UP_ARROW)) {
    y = y - speed;
  }
  if (keyIsDown(DOWN_ARROW)) {
    y = y + speed;
  }
  
  // Рисуем игрока
  fill(0, 200, 0);
  ellipse(x, y, 50);
  
  // Рисуем подсказку
  fill(0);
  textSize(14);
  text("Используй стрелки для движения", 100, 380);
}
```

### 🔄 В чём разница?

| Способ | Когда срабатывает | Для чего |
|--------|-------------------|----------|
| `keyPressed()` | Один раз при нажатии | Ввод текста, выстрелы |
| `keyIsDown()` | Пока клавиша нажата | Плавное движение |

---

## Пример 4: Цвет по клавише

**Файл:** `sketch_07.js`

```javascript
let currentColor = color(255, 0, 0);

function setup() {
  createCanvas(400, 400);
  textAlign(CENTER, CENTER);
  textSize(18);
}

function draw() {
  background(220);
  
  fill(currentColor);
  ellipse(width/2, height/2, 200);
  
  fill(0);
  textSize(14);
  text("Нажми: R-красный, G-зелёный, B-синий", width/2, 350);
}

function keyPressed() {
  // Меняем цвет по буквам
  if (key === 'r' || key === 'R') {
    currentColor = color(255, 0, 0);
    console.log("Красный");
  }
  else if (key === 'g' || key === 'G') {
    currentColor = color(0, 255, 0);
    console.log("Зелёный");
  }
  else if (key === 'b' || key === 'B') {
    currentColor = color(0, 0, 255);
    console.log("Синий");
  }
}
```

---

## 🎯 Запомни:

| Что использовать | Когда |
|------------------|-------|
| `keyPressed()` | Нужно реагировать на факт нажатия |
| `key` | Нужен символ (буква, цифра) |
| `keyCode` | Нужна специальная клавиша (стрелки) |
| `keyIsDown()` | Нужно плавное движение |

---

## 🧪 Задание для самостоятельной работы:

Создай игру, где:
1. Квадратик двигается стрелками
2. При нажатии пробела — квадратик меняет цвет
3. При нажатии 'R' — возвращается в центр
