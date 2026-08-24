  // База данных функций p5.js с описаниями
  export const p5functions: Array<{
    name: string;
    description: string;
    section: string;
  }> = [
    // Environment
    {
      name: 'createCanvas(w, h)',
      description: 'Создаёт холст заданной ширины и высоты',
      section: 'Environment',
    },
    {
      name: 'setup()',
      description: 'Вызывается один раз при инициализации программы',
      section: 'Environment',
    },
    {
      name: 'draw()',
      description: 'Вызывается непрерывно для отрисовки кадров',
      section: 'Environment',
    },
    {
      name: 'preload()',
      description: 'Вызывается для предзагрузки ресурсов',
      section: 'Environment',
    },
    {
      name: 'resizeCanvas(w, h)',
      description: 'Изменяет размер холста',
      section: 'Environment',
    },
    {
      name: 'noCanvas()',
      description: 'Удаляет холст по умолчанию',
      section: 'Environment',
    },
    {
      name: 'blendMode(mode)',
      description: 'Устанавливает режим смешивания цветов',
      section: 'Environment',
    },
    {
      name: 'print(content)',
      description: 'Выводит содержимое в консоль браузера',
      section: 'Environment',
    },
    {
      name: 'frameRate(fps)',
      description: 'Устанавливает частоту кадров в секунду',
      section: 'Environment',
    },
    {
      name: 'width',
      description: 'Ширина холста (свойство)',
      section: 'Environment',
    },
    {
      name: 'height',
      description: 'Высота холста (свойство)',
      section: 'Environment',
    },
    {
      name: 'windowWidth',
      description: 'Ширина окна браузера (свойство)',
      section: 'Environment',
    },
    {
      name: 'windowHeight',
      description: 'Высота окна браузера (свойство)',
      section: 'Environment',
    },
    {
      name: 'displayWidth',
      description: 'Ширина экрана устройства (свойство)',
      section: 'Environment',
    },
    {
      name: 'displayHeight',
      description: 'Высота экрана устройства (свойство)',
      section: 'Environment',
    },
    {
      name: 'frameCount',
      description: 'Количество кадров с начала работы программы (свойство)',
      section: 'Environment',
    },
    {
      name: 'cursor(type)',
      description: 'Устанавливает тип курсора',
      section: 'Environment',
    },
    {
      name: 'noCursor()',
      description: 'Скрывает курсор',
      section: 'Environment',
    },
    {
      name: 'pixelDensity([density])',
      description: 'Устанавливает плотность пикселей',
      section: 'Environment',
    },
    {
      name: 'displayDensity()',
      description: 'Возвращает плотность пикселей дисплея',
      section: 'Environment',
    },
    {
      name: 'fullscreen([value])',
      description: 'Получает/устанавливает полноэкранный режим',
      section: 'Environment',
    },
    {
      name: 'getURL()',
      description: 'Возвращает текущий URL',
      section: 'Environment',
    },
    {
      name: 'getURLPath()',
      description: 'Возвращает путь URL как массив',
      section: 'Environment',
    },
    {
      name: 'getURLParams()',
      description: 'Возвращает параметры URL как объект',
      section: 'Environment',
    },
    {
      name: 'windowResized()',
      description: 'Вызывается при изменении размера окна',
      section: 'Environment',
    },
    {
      name: 'noLoop()',
      description: 'Останавливает цикл draw()',
      section: 'Environment',
    },
    {
      name: 'loop()',
      description: 'Снова запускает цикл draw()',
      section: 'Environment',
    },
    {
      name: 'redraw()',
      description: 'Вручную вызывает draw() один раз',
      section: 'Environment',
    },
    {
      name: 'push()',
      description: 'Сохраняет текущие настройки рисования',
      section: 'Environment',
    },
    {
      name: 'pop()',
      description: 'Восстанавливает сохранённые настройки рисования',
      section: 'Environment',
    },
    {
      name: 'smooth()',
      description: 'Включает сглаживание',
      section: 'Environment',
    },
    {
      name: 'noSmooth()',
      description: 'Отключает сглаживание',
      section: 'Environment',
    },
    {
      name: 'background(v1, v2, v3)',
      description: 'Устанавливает цвет фона',
      section: 'Environment',
    },
    {
      name: 'clear()',
      description: 'Очищает буфер пикселей',
      section: 'Environment',
    },

    // Color
    {
      name: 'color(v1, v2, v3, [a])',
      description: 'Создаёт цвет из RGB/HSB значений',
      section: 'Color',
    },
    {
      name: 'red(c)',
      description: 'Извлекает красную компоненту из цвета',
      section: 'Color',
    },
    {
      name: 'green(c)',
      description: 'Извлекает зелёную компоненту из цвета',
      section: 'Color',
    },
    {
      name: 'blue(c)',
      description: 'Извлекает синюю компоненту из цвета',
      section: 'Color',
    },
    {
      name: 'alpha(c)',
      description: 'Извлекает альфа-канал из цвета',
      section: 'Color',
    },
    {
      name: 'hue(c)',
      description: 'Извлекает оттенок (HSB/HSL)',
      section: 'Color',
    },
    {
      name: 'saturation(c)',
      description: 'Извлекает насыщенность (HSB/HSL)',
      section: 'Color',
    },
    {
      name: 'brightness(c)',
      description: 'Извлекает яркость (HSB)',
      section: 'Color',
    },
    {
      name: 'lightness(c)',
      description: 'Извлекает светлоту (HSL)',
      section: 'Color',
    },
    {
      name: 'lerpColor(c1, c2, amt)',
      description: 'Интерполирует между двумя цветами',
      section: 'Color',
    },
    {
      name: 'fill(v1, v2, v3, [a])',
      description: 'Устанавливает цвет заливки фигур',
      section: 'Color',
    },
    {
      name: 'noFill()',
      description: 'Отключает заливку фигур',
      section: 'Color',
    },
    {
      name: 'stroke(v1, v2, v3, [a])',
      description: 'Устанавливает цвет обводки',
      section: 'Color',
    },
    { name: 'noStroke()', description: 'Отключает обводку', section: 'Color' },
    {
      name: 'colorMode(mode, [max1], [max2], [max3], [maxA])',
      description: 'Устанавливает режим цвета (RGB/HSB/HSL)',
      section: 'Color',
    },
    {
      name: 'erase([strength], [shadowStrength])',
      description: 'Включает режим стирания',
      section: 'Color',
    },
    {
      name: 'noErase()',
      description: 'Отключает режим стирания',
      section: 'Color',
    },

    // Shape
    {
      name: 'arc(x, y, w, h, start, stop, [mode])',
      description: 'Рисует дугу',
      section: 'Shape',
    },
    { name: 'circle(x, y, d)', description: 'Рисует круг', section: 'Shape' },
    {
      name: 'ellipse(x, y, w, [h])',
      description: 'Рисует эллипс',
      section: 'Shape',
    },
    {
      name: 'line(x1, y1, x2, y2)',
      description: 'Рисует линию между двумя точками',
      section: 'Shape',
    },
    { name: 'point(x, y, [z])', description: 'Рисует точку', section: 'Shape' },
    {
      name: 'quad(x1, y1, x2, y2, x3, y3, x4, y4)',
      description: 'Рисует четырёхугольник',
      section: 'Shape',
    },
    {
      name: 'rect(x, y, w, h, [tl, tr, br, bl])',
      description: 'Рисует прямоугольник\n![пример rect](images/reference/rect.png)',
      section: 'Shape',
    },
    {
      name: 'square(x, y, s)',
      description: 'Рисует квадрат',
      section: 'Shape',
    },
    {
      name: 'triangle(x1, y1, x2, y2, x3, y3)',
      description: 'Рисует треугольник',
      section: 'Shape',
    },
    {
      name: 'ellipseMode(mode)',
      description: 'Устанавливает режим отрисовки эллипсов',
      section: 'Shape',
    },
    {
      name: 'rectMode(mode)',
      description: 'Устанавливает режим отрисовки прямоугольников',
      section: 'Shape',
    },
    {
      name: 'strokeWeight(weight)',
      description: 'Устанавливает толщину обводки',
      section: 'Shape',
    },
    {
      name: 'strokeCap(cap)',
      description: 'Устанавливает стиль концов линий',
      section: 'Shape',
    },
    {
      name: 'strokeJoin(join)',
      description: 'Устанавливает стиль соединения линий',
      section: 'Shape',
    },
    {
      name: 'bezier(x1, y1, x2, y2, x3, y3, x4, y4)',
      description: 'Рисует кривую Безье',
      section: 'Shape',
    },
    {
      name: 'bezierDetail(detail)',
      description: 'Устанавливает детализацию кривых Безье',
      section: 'Shape',
    },
    {
      name: 'bezierPoint(a, b, c, d, t)',
      description: 'Вычисляет точку на кривой Безье',
      section: 'Shape',
    },
    {
      name: 'curve(x1, y1, x2, y2, x3, y3, x4, y4)',
      description: 'Рисует сплайн-кривую',
      section: 'Shape',
    },
    {
      name: 'curveDetail(detail)',
      description: 'Устанавливает детализацию кривых',
      section: 'Shape',
    },
    {
      name: 'curveTightness(tightness)',
      description: 'Устанавливает натяжение кривых',
      section: 'Shape',
    },
    {
      name: 'curvePoint(a, b, c, d, t)',
      description: 'Вычисляет точку на сплайн-кривой',
      section: 'Shape',
    },
    {
      name: 'beginShape([kind])',
      description: 'Начинает определение сложной формы',
      section: 'Shape',
    },
    {
      name: 'endShape([mode])',
      description: 'Завершает определение формы',
      section: 'Shape',
    },
    {
      name: 'vertex(x, y, [z], [u], [v])',
      description: 'Добавляет вершину к форме',
      section: 'Shape',
    },
    {
      name: 'bezierVertex(x2, y2, x3, y3, x4, y4)',
      description: 'Добавляет вершину кривой Безье',
      section: 'Shape',
    },
    {
      name: 'curveVertex(x, y)',
      description: 'Добавляет вершину сплайн-кривой',
      section: 'Shape',
    },
    {
      name: 'quadraticVertex(cx, cy, x3, y3)',
      description: 'Добавляет квадратичную вершину Безье',
      section: 'Shape',
    },
    {
      name: 'beginContour()',
      description: 'Начинает внутренний контур (дырку)',
      section: 'Shape',
    },
    {
      name: 'endContour()',
      description: 'Завершает внутренний контур',
      section: 'Shape',
    },
    {
      name: 'box([width], [height], [depth], [detail])',
      description: 'Рисует коробку (3D)',
      section: 'Shape',
    },
    {
      name: 'plane([width], [height], [detailX], [detailY])',
      description: 'Рисует плоскость (3D)',
      section: 'Shape',
    },
    {
      name: 'sphere([radius], [detailX], [detailY])',
      description: 'Рисует сферу (3D)',
      section: 'Shape',
    },
    {
      name: 'cylinder([radius], [height], [detailX], [detailY])',
      description: 'Рисует цилиндр (3D)',
      section: 'Shape',
    },
    {
      name: 'cone([radius], [height], [detailX], [detailY])',
      description: 'Рисует конус (3D)',
      section: 'Shape',
    },
    {
      name: 'ellipsoid([radiusX], [radiusY], [radiusZ])',
      description: 'Рисует эллипсоид (3D)',
      section: 'Shape',
    },
    {
      name: 'torus([radius], [tube], [detailX], [detailY])',
      description: 'Рисует тор (3D)',
      section: 'Shape',
    },
    {
      name: 'loadModel(path, [successCallback])',
      description: 'Загружает 3D модель из файла',
      section: 'Shape',
    },
    {
      name: 'model(model, [x], [y], [z])',
      description: 'Отрисовывает 3D модель',
      section: 'Shape',
    },

    // Math
    {
      name: 'abs(n)',
      description: 'Возвращает абсолютное значение',
      section: 'Math',
    },
    {
      name: 'ceil(n)',
      description: 'Округляет вверх до ближайшего целого',
      section: 'Math',
    },
    {
      name: 'constrain(n, low, high)',
      description: 'Ограничивает число диапазоном',
      section: 'Math',
    },
    {
      name: 'dist(x1, y1, x2, y2)',
      description: 'Вычисляет расстояние между точками',
      section: 'Math',
    },
    {
      name: 'floor(n)',
      description: 'Округляет вниз до ближайшего целого',
      section: 'Math',
    },
    {
      name: 'lerp(start, stop, amt)',
      description: 'Линейная интерполяция',
      section: 'Math',
    },
    { name: 'log(n)', description: 'Натуральный логарифм', section: 'Math' },
    {
      name: 'mag(x, y)',
      description: 'Длина вектора (магнитуда)',
      section: 'Math',
    },
    {
      name: 'max(n1, n2, n3, ...)',
      description: 'Максимальное значение',
      section: 'Math',
    },
    {
      name: 'min(n1, n2, n3, ...)',
      description: 'Минимальное значение',
      section: 'Math',
    },
    {
      name: 'pow(n, exponent)',
      description: 'Возведение в степень',
      section: 'Math',
    },
    {
      name: 'round(n)',
      description: 'Округление до ближайшего целого',
      section: 'Math',
    },
    { name: 'sq(n)', description: 'Квадрат числа', section: 'Math' },
    { name: 'sqrt(n)', description: 'Квадратный корень', section: 'Math' },
    { name: 'fract(n)', description: 'Дробная часть числа', section: 'Math' },
    {
      name: 'map(value, start1, stop1, start2, stop2)',
      description: 'Переводит число из одного диапазона в другой',
      section: 'Math',
    },
    {
      name: 'noise(x, [y], [z])',
      description: 'Возвращает значение шума Перлина',
      section: 'Math',
    },
    {
      name: 'noiseSeed(seed)',
      description: 'Устанавливает зерно для шума',
      section: 'Math',
    },
    {
      name: 'noiseDetail(lod, [falloff])',
      description: 'Устанавливает детализацию шума',
      section: 'Math',
    },
    {
      name: 'random([min], [max])',
      description: 'Возвращает случайное число',
      section: 'Math',
    },
    {
      name: 'randomSeed(seed)',
      description: 'Устанавливает зерно для случайных чисел',
      section: 'Math',
    },
    {
      name: 'randomGaussian([mean], [deviation])',
      description: 'Возвращает случайное число по Гауссу',
      section: 'Math',
    },
    { name: 'sin(angle)', description: 'Синус угла', section: 'Math' },
    { name: 'cos(angle)', description: 'Косинус угла', section: 'Math' },
    { name: 'tan(angle)', description: 'Тангенс угла', section: 'Math' },
    { name: 'asin(value)', description: 'Арксинус', section: 'Math' },
    { name: 'acos(value)', description: 'Арккосинус', section: 'Math' },
    { name: 'atan(value)', description: 'Арктангенс', section: 'Math' },
    {
      name: 'atan2(y, x)',
      description: 'Арктангенс от y/x с учётом квадранта',
      section: 'Math',
    },
    {
      name: 'degrees(radians)',
      description: 'Конвертирует радианы в градусы',
      section: 'Math',
    },
    {
      name: 'radians(degrees)',
      description: 'Конвертирует градусы в радианы',
      section: 'Math',
    },
    {
      name: 'angleMode(mode)',
      description: 'Устанавливает режим углов (DEGREES/RADIANS)',
      section: 'Math',
    },
    {
      name: 'createVector([x], [y], [z])',
      description: 'Создаёт новый вектор p5.Vector',
      section: 'Math',
    },

    // Input/Events
    {
      name: 'keyIsPressed',
      description: 'true, если любая клавиша нажата',
      section: 'Input/Events',
    },
    {
      name: 'key',
      description: 'Значение последней нажатой клавиши',
      section: 'Input/Events',
    },
    {
      name: 'keyCode',
      description: 'Код последней нажатой клавиши',
      section: 'Input/Events',
    },
    {
      name: 'keyIsDown(code)',
      description: 'Проверяет, нажата ли клавиша с данным кодом',
      section: 'Input/Events',
    },
    {
      name: 'keyPressed()',
      description: 'Вызывается при нажатии клавиши',
      section: 'Input/Events',
    },
    {
      name: 'keyReleased()',
      description: 'Вызывается при отпускании клавиши',
      section: 'Input/Events',
    },
    {
      name: 'keyTyped()',
      description: 'Вызывается при вводе символа',
      section: 'Input/Events',
    },
    {
      name: 'doubleClicked()',
      description: 'Вызывается при двойном клике',
      section: 'Input/Events',
    },
    {
      name: 'mouseX',
      description: 'Текущая X-координата мыши на холсте',
      section: 'Input/Events',
    },
    {
      name: 'mouseY',
      description: 'Текущая Y-координата мыши на холсте',
      section: 'Input/Events',
    },
    {
      name: 'pmouseX',
      description: 'Предыдущая X-координата мыши',
      section: 'Input/Events',
    },
    {
      name: 'pmouseY',
      description: 'Предыдущая Y-координата мыши',
      section: 'Input/Events',
    },
    {
      name: 'winMouseX',
      description: 'X-координата мыши относительно окна',
      section: 'Input/Events',
    },
    {
      name: 'winMouseY',
      description: 'Y-координата мыши относительно окна',
      section: 'Input/Events',
    },
    {
      name: 'mouseIsPressed',
      description: 'true, если кнопка мыши нажата',
      section: 'Input/Events',
    },
    {
      name: 'mouseButton',
      description: 'Какая кнопка мыши нажата (LEFT/RIGHT/CENTER)',
      section: 'Input/Events',
    },
    {
      name: 'mouseMoved()',
      description: 'Вызывается при перемещении мыши',
      section: 'Input/Events',
    },
    {
      name: 'mouseDragged()',
      description: 'Вызывается при перетаскивании мыши',
      section: 'Input/Events',
    },
    {
      name: 'mousePressed()',
      description: 'Вызывается при нажатии кнопки мыши',
      section: 'Input/Events',
    },
    {
      name: 'mouseReleased()',
      description: 'Вызывается при отпускании кнопки мыши',
      section: 'Input/Events',
    },
    {
      name: 'mouseClicked()',
      description: 'Вызывается при клике мыши',
      section: 'Input/Events',
    },
    {
      name: 'mouseWheel(event)',
      description: 'Вызывается при прокрутке колеса',
      section: 'Input/Events',
    },
    {
      name: 'touches',
      description: 'Массив активных касаний',
      section: 'Input/Events',
    },
    {
      name: 'touchStarted()',
      description: 'Вызывается при начале касания',
      section: 'Input/Events',
    },
    {
      name: 'touchMoved()',
      description: 'Вызывается при перемещении касания',
      section: 'Input/Events',
    },
    {
      name: 'touchEnded()',
      description: 'Вызывается при окончании касания',
      section: 'Input/Events',
    },

    // Image
    {
      name: 'loadImage(path, [successCallback])',
      description: 'Загружает изображение как p5.Image',
      section: 'Image',
    },
    {
      name: 'image(img, x, y, [w], [h])',
      description: 'Отрисовывает изображение',
      section: 'Image',
    },
    {
      name: 'imageMode(mode)',
      description: 'Устанавливает режим отрисовки изображений',
      section: 'Image',
    },
    {
      name: 'tint(v1, v2, v3, [a])',
      description: 'Устанавливает тонирование для изображений',
      section: 'Image',
    },
    {
      name: 'noTint()',
      description: 'Отключает тонирование',
      section: 'Image',
    },
    {
      name: 'filter(mode, [param])',
      description: 'Применяет фильтр к изображению/холсту',
      section: 'Image',
    },
    {
      name: 'mask(img)',
      description: 'Применяет маску к изображению',
      section: 'Image',
    },
    {
      name: 'resize(w, h)',
      description: 'Изменяет размер изображения (метод p5.Image)',
      section: 'Image',
    },
    {
      name: 'copy([src], [sx], [sy], [sw], [sh], [dx], [dy], [dw], [dh])',
      description: 'Копирует участок изображения',
      section: 'Image',
    },
    {
      name: 'blend([src], [sx], [sy], [sw], [sh], [dx], [dy], [dw], [dh], [mode])',
      description: 'Смешивает изображения',
      section: 'Image',
    },
    {
      name: 'get(x, y, [w], [h])',
      description: 'Получает пиксель или участок изображения',
      section: 'Image',
    },
    {
      name: 'set(x, y, c)',
      description: 'Задаёт пиксель или участок',
      section: 'Image',
    },
    {
      name: 'loadPixels()',
      description: 'Загружает массив пикселей',
      section: 'Image',
    },
    {
      name: 'updatePixels()',
      description: 'Применяет изменения пикселей',
      section: 'Image',
    },
    {
      name: 'saveCanvas([selectedCanvas], [filename], [extension])',
      description: 'Сохраняет холст как изображение',
      section: 'Image',
    },
    {
      name: 'save([object], [filename], [options])',
      description: 'Сохраняет данные или изображение',
      section: 'Image',
    },

    // Typography
    {
      name: 'text(str, x, y, [w], [h])',
      description: 'Рисует текст на холсте',
      section: 'Typography',
    },
    {
      name: 'textAlign([horizontal], [vertical])',
      description: 'Устанавливает выравнивание текста',
      section: 'Typography',
    },
    {
      name: 'textLeading(leading)',
      description: 'Устанавливает межстрочный интервал',
      section: 'Typography',
    },
    {
      name: 'textSize(size)',
      description: 'Устанавливает размер шрифта',
      section: 'Typography',
    },
    {
      name: 'textStyle(style)',
      description: 'Устанавливает стиль текста (NORMAL/BOLD/ITALIC)',
      section: 'Typography',
    },
    {
      name: 'textWidth(str)',
      description: 'Вычисляет ширину текста',
      section: 'Typography',
    },
    {
      name: 'textAscent()',
      description: 'Возвращает подъём текущего шрифта',
      section: 'Typography',
    },
    {
      name: 'textDescent()',
      description: 'Возвращает спуск текущего шрифта',
      section: 'Typography',
    },
    {
      name: 'loadFont(path, [successCallback])',
      description: 'Загружает шрифт как p5.Font',
      section: 'Typography',
    },
    {
      name: 'textFont(font, [size])',
      description: 'Устанавливает шрифт для текста',
      section: 'Typography',
    },
    {
      name: 'textBounds(str, x, y, [fontSize])',
      description: 'Возвращает ограничивающую рамку текста',
      section: 'Typography',
    },

    // Transform
    {
      name: 'push()',
      description: 'Сохраняет текущие настройки стиля и трансформации',
      section: 'Transform',
    },
    {
      name: 'pop()',
      description: 'Восстанавливает последние сохранённые настройки',
      section: 'Transform',
    },
    {
      name: 'translate(x, [y], [z])',
      description: 'Перемещает начало координат',
      section: 'Transform',
    },
    {
      name: 'rotate(angle)',
      description: 'Поворачивает холст вокруг начала координат',
      section: 'Transform',
    },
    {
      name: 'rotateZ(angle)',
      description: 'Поворачивает вокруг оси Z (3D)',
      section: 'Transform',
    },
    {
      name: 'scale(s, [y], [z])',
      description: 'Масштабирует холст',
      section: 'Transform',
    },
    {
      name: 'shearX(angle)',
      description: 'Наклоняет холст по оси X',
      section: 'Transform',
    },
    {
      name: 'shearY(angle)',
      description: 'Наклоняет холст по оси Y',
      section: 'Transform',
    },
    {
      name: 'applyMatrix(a, b, c, d, e, f)',
      description: 'Применяет матрицу трансформации',
      section: 'Transform',
    },
    {
      name: 'resetMatrix()',
      description: 'Сбрасывает матрицу трансформации к единичной',
      section: 'Transform',
    },
    {
      name: 'rotateX(angle)',
      description: 'Поворачивает вокруг оси X (3D)',
      section: 'Transform',
    },
    {
      name: 'rotateY(angle)',
      description: 'Поворачивает вокруг оси Y (3D)',
      section: 'Transform',
    },

    // Lights & Camera
    {
      name: 'lights()',
      description: 'Включает стандартное освещение',
      section: 'Lights & Camera',
    },
    {
      name: 'noLights()',
      description: 'Отключает все источники света',
      section: 'Lights & Camera',
    },
    {
      name: 'ambientLight(r, g, b)',
      description: 'Добавляет окружающий свет',
      section: 'Lights & Camera',
    },
    {
      name: 'directionalLight(r, g, b, nx, ny, nz)',
      description: 'Добавляет направленный свет',
      section: 'Lights & Camera',
    },
    {
      name: 'pointLight(r, g, b, x, y, z)',
      description: 'Добавляет точечный источник света',
      section: 'Lights & Camera',
    },
    {
      name: 'spotLight(r, g, b, x, y, z, nx, ny, nz, angle, [conc])',
      description: 'Добавляет прожектор',
      section: 'Lights & Camera',
    },
    {
      name: 'lightFalloff(constant, linear, quadratic)',
      description: 'Устанавливает затухание света',
      section: 'Lights & Camera',
    },
    {
      name: 'specularColor(r, g, b)',
      description: 'Устанавливает цвет зеркального блика',
      section: 'Lights & Camera',
    },
    {
      name: 'normalMaterial()',
      description: 'Использует нормали для окраски',
      section: 'Lights & Camera',
    },
    {
      name: 'ambientMaterial(r, g, b)',
      description: 'Устанавливает окружающий материал',
      section: 'Lights & Camera',
    },
    {
      name: 'emissiveMaterial(r, g, b)',
      description: 'Устанавливает излучающий материал',
      section: 'Lights & Camera',
    },
    {
      name: 'specularMaterial(r, g, b)',
      description: 'Устанавливает зеркальный материал',
      section: 'Lights & Camera',
    },
    {
      name: 'shininess(n)',
      description: 'Устанавливает блеск материала',
      section: 'Lights & Camera',
    },
    {
      name: 'texture(tex)',
      description: 'Применяет текстуру к геометрии',
      section: 'Lights & Camera',
    },
    {
      name: 'camera([x], [y], [z], [cx], [cy], [cz])',
      description: 'Устанавливает камеру',
      section: 'Lights & Camera',
    },
    {
      name: 'perspective([fovy], [aspect], [near], [far])',
      description: 'Устанавливает перспективную проекцию',
      section: 'Lights & Camera',
    },
    {
      name: 'ortho([left], [right], [bottom], [top], [near], [far])',
      description: 'Устанавливает ортогональную проекцию',
      section: 'Lights & Camera',
    },
    {
      name: 'createCamera()',
      description: 'Создаёт объект камеры',
      section: 'Lights & Camera',
    },
    {
      name: 'setCamera(cam)',
      description: 'Устанавливает камеру для рендерера',
      section: 'Lights & Camera',
    },
    {
      name: 'orbitControl([sensitivity], [maxZoom], [minZoom])',
      description: 'Включает управление камерой мышью',
      section: 'Lights & Camera',
    },
    {
      name: 'debugMode([mode], [x], [y], [z], [size], [xOff], [yOff], [zOff])',
      description: 'Включает режим отладки',
      section: 'Lights & Camera',
    },
    {
      name: 'noDebugMode()',
      description: 'Отключает режим отладки',
      section: 'Lights & Camera',
    },

    // DOM
    {
      name: 'createDiv([html])',
      description: 'Создаёт элемент div',
      section: 'DOM',
    },
    {
      name: 'createP([html])',
      description: 'Создаёт элемент p (параграф)',
      section: 'DOM',
    },
    {
      name: 'createSpan([html])',
      description: 'Создаёт элемент span',
      section: 'DOM',
    },
    {
      name: 'createButton([label])',
      description: 'Создаёт кнопку',
      section: 'DOM',
    },
    {
      name: 'createCheckbox([label], [checked])',
      description: 'Создаёт чекбокс',
      section: 'DOM',
    },
    {
      name: 'createSlider(min, max, [value], [step])',
      description: 'Создаёт ползунок',
      section: 'DOM',
    },
    {
      name: 'createInput([value])',
      description: 'Создаёт текстовое поле ввода',
      section: 'DOM',
    },
    {
      name: 'createSelect([multiple])',
      description: 'Создаёт выпадающий список',
      section: 'DOM',
    },
    {
      name: 'createRadio([name])',
      description: 'Создаёт группу радио-кнопок',
      section: 'DOM',
    },
    {
      name: 'createColorPicker([value])',
      description: 'Создаёт выбор цвета',
      section: 'DOM',
    },
    {
      name: 'createFileInput(callback, [multiple])',
      description: 'Создаёт поле загрузки файла',
      section: 'DOM',
    },
    {
      name: 'createImg(src, [alt])',
      description: 'Создаёт изображение',
      section: 'DOM',
    },
    {
      name: 'createA(href, html, [target])',
      description: 'Создаёт ссылку',
      section: 'DOM',
    },
    {
      name: 'createVideo([src])',
      description: 'Создаёт видео элемент',
      section: 'DOM',
    },
    {
      name: 'createAudio([src])',
      description: 'Создаёт аудио элемент',
      section: 'DOM',
    },
    {
      name: 'createElement(tag, [value])',
      description: 'Создаёт произвольный элемент',
      section: 'DOM',
    },
    {
      name: 'select(query)',
      description: 'Находит первый элемент по селектору',
      section: 'DOM',
    },
    {
      name: 'selectAll(query)',
      description: 'Находит все элементы по селектору',
      section: 'DOM',
    },
    {
      name: 'removeElements()',
      description: 'Удаляет все DOM-элементы, созданные через p5',
      section: 'DOM',
    },
    {
      name: 'html([html])',
      description: 'Изменяет HTML-содержимое элемента',
      section: 'DOM',
    },
    {
      name: 'value([value])',
      description: 'Получает или задаёт значение элемента',
      section: 'DOM',
    },
    {
      name: 'style(property, [value])',
      description: 'Изменяет стиль элемента',
      section: 'DOM',
    },
    { name: 'remove()', description: 'Удаляет DOM-элемент', section: 'DOM' },
    {
      name: 'changed(callback)',
      description: 'Вызывается при изменении значения элемента',
      section: 'DOM',
    },
    {
      name: 'input(callback)',
      description: 'Вызывается при вводе данных в элемент',
      section: 'DOM',
    },

    // Data
    {
      name: 'append(array, value)',
      description: 'Добавляет элемент в конец массива',
      section: 'Data',
    },
    {
      name: 'arrayCopy(src, dst, [length])',
      description: 'Копирует элементы между массивами',
      section: 'Data',
    },
    {
      name: 'concat(array1, array2)',
      description: 'Объединяет два массива',
      section: 'Data',
    },
    {
      name: 'reverse(array)',
      description: 'Переворачивает массив',
      section: 'Data',
    },
    {
      name: 'shorten(array)',
      description: 'Удаляет последний элемент массива',
      section: 'Data',
    },
    {
      name: 'shuffle(array, [bool])',
      description: 'Перемешивает массив',
      section: 'Data',
    },
    {
      name: 'sort(array, [count])',
      description: 'Сортирует массив',
      section: 'Data',
    },
    {
      name: 'splice(array, index, count)',
      description: 'Вставляет/удаляет элементы массива',
      section: 'Data',
    },
    {
      name: 'subset(array, start, [count])',
      description: 'Возвращает подмассив',
      section: 'Data',
    },
    {
      name: 'float(str)',
      description: 'Преобразует в число с плавающей точкой',
      section: 'Data',
    },
    {
      name: 'int(str)',
      description: 'Преобразует в целое число',
      section: 'Data',
    },
    { name: 'str(num)', description: 'Преобразует в строку', section: 'Data' },
    {
      name: 'boolean(value)',
      description: 'Преобразует в булево значение',
      section: 'Data',
    },
    { name: 'byte(value)', description: 'Преобразует в байт', section: 'Data' },
    {
      name: 'char(value)',
      description: 'Преобразует в символ',
      section: 'Data',
    },
    {
      name: 'unchar(str)',
      description: 'Преобразует символ в код',
      section: 'Data',
    },
    {
      name: 'hex(value, [digits])',
      description: 'Преобразует в шестнадцатеричную строку',
      section: 'Data',
    },
    {
      name: 'unhex(str)',
      description: 'Преобразует из шестнадцатеричной строки',
      section: 'Data',
    },
    {
      name: 'join(array, separator)',
      description: 'Объединяет массив в строку',
      section: 'Data',
    },
    {
      name: 'split(str, delimiter)',
      description: 'Разбивает строку на массив',
      section: 'Data',
    },
    {
      name: 'splitTokens(str, [tokens])',
      description: 'Разбивает строку по токенам',
      section: 'Data',
    },
    {
      name: 'trim(str)',
      description: 'Удаляет пробелы по краям строки',
      section: 'Data',
    },
    {
      name: 'nf(num, left, [right])',
      description: 'Форматирует число',
      section: 'Data',
    },
    {
      name: 'nfc(num, [right])',
      description: 'Форматирует число с разделителями',
      section: 'Data',
    },
    {
      name: 'nfp(num, left, [right])',
      description: 'Форматирует число со знаком',
      section: 'Data',
    },
    {
      name: 'nfs(num, left, [right])',
      description: 'Форматирует число с пробелом',
      section: 'Data',
    },
    {
      name: 'createStringDict()',
      description: 'Создаёт строковый словарь',
      section: 'Data',
    },
    {
      name: 'createNumberDict()',
      description: 'Создаёт числовой словарь',
      section: 'Data',
    },
    {
      name: 'storeItem(key, value)',
      description: 'Сохраняет в localStorage',
      section: 'Data',
    },
    {
      name: 'getItem(key)',
      description: 'Получает из localStorage',
      section: 'Data',
    },
    {
      name: 'removeItem(key)',
      description: 'Удаляет из localStorage',
      section: 'Data',
    },
    {
      name: 'clearStorage()',
      description: 'Очищает localStorage',
      section: 'Data',
    },

    // IO
    {
      name: 'loadJSON(path, [callback])',
      description: 'Загружает JSON файл',
      section: 'IO',
    },
    {
      name: 'loadStrings(path, [callback])',
      description: 'Загружает текстовый файл построчно',
      section: 'IO',
    },
    {
      name: 'loadTable(path, [options], [callback])',
      description: 'Загружает CSV/TSV файл как таблицу',
      section: 'IO',
    },
    {
      name: 'loadXML(path, [callback])',
      description: 'Загружает XML файл',
      section: 'IO',
    },
    {
      name: 'loadBytes(path, [callback])',
      description: 'Загружает файл как байты',
      section: 'IO',
    },
    {
      name: 'httpGet(path, [data], [callback])',
      description: 'Выполняет HTTP GET запрос',
      section: 'IO',
    },
    {
      name: 'httpPost(path, [data], [callback])',
      description: 'Выполняет HTTP POST запрос',
      section: 'IO',
    },
    {
      name: 'httpDo(path, [method], [data], [callback])',
      description: 'Выполняет HTTP запрос',
      section: 'IO',
    },
    {
      name: 'createWriter([filename])',
      description: 'Создаёт объект для записи в файл',
      section: 'IO',
    },
    {
      name: 'saveJSON(data, filename, [optimize])',
      description: 'Сохраняет JSON файл',
      section: 'IO',
    },
    {
      name: 'saveStrings(data, filename)',
      description: 'Сохраняет массив строк в файл',
      section: 'IO',
    },
    {
      name: 'saveTable(table, filename, [options])',
      description: 'Сохраняет таблицу в файл',
      section: 'IO',
    },
    {
      name: 'save([object], [filename], [options])',
      description: 'Сохраняет данные или изображение',
      section: 'IO',
    },
    {
      name: 'saveCanvas([selectedCanvas], [filename], [extension])',
      description: 'Сохраняет холст как изображение',
      section: 'IO',
    },
    {
      name: 'millis()',
      description: 'Возвращает миллисекунды с начала программы',
      section: 'IO',
    },
    { name: 'year()', description: 'Возвращает текущий год', section: 'IO' },
    { name: 'month()', description: 'Возвращает текущий месяц', section: 'IO' },
    { name: 'day()', description: 'Возвращает текущий день', section: 'IO' },
    { name: 'hour()', description: 'Возвращает текущий час', section: 'IO' },
    {
      name: 'minute()',
      description: 'Возвращает текущую минуту',
      section: 'IO',
    },
    {
      name: 'second()',
      description: 'Возвращает текущую секунду',
      section: 'IO',
    },

    // Constants - Alignment
    {
      name: 'CENTER',
      description: 'Выравнивание по центру',
      section: 'Constants',
    },
    { name: 'CORNER', description: 'Координаты от угла', section: 'Constants' },
    {
      name: 'CORNERS',
      description: 'Координаты по двум углам',
      section: 'Constants',
    },
    {
      name: 'RADIUS',
      description: 'Координаты по радиусу',
      section: 'Constants',
    },
    { name: 'LEFT', description: 'Выравнивание влево', section: 'Constants' },
    { name: 'RIGHT', description: 'Выравнивание вправо', section: 'Constants' },
    { name: 'TOP', description: 'Выравнивание сверху', section: 'Constants' },
    { name: 'BOTTOM', description: 'Выравнивание снизу', section: 'Constants' },
    {
      name: 'BASELINE',
      description: 'Выравнивание по базовой линии',
      section: 'Constants',
    },
    { name: 'OPEN', description: 'Открытая фигура', section: 'Constants' },
    { name: 'CLOSE', description: 'Замкнутая фигура', section: 'Constants' },

    // Constants - Math
    { name: 'PI', description: 'Число π (пи)', section: 'Constants' },
    { name: 'HALF_PI', description: 'Половина π', section: 'Constants' },
    { name: 'QUARTER_PI', description: 'Четверть π', section: 'Constants' },
    { name: 'TAU', description: '2π (Тау)', section: 'Constants' },
    { name: 'TWO_PI', description: '2π', section: 'Constants' },

    // Constants - Angle modes
    { name: 'DEGREES', description: 'Градусы', section: 'Constants' },
    { name: 'RADIANS', description: 'Радианы', section: 'Constants' },

    // Constants - Color modes
    { name: 'RGB', description: 'Цветовая модель RGB', section: 'Constants' },
    { name: 'HSB', description: 'Цветовая модель HSB', section: 'Constants' },
    { name: 'HSL', description: 'Цветовая модель HSL', section: 'Constants' },

    // Constants - Renderer
    { name: 'WEBGL', description: 'Режим WebGL', section: 'Constants' },
    { name: 'P2D', description: '2D-рендерер', section: 'Constants' },
    { name: 'P3D', description: '3D-рендерер', section: 'Constants' },

    // Constants - Blend modes
    { name: 'BLEND', description: 'Обычное смешивание', section: 'Constants' },
    { name: 'DARKEST', description: 'Затемнение', section: 'Constants' },
    { name: 'LIGHTEST', description: 'Осветление', section: 'Constants' },
    { name: 'DIFFERENCE', description: 'Разность', section: 'Constants' },
    { name: 'MULTIPLY', description: 'Умножение', section: 'Constants' },
    {
      name: 'SCREEN',
      description: 'Экранное смешивание',
      section: 'Constants',
    },
    { name: 'OVERLAY', description: 'Наложение', section: 'Constants' },
    { name: 'HARD_LIGHT', description: 'Жёсткий свет', section: 'Constants' },
    { name: 'SOFT_LIGHT', description: 'Мягкий свет', section: 'Constants' },
    { name: 'DODGE', description: 'Осветление', section: 'Constants' },
    { name: 'BURN', description: 'Затемнение', section: 'Constants' },
    { name: 'ADD', description: 'Сложение', section: 'Constants' },
    { name: 'REMOVE', description: 'Удаление', section: 'Constants' },
    { name: 'EXCLUSION', description: 'Исключение', section: 'Constants' },
    { name: 'NORMAL', description: 'Нормальный режим', section: 'Constants' },
    {
      name: 'THRESHOLD',
      description: 'Пороговый эффект',
      section: 'Constants',
    },
    { name: 'GRAY', description: 'Оттенки серого', section: 'Constants' },
    { name: 'OPAQUE', description: 'Непрозрачный', section: 'Constants' },
    { name: 'INVERT', description: 'Инверсия', section: 'Constants' },
    { name: 'POSTERIZE', description: 'Постеризация', section: 'Constants' },
    { name: 'DILATE', description: 'Расширение', section: 'Constants' },
    { name: 'ERODE', description: 'Эрозия', section: 'Constants' },

    // Constants - Cursors
    { name: 'ARROW', description: 'Курсор-стрелка', section: 'Constants' },
    { name: 'CROSS', description: 'Курсор-крест', section: 'Constants' },
    { name: 'HAND', description: 'Курсор-рука', section: 'Constants' },
    { name: 'MOVE', description: 'Курсор перемещения', section: 'Constants' },
    { name: 'TEXT', description: 'Текстовый курсор', section: 'Constants' },
    { name: 'WAIT', description: 'Курсор ожидания', section: 'Constants' },
    { name: 'AUTO', description: 'Автоматический режим', section: 'Constants' },

    // Constants - Keys
    { name: 'ALT', description: 'Клавиша Alt', section: 'Constants' },
    {
      name: 'BACKSPACE',
      description: 'Клавиша Backspace',
      section: 'Constants',
    },
    { name: 'CONTROL', description: 'Клавиша Ctrl', section: 'Constants' },
    { name: 'DELETE', description: 'Клавиша Delete', section: 'Constants' },
    { name: 'DOWN_ARROW', description: 'Стрелка вниз', section: 'Constants' },
    { name: 'ENTER', description: 'Клавиша Enter', section: 'Constants' },
    { name: 'ESCAPE', description: 'Клавиша Esc', section: 'Constants' },
    { name: 'LEFT_ARROW', description: 'Стрелка влево', section: 'Constants' },
    { name: 'OPTION', description: 'Клавиша Option', section: 'Constants' },
    { name: 'RETURN', description: 'Клавиша Return', section: 'Constants' },
    {
      name: 'RIGHT_ARROW',
      description: 'Стрелка вправо',
      section: 'Constants',
    },
    { name: 'SHIFT', description: 'Клавиша Shift', section: 'Constants' },
    { name: 'TAB', description: 'Клавиша Tab', section: 'Constants' },
    { name: 'UP_ARROW', description: 'Стрелка вверх', section: 'Constants' },

    // Constants - Other
    {
      name: 'VERSION',
      description: 'Текущая версия p5.js',
      section: 'Constants',
    },
  ];
