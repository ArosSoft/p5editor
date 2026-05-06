# Полный справочник p5.js

Справочник содержит все основные функции и ключевые слова p5.js, сгруппированные по категориям.

---

## Оглавление

1. [Environment (Окружение)](#environment-окружение)
2. [Color (Цвет)](#color-цвет)
3. [Shape (Фигуры)](#shape-фигуры)
4. [Math (Математика)](#math-математика)
5. [Input/Events (Ввод и события)](#inputevents-ввод-и-события)
6. [Image (Изображения)](#image-изображения)
7. [Typography (Типографика)](#typography-типографика)
8. [Transform (Трансформации)](#transform-трансформации)
9. [Lights & Camera (Свет и камера)](#lights--camera-свет-и-камера)
10. [DOM (DOM-элементы)](#dom-dom-элементы)
11. [Data (Данные)](#data-данные)
12. [IO (Ввод/Вывод)](#io-вводвывод)

---

## Environment (Окружение)

| Функция | Описание |
|---------|----------|
| 1.1 `createCanvas(w, h)` | Создаёт холст заданной ширины и высоты |
| 1.2 `setup()` | Вызывается один раз при инициализации программы |
| 1.3 `draw()` | Вызывается непрерывно для отрисовки кадров |
| 1.4 `resizeCanvas(w, h)` | Изменяет размер холста |
| 1.5 `noCanvas()` | Удаляет холст по умолчанию |
| 1.6 `blendMode(mode)` | Устанавливает режим смешивания цветов |
| 1.7 `print(content)` | Выводит содержимое в консоль браузера |
| 1.8 `cursor(type)` | Устанавливает тип курсора |
| 1.9 `frameRate(fps)` | Устанавливает частоту кадров в секунду |
| 1.10 `noCursor()` | Скрывает курсор |
| 1.11 `fullscreen([value])` | Получает/устанавливает полноэкранный режим |
| 1.12 `pixelDensity([density])` | Устанавливает плотность пикселей |
| 1.13 `displayDensity()` | Возвращает плотность пикселей дисплея |
| 1.14 `getURL()` | Возвращает текущий URL |
| 1.15 `getURLPath()` | Возвращает путь URL как массив |
| 1.16 `getURLParams()` | Возвращает параметры URL как объект |
| 1.17 `windowResized()` | Вызывается при изменении размера окна |
| 1.18 `width` | Ширина холста (свойство) |
| 1.19 `height` | Высота холста (свойство) |
| 1.20 `windowWidth` | Ширина окна браузера (свойство) |
| 1.21 `windowHeight` | Высота окна браузера (свойство) |
| 1.22 `displayWidth` | Ширина экрана устройства (свойство) |
| 1.23 `displayHeight` | Высота экрана устройства (свойство) |

**Пример:**
```javascript
function setup() {
  createCanvas(800, 600);
  frameRate(60);
}

function draw() {
  background(220);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
```

---

## Color (Цвет)

### Создание и чтение цвета

| Функция | Описание |
|---------|----------|
| 2.1 `color(v1, v2, v3, [a])` | Создаёт цвет из RGB/HSB значений |
| 2.2 `red(c)` | Извлекает красную компоненту из цвета |
| 2.3 `green(c)` | Извлекает зелёную компоненту из цвета |
| 2.4 `blue(c)` | Извлекает синюю компоненту из цвета |
| 2.5 `alpha(c)` | Извлекает альфа-канал из цвета |
| 2.6 `hue(c)` | Извлекает оттенок (HSB/HSL) |
| 2.7 `saturation(c)` | Извлекает насыщенность (HSB/HSL) |
| 2.8 `brightness(c)` | Извлекает яркость (HSB) |
| 2.9 `lightness(c)` | Извлекает светлоту (HSL) |
| 2.10 `lerpColor(c1, c2, amt)` | Интерполирует между двумя цветами |

### Настройка цвета

| Функция | Описание |
|---------|----------|
| 2.11 `background(v1, v2, v3)` | Устанавливает цвет фона |
| 2.12 `clear()` | Очищает буфер пикселей |
| 2.13 `fill(v1, v2, v3, [a])` | Устанавливает цвет заливки фигур |
| 2.14 `noFill()` | Отключает заливку фигур |
| 2.15 `stroke(v1, v2, v3, [a])` | Устанавливает цвет обводки |
| 2.16 `noStroke()` | Отключает обводку |
| 2.17 `erase([strength], [shadowStrength])` | Включает режим стирания |
| 2.18 `noErase()` | Отключает режим стирания |
| 2.19 `colorMode(mode, [max1], [max2], [max3], [maxA])` | Устанавливает режим цвета (RGB/HSB/HSL) |

**Пример:**
```javascript
function setup() {
  createCanvas(400, 400);
  colorMode(HSB, 360, 100, 100);
}

function draw() {
  background(200, 50, 90);
  
  fill(0, 80, 100);
  noStroke();
  circle(200, 200, 100);
  
  let c = color(255, 0, 0);
  print(red(c)); // 255
}
```

---

## Shape (Фигуры)

### 2D Примитивы

| Функция | Описание |
|---------|----------|
| 3.1 `arc(x, y, w, h, start, stop, [mode])` | Рисует дугу |
| 3.2 `circle(x, y, d)` | Рисует круг |
| 3.3 `ellipse(x, y, w, [h])` | Рисует эллипс |
| 3.4 `line(x1, y1, x2, y2)` | Рисует линию между двумя точками |
| 3.5 `point(x, y, [z])` | Рисует точку |
| 3.6 `quad(x1, y1, x2, y2, x3, y3, x4, y4)` | Рисует четырёхугольник |
| 3.7 `rect(x, y, w, h, [tl, tr, br, bl])` | Рисует прямоугольник |
| 3.8 `square(x, y, s)` | Рисует квадрат |
| 3.9 `triangle(x1, y1, x2, y2, x3, y3)` | Рисует треугольник |

### Атрибуты фигур

| Функция | Описание |
|---------|----------|
| 3.10 `ellipseMode(mode)` | Устанавливает режим отрисовки эллипсов (CENTER/RADIUS/CORNER/CORNERS) |
| 3.11 `rectMode(mode)` | Устанавливает режим отрисовки прямоугольников |
| 3.12 `strokeWeight(weight)` | Устанавливает толщину обводки |
| 3.13 `strokeCap(cap)` | Устанавливает стиль концов линий (ROUND/SQUARE/PROJECT) |
| 3.14 `strokeJoin(join)` | Устанавливает стиль соединения линий (ROUND/BEVEL/MITER) |
| 3.15 `smooth()` | Включает сглаживание |

### Кривые

| Функция | Описание |
|---------|----------|
| 3.16 `bezier(x1, y1, x2, y2, x3, y3, x4, y4)` | Рисует кривую Безье |
| 3.17 `bezierDetail(detail)` | Устанавливает детализацию кривых Безье |
| 3.18 `bezierPoint(a, b, c, d, t)` | Вычисляет точку на кривой Безье |
| 3.19 `curve(x1, y1, x2, y2, x3, y3, x4, y4)` | Рисует сплайн-кривую |
| 3.20 `curveDetail(detail)` | Устанавливает детализацию кривых |
| 3.21 `curveTightness(tightness)` | Устанавливает натяжение кривых |
| 3.22 `curvePoint(a, b, c, d, t)` | Вычисляет точку на сплайн-кривой |

### Вершины и сложные формы

| Функция | Описание |
|---------|----------|
| 3.23 `beginShape([kind])` | Начинает определение сложной формы |
| 3.24 `endShape([mode])` | Завершает определение формы |
| 3.25 `vertex(x, y, [z], [u], [v])` | Добавляет вершину к форме |
| 3.26 `bezierVertex(x2, y2, x3, y3, x4, y4)` | Добавляет вершину кривой Безье |
| 3.27 `curveVertex(x, y)` | Добавляет вершину сплайн-кривой |
| 3.28 `quadraticVertex(cx, cy, x3, y3)` | Добавляет квадратичную вершину Безье |
| 3.29 `beginContour()` | Начинает внутренний контур (дырку) |
| 3.30 `endContour()` | Завершает внутренний контур |

### 3D Примитивы

| Функция | Описание |
|---------|----------|
| 3.31 `plane([width], [height], [detailX], [detailY])` | Рисует плоскость |
| 3.32 `box([width], [height], [depth], [detail])` | Рисует коробку |
| 3.33 `sphere([radius], [detailX], [detailY])` | Рисует сферу |
| 3.34 `cylinder([radius], [height], [detailX], [detailY])` | Рисует цилиндр |
| 3.35 `cone([radius], [height], [detailX], [detailY])` | Рисует конус |
| 3.36 `ellipsoid([radiusX], [radiusY], [radiusZ])` | Рисует эллипсоид |
| 3.37 `torus([radius], [tube], [detailX], [detailY])` | Рисует тор |

### 3D Модели

| Функция | Описание |
|---------|----------|
| 3.38 `loadModel(path, [successCallback])` | Загружает 3D модель из файла |
| 3.39 `model(model, [x], [y], [z])` | Отрисовывает 3D модель |

**Пример:**
```javascript
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  
  // 2D фигуры
  rect(50, 50, 100, 100);
  circle(250, 100, 80);
  
  // Кривая Безье
  noFill();
  stroke(255, 0, 0);
  bezier(50, 300, 150, 200, 250, 400, 350, 300);
  
  // Сложная форма
  fill(0, 255, 0);
  beginShape();
  vertex(100, 100);
  vertex(150, 50);
  vertex(200, 100);
  endShape(CLOSE);
}
```

---

## Math (Математика)

### Вычисления

| Функция | Описание |
|---------|----------|
| 4.1 `abs(n)` | Возвращает абсолютное значение |
| 4.2 `ceil(n)` | Округляет вверх до ближайшего целого |
| 4.3 `constrain(n, low, high)` | Ограничивает число диапазоном |
| 4.4 `dist(x1, y1, x2, y2, [z1], [z2])` | Вычисляет расстояние между точками |
| 4.5 `floor(n)` | Округляет вниз до ближайшего целого |
| 4.6 `lerp(start, stop, amt)` | Линейная интерполяция |
| 4.7 `log(n)` | Натуральный логарифм |
| 4.8 `mag(x, y, [z])` | Длина вектора (магнитуда) |
| 4.9 `max(n1, n2, n3, ...)` | Максимальное значение |
| 4.10 `min(n1, n2, n3, ...)` | Минимальное значение |
| 4.11 `pow(n, exponent)` | Возведение в степень |
| 4.12 `round(n, [decimals])` | Округление до ближайшего целого |
| 4.13 `sq(n)` | Квадрат числа |
| 4.14 `sqrt(n)` | Квадратный корень |
| 4.15 `fract(n)` | Дробная часть числа |

### Векторы

| Функция | Описание |
|---------|----------|
| 4.16 `createVector([x], [y], [z])` | Создаёт новый вектор p5.Vector |

### Шум Перлина

| Функция | Описание |
|---------|----------|
| 4.17 `noise(x, [y], [z])` | Возвращает значение шума Перлина |
| 4.18 `noiseSeed(seed)` | Устанавливает зерно для шума |
| 4.19 `noiseDetail(lod, [falloff])` | Устанавливает детализацию шума |

### Случайные числа

| Функция | Описание |
|---------|----------|
| 4.20 `random([min], [max])` | Возвращает случайное число |
| 4.21 `randomSeed(seed)` | Устанавливает зерно для случайных чисел |
| 4.22 `randomGaussian([mean], [deviation])` | Возвращает случайное число по Гауссу |

### Тригонометрия

| Функция | Описание |
|---------|----------|
| 4.23 `acos(value)` | Арккосинус |
| 4.24 `asin(value)` | Арксинус |
| 4.25 `atan(value)` | Арктангенс |
| 4.26 `atan2(y, x)` | Арктангенс от y/x с учётом квадранта |
| 4.27 `cos(angle)` | Косинус угла |
| 4.28 `sin(angle)` | Синус угла |
| 4.29 `tan(angle)` | Тангенс угла |
| 4.30 `degrees(radians)` | Конвертирует радианы в градусы |
| 4.31 `radians(degrees)` | Конвертирует градусы в радианы |
| 4.32 `angleMode(mode)` | Устанавливает режим углов (DEGREES/RADIANS) |

**Пример:**
```javascript
function setup() {
  createCanvas(400, 400);
  angleMode(DEGREES);
}

function draw() {
  background(220);
  
  // Тригонометрия
  let angle = frameCount % 360;
  let x = 200 + cos(angle) * 100;
  let y = 200 + sin(angle) * 100;
  
  circle(x, y, 20);
  
  // Шум Перлина
  let n = noise(frameCount * 0.01) * 255;
  fill(n);
  rect(10, 10, 50, 50);
  
  // Векторы
  let v = createVector(mouseX, mouseY);
  let mag = v.mag();
  print(mag);
}
```

---

## Input/Events (Ввод и события)

### Клавиатура

| Функция/Свойство | Описание |
|------------------|----------|
| 5.1 `keyIsPressed` | true, если любая клавиша нажата |
| 5.2 `key` | Значение последней нажатой клавиши |
| 5.3 `keyCode` | Код последней нажатой клавиши |
| 5.4 `keyPressed()` | Вызывается при нажатии клавиши |
| 5.5 `keyReleased()` | Вызывается при отпускании клавиши |
| 5.6 `keyTyped()` | Вызывается при вводе символа |
| 5.7 `keyIsDown(code)` | Проверяет, нажата ли клавиша с данным кодом |

### Мышь

| Функция/Свойство | Описание |
|------------------|----------|
| 5.8 `mouseX` | Текущая X-координата мыши на холсте |
| 5.9 `mouseY` | Текущая Y-координата мыши на холсте |
| 5.10 `pmouseX` | Предыдущая X-координата мыши |
| 5.11 `pmouseY` | Предыдущая Y-координата мыши |
| 5.12 `winMouseX` | X-координата мыши относительно окна |
| 5.13 `winMouseY` | Y-координата мыши относительно окна |
| 5.14 `mouseIsPressed` | true, если кнопка мыши нажата |
| 5.15 `mouseButton` | Какая кнопка мыши нажата (LEFT/RIGHT/CENTER) |
| 5.16 `mouseMoved()` | Вызывается при перемещении мыши |
| 5.17 `mouseDragged()` | Вызывается при перетаскивании мыши |
| 5.18 `mousePressed()` | Вызывается при нажатии кнопки мыши |
| 5.19 `mouseReleased()` | Вызывается при отпускании кнопки мыши |
| 5.20 `mouseClicked()` | Вызывается при клике мыши |
| 5.21 `doubleClicked()` | Вызывается при двойном клике |
| 5.22 `mouseWheel(event)` | Вызывается при прокрутке колеса |

### Тач (сенсорный ввод)

| Функция/Свойство | Описание |
|------------------|----------|
| 5.23 `touches` | Массив активных касаний |
| 5.24 `touchStarted()` | Вызывается при начале касания |
| 5.25 `touchMoved()` | Вызывается при перемещении касания |
| 5.26 `touchEnded()` | Вызывается при окончании касания |

**Пример:**
```javascript
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  
  if (mouseIsPressed) {
    fill(255, 0, 0);
  } else {
    fill(0, 255, 0);
  }
  
  circle(mouseX, mouseY, 50);
  
  if (keyIsPressed) {
    print('Нажата клавиша:', key);
  }
}

function keyPressed() {
  if (keyCode === ENTER) {
    print('Enter нажат!');
  }
}

function mousePressed() {
  print('Клик мыши в:', mouseX, mouseY);
}
```

---

## Image (Изображения)

### Загрузка и отрисовка

| Функция | Описание |
|---------|----------|
| 6.1 `loadImage(path, [successCallback])` | Загружает изображение как p5.Image |
| 6.2 `image(img, x, y, [w], [h])` | Отрисовывает изображение |
| 6.3 `imageMode(mode)` | Устанавливает режим отрисовки изображений |

### Обработка изображений

| Функция | Описание |
|---------|----------|
| 6.4 `tint(v1, v2, v3, [a])` | Устанавливает тонирование для изображений |
| 6.5 `noTint()` | Отключает тонирование |
| 6.6 `filter(mode, [param])` | Применяет фильтр к изображению/холсту |
| 6.7 `mask(img)` | Применяет маску к изображению |
| 6.8 `resize(w, h)` | Изменяет размер изображения (метод p5.Image) |

### Сохранение

| Функция | Описание |
|---------|----------|
| 6.9 `saveCanvas([selectedCanvas], [filename], [extension])` | Сохраняет холст как изображение |
| 6.10 `save([object], [filename], [options])` | Сохраняет изображение или данные |

### GIF анимация (методы p5.Image)

| Функция | Описание |
|---------|----------|
| 6.11 `numFrames()` | Возвращает количество кадров GIF |
| 6.12 `getCurrentFrame()` | Возвращает текущий кадр |
| 6.13 `setFrame(frame)` | Устанавливает текущий кадр |
| 6.14 `reset()` | Сбрасывает GIF к началу |
| 6.15 `delay(time)` | Устанавливает задержку между кадрами |

**Пример:**
```javascript
let img;

function preload() {
  img = loadImage('assets/myImage.jpg');
}

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  image(img, 0, 0, width, height);
  
  // Применение фильтра
  if (mouseIsPressed) {
    filter(THRESHOLD);
  }
}

function keyPressed() {
  saveCanvas('myCanvas', 'png');
}
```

---

## Typography (Типографика)

### Атрибуты текста

| Функция | Описание |
|---------|----------|
| 7.1 `text(str, x, y, [w], [h])` | Рисует текст на холсте |
| 7.2 `textAlign([horizontal], [vertical])` | Устанавливает выравнивание текста |
| 7.3 `textLeading(leading)` | Устанавливает межстрочный интервал |
| 7.4 `textSize(size)` | Устанавливает размер шрифта |
| 7.5 `textStyle(style)` | Устанавливает стиль текста (NORMAL/BOLD/ITALIC) |
| 7.6 `textWidth(str)` | Вычисляет ширину текста |
| 7.7 `textAscent()` | Возвращает подъём текущего шрифта |
| 7.8 `textDescent()` | Возвращает спуск текущего шрифта |

### Шрифты

| Функция | Описание |
|---------|----------|
| 7.9 `loadFont(path, [successCallback])` | Загружает шрифт как p5.Font |
| 7.10 `textFont(font, [size])` | Устанавливает шрифт для текста |
| 7.11 `textBounds(str, x, y, [fontSize])` | Возвращает ограничивающую рамку текста |

**Пример:**
```javascript
let font;

function preload() {
  font = loadFont('assets/myFont.ttf');
}

function setup() {
  createCanvas(400, 400);
  textFont(font);
  textSize(32);
  textAlign(CENTER, CENTER);
}

function draw() {
  background(220);
  fill(0);
  text('Hello p5.js!', width/2, height/2);
  
  let w = textWidth('Hello p5.js!');
  print('Ширина текста:', w);
}
```

---

## Transform (Трансформации)

| Функция | Описание |
|---------|----------|
| 8.1 `push()` | Сохраняет текущие настройки стиля и трансформации |
| 8.2 `pop()` | Восстанавливает последние сохранённые настройки |
| 8.3 `translate(x, [y], [z])` | Перемещает начало координат |
| 8.4 `rotate(angle, [mode])` | Поворачивает холст вокруг начала координат |
| 8.5 `scale(s, [y], [z])` | Масштабирует холст |
| 8.6 `shearX(angle)` | Наклоняет холст по оси X |
| 8.7 `shearY(angle)` | Наклоняет холст по оси Y |
| 8.8 `applyMatrix(a, b, c, d, e, f)` | Применяет матрицу трансформации |
| 8.9 `resetMatrix()` | Сбрасывает матрицу трансформации к единичной |
| 8.10 `rotateX(angle)` | Поворачивает вокруг оси X (3D) |
| 8.11 `rotateY(angle)` | Поворачивает вокруг оси Y (3D) |
| 8.12 `rotateZ(angle)` | Поворачивает вокруг оси Z (3D) |

**Пример:**
```javascript
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  
  // Сохраняем состояние
  push();
  translate(width/2, height/2);
  rotate(frameCount * 0.01);
  fill(255, 0, 0);
  rect(-50, -50, 100, 100);
  pop(); // Восстанавливаем состояние
  
  // Без трансформации
  fill(0, 255, 0);
  rect(10, 10, 50, 50);
}
```

---

## Lights & Camera (Свет и камера)

### Свет

| Функция | Описание |
|---------|----------|
| 9.1 `lights()` | Включает стандартное освещение |
| 9.2 `noLights()` | Отключает все источники света |
| 9.3 `ambientLight(r, g, b, [a])` | Добавляет окружающий свет |
| 9.4 `directionalLight(r, g, b, nx, ny, nz)` | Добавляет направленный свет |
| 9.5 `pointLight(r, g, b, x, y, z)` | Добавляет точечный источник света |
| 9.6 `spotLight(r, g, b, x, y, z, nx, ny, nz, angle, [conc])` | Добавляет прожектор |
| 9.7 `lightFalloff(constant, linear, quadratic)` | Устанавливает затухание света |
| 9.8 `specularColor(r, g, b)` | Устанавливает цвет зеркального блика |

### Материалы

| Функция | Описание |
|---------|----------|
| 9.9 `normalMaterial()` | Использует нормали для окраски |
| 9.10 `ambientMaterial(r, g, b)` | Устанавливает окружающий материал |
| 9.11 `emissiveMaterial(r, g, b)` | Устанавливает излучающий материал |
| 9.12 `specularMaterial(r, g, b)` | Устанавливает зеркальный материал |
| 9.13 `shininess(n)` | Устанавливает блеск материала |
| 9.14 `texture(tex)` | Применяет текстуру к геометрии |

### Камера

| Функция | Описание |
|---------|----------|
| 9.15 `camera([x], [y], [z], [cx], [cy], [cz], [ux], [uy], [uz])` | Устанавливает камеру |
| 9.16 `perspective([fovy], [aspect], [near], [far])` | Устанавливает перспективную проекцию |
| 9.17 `ortho([left], [right], [bottom], [top], [near], [far])` | Устанавливает ортогональную проекцию |
| 9.18 `createCamera()` | Создаёт объект камеры |
| 9.19 `setCamera(cam)` | Устанавливает камеру для рендерера |
| 9.20 `orbitControl([sensitivity], [maxZoom], [minZoom])` | Включает управление камерой мышью |

### Режим отладки

| Функция | Описание |
|---------|----------|
| 9.21 `debugMode([mode], [x], [y], [z], [size], [xOff], [yOff], [zOff])` | Включает режим отладки |
| 9.22 `noDebugMode()` | Отключает режим отладки |

**Пример:**
```javascript
function setup() {
  createCanvas(400, 400, WEBGL);
}

function draw() {
  background(50);
  
  // Освещение
  ambientLight(100);
  pointLight(255, 0, 0, 100, 100, 100);
  
  // Материал
  specularMaterial(255);
  shininess(50);
  
  // Управление камерой
  orbitControl();
  
  // 3D объект
  rotateX(frameCount * 0.01);
  rotateY(frameCount * 0.01);
  box(100);
}
```

---

## DOM (DOM-элементы)

### Создание элементов

| Функция | Описание |
|---------|----------|
| 10.1 `createDiv([html])` | Создаёт элемент div |
| 10.2 `createP([html])` | Создаёт элемент p (параграф) |
| 10.3 `createSpan([html])` | Создаёт элемент span |
| 10.4 `createButton([label])` | Создаёт кнопку |
| 10.5 `createCheckbox([label], [checked])` | Создаёт чекбокс |
| 10.6 `createSlider(min, max, [value], [step])` | Создаёт ползунок |
| 10.7 `createInput([value], [type])` | Создаёт текстовое поле ввода |
| 10.8 `createSelect([multiple])` | Создаёт выпадающий список |
| 10.9 `createRadio([name])` | Создаёт группу радио-кнопок |
| 10.10 `createColorPicker([value])` | Создаёт выбор цвета |
| 10.11 `createFileInput(callback, [multiple])` | Создаёт поле загрузки файла |
| 10.12 `createVideo([src])` | Создаёт видео элемент |
| 10.13 `createAudio([src])` | Создаёт аудио элемент |
| 10.14 `createElement(tag, [value])` | Создаёт произвольный элемент |

### Работа с элементами

| Функция | Описание |
|---------|----------|
| 10.15 `select(query)` | Находит первый элемент по селектору |
| 10.16 `selectAll(query)` | Находит все элементы по селектору |
| 10.17 `removeElements()` | Удаляет все DOM-элементы, созданные через p5 |

### События элементов

| Функция | Описание |
|---------|----------|
| 10.18 `changed(callback)` | Вызывается при изменении значения элемента |
| 10.19 `input(callback)` | Вызывается при вводе данных в элемент |

**Пример:**
```javascript
let button;
let slider;
let input;

function setup() {
  createCanvas(400, 400);
  
  button = createButton('Нажми меня');
  button.position(10, 10);
  button.mousePressed(onButtonClick);
  
  slider = createSlider(0, 255, 128);
  slider.position(10, 50);
  
  input = createInput('Введите текст');
  input.position(10, 90);
}

function draw() {
  background(slider.value());
}

function onButtonClick() {
  print('Текст:', input.value());
}
```

---

## Data (Данные)

### Массивы

| Функция | Описание |
|---------|----------|
| 11.1 `append(array, value)` | Добавляет элемент в конец массива |
| 11.2 `arrayCopy(src, dst, [length])` | Копирует элементы между массивами |
| 11.3 `concat(array1, array2)` | Объединяет два массива |
| 11.4 `reverse(array)` | Переворачивает массив |
| 11.5 `shorten(array)` | Удаляет последний элемент массива |
| 11.6 `shuffle(array, [bool])` | Перемешивает массив |
| 11.7 `sort(array, [count])` | Сортирует массив |
| 11.8 `splice(array, index, count)` | Вставляет/удаляет элементы массива |
| 11.9 `subset(array, start, [count])` | Возвращает подмассив |

### Преобразование типов

| Функция | Описание |
|---------|----------|
| 11.10 `float(str)` | Преобразует в число с плавающей точкой |
| 11.11 `int(str)` | Преобразует в целое число |
| 11.12 `str(num)` | Преобразует в строку |
| 11.13 `boolean(value)` | Преобразует в булево значение |
| 11.14 `byte(value)` | Преобразует в байт |
| 11.15 `char(value)` | Преобразует в символ |
| 11.16 `unchar(str)` | Преобразует символ в код |
| 11.17 `hex(value, [digits])` | Преобразует в шестнадцатеричную строку |
| 11.18 `unhex(str)` | Преобразует из шестнадцатеричной строки |

### Строковые функции

| Функция | Описание |
|---------|----------|
| 11.19 `join(array, separator)` | Объединяет массив в строку |
| 11.20 `split(str, delimiter)` | Разбивает строку на массив |
| 11.21 `splitTokens(str, [tokens])` | Разбивает строку по токенам |
| 11.22 `trim(str)` | Удаляет пробелы по краям строки |
| 11.23 `nf(num, left, [right])` | Форматирует число |
| 11.24 `nfc(num, [right])` | Форматирует число с разделителями |
| 11.25 `nfp(num, left, [right])` | Форматирует число со знаком |
| 11.26 `nfs(num, left, [right])` | Форматирует число с пробелом |

### Словари (Dictionary)

| Функция | Описание |
|---------|----------|
| 11.27 `createStringDict()` | Создаёт строковый словарь |
| 11.28 `createNumberDict()` | Создаёт числовой словарь |
| 11.29 `storeItem(key, value)` | Сохраняет в localStorage |
| 11.30 `getItem(key)` | Получает из localStorage |
| 11.31 `removeItem(key)` | Удаляет из localStorage |
| 11.32 `clearStorage()` | Очищает localStorage |

**Пример:**
```javascript
function setup() {
  createCanvas(400, 400);
  
  // Массивы
  let arr = [1, 2, 3];
  append(arr, 4);
  print(arr); // [1, 2, 3, 4]
  
  // Преобразование
  let num = float('3.14');
  let str = str(42);
  
  // Строки
  let parts = split('a,b,c', ',');
  let joined = join(parts, '-');
  
  // localStorage
  storeItem('score', 100);
  let score = getItem('score');
  print(score); // 100
}
```

---

## IO (Ввод/Вывод)

### Загрузка данных (Input)

| Функция | Описание |
|---------|----------|
| 12.1 `loadJSON(path, [callback])` | Загружает JSON файл |
| 12.2 `loadStrings(path, [callback])` | Загружает текстовый файл построчно |
| 12.3 `loadTable(path, [options], [callback])` | Загружает CSV/TSV файл как таблицу |
| 12.4 `loadXML(path, [callback])` | Загружает XML файл |
| 12.5 `loadBytes(path, [callback])` | Загружает файл как байты |
| 12.6 `httpGet(path, [data], [callback])` | Выполняет HTTP GET запрос |
| 12.7 `httpPost(path, [data], [callback])` | Выполняет HTTP POST запрос |
| 12.8 `httpDo(path, [method], [data], [callback])` | Выполняет HTTP запрос |

### Сохранение данных (Output)

| Функция | Описание |
|---------|----------|
| 12.9 `createWriter([filename])` | Создаёт объект для записи в файл |
| 12.10 `saveJSON(data, filename, [optimize])` | Сохраняет JSON файл |
| 12.11 `saveStrings(data, filename)` | Сохраняет массив строк в файл |
| 12.12 `saveTable(table, filename, [options])` | Сохраняет таблицу в файл |
| 12.13 `save([object], [filename], [options])` | Сохраняет данные или изображение |

### Время и дата

| Функция | Описание |
|---------|----------|
| 12.14 `millis()` | Возвращает миллисекунды с начала программы |
| 12.15 `year()` | Возвращает текущий год |
| 12.16 `month()` | Возвращает текущий месяц |
| 12.17 `day()` | Возвращает текущий день |
| 12.18 `hour()` | Возвращает текущий час |
| 12.19 `minute()` | Возвращает текущую минуту |
| 12.20 `second()` | Возвращает текущую секунду |

**Пример:**
```javascript
let data;

function preload() {
  // Загрузка JSON
  data = loadJSON('assets/data.json');
  
  // Загрузка текста
  let lines = loadStrings('assets/text.txt');
}

function setup() {
  createCanvas(400, 400);
  
  // HTTP запрос
  httpGet('https://api.example.com/data', {}, (response) => {
    print(response);
  });
}

function draw() {
  background(220);
  
  // Время
  let ms = millis();
  let s = second();
  
  // Сохранение
  if (keyIsPressed) {
    saveJSON({ x: mouseX, y: mouseY }, 'position.json');
  }
}
```

---

## Структура программы p5.js

```javascript
// Предзагрузка ресурсов
function preload() {
  // Загрузка изображений, шрифтов, данных
  img = loadImage('image.png');
  font = loadFont('font.ttf');
}

// Инициализация (вызывается один раз)
function setup() {
  createCanvas(800, 600);
  // Начальные настройки
}

// Основной цикл отрисовки (вызывается постоянно)
function draw() {
  background(220);
  // Отрисовка и логика
}

// Обработчики событий
function mousePressed() {
  // Код при клике мыши
}

function keyPressed() {
  // Код при нажатии клавиши
}
```

---

## Полезные ссылки

- **Официальная документация:** https://p5js.org/reference/
- **Примеры:** https://p5js.org/examples/
- **GitHub:** https://github.com/processing/p5.js
- **Сообщество:** https://discourse.processing.org/

---

*Справочник создан на основе документации p5.js*
