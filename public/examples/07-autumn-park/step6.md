# Урок 6: Анимация падающих листьев

Самая волшебная часть — заставим листья падать с деревьев, покачиваясь и вращаясь!

## Функция createLeaf()
Сначала напишем функцию, которая создаёт один листик со случайными свойствами:

```javascript
function createLeaf() {
  let tree = random(treePositions);

  return {
    treeX: tree.x,
    treeY: tree.y,
    x: tree.x + random(-tree.crownWidth * 0.5, tree.crownWidth * 0.5),
    y: tree.y - tree.trunkHeight + random(20, tree.crownHeight),
    size: random(6, 15),
    speed: random(0.3, 1.2),
    rotation: random(TWO_PI),
    rotSpeed: random(-0.03, 0.03),
    swingAmount: random(0.3, 1),
    swingSpeed: random(0.02, 0.04),
    timeOffset: random(TWO_PI),
    falling: false,
    fallDelay: random(100, 400),
    colorHue: random(20, 40)
  };
}
```

## Что такое `return`?
`return` возвращает значение из функции. Здесь мы возвращаем объект с 15 свойствами!

## Свойства листика
| Свойство | Что делает |
|----------|------------|
| `x`, `y` | текущая позиция |
| `size` | размер от 6 до 15 пикселей |
| `speed` | скорость падения |
| `rotation` | текущий угол поворота |
| `rotSpeed` | скорость вращения |
| `swingAmount` | насколько сильно качается |
| `swingSpeed` | скорость покачивания |
| `timeOffset` | случайный сдвиг фазы |
| `falling` | падает ли сейчас |
| `fallDelay` | задержка перед падением |
| `colorHue` | оттенок цвета (20-40 = оранжевый) |

## Обновляем и рисуем листья
Добавь этот код в `draw()` после рисования деревьев:

```javascript
  // Обновляем и рисуем падающие листья
  for (let leaf of leaves) {
    if (!leaf.falling) {
      leaf.fallDelay--;
      if (leaf.fallDelay <= 0) {
        leaf.falling = true;
      }
    } else {
      leaf.y += leaf.speed;
      leaf.x += sin(frameCount * leaf.swingSpeed + leaf.timeOffset) * leaf.swingAmount;
      leaf.rotation += leaf.rotSpeed;

      if (leaf.y > height + 30) {
        let newLeaf = createLeaf();
        leaf.x = newLeaf.x;
        leaf.y = newLeaf.y;
        leaf.falling = false;
        leaf.fallDelay = random(200, 500);
        leaf.colorHue = newLeaf.colorHue;
      }
    }

    drawRealisticLeaf(leaf);
  }
```

## Как работает анимация?
1.  Если листик ещё не падает (`!leaf.falling`), уменьшаем `fallDelay`
2.  Когда задержка кончается — начинаем падение
3.  `leaf.y += leaf.speed` — листик движется вниз
4.  `sin(...)` — создаёт покачивание из стороны в сторону
5.  Когда листик улетает за экран — создаём новый на дереве

## Почему `sin` для покачивания?
Функция `sin()` возвращает значения от -1 до 1 по синусоиде. Это создаёт плавное движение влево-вправо, как у настоящего листика на ветру!

## Рисуем реалистичный листик
Функция `drawRealisticLeaf()` создаёт красивый лист с прожилками:

```javascript
function drawRealisticLeaf(leaf) {
  push();
  translate(leaf.x, leaf.y);
  rotate(leaf.rotation);

  // Осенний цвет листа
  colorMode(HSB, 360, 100, 100, 100);
  fill(leaf.colorHue, 80, 90, 80);
  colorMode(RGB, 255, 255, 255, 255);

  noStroke();

  // Форма листа (более реалистичная)
  beginShape();
  for (let a = 0; a < TWO_PI; a += 0.3) {
    let r1 = leaf.size * (0.6 + 0.3 * sin(3 * a) + 0.1 * sin(5 * a));
    let x1 = cos(a) * r1;
    let y1 = sin(a) * r1 * 0.7;
    vertex(x1, y1);
  }
  endShape(CLOSE);

  // Прожилки
  stroke(100, 50, 20, 100);
  strokeWeight(0.5);
  line(0, 0, leaf.size * 0.3, leaf.size * 0.2);
  line(0, 0, leaf.size * 0.2, -leaf.size * 0.2);

  // Черенок
  stroke(120, 60, 20);
  strokeWeight(1);
  line(0, 0, leaf.size * 0.4, leaf.size * 0.4);

  pop();
}
```

## Что такое HSB?
`colorMode(HSB, 360, 100, 100, 100)` переключает режим цвета:
*   **H** (Hue) — оттенок от 0 до 360 (как радуга)
*   **S** (Saturation) — насыщенность от 0 до 100
*   **B** (Brightness) — яркость от 0 до 100

`leaf.colorHue: 20-40` — это оттенки оранжевого и жёлтого!

## Форма листа через `beginShape()`
Цикл создаёт точки по кругу, но с разной дальностью:
*   `sin(3 * a)` — три больших выступа (как у клёнового листа)
*   `sin(5 * a)` — пять маленьких деталей
*   `y1 * 0.7` — сплющиваем круг по вертикали

Получается форма, похожая на настоящий лист!

![Падающие листья](/images/falling-leaves.png)

### Задание
Попробуй изменить анимацию:
1.  Сделай листья крупнее: измени `random(6, 15)` на `random(10, 20)`
2.  Замедли падение: умножь `leaf.speed` на 0.5
3.  Добавь красные листья: измени `colorHue` на `random(0, 40)`

## Финальные штрихи
Добавь тени от деревьев и листья на земле:

```javascript
  // Тени от деревьев
  drawTreeShadows();

  // Трава
  drawGrass();

  // Листья на земле
  drawLeavesOnGround();
```

Готово! Запусти программу и наблюдай за осенним листопадом! 🍂
