# Урок 5: Рисуем реалистичные деревья

Теперь нарисуем деревья с кронами, ветвями и текстурой коры. Каждое дерево будет уникальным!

## Рисуем все деревья
Добавь этот код в `draw()` после рисования земли:

```javascript
  // Рисуем деревья
  for (let tree of treePositions) {
    drawRealisticTree(tree);
  }
```

Цикл `for...of` проходит по всем деревьям в массиве и рисует каждое, вызывая функцию `drawRealisticTree(tree)`.

## Главная функция рисования дерева
Функция `drawRealisticTree()` вызывает три другие функции:

```javascript
function drawRealisticTree(tree) {
  // Ствол с текстурой коры
  drawTreeTrunk(tree);

  // Ветви
  drawTreeBranches(tree);

  // Крона (высокая и реалистичная)
  drawTreeCrown(tree);
}
```

Такой подход называется **разделением задачи**: большая задача разбивается на маленькие части.

## Рисуем ствол с корой
Функция `drawTreeTrunk()` создаёт ствол с текстурой:

```javascript
function drawTreeTrunk(tree) {
  // Основной ствол
  fill(80, 50, 20);
  noStroke();
  rect(tree.x - tree.trunkWidth/2, tree.y - tree.trunkHeight,
       tree.trunkWidth, tree.trunkHeight);

  // Текстура коры (вертикальные линии)
  stroke(60, 40, 15);
  strokeWeight(1);
  for (let i = 0; i < 3; i++) {
    let xOffset = -tree.trunkWidth/2 + i * tree.trunkWidth/2;
    for (let y = tree.y - tree.trunkHeight; y < tree.y; y += 15) {
      line(tree.x + xOffset, y, tree.x + xOffset + random(-2, 2), y + 10);
    }
  }

  // Тёмные пятна на коре
  noStroke();
  fill(50, 30, 10, 100);
  for (let i = 0; i < 5; i++) {
    ellipse(tree.x + random(-8, 8),
            tree.y - tree.trunkHeight + random(20, tree.trunkHeight - 20),
            5, 8);
  }
}
```

## Вложенные циклы
Для рисования коры используется **вложенный цикл** — цикл внутри цикла:
*   Внешний цикл (3 линии по ширине ствола)
*   Внутренний цикл (линии каждые 15 пикселей по высоте)

## Рисуем ветви
Функция `drawTreeBranches()` создаёт основные и тонкие веточки:

```javascript
function drawTreeBranches(tree) {
  stroke(70, 40, 15);
  strokeWeight(3);

  // Главные ветви
  line(tree.x, tree.y - tree.trunkHeight * 0.7,
       tree.x - tree.crownWidth * 0.4, tree.y - tree.trunkHeight * 0.8);
  line(tree.x, tree.y - tree.trunkHeight * 0.6,
       tree.x + tree.crownWidth * 0.5, tree.y - tree.trunkHeight * 0.7);

  strokeWeight(2);
  // Верхние ветви
  line(tree.x, tree.y - tree.trunkHeight * 0.4,
       tree.x - tree.crownWidth * 0.3, tree.y - tree.trunkHeight * 0.5);
  line(tree.x, tree.y - tree.trunkHeight * 0.3,
       tree.x + tree.crownWidth * 0.4, tree.y - tree.trunkHeight * 0.4);

  // Тонкие веточки
  strokeWeight(1);
  for (let i = 0; i < 5; i++) {
    let branchX = tree.x - tree.crownWidth * 0.3 + i * 10;
    let branchY = tree.y - tree.trunkHeight * 0.8 + i * 8;
    line(branchX, branchY, branchX - 10, branchY - 15);

    branchX = tree.x + tree.crownWidth * 0.3 - i * 10;
    line(branchX, branchY, branchX + 10, branchY - 15);
  }
}
```

## Рисуем крону с разными цветами
Самая сложная часть — крона дерева. Цвет зависит от типа дерева:

```javascript
function drawTreeCrown(tree) {
  noStroke();

  // Осенние цвета для листвы
  let color1, color2, color3;

  switch(tree.type) {
    case 'oak':
      color1 = color(200, 80, 20, 200);
      color2 = color(180, 100, 30, 180);
      color3 = color(150, 70, 10, 160);
      break;
    case 'maple':
      color1 = color(220, 60, 30, 200);
      color2 = color(200, 120, 20, 180);
      color3 = color(160, 70, 40, 160);
      break;
    case 'birch':
      color1 = color(210, 150, 30, 200);
      color2 = color(190, 120, 20, 180);
      color3 = color(140, 90, 25, 160);
      break;
  }
```

## Что такое `switch`?
`switch` — это способ выбрать один из нескольких вариантов:
*   Если `tree.type` равен `'oak'` — используем ржавые оттенки
*   Если `'maple'` — красные и оранжевые
*   Если `'birch'` — жёлтые и золотые

`break` останавливает выполнение `switch`, чтобы не выполнились лишние варианты.

## Рисуем крону из эллипсов
После выбора цветов рисуем крону из нескольких эллипсов:

```javascript
  // Верхняя часть кроны
  push();
  translate(tree.x, tree.y - tree.trunkHeight + tree.crownHeight * 0.4);

  // Основной объём
  fill(color1);
  ellipse(0, -tree.crownHeight * 0.3, tree.crownWidth * 0.9, tree.crownHeight * 0.7);

  // Верхушка
  fill(color2);
  ellipse(0, -tree.crownHeight * 0.6, tree.crownWidth * 0.6, tree.crownHeight * 0.5);

  // Боковые объёмы
  fill(color3);
  ellipse(-tree.crownWidth * 0.3, -tree.crownHeight * 0.2,
          tree.crownWidth * 0.5, tree.crownHeight * 0.4);
  ellipse(tree.crownWidth * 0.3, -tree.crownHeight * 0.2,
          tree.crownWidth * 0.5, tree.crownHeight * 0.4);

  pop();
}
```

## Что делают `push()` и `pop()`?
*   `push()` — сохраняет текущие настройки (позицию, цвета)
*   `translate(x, y)` — сдвигает систему координат в указанную точку
*   `pop()` — восстанавливает настройки обратно

Это удобно, чтобы не запутаться в координатах!

![Дерево с кронами](/images/autumn-trees.png)

### Задание
Попробуй изменить дерево:
1.  Добавь новый тип дерева `'pine'` с зелёными цветами
2.  Сделай крону шире: умножь `tree.crownWidth` на 1.2

### Почему так много кода для одного дерева?
Зато каждое дерево выглядит реалистично: с текстурой коры, ветвями и объёмной кроной! Это как рисовать картину — чем больше деталей, тем красивее.
