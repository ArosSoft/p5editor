// 🔢 ОСНОВЫ АЛГОРИТМОВ
// Интерактивная демонстрация алгоритмов на JavaScript

let currentAlgorithm = 0;
let numbers = [];
let sortedNumbers = [];
let secretNumber = 0;
let guessCount = 0;
let maxGuesses = 7;
let gameWon = false;
let fibSequence = [];
let inputA = 48;
let inputB = 18;

function setup() {
  createCanvas(600, 500);
  textAlign(CENTER, CENTER);
  generateRandomNumbers();
  secretNumber = floor(random(1, 100));
  generateFibSequence();
}

function draw() {
  background(245);
  
  // Заголовок
  fill(0);
  textSize(20);
  textStyle(BOLD);
  text('🔢 Основы алгоритмов на JavaScript', width / 2, 30);
  
  // Меню выбора алгоритма
  drawMenu();
  
  // Область демонстрации
  fill(255);
  stroke(200);
  rect(20, 80, width - 40, 400, 10);
  noStroke();
  
  // Демонстрация выбранного алгоритма
  drawAlgorithmDemo();
  
  // Инструкция
  fill(60);
  textSize(14);
  textStyle(NORMAL);
  text('Нажми 1-0 для выбора алгоритма. Кликай для взаимодействия!', width / 2, 490);
}

function drawMenu() {
  const algorithms = [
    '1. Переменные',
    '2. if-else',
    '3. for цикл',
    '4. while цикл',
    '5. Функции',
    '6. Массивы',
    '7. Сортировка',
    '8. Рекурсия',
    '9. НОД',
    '10. Поиск'
  ];
  
  textSize(11);
  for (let i = 0; i < algorithms.length; i++) {
    if (i === currentAlgorithm) {
      fill(76, 175, 80);
      stroke(50, 150, 50);
    } else {
      fill(255);
      stroke(200);
    }
    rect(10 + (i % 5) * 118, 45, 113, 25, 5);
    fill(i === currentAlgorithm ? 255 : 0);
    text(algorithms[i], 66 + (i % 5) * 118, 58);
  }
}

function drawAlgorithmDemo() {
  textSize(16);
  textAlign(LEFT, TOP);
  
  switch (currentAlgorithm) {
    case 0: // Переменные
      drawVariablesDemo();
      break;
    case 1: // if-else
      drawIfElseDemo();
      break;
    case 2: // for цикл
      drawForLoopDemo();
      break;
    case 3: // while цикл
      drawWhileLoopDemo();
      break;
    case 4: // Функции
      drawFunctionsDemo();
      break;
    case 5: // Массивы
      drawArraysDemo();
      break;
    case 6: // Сортировка
      drawSortingDemo();
      break;
    case 7: // Рекурсия
      drawRecursionDemo();
      break;
    case 8: // НОД
      drawGCDDemo();
      break;
    case 9: // Поиск
      drawSearchDemo();
      break;
  }
}

function drawVariablesDemo() {
  fill(0);
  textSize(18);
  text('1. Переменные и последовательность действий', 40, 100);
  
  textSize(14);
  text('Переменная — это «коробочка» для хранения данных.', 40, 130);
  
  // Визуализация переменных
  fill(76, 175, 80);
  rect(60, 160, 100, 80, 5);
  fill(255);
  text('x = 5', 110, 180);
  text('5', 110, 220);
  
  fill(33, 150, 243);
  rect(200, 160, 100, 80, 5);
  fill(255);
  text('y = 10', 250, 180);
  text('10', 250, 220);
  
  fill(255, 152, 0);
  rect(340, 160, 100, 80, 5);
  fill(255);
  text('sum = x + y', 390, 180);
  text('15', 390, 220);
  
  // Код
  fill(30);
  textSize(13);
  text('let x = 5;', 60, 280);
  text('let y = 10;', 60, 305);
  text('let sum = x + y;', 60, 330);
  text(`console.log(\\`Сумма \\${x} + \\${y} = \\${sum}\\`);`, 60, 355);
  
  fill(0, 150, 0);
  text('→ Сумма 5 + 10 = 15', 60, 390);
}

function drawIfElseDemo() {
  fill(0);
  textSize(18);
  text('2. Условные операторы (if-else)', 40, 100);
  
  textSize(14);
  text('Проверяем число на чётность:', 40, 130);
  
  let testNumber = 42;
  let isEven = testNumber % 2 === 0;
  
  // Визуализация
  fill(isEven ? 76, 175, 80 : 244, 67, 54);
  ellipse(150, 200, 100, 100);
  fill(255);
  textSize(24);
  text(testNumber, 150, 200);
  
  textSize(16);
  fill(0);
  text(`${testNumber} % 2 = ${testNumber % 2}`, 280, 180);
  
  if (isEven) {
    fill(76, 175, 80);
    text('✅ ЧЁТНОЕ!', 280, 220);
  } else {
    fill(244, 67, 54);
    text('❌ НЕЧЁТНОЕ!', 280, 220);
  }
  
  // Код
  fill(30);
  textSize(13);
  text('let number = 42;', 40, 280);
  text('if (number % 2 === 0) {', 40, 305);
  text('  console.log("Чётное!");', 60, 330);
  text('} else {', 40, 355);
  text('  console.log("Нечётное!");', 60, 380);
  text('}', 40, 405);
}

function drawForLoopDemo() {
  fill(0);
  textSize(18);
  text('3. Цикл for — таблица умножения', 40, 100);
  
  textSize(14);
  text('Цикл повторяет код заданное количество раз:', 40, 130);
  
  // Таблица умножения на 5
  fill(30);
  textSize(12);
  for (let i = 1; i <= 5; i++) {
    let result = 5 * i;
    fill(76, 175, 80);
    rect(60 + (i - 1) * 95, 160, 85, 200, 5);
    fill(255);
    text(`5 × ${i}`, 102 + (i - 1) * 95, 180);
    text('= ' + result, 102 + (i - 1) * 95, 340);
  }
  
  // Код
  fill(30);
  textSize(12);
  text('for (let i = 1; i <= 10; i++) {', 40, 380);
  text(`  console.log(\\`5 × \\${i} = \\${5 * i}\\`);`, 60, 405);
  text('}', 40, 430);
}

function drawWhileLoopDemo() {
  fill(0);
  textSize(18);
  text('4. Цикл while — игра «Угадай число»', 40, 100);
  
  textSize(14);
  text(`Загадано число от 1 до 100. Попыток: ${guessCount}/${maxGuesses}`, 40, 130);
  
  // Визуализация числа
  fill(156, 39, 176);
  rect(200, 160, 200, 100, 10);
  fill(255);
  textSize(20);
  text(`? (1-100)`, 300, 190);
  text(`Попыток: ${guessCount}`, 300, 230);
  
  // Подсказки
  textSize(14);
  fill(0);
  text('Кликни, чтобы сделать попытку!', 300, 270);
  
  // Код
  fill(30);
  textSize(12);
  text('while (guess !== secret) {', 40, 310);
  text('  guess = parseInt(prompt("Угадай:"));', 60, 335);
  text('  if (guess < secret) console.log("Больше!");', 60, 360);
  text('  else if (guess > secret) console.log("Меньше!");', 60, 385);
  text('}', 40, 410);
  text('console.log("Угадал! 🎉");', 40, 435);
}

function drawFunctionsDemo() {
  fill(0);
  textSize(18);
  text('5. Функции — расчёт факториала', 40, 100);
  
  textSize(14);
  text('Функция — это именованный блок кода, который можно вызывать:', 40, 130);
  
  // Визуализация факториала
  let n = 5;
  let result = 1;
  for (let i = 1; i <= n; i++) {
    result *= i;
  }
  
  fill(255, 152, 0);
  ellipse(150, 200, 80, 80);
  fill(255);
  textSize(20);
  text('5!', 150, 200);
  
  fill(0);
  textSize(16);
  text('=', 220, 190);
  
  fill(76, 175, 80);
  ellipse(300, 200, 80, 80);
  fill(255);
  text(result, 300, 200);
  
  // Формула
  textSize(14);
  fill(0);
  text('5! = 1 × 2 × 3 × 4 × 5 = 120', 150, 260);
  
  // Код
  fill(30);
  textSize(12);
  text('function factorial(n) {', 40, 300);
  text('  let result = 1;', 60, 325);
  text('  for (let i = 2; i <= n; i++) {', 60, 350);
  text('    result *= i;', 80, 375);
  text('  }', 60, 400);
  text('  return result;', 60, 425);
  text('}', 40, 450);
}

function drawArraysDemo() {
  fill(0);
  textSize(18);
  text('6. Массивы — поиск максимума', 40, 100);
  
  textSize(14);
  text('Массив — это список значений. Ищем максимальное:', 40, 130);
  
  let scores = [87, 95, 72, 88, 91];
  let maxScore = max(scores);
  let maxIndex = scores.indexOf(maxScore);
  
  // Визуализация массива
  for (let i = 0; i < scores.length; i++) {
    let height = scores[i] * 1.5;
    if (i === maxIndex) {
      fill(76, 175, 80);
    } else {
      fill(100, 100, 250);
    }
    rect(80 + i * 90, 350 - height, 70, height, 5);
    fill(255);
    textSize(14);
    text(scores[i], 115 + i * 90, 350 - height / 2);
  }
  
  // Результат
  fill(76, 175, 80);
  rect(480, 180, 100, 60, 5);
  fill(255);
  text(`MAX = ${maxScore}`, 530, 210);
  
  // Код
  fill(30);
  textSize(11);
  text('let scores = [87, 95, 72, 88, 91];', 40, 400);
  text('let max = scores[0];', 40, 420);
  text('for (let score of scores) {', 40, 440);
  text('  if (score > max) max = score;', 60, 460);
  text('}', 40, 480);
}

function drawSortingDemo() {
  fill(0);
  textSize(18);
  text('7. Сортировка пузырьком', 40, 100);
  
  textSize(14);
  text('Сравниваем соседние элементы и меняем местами:', 40, 130);
  
  // Исходный массив
  let unsorted = [64, 34, 25, 12, 22];
  let sorted = [...unsorted].sort((a, b) => a - b);
  
  // До
  fill(150);
  text('До:', 60, 170);
  for (let i = 0; i < unsorted.length; i++) {
    fill(244, 67, 54);
    rect(100 + i * 50, 160, 45, 45, 5);
    fill(255);
    text(unsorted[i], 122 + i * 50, 182);
  }
  
  // После
  fill(150);
  text('После:', 60, 230);
  for (let i = 0; i < sorted.length; i++) {
    fill(76, 175, 80);
    rect(100 + i * 50, 220, 45, 45, 5);
    fill(255);
    text(sorted[i], 122 + i * 50, 242);
  }
  
  // Код
  fill(30);
  textSize(10);
  text('for (let i = 0; i < arr.length; i++) {', 40, 300);
  text('  for (let j = 0; j < arr.length - i - 1; j++) {', 60, 320);
  text('    if (arr[j] > arr[j + 1]) {', 80, 340);
  text('      [arr[j], arr[j+1]] = [arr[j+1], arr[j]];', 100, 360);
  text('    }', 80, 380);
  text('  }', 60, 400);
  text('}', 40, 420);
}

function drawRecursionDemo() {
  fill(0);
  textSize(18);
  text('8. Рекурсия — числа Фибоначчи', 40, 100);
  
  textSize(14);
  text('Рекурсия — функция вызывает сама себя:', 40, 130);
  
  // Последовательность Фибоначчи
  let fib = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34];
  
  fill(156, 39, 176);
  for (let i = 0; i < fib.length; i++) {
    rect(50 + i * 52, 160, 48, 48, 5);
    fill(255);
    text(fib[i], 74 + i * 52, 182);
    fill(156, 39, 176);
  }
  
  // Формула
  textSize(14);
  fill(0);
  text('F(n) = F(n-1) + F(n-2)', 200, 240);
  text('F(0) = 0, F(1) = 1', 200, 265);
  
  // Код
  fill(30);
  textSize(12);
  text('function fib(n) {', 40, 310);
  text('  if (n <= 1) return n;', 60, 335);
  text('  return fib(n-1) + fib(n-2);', 60, 360);
  text('}', 40, 385);
  text('// fib(10) = 55', 40, 420);
}

function drawGCDDemo() {
  fill(0);
  textSize(18);
  text('9. Алгоритм Евклида — НОД', 40, 100);
  
  textSize(14);
  text(`Находим НОД(${inputA}, ${inputB}):`, 40, 130);
  
  // Визуализация алгоритма
  let a = inputA, b = inputB;
  let steps = [];
  while (b !== 0) {
    steps.push(`НОД(${a}, ${b}) → ${a} % ${b} = ${a % b}`);
    let temp = b;
    b = a % b;
    a = temp;
  }
  steps.push(`Ответ: ${a}`);
  
  fill(30);
  textSize(11);
  for (let i = 0; i < steps.length && i < 5; i++) {
    fill(i === steps.length - 1 ? 76, 175, 80 : 255);
    text(steps[i], 60, 180 + i * 40);
  }
  
  // Код
  fill(30);
  textSize(11);
  text('function gcd(a, b) {', 40, 320);
  text('  while (b !== 0) {', 60, 345);
  text('    let temp = b;', 80, 370);
  text('    b = a % b;', 80, 395);
  text('    a = temp;', 80, 420);
  text('  }', 60, 445);
  text('  return a;', 60, 470);
  text('}', 40, 495);
}

function drawSearchDemo() {
  fill(0);
  textSize(18);
  text('10. Поиск в массиве', 40, 100);
  
  textSize(14);
  text('Линейный поиск: проверяем каждый элемент:', 40, 130);
  
  let numbers = [10, 20, 30, 40, 50, 60];
  let target = 40;
  let foundIndex = numbers.indexOf(target);
  
  // Визуализация
  for (let i = 0; i < numbers.length; i++) {
    if (numbers[i] === target) {
      fill(76, 175, 80);
    } else {
      fill(200);
    }
    rect(60 + i * 75, 160, 65, 65, 5);
    fill(numbers[i] === target ? 255 : 0);
    text(numbers[i], 92 + i * 75, 192);
    
    if (numbers[i] === target) {
      fill(76, 175, 80);
      text('✅', 92 + i * 75, 240);
    }
  }
  
  // Результат
  fill(0);
  textSize(14);
  text(`Число ${target} найдено на индексе ${foundIndex}`, 40, 270);
  
  // Код
  fill(30);
  textSize(11);
  text('function linearSearch(arr, target) {', 40, 310);
  text('  for (let i = 0; i < arr.length; i++) {', 60, 335);
  text('    if (arr[i] === target) return i;', 80, 360);
  text('  }', 60, 385);
  text('  return -1; // не найдено', 60, 410);
  text('}', 40, 445);
}

function mousePressed() {
  // Проверка клика по меню
  if (mouseY >= 45 && mouseY <= 70) {
    for (let i = 0; i < 10; i++) {
      if (mouseX >= 10 + i % 5 * 118 && mouseX <= 123 + i % 5 * 118) {
        currentAlgorithm = i;
        // Сброс для игры в угадай число
        if (i === 3) {
          secretNumber = floor(random(1, 100));
          guessCount = 0;
          gameWon = false;
        }
        return;
      }
    }
  }
  
  // Клик для игры в угадай число
  if (currentAlgorithm === 3 && mouseY > 160 && mouseY < 280) {
    guessCount++;
  }
}

function keyPressed() {
  // Выбор алгоритма клавишами 1-0
  if (key >= '1' && key <= '9') {
    currentAlgorithm = int(key) - 1;
  } else if (key === '0') {
    currentAlgorithm = 9;
  }
}

function generateRandomNumbers() {
  numbers = [];
  for (let i = 0; i < 7; i++) {
    numbers.push(floor(random(10, 99)));
  }
  sortedNumbers = [...numbers].sort((a, b) => a - b);
}

function generateFibSequence() {
  fibSequence = [0, 1];
  for (let i = 2; i < 10; i++) {
    fibSequence.push(fibSequence[i-1] + fibSequence[i-2]);
  }
}
