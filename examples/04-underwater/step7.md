# Шаг 7: Рыбки плывут! 🏊‍♂️

Заставим рыбок двигаться вправо и появляться слева, когда они уплывают.

## Код
```javascript
for (let fishy of fish) {
  fishy.x += fishy.speed;
  
  if (fishy.x > width + 50) {
    fishy.x = -50;
  }
}
```

## Объяснение
`for (let fishy of fish)` — перебираем всех рыбок по очереди.

`fishy.x += fishy.speed` — двигаем рыбку вправо.

`if (fishy.x > width + 50)` — если уплыла далеко за правый край.

`fishy.x = -50` — появляется слева.

![картинка_7.1](/images/47.png)

