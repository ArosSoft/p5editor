// Примеры использования для каждой функции p5.js
// Этот файл будет использоваться AIChat.vue для показа примеров

export const P5_EXAMPLES = {
  // Environment
  'createCanvas': `createCanvas(800, 600); // Создаёт холст 800x600
createCanvas(windowWidth, windowHeight); // На весь экран
createCanvas(400, 400, WEBGL); // 3D режим`,

  'setup': `function setup() {
  createCanvas(800, 600);
  background(220);
}`,

  'draw': `function draw() {
  circle(mouseX, mouseY, 50);
}`,

  'resizeCanvas': `resizeCanvas(1024, 768); // Изменяет размер
resizeCanvas(windowWidth, windowHeight); // Адаптивный`,

  'frameRate': `frameRate(30); // 30 FPS
frameRate(60); // 60 FPS`,

  'cursor': `cursor(HAND); // Курсор-рука
cursor(CROSS); // Перекрестие
cursor(ARROW); // Стрелка`,

  'noCursor': `noCursor(); // Скрывает курсор`,

  'background': `background(220); // Серый
background(255, 0, 0); // Красный
background(0, 0, 255, 128); // Синий полупрозрачный
background('blue'); // По имени`,

  'width': `print(width); // Ширина холста
rect(0, 0, width/2, height); // Половина ширины`,

  'height': `print(height); // Высота холста
circle(width/2, height/2, 100); // Центр`,

  'windowWidth': `resizeCanvas(windowWidth, windowHeight);`,

  'windowHeight': `resizeCanvas(windowWidth, windowHeight);`,

  // Color
  'color': `let c = color(255, 0, 0); // RGB
let c2 = color(0, 100, 100); // HSB
let c3 = color('#FF0000'); // HEX
let c4 = color(255, 0, 0, 128); // С прозрачностью`,

  'red': `let c = color(255, 100, 50);
print(red(c)); // 255`,

  'green': `let c = color(100, 200, 50);
print(green(c)); // 200`,

  'blue': `let c = color(50, 100, 255);
print(blue(c)); // 255`,

  'alpha': `let c = color(255, 0, 0, 128);
print(alpha(c)); // 128`,

  'fill': `fill(255, 0, 0); // Красный
fill(0, 255, 0, 128); // Зелёный полупрозрачный
fill('blue'); // По имени
circle(100, 100, 50);`,

  'noFill': `noFill();
rect(50, 50, 100, 100); // Только обводка`,

  'stroke': `stroke(255, 0, 0); // Красная обводка
strokeWeight(5); // Толщина 5
rect(50, 50, 100, 100);`,

  'noStroke': `noStroke();
fill(0, 255, 0);
circle(100, 100, 50); // Без обводки`,

  'colorMode': `colorMode(RGB, 255); // По умолчанию
colorMode(HSB, 360, 100, 100); // HSB
colorMode(HSL); // HSL`,

  // Shape
  'circle': `circle(100, 100, 50); // x, y, диаметр
circle(200, 200, 80);`,

  'ellipse': `ellipse(100, 100, 80, 50); // x, y, ширина, высота
ellipse(200, 200, 100); // Круг`,

  'line': `line(0, 0, 100, 100); // От (0,0) до (100,100)
line(50, 50, 200, 150);`,

  'point': `point(100, 100); // Точка
strokeWeight(10);
point(200, 200); // Большая точка`,

  'rect': `rect(50, 50, 100, 80); // x, y, ширина, высота
rect(10, 10, 50, 50, 10); // Со скруглением
rect(10, 10, 50, 50, 10, 20, 30, 40); // Разные углы`,

  'square': `square(50, 50, 100); // x, y, размер
square(100, 100, 50);`,

  'triangle': `triangle(0, 100, 100, 0, 200, 100);
triangle(50, 50, 150, 50, 100, 150);`,

  'quad': `quad(0, 0, 100, 50, 200, 100, 50, 200);`,

  'arc': `arc(100, 100, 80, 80, 0, PI); // Полуокружность
arc(100, 100, 80, 80, 0, HALF_PI); // Четверть
arc(100, 100, 80, 80, 0, PI, PIE); // Сектор`,

  'bezier': `bezier(80, 200, 100, 50, 300, 350, 320, 200);
// x1,y1 - начало
// x2,y2 - контрольная точка 1
// x3,y3 - контрольная точка 2
// x4,y4 - конец`,

  'curve': `curve(5, 5, 50, 50, 200, 50, 195, 5);
// Точки 1 и 4 - контрольные
// Точки 2 и 3 - начало и конец кривой`,

  'beginShape': `beginShape();
vertex(50, 50);
vertex(150, 50);
vertex(150, 150);
vertex(50, 150);
endShape(CLOSE); // CLOSE - замкнуть`,

  'endShape': `beginShape();
vertex(50, 50);
vertex(150, 50);
vertex(100, 150);
endShape(CLOSE); // Замкнуть фигуру`,

  'vertex': `beginShape();
vertex(100, 50);
vertex(150, 150);
vertex(50, 150);
endShape(CLOSE);`,

  'box': `box(100); // Куб 100x100x100
box(100, 50, 80); // Ширина, высота, глубина`,

  'sphere': `sphere(100); // Сфера радиусом 100
sphere(50, 24, 16); // С детализацией`,

  // Math
  'abs': `print(abs(-5)); // 5
print(abs(5)); // 5`,

  'ceil': `print(ceil(4.2)); // 5
print(ceil(4.9)); // 5`,

  'constrain': `print(constrain(15, 10, 20)); // 15
print(constrain(25, 10, 20)); // 20
print(constrain(5, 10, 20)); // 10`,

  'dist': `print(dist(0, 0, 3, 4)); // 5 (теорема Пифагора)
print(dist(mouseX, mouseY, pmouseX, pmouseY)); // Скорость мыши`,

  'floor': `print(floor(4.2)); // 4
print(floor(4.9)); // 4`,

  'lerp': `print(lerp(0, 100, 0.5)); // 50
print(lerp(0, 100, 0.25)); // 25
let x = lerp(0, width, 0.5); // Половина ширины`,

  'mag': `print(mag(3, 4)); // 5
print(mag(mouseX, mouseY)); // Расстояние до мыши`,

  'max': `print(max(1, 5, 3)); // 5
print(max(10, 20, 5, 30)); // 30`,

  'min': `print(min(1, 5, 3)); // 1
print(min(10, 20, 5, 30)); // 5`,

  'pow': `print(pow(2, 3)); // 8 (2³)
print(pow(5, 2)); // 25 (5²)`,

  'round': `print(round(4.3)); // 4
print(round(4.7)); // 5
print(round(4.5)); // 5`,

  'sqrt': `print(sqrt(9)); // 3
print(sqrt(16)); // 4
print(sqrt(2)); // 1.414...`,

  'noise': `let n = noise(frameCount * 0.01); // 0..1
let x = noise(0.5) * width; // Позиция
let y = noise(0.5, 0.5) * height; // 2D шум`,

  'random': `random(100); // 0..100
random(50, 100); // 50..100
random(); // 0..1
random(['a', 'b', 'c']); // Случайный элемент`,

  'sin': `print(sin(PI/2)); // 1
let y = sin(frameCount * 0.05) * 50; // Колебание`,

  'cos': `print(cos(0)); // 1
let x = cos(frameCount * 0.05) * 50; // Колебание`,

  'tan': `print(tan(PI/4)); // ~1`,

  'degrees': `print(degrees(PI)); // 180
print(degrees(PI/2)); // 90`,

  'radians': `print(radians(180)); // PI
print(radians(90)); // PI/2`,

  'createVector': `let v = createVector(100, 50);
v.add(10, 20);
v.normalize();
v.mult(5);`,

  // Input/Events
  'keyIsPressed': `if (keyIsPressed) {
  fill(255, 0, 0);
} else {
  fill(0, 255, 0);
}`,

  'key': `if (key === 'a') {
  print('Нажата A');
}
if (key === ' ') {
  print('Пробел');
}`,

  'keyCode': `if (keyCode === ENTER) {
  print('Enter!');
}
if (keyCode === UP_ARROW) {
  print('Вверх!');
}`,

  'mouseX': `circle(mouseX, mouseY, 50); // Следует за мышью`,

  'mouseY': `line(pmouseX, pmouseY, mouseX, mouseY); // Линия за мышью`,

  'mouseIsPressed': `if (mouseIsPressed) {
  fill(255, 0, 0);
} else {
  fill(0);
}
circle(mouseX, mouseY, 50);`,

  'mouseButton': `if (mouseButton === LEFT) {
  print('Левая кнопка');
} else if (mouseButton === RIGHT) {
  print('Правая кнопка');
}`,

  'touches': `for (let touch of touches) {
  circle(touch.x, touch.y, 50);
}`,

  // Image
  'loadImage': `let img;
function preload() {
  img = loadImage('photo.jpg');
}`,

  'image': `image(img, 0, 0); // В начале координат
image(img, 50, 50, 200, 150); // С размером`,

  'tint': `tint(255, 0, 0); // Красный оттенок
tint(255, 255, 255, 128); // Полупрозрачный
image(img, 0, 0);`,

  'noTint': `tint(255, 0, 0);
image(img, 0, 0); // С оттенком
noTint();
image(img, 200, 0); // Без оттенка`,

  'filter': `filter(GRAY); // Чёрно-белый
filter(INVERT); // Инверсия
filter(THRESHOLD, 0.5); // Порог
filter(BLUR, 5); // Размытие`,

  'saveCanvas': `saveCanvas('myDrawing', 'png'); // Сохранить PNG
saveCanvas('myDrawing', 'jpg'); // Сохранить JPG`,

  // Typography
  'text': `text('Hello!', 100, 100); // В точке
text('Long text', 50, 50, 200, 100); // В рамке`,

  'textAlign': `textAlign(CENTER, CENTER); // По центру
textAlign(LEFT); // По левому краю
textAlign(RIGHT, BOTTOM); // По правому нижнему`,

  'textSize': `textSize(16); // Маленький
textSize(32); // Средний
textSize(64); // Большой`,

  'textStyle': `textStyle(NORMAL); // Обычный
textStyle(BOLD); // Жирный
textStyle(ITALIC); // Курсив`,

  'textWidth': `let w = textWidth('Hello');
print(w); // Ширина текста в пикселях`,

  'loadFont': `let font;
function preload() {
  font = loadFont('myFont.ttf');
}`,

  'textFont': `textFont(font); // Использовать загруженный шрифт
textFont('Georgia'); // Системный шрифт`,

  // Transform
  'push': `push(); // Сохранить состояние
translate(100, 100);
rotate(PI/4);
rect(0, 0, 50, 50);
pop(); // Восстановить состояние`,

  'pop': `push();
rotate(PI/4);
rect(0, 0, 50, 50);
pop(); // Возврат к исходному состоянию`,

  'translate': `translate(100, 100); // Сдвиг начала координат
rect(0, 0, 50, 50); // Рисуется от (100,100)`,

  'rotate': `rotate(PI/4); // Поворот на 45°
rotate(frameCount * 0.01); // Анимация вращения`,

  'scale': `scale(2); // Увеличить в 2 раза
scale(0.5); // Уменьшить в 2 раза
scale(2, 1); // Только по X`,

  'rotateX': `rotateX(frameCount * 0.01); // Вращение вокруг X`,

  'rotateY': `rotateY(frameCount * 0.01); // Вращение вокруг Y`,

  // Lights & Camera
  'lights': `lights(); // Включить стандартное освещение
box(100);`,

  'ambientLight': `ambientLight(100, 100, 100); // Серый свет
ambientLight(255, 0, 0); // Красный свет`,

  'directionalLight': `directionalLight(255, 255, 255, 0, 1, 0); // Свет сверху`,

  'pointLight': `pointLight(255, 0, 0, mouseX, mouseY, 100); // Свет следует за мышью`,

  'specularMaterial': `specularMaterial(255, 255, 255); // Белый зеркальный
sphere(50);`,

  'shininess': `shininess(50); // Блеск 50
sphere(50);`,

  'orbitControl': `orbitControl(); // Управление камерой мышью`,

  'camera': `camera(0, 0, 500, 0, 0, 0, 0, 1, 0); // Позиция камеры`,

  // DOM
  'createButton': `let btn = createButton('Нажми');
btn.position(10, 10);
btn.mousePressed(() => print('Клик!'));`,

  'createSlider': `let slider = createSlider(0, 255, 128);
slider.position(10, 10);
print(slider.value());`,

  'createInput': `let input = createInput('Введите текст');
input.position(10, 10);
print(input.value());`,

  'createSelect': `let select = createSelect();
select.option('Red');
select.option('Green');
select.option('Blue');`,

  'createCheckbox': `let checkbox = createCheckbox('Включить', false);
if (checkbox.checked()) {
  print('Включено!');
}`,

  'createColorPicker': `let picker = createColorPicker('#ff0000');
print(picker.color());`,

  'select': `let elem = select('#myId'); // По ID
let elem2 = select('.myClass'); // По классу`,

  // Data
  'append': `let arr = [1, 2, 3];
arr = append(arr, 4); // [1, 2, 3, 4]`,

  'concat': `let a1 = [1, 2];
let a2 = [3, 4];
let a3 = concat(a1, a2); // [1, 2, 3, 4]`,

  'reverse': `let arr = [1, 2, 3];
arr = reverse(arr); // [3, 2, 1]`,

  'shuffle': `let arr = [1, 2, 3, 4, 5];
arr = shuffle(arr); // Перемешать`,

  'sort': `let arr = [3, 1, 4, 1, 5];
arr = sort(arr); // [1, 1, 3, 4, 5]`,

  'float': `let n = float('3.14'); // 3.14
let n2 = float('42'); // 42`,

  'int': `let n = int('42'); // 42
let n2 = int('3.99'); // 3`,

  'str': `let s = str(42); // '42'
let s2 = str(3.14); // '3.14'`,

  'join': `let arr = ['a', 'b', 'c'];
let s = join(arr, '-'); // 'a-b-c'`,

  'split': `let parts = split('a,b,c', ','); // ['a', 'b', 'c']`,

  'trim': `let s = trim('  hello  '); // 'hello'`,

  'storeItem': `storeItem('score', 100); // Сохранить в localStorage`,

  'getItem': `let score = getItem('score'); // Получить из localStorage`,

  // IO
  'loadJSON': `let data;
function preload() {
  data = loadJSON('data.json');
}`,

  'loadStrings': `let lines;
function preload() {
  lines = loadStrings('file.txt');
}`,

  'httpGet': `httpGet('https://api.example.com/data', (data) => {
  print(data);
});`,

  'httpPost': `httpPost('https://api.example.com/submit', {name: 'John'}, (response) => {
  print(response);
});`,

  'saveJSON': `let data = {x: 100, y: 200};
saveJSON(data, 'position.json');`,

  'saveStrings': `let lines = ['line1', 'line2', 'line3'];
saveStrings(lines, 'output.txt');`,

  'millis': `print(millis()); // Миллисекунды с запуска`,

  'year': `print(year()); // Текущий год`,

  'month': `print(month()); // Текущий месяц (1-12)`,

  'day': `print(day()); // Текущий день (1-31)`,

  'hour': `print(hour()); // Текущий час (0-23)`,

  'minute': `print(minute()); // Текущая минута (0-59)`,

  'second': `print(second()); // Текущая секунда (0-59)`
};
