import{d as K,P as Q,o as N,w as Z,a as ee,b as y,i as te,e as t,n as b,c as S,t as T,F as Y,h as ne,g as D,p as F,q as ie,v as ae,C as se,l as oe,r as c,M as X,_ as re}from"./index-ml9QLuNs.js";const ce={createCanvas:`createCanvas(800, 600); // Создаёт холст 800x600
createCanvas(windowWidth, windowHeight); // На весь экран
createCanvas(400, 400, WEBGL); // 3D режим`,setup:`function setup() {
  createCanvas(800, 600);
  background(220);
}`,draw:`function draw() {
  circle(mouseX, mouseY, 50);
}`,resizeCanvas:`resizeCanvas(1024, 768); // Изменяет размер
resizeCanvas(windowWidth, windowHeight); // Адаптивный`,frameRate:`frameRate(30); // 30 FPS
frameRate(60); // 60 FPS`,cursor:`cursor(HAND); // Курсор-рука
cursor(CROSS); // Перекрестие
cursor(ARROW); // Стрелка`,noCursor:"noCursor(); // Скрывает курсор",background:`background(220); // Серый
background(255, 0, 0); // Красный
background(0, 0, 255, 128); // Синий полупрозрачный
background('blue'); // По имени`,width:`print(width); // Ширина холста
rect(0, 0, width/2, height); // Половина ширины`,height:`print(height); // Высота холста
circle(width/2, height/2, 100); // Центр`,windowWidth:"resizeCanvas(windowWidth, windowHeight);",windowHeight:"resizeCanvas(windowWidth, windowHeight);",color:`let c = color(255, 0, 0); // RGB
let c2 = color(0, 100, 100); // HSB
let c3 = color('#FF0000'); // HEX
let c4 = color(255, 0, 0, 128); // С прозрачностью`,red:`let c = color(255, 100, 50);
print(red(c)); // 255`,green:`let c = color(100, 200, 50);
print(green(c)); // 200`,blue:`let c = color(50, 100, 255);
print(blue(c)); // 255`,alpha:`let c = color(255, 0, 0, 128);
print(alpha(c)); // 128`,fill:`fill(255, 0, 0); // Красный
fill(0, 255, 0, 128); // Зелёный полупрозрачный
fill('blue'); // По имени
circle(100, 100, 50);`,noFill:`noFill();
rect(50, 50, 100, 100); // Только обводка`,stroke:`stroke(255, 0, 0); // Красная обводка
strokeWeight(5); // Толщина 5
rect(50, 50, 100, 100);`,noStroke:`noStroke();
fill(0, 255, 0);
circle(100, 100, 50); // Без обводки`,colorMode:`colorMode(RGB, 255); // По умолчанию
colorMode(HSB, 360, 100, 100); // HSB
colorMode(HSL); // HSL`,circle:`circle(100, 100, 50); // x, y, диаметр
circle(200, 200, 80);`,ellipse:`ellipse(100, 100, 80, 50); // x, y, ширина, высота
ellipse(200, 200, 100); // Круг`,line:`line(0, 0, 100, 100); // От (0,0) до (100,100)
line(50, 50, 200, 150);`,point:`point(100, 100); // Точка
strokeWeight(10);
point(200, 200); // Большая точка`,rect:`rect(50, 50, 100, 80); // x, y, ширина, высота
rect(10, 10, 50, 50, 10); // Со скруглением
rect(10, 10, 50, 50, 10, 20, 30, 40); // Разные углы`,square:`square(50, 50, 100); // x, y, размер
square(100, 100, 50);`,triangle:`triangle(0, 100, 100, 0, 200, 100);
triangle(50, 50, 150, 50, 100, 150);`,quad:"quad(0, 0, 100, 50, 200, 100, 50, 200);",arc:`arc(100, 100, 80, 80, 0, PI); // Полуокружность
arc(100, 100, 80, 80, 0, HALF_PI); // Четверть
arc(100, 100, 80, 80, 0, PI, PIE); // Сектор`,bezier:`bezier(80, 200, 100, 50, 300, 350, 320, 200);
// x1,y1 - начало
// x2,y2 - контрольная точка 1
// x3,y3 - контрольная точка 2
// x4,y4 - конец`,curve:`curve(5, 5, 50, 50, 200, 50, 195, 5);
// Точки 1 и 4 - контрольные
// Точки 2 и 3 - начало и конец кривой`,beginShape:`beginShape();
vertex(50, 50);
vertex(150, 50);
vertex(150, 150);
vertex(50, 150);
endShape(CLOSE); // CLOSE - замкнуть`,endShape:`beginShape();
vertex(50, 50);
vertex(150, 50);
vertex(100, 150);
endShape(CLOSE); // Замкнуть фигуру`,vertex:`beginShape();
vertex(100, 50);
vertex(150, 150);
vertex(50, 150);
endShape(CLOSE);`,box:`box(100); // Куб 100x100x100
box(100, 50, 80); // Ширина, высота, глубина`,sphere:`sphere(100); // Сфера радиусом 100
sphere(50, 24, 16); // С детализацией`,abs:`print(abs(-5)); // 5
print(abs(5)); // 5`,ceil:`print(ceil(4.2)); // 5
print(ceil(4.9)); // 5`,constrain:`print(constrain(15, 10, 20)); // 15
print(constrain(25, 10, 20)); // 20
print(constrain(5, 10, 20)); // 10`,dist:`print(dist(0, 0, 3, 4)); // 5 (теорема Пифагора)
print(dist(mouseX, mouseY, pmouseX, pmouseY)); // Скорость мыши`,floor:`print(floor(4.2)); // 4
print(floor(4.9)); // 4`,lerp:`print(lerp(0, 100, 0.5)); // 50
print(lerp(0, 100, 0.25)); // 25
let x = lerp(0, width, 0.5); // Половина ширины`,mag:`print(mag(3, 4)); // 5
print(mag(mouseX, mouseY)); // Расстояние до мыши`,max:`print(max(1, 5, 3)); // 5
print(max(10, 20, 5, 30)); // 30`,min:`print(min(1, 5, 3)); // 1
print(min(10, 20, 5, 30)); // 5`,pow:`print(pow(2, 3)); // 8 (2³)
print(pow(5, 2)); // 25 (5²)`,round:`print(round(4.3)); // 4
print(round(4.7)); // 5
print(round(4.5)); // 5`,sqrt:`print(sqrt(9)); // 3
print(sqrt(16)); // 4
print(sqrt(2)); // 1.414...`,noise:`let n = noise(frameCount * 0.01); // 0..1
let x = noise(0.5) * width; // Позиция
let y = noise(0.5, 0.5) * height; // 2D шум`,random:`random(100); // 0..100
random(50, 100); // 50..100
random(); // 0..1
random(['a', 'b', 'c']); // Случайный элемент`,sin:`print(sin(PI/2)); // 1
let y = sin(frameCount * 0.05) * 50; // Колебание`,cos:`print(cos(0)); // 1
let x = cos(frameCount * 0.05) * 50; // Колебание`,tan:"print(tan(PI/4)); // ~1",degrees:`print(degrees(PI)); // 180
print(degrees(PI/2)); // 90`,radians:`print(radians(180)); // PI
print(radians(90)); // PI/2`,createVector:`let v = createVector(100, 50);
v.add(10, 20);
v.normalize();
v.mult(5);`,keyIsPressed:`if (keyIsPressed) {
  fill(255, 0, 0);
} else {
  fill(0, 255, 0);
}`,key:`if (key === 'a') {
  print('Нажата A');
}
if (key === ' ') {
  print('Пробел');
}`,keyCode:`if (keyCode === ENTER) {
  print('Enter!');
}
if (keyCode === UP_ARROW) {
  print('Вверх!');
}`,mouseX:"circle(mouseX, mouseY, 50); // Следует за мышью",mouseY:"line(pmouseX, pmouseY, mouseX, mouseY); // Линия за мышью",mouseIsPressed:`if (mouseIsPressed) {
  fill(255, 0, 0);
} else {
  fill(0);
}
circle(mouseX, mouseY, 50);`,mouseButton:`if (mouseButton === LEFT) {
  print('Левая кнопка');
} else if (mouseButton === RIGHT) {
  print('Правая кнопка');
}`,touches:`for (let touch of touches) {
  circle(touch.x, touch.y, 50);
}`,loadImage:`let img;
function preload() {
  img = loadImage('photo.jpg');
}`,image:`image(img, 0, 0); // В начале координат
image(img, 50, 50, 200, 150); // С размером`,tint:`tint(255, 0, 0); // Красный оттенок
tint(255, 255, 255, 128); // Полупрозрачный
image(img, 0, 0);`,noTint:`tint(255, 0, 0);
image(img, 0, 0); // С оттенком
noTint();
image(img, 200, 0); // Без оттенка`,filter:`filter(GRAY); // Чёрно-белый
filter(INVERT); // Инверсия
filter(THRESHOLD, 0.5); // Порог
filter(BLUR, 5); // Размытие`,saveCanvas:`saveCanvas('myDrawing', 'png'); // Сохранить PNG
saveCanvas('myDrawing', 'jpg'); // Сохранить JPG`,text:`text('Hello!', 100, 100); // В точке
text('Long text', 50, 50, 200, 100); // В рамке`,textAlign:`textAlign(CENTER, CENTER); // По центру
textAlign(LEFT); // По левому краю
textAlign(RIGHT, BOTTOM); // По правому нижнему`,textSize:`textSize(16); // Маленький
textSize(32); // Средний
textSize(64); // Большой`,textStyle:`textStyle(NORMAL); // Обычный
textStyle(BOLD); // Жирный
textStyle(ITALIC); // Курсив`,textWidth:`let w = textWidth('Hello');
print(w); // Ширина текста в пикселях`,loadFont:`let font;
function preload() {
  font = loadFont('myFont.ttf');
}`,textFont:`textFont(font); // Использовать загруженный шрифт
textFont('Georgia'); // Системный шрифт`,push:`push(); // Сохранить состояние
translate(100, 100);
rotate(PI/4);
rect(0, 0, 50, 50);
pop(); // Восстановить состояние`,pop:`push();
rotate(PI/4);
rect(0, 0, 50, 50);
pop(); // Возврат к исходному состоянию`,translate:`translate(100, 100); // Сдвиг начала координат
rect(0, 0, 50, 50); // Рисуется от (100,100)`,rotate:`rotate(PI/4); // Поворот на 45°
rotate(frameCount * 0.01); // Анимация вращения`,scale:`scale(2); // Увеличить в 2 раза
scale(0.5); // Уменьшить в 2 раза
scale(2, 1); // Только по X`,rotateX:"rotateX(frameCount * 0.01); // Вращение вокруг X",rotateY:"rotateY(frameCount * 0.01); // Вращение вокруг Y",lights:`lights(); // Включить стандартное освещение
box(100);`,ambientLight:`ambientLight(100, 100, 100); // Серый свет
ambientLight(255, 0, 0); // Красный свет`,directionalLight:"directionalLight(255, 255, 255, 0, 1, 0); // Свет сверху",pointLight:"pointLight(255, 0, 0, mouseX, mouseY, 100); // Свет следует за мышью",specularMaterial:`specularMaterial(255, 255, 255); // Белый зеркальный
sphere(50);`,shininess:`shininess(50); // Блеск 50
sphere(50);`,orbitControl:"orbitControl(); // Управление камерой мышью",camera:"camera(0, 0, 500, 0, 0, 0, 0, 1, 0); // Позиция камеры",createButton:`let btn = createButton('Нажми');
btn.position(10, 10);
btn.mousePressed(() => print('Клик!'));`,createSlider:`let slider = createSlider(0, 255, 128);
slider.position(10, 10);
print(slider.value());`,createInput:`let input = createInput('Введите текст');
input.position(10, 10);
print(input.value());`,createSelect:`let select = createSelect();
select.option('Red');
select.option('Green');
select.option('Blue');`,createCheckbox:`let checkbox = createCheckbox('Включить', false);
if (checkbox.checked()) {
  print('Включено!');
}`,createColorPicker:`let picker = createColorPicker('#ff0000');
print(picker.color());`,select:`let elem = select('#myId'); // По ID
let elem2 = select('.myClass'); // По классу`,append:`let arr = [1, 2, 3];
arr = append(arr, 4); // [1, 2, 3, 4]`,concat:`let a1 = [1, 2];
let a2 = [3, 4];
let a3 = concat(a1, a2); // [1, 2, 3, 4]`,reverse:`let arr = [1, 2, 3];
arr = reverse(arr); // [3, 2, 1]`,shuffle:`let arr = [1, 2, 3, 4, 5];
arr = shuffle(arr); // Перемешать`,sort:`let arr = [3, 1, 4, 1, 5];
arr = sort(arr); // [1, 1, 3, 4, 5]`,float:`let n = float('3.14'); // 3.14
let n2 = float('42'); // 42`,int:`let n = int('42'); // 42
let n2 = int('3.99'); // 3`,str:`let s = str(42); // '42'
let s2 = str(3.14); // '3.14'`,join:`let arr = ['a', 'b', 'c'];
let s = join(arr, '-'); // 'a-b-c'`,split:"let parts = split('a,b,c', ','); // ['a', 'b', 'c']",trim:"let s = trim('  hello  '); // 'hello'",storeItem:"storeItem('score', 100); // Сохранить в localStorage",getItem:"let score = getItem('score'); // Получить из localStorage",loadJSON:`let data;
function preload() {
  data = loadJSON('data.json');
}`,loadStrings:`let lines;
function preload() {
  lines = loadStrings('file.txt');
}`,httpGet:`httpGet('https://api.example.com/data', (data) => {
  print(data);
});`,httpPost:`httpPost('https://api.example.com/submit', {name: 'John'}, (response) => {
  print(response);
});`,saveJSON:`let data = {x: 100, y: 200};
saveJSON(data, 'position.json');`,saveStrings:`let lines = ['line1', 'line2', 'line3'];
saveStrings(lines, 'output.txt');`,millis:"print(millis()); // Миллисекунды с запуска",year:"print(year()); // Текущий год",month:"print(month()); // Текущий месяц (1-12)",day:"print(day()); // Текущий день (1-31)",hour:"print(hour()); // Текущий час (0-23)",minute:"print(minute()); // Текущая минута (0-59)",second:"print(second()); // Текущая секунда (0-59)"},le=["title"],pe={class:"chat-header"},de={class:"header-controls"},me=["title"],ue={class:"message-avatar"},he={class:"message-content"},ge=["innerHTML"],ve={class:"message-time"},fe={key:0,class:"message assistant typing"},ye=["disabled"],xe=K({__name:"AIChat",props:{theme:{},isVisible:{type:Boolean},code:{}},emits:["update:isVisible","sendMessage","suggestCode"],setup(C,{emit:$}){Q(n=>({v70cc9462:a.theme==="dark"?"#1e1e1e":"#ffffff",v57e77912:a.theme==="dark"?"rgba(255, 255, 255, 0.1)":"rgba(0, 0, 0, 0.1)",v3cc4e533:a.theme==="dark"?"rgba(100, 108, 255, 0.1)":"rgba(100, 108, 255, 0.05)",v77b6296c:a.theme==="dark"?"white":"#333",v456a1452:a.theme==="dark"?"rgba(255, 255, 255, 0.6)":"rgba(0, 0, 0, 0.6)",v246d95ae:a.theme==="dark"?"white":"black",v50821d92:a.theme==="dark"?"rgba(255, 255, 255, 0.3)":"rgba(0, 0, 0, 0.3)",a50835de:a.theme==="dark"?"rgba(255, 255, 255, 0.1)":"rgba(0, 0, 0, 0.05)",v27f448c0:a.theme==="dark"?"#aaa":"#666",v641413a8:a.theme==="dark"?"#2d2d2d":"#f5f5f5",v5434cb52:a.theme==="dark"?"rgba(255, 255, 255, 0.2)":"rgba(0, 0, 0, 0.2)",v7853e434:a.theme==="dark"?"rgba(0, 0, 0, 0.2)":"rgba(0, 0, 0, 0.05)"}));const a=C,E=$,o=c([]),m=c(""),I=c(!1),u=c(null),w=c(!1),O=c(0),z=c(560),M=c(560),h=c(!1),r=c(null);N(()=>{o.value.length===0&&o.value.push({role:"assistant",content:'👋 Привет! Я p5.js помощник. Введите ключевое слово (например, "circle", "rect", "color"), и я найду информацию в справочнике p5.js!'})}),Z(o,()=>{X(()=>{u.value&&(u.value.scrollTop=u.value.scrollHeight)})},{deep:!0});function H(){E("update:isVisible",!1)}function A(){h.value=!h.value}function W(n){const s=n.toLowerCase().trim().split(/\s+/).filter(i=>i.length>0),l=[{name:"createCanvas(w, h)",description:"Создаёт холст заданной ширины и высоты",section:"Environment"},{name:"setup()",description:"Вызывается один раз при инициализации программы",section:"Environment"},{name:"draw()",description:"Вызывается непрерывно для отрисовки кадров",section:"Environment"},{name:"resizeCanvas(w, h)",description:"Изменяет размер холста",section:"Environment"},{name:"frameRate(fps)",description:"Устанавливает частоту кадров в секунду",section:"Environment"},{name:"width",description:"Ширина холста (свойство)",section:"Environment"},{name:"height",description:"Высота холста (свойство)",section:"Environment"},{name:"windowWidth",description:"Ширина окна браузера (свойство)",section:"Environment"},{name:"windowHeight",description:"Высота окна браузера (свойство)",section:"Environment"},{name:"cursor(type)",description:"Устанавливает тип курсора",section:"Environment"},{name:"noCursor()",description:"Скрывает курсор",section:"Environment"},{name:"background(v1, v2, v3)",description:"Устанавливает цвет фона",section:"Environment"},{name:"color(v1, v2, v3, [a])",description:"Создаёт цвет из RGB/HSB значений",section:"Color"},{name:"red(c)",description:"Извлекает красную компоненту из цвета",section:"Color"},{name:"green(c)",description:"Извлекает зелёную компоненту из цвета",section:"Color"},{name:"blue(c)",description:"Извлекает синюю компоненту из цвета",section:"Color"},{name:"alpha(c)",description:"Извлекает альфа-канал из цвета",section:"Color"},{name:"hue(c)",description:"Извлекает оттенок (HSB/HSL)",section:"Color"},{name:"saturation(c)",description:"Извлекает насыщенность (HSB/HSL)",section:"Color"},{name:"brightness(c)",description:"Извлекает яркость (HSB)",section:"Color"},{name:"lerpColor(c1, c2, amt)",description:"Интерполирует между двумя цветами",section:"Color"},{name:"fill(v1, v2, v3, [a])",description:"Устанавливает цвет заливки фигур",section:"Color"},{name:"noFill()",description:"Отключает заливку фигур",section:"Color"},{name:"stroke(v1, v2, v3, [a])",description:"Устанавливает цвет обводки",section:"Color"},{name:"noStroke()",description:"Отключает обводку",section:"Color"},{name:"colorMode(mode, [max1], [max2], [max3], [maxA])",description:"Устанавливает режим цвета (RGB/HSB/HSL)",section:"Color"},{name:"arc(x, y, w, h, start, stop, [mode])",description:"Рисует дугу",section:"Shape"},{name:"circle(x, y, d)",description:"Рисует круг",section:"Shape"},{name:"ellipse(x, y, w, [h])",description:"Рисует эллипс",section:"Shape"},{name:"line(x1, y1, x2, y2)",description:"Рисует линию между двумя точками",section:"Shape"},{name:"point(x, y, [z])",description:"Рисует точку",section:"Shape"},{name:"quad(x1, y1, x2, y2, x3, y3, x4, y4)",description:"Рисует четырёхугольник",section:"Shape"},{name:"rect(x, y, w, h, [tl, tr, br, bl])",description:"Рисует прямоугольник",section:"Shape"},{name:"square(x, y, s)",description:"Рисует квадрат",section:"Shape"},{name:"triangle(x1, y1, x2, y2, x3, y3)",description:"Рисует треугольник",section:"Shape"},{name:"bezier(x1, y1, x2, y2, x3, y3, x4, y4)",description:"Рисует кривую Безье",section:"Shape"},{name:"curve(x1, y1, x2, y2, x3, y3, x4, y4)",description:"Рисует сплайн-кривую",section:"Shape"},{name:"beginShape([kind])",description:"Начинает определение сложной формы",section:"Shape"},{name:"endShape([mode])",description:"Завершает определение формы",section:"Shape"},{name:"vertex(x, y, [z], [u], [v])",description:"Добавляет вершину к форме",section:"Shape"},{name:"box([width], [height], [depth], [detail])",description:"Рисует коробку (3D)",section:"Shape"},{name:"sphere([radius], [detailX], [detailY])",description:"Рисует сферу (3D)",section:"Shape"},{name:"abs(n)",description:"Возвращает абсолютное значение",section:"Math"},{name:"ceil(n)",description:"Округляет вверх до ближайшего целого",section:"Math"},{name:"constrain(n, low, high)",description:"Ограничивает число диапазоном",section:"Math"},{name:"dist(x1, y1, x2, y2)",description:"Вычисляет расстояние между точками",section:"Math"},{name:"floor(n)",description:"Округляет вниз до ближайшего целого",section:"Math"},{name:"lerp(start, stop, amt)",description:"Линейная интерполяция",section:"Math"},{name:"mag(x, y)",description:"Длина вектора (магнитуда)",section:"Math"},{name:"max(n1, n2, n3, ...)",description:"Максимальное значение",section:"Math"},{name:"min(n1, n2, n3, ...)",description:"Минимальное значение",section:"Math"},{name:"pow(n, exponent)",description:"Возведение в степень",section:"Math"},{name:"round(n)",description:"Округление до ближайшего целого",section:"Math"},{name:"sqrt(n)",description:"Квадратный корень",section:"Math"},{name:"noise(x, [y], [z])",description:"Возвращает значение шума Перлина",section:"Math"},{name:"random([min], [max])",description:"Возвращает случайное число",section:"Math"},{name:"sin(angle)",description:"Синус угла",section:"Math"},{name:"cos(angle)",description:"Косинус угла",section:"Math"},{name:"tan(angle)",description:"Тангенс угла",section:"Math"},{name:"degrees(radians)",description:"Конвертирует радианы в градусы",section:"Math"},{name:"radians(degrees)",description:"Конвертирует градусы в радианы",section:"Math"},{name:"createVector([x], [y], [z])",description:"Создаёт новый вектор p5.Vector",section:"Math"},{name:"keyIsPressed",description:"true, если любая клавиша нажата",section:"Input/Events"},{name:"key",description:"Значение последней нажатой клавиши",section:"Input/Events"},{name:"keyCode",description:"Код последней нажатой клавиши",section:"Input/Events"},{name:"keyPressed()",description:"Вызывается при нажатии клавиши",section:"Input/Events"},{name:"keyReleased()",description:"Вызывается при отпускании клавиши",section:"Input/Events"},{name:"mouseX",description:"Текущая X-координата мыши на холсте",section:"Input/Events"},{name:"mouseY",description:"Текущая Y-координата мыши на холсте",section:"Input/Events"},{name:"pmouseX",description:"Предыдущая X-координата мыши",section:"Input/Events"},{name:"pmouseY",description:"Предыдущая Y-координата мыши",section:"Input/Events"},{name:"mouseIsPressed",description:"true, если кнопка мыши нажата",section:"Input/Events"},{name:"mouseButton",description:"Какая кнопка мыши нажата (LEFT/RIGHT/CENTER)",section:"Input/Events"},{name:"mousePressed()",description:"Вызывается при нажатии кнопки мыши",section:"Input/Events"},{name:"mouseReleased()",description:"Вызывается при отпускании кнопки мыши",section:"Input/Events"},{name:"mouseClicked()",description:"Вызывается при клике мыши",section:"Input/Events"},{name:"mouseWheel(event)",description:"Вызывается при прокрутке колеса",section:"Input/Events"},{name:"touches",description:"Массив активных касаний",section:"Input/Events"},{name:"loadImage(path, [successCallback])",description:"Загружает изображение как p5.Image",section:"Image"},{name:"image(img, x, y, [w], [h])",description:"Отрисовывает изображение",section:"Image"},{name:"tint(v1, v2, v3, [a])",description:"Устанавливает тонирование для изображений",section:"Image"},{name:"noTint()",description:"Отключает тонирование",section:"Image"},{name:"filter(mode, [param])",description:"Применяет фильтр к изображению/холсту",section:"Image"},{name:"saveCanvas([selectedCanvas], [filename], [extension])",description:"Сохраняет холст как изображение",section:"Image"},{name:"text(str, x, y, [w], [h])",description:"Рисует текст на холсте",section:"Typography"},{name:"textAlign([horizontal], [vertical])",description:"Устанавливает выравнивание текста",section:"Typography"},{name:"textSize(size)",description:"Устанавливает размер шрифта",section:"Typography"},{name:"textStyle(style)",description:"Устанавливает стиль текста (NORMAL/BOLD/ITALIC)",section:"Typography"},{name:"textWidth(str)",description:"Вычисляет ширину текста",section:"Typography"},{name:"loadFont(path, [successCallback])",description:"Загружает шрифт как p5.Font",section:"Typography"},{name:"textFont(font, [size])",description:"Устанавливает шрифт для текста",section:"Typography"},{name:"push()",description:"Сохраняет текущие настройки стиля и трансформации",section:"Transform"},{name:"pop()",description:"Восстанавливает последние сохранённые настройки",section:"Transform"},{name:"translate(x, [y], [z])",description:"Перемещает начало координат",section:"Transform"},{name:"rotate(angle)",description:"Поворачивает холст вокруг начала координат",section:"Transform"},{name:"scale(s, [y], [z])",description:"Масштабирует холст",section:"Transform"},{name:"rotateX(angle)",description:"Поворачивает вокруг оси X (3D)",section:"Transform"},{name:"rotateY(angle)",description:"Поворачивает вокруг оси Y (3D)",section:"Transform"},{name:"lights()",description:"Включает стандартное освещение",section:"Lights & Camera"},{name:"ambientLight(r, g, b)",description:"Добавляет окружающий свет",section:"Lights & Camera"},{name:"directionalLight(r, g, b, nx, ny, nz)",description:"Добавляет направленный свет",section:"Lights & Camera"},{name:"pointLight(r, g, b, x, y, z)",description:"Добавляет точечный источник света",section:"Lights & Camera"},{name:"specularMaterial(r, g, b)",description:"Устанавливает зеркальный материал",section:"Lights & Camera"},{name:"shininess(n)",description:"Устанавливает блеск материала",section:"Lights & Camera"},{name:"orbitControl()",description:"Включает управление камерой мышью",section:"Lights & Camera"},{name:"camera([x], [y], [z], [cx], [cy], [cz])",description:"Устанавливает камеру",section:"Lights & Camera"},{name:"createDiv([html])",description:"Создаёт элемент div",section:"DOM"},{name:"createButton([label])",description:"Создаёт кнопку",section:"DOM"},{name:"createSlider(min, max, [value], [step])",description:"Создаёт ползунок",section:"DOM"},{name:"createInput([value])",description:"Создаёт текстовое поле ввода",section:"DOM"},{name:"createSelect([multiple])",description:"Создаёт выпадающий список",section:"DOM"},{name:"select(query)",description:"Находит первый элемент по селектору",section:"DOM"},{name:"append(array, value)",description:"Добавляет элемент в конец массива",section:"Data"},{name:"concat(array1, array2)",description:"Объединяет два массива",section:"Data"},{name:"reverse(array)",description:"Переворачивает массив",section:"Data"},{name:"shuffle(array)",description:"Перемешивает массив",section:"Data"},{name:"sort(array)",description:"Сортирует массив",section:"Data"},{name:"float(str)",description:"Преобразует в число с плавающей точкой",section:"Data"},{name:"int(str)",description:"Преобразует в целое число",section:"Data"},{name:"str(num)",description:"Преобразует в строку",section:"Data"},{name:"join(array, separator)",description:"Объединяет массив в строку",section:"Data"},{name:"split(str, delimiter)",description:"Разбивает строку на массив",section:"Data"},{name:"trim(str)",description:"Удаляет пробелы по краям строки",section:"Data"},{name:"storeItem(key, value)",description:"Сохраняет в localStorage",section:"Data"},{name:"getItem(key)",description:"Получает из localStorage",section:"Data"},{name:"loadJSON(path, [callback])",description:"Загружает JSON файл",section:"IO"},{name:"loadStrings(path, [callback])",description:"Загружает текстовый файл построчно",section:"IO"},{name:"httpGet(path, [data], [callback])",description:"Выполняет HTTP GET запрос",section:"IO"},{name:"httpPost(path, [data], [callback])",description:"Выполняет HTTP POST запрос",section:"IO"},{name:"saveJSON(data, filename)",description:"Сохраняет JSON файл",section:"IO"},{name:"saveStrings(data, filename)",description:"Сохраняет массив строк в файл",section:"IO"},{name:"millis()",description:"Возвращает миллисекунды с начала программы",section:"IO"},{name:"year()",description:"Возвращает текущий год",section:"IO"},{name:"month()",description:"Возвращает текущий месяц",section:"IO"},{name:"day()",description:"Возвращает текущий день",section:"IO"},{name:"hour()",description:"Возвращает текущий час",section:"IO"},{name:"minute()",description:"Возвращает текущую минуту",section:"IO"},{name:"second()",description:"Возвращает текущую секунду",section:"IO"}].map(i=>{const v=(i.name.split("(")[0]||"").toLowerCase(),L=i.description.toLowerCase();let g=0,f=[];return s.forEach(d=>{const J=v.includes(d),U=L.includes(d);v===d?(g+=10,f.push(d)):J?(g+=5,f.push(d)):U&&(g+=2,f.push(d))}),{...i,relevanceScore:g,matchedWords:f}}).filter(i=>i.relevanceScore>0).sort((i,k)=>k.relevanceScore-i.relevanceScore);if(l.length===0)return`❌ По запросу "${n}" ничего не найдено.

Попробуйте ввести любой текст, и я найду команды p5.js, в описании которых он встречается (например, "цвет", "рисует", "случайное", "вектор" и т.д.)`;let p=`📚 **Найдено функций: ${l.length}**
`;return p+=`🔍 **Запрос:** "${n}"
---
`,l.forEach((i,k)=>{let v=i.description;i.matchedWords.forEach(f=>{const d=new RegExp(`(${f})`,"gi");v=v.replace(d,"**$1**")}),p+=`**${i.name}** — ${v}
`;const L=i.name.split("(")[0]||"",g=ce[L];g&&(p+=`\`\`\`javascript
${g}
\`\`\`
`),k<l.length-1&&(p+=`---
`)}),p}function G(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/```(\w+)\n([\s\S]*?)```/g,'<pre><code class="language-$1">$2</code></pre>').replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>").replace(/^### (.+)$/gm,"<h3>$1</h3>").replace(/^## (.+)$/gm,"<h2>$1</h2>").replace(/^# (.+)$/gm,"<h1>$1</h1>").replace(/^---$/gm,"<hr>").replace(/\n/g,"<br>")}function V(n,e,s=10){return new Promise(x=>{let l=0;const p=o.value[e];if(!p){x();return}p.content="",r.value=window.setInterval(()=>{if(l<n.length){const i=o.value[e];i&&(i.content=n.substring(0,l+1)),l++,X(()=>{u.value&&(u.value.scrollTop=u.value.scrollHeight)})}else r.value&&(clearInterval(r.value),r.value=null),x()},s)})}async function P(){if(!m.value.trim())return;const n=m.value;o.value.push({role:"user",content:n}),m.value="",I.value=!0;try{const e=W(n),s=o.value.length;o.value.push({role:"assistant",content:""}),await V(e,s,8),E("sendMessage",n)}catch(e){console.error("Error sending message:",e),o.value.push({role:"assistant",content:"😵 Произошла ошибка. Пожалуйста, попробуй еще раз."})}finally{I.value=!1,r.value&&(clearInterval(r.value),r.value=null)}}function _(n){w.value=!0,O.value=n.clientY,z.value=M.value,document.body.style.cursor="row-resize",document.body.style.userSelect="none"}function R(n){if(!w.value)return;const e=O.value-n.clientY,s=Math.min(Math.max(300,z.value+e),window.innerHeight*.8);M.value=s}function B(){w.value=!1,document.body.style.cursor="",document.body.style.userSelect=""}N(()=>{window.addEventListener("mousemove",R),window.addEventListener("mouseup",B)}),ee(()=>{window.removeEventListener("mousemove",R),window.removeEventListener("mouseup",B),r.value&&(clearInterval(r.value),r.value=null)});function q(n){n.key==="Enter"&&!n.shiftKey&&(n.preventDefault(),P())}function j(n){n.preventDefault();const e=n.dataTransfer?.getData("text/plain");e&&(m.value=e)}return(n,e)=>(y(),te(oe,{to:"body"},[t("button",{class:b(["ai-float-button",[`theme-${a.theme}`,{hidden:C.isVisible}]]),onClick:e[0]||(e[0]=s=>E("update:isVisible",!0)),title:C.isVisible?"":"Открыть Deepseek AI"},[...e[3]||(e[3]=[t("span",{class:"ai-icon"},"🤖",-1),t("span",{class:"ai-pulse"},null,-1)])],10,le),C.isVisible?(y(),S("div",{key:0,class:b(["ai-chat-overlay",`theme-${a.theme}`]),onClick:F(H,["self"])},[t("div",{class:b(["ai-chat-window",{minimized:h.value}]),style:se({height:h.value?"60px":M.value+"px"})},[t("div",pe,[e[4]||(e[4]=t("div",{class:"header-left"},[t("span",{class:"header-icon"},"📚"),t("span",{class:"header-title"},"p5.js помощник"),t("span",{class:"header-badge"},"справочник")],-1)),t("div",de,[t("button",{class:"control-btn",onClick:A,title:h.value?"Развернуть":"Свернуть"},T(h.value?"□":"−"),9,me),t("button",{class:"control-btn close",onClick:H,title:"Закрыть"},"✕")])]),h.value?D("",!0):(y(),S(Y,{key:0},[t("div",{class:b(["chat-resize-handle",{dragging:w.value}]),onMousedown:_},[...e[5]||(e[5]=[t("div",{class:"handle-dots"},"⋯",-1)])],34),t("div",{class:"chat-messages",ref_key:"chatContainer",ref:u},[(y(!0),S(Y,null,ne(o.value,(s,x)=>(y(),S("div",{key:x,class:b(["message",s.role])},[t("div",ue,T(s.role==="user"?"👤":"🤖"),1),t("div",he,[t("div",{class:"message-text",innerHTML:G(s.content)},null,8,ge),t("div",ve,T(new Date().toLocaleTimeString()),1)])],2))),128)),I.value?(y(),S("div",fe,[...e[6]||(e[6]=[t("div",{class:"message-avatar"},"🤖",-1),t("div",{class:"message-content"},[t("div",{class:"typing-indicator"},[t("span"),t("span"),t("span")])],-1)])])):D("",!0)],512),t("div",{class:"chat-input-area",onDragover:e[2]||(e[2]=F(()=>{},["prevent"])),onDrop:j},[ie(t("textarea",{"onUpdate:modelValue":e[1]||(e[1]=s=>m.value=s),onKeydown:q,placeholder:"Введите любое слово (например, circle, rect, color, цвет)",rows:"1"},null,544),[[ae,m.value]]),t("button",{class:"send-btn",onClick:P,disabled:!m.value.trim()||I.value}," 📤 ",8,ye)],32)],64))],6)],2)):D("",!0)]))}}),Ce=re(xe,[["__scopeId","data-v-2b93ee5c"]]);export{Ce as default};
