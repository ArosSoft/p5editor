# Шаг 6: Пузырьки всплывают и лопаются ⬆️💭

Пузырьки двигаются вверх и исчезают, когда долетают до верха.

## Код
```javascript
for (let i = bubbles.length - 1; i >= 0; i--) {
  let b = bubbles[i];
  b.y -= b.speed;
  
  fill(255, 255, 255, 150);
  noStroke();
  ellipse(b.x, b.y, b.size, b.size);
  
  if (b.y < 0) {
    bubbles.splice(i, 1);
  }
}
```

## Объяснение
`for (let i = bubbles.length - 1; i >= 0; i--)` — проходим по массиву с конца.

`b.y -= b.speed` — поднимаем пузырёк вверх.

`fill(255, 255, 255, 150)` — белый полупрозрачный цвет.

`ellipse(b.x, b.y, b.size, b.size)` — рисуем круг.

`if (b.y < 0)` — если пузырёк улетел за верх экрана.

`bubbles.splice(i, 1)` — удаляем его.

![картинка_6.1](/images/46.png)