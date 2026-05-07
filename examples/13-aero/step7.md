# Урок 7: Красивые визуальные эффекты

Игра почти готова! Теперь добавим красивые визуальные эффекты: свечение игроков и замок для шайбы.

## Эффект свечения
Мы будем рисовать несколько кругов разного размера с разной прозрачностью для создания эффекта свечения.

## Добавляем визуальные эффекты

```javascript
function drawPlayer(player) {
  // Эффект свечения - несколько кругов подряд
  for (let i = 3; i > 0; i--) {
    let alpha = map(i, 0, 3, 80, 255);  // Прозрачность
    let r = playerRadius - i * 3;         // Размер круга
    fill(player.color[0], player.color[1], player.color[2], alpha);
    noStroke();
    ellipse(player.x, player.y, r * 2);
  }
  
  // Основной игрок
  fill(player.color[0], player.color[1], player.color[2]);
  ellipse(player.x, player.y, playerRadius * 2);
}

function drawPuck() {
  // Эффект свечения шайбы (голубой)
  for (let i = 2; i > 0; i--) {
    fill(180, 210, 255, map(i, 0, 2, 15, 40));
    ellipse(puck.x, puck.y, (puckRadius + i * 3) * 2);
  }
  
  // Основная шайба
  fill(220, 240, 255);
  ellipse(puck.x, puck.y, puckRadius * 2);
}

// Добавим светящиеся границы поля
function drawGlowBorders() {
  noFill();
  for (let i = 6; i > 0; i--) {
    let alpha = map(i, 0, 6, 30, 150);
    strokeWeight(i * 2);
    stroke(100, 180, 255, alpha);
    // Рисуем границы
    line(fieldLeft, fieldTop, fieldRight, fieldTop);
    line(fieldLeft, fieldBottom, fieldRight, fieldBottom);
    line(fieldLeft, fieldTop, fieldLeft, goalTop);
    line(fieldLeft, goalBottom, fieldLeft, fieldBottom);
    line(fieldRight, fieldTop, fieldRight, goalTop);
    line(fieldRight, goalBottom, fieldRight, fieldBottom);
  }
}
```

![Визуальные эффекты](images/step7.png)

## Что мы узнали:
- Как создать эффект свечения
- Как использовать цикл для рисования нескольких слоёв
- Как работать с альфа-прозрачностью

### Задание для самопроверки
Попробуй изменить цвета свечения. Можешь сделать красный эффект для красного игрока и синий для синего?