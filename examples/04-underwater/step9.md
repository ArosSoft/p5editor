# Шаг 9: Добавляем глаз и хвост 🐠

Добавим детали, чтобы рыбки стали похожи на настоящих.

## Код
```javascript
fill(0);
ellipse(fishy.x + fishy.size * 0.2, fishy.y - 2, 3, 3);

fill(fishy.color);
triangle(
  fishy.x - fishy.size / 2, fishy.y,
  fishy.x - fishy.size / 2 - 10, fishy.y - 5,
  fishy.x - fishy.size / 2 - 10, fishy.y + 5
);
```

## Объяснение
`fill(0)` — чёрный цвет для глаза.

`ellipse(fishy.x + fishy.size * 0.2, fishy.y - 2, 3, 3)` — рисуем глаз справа от центра и чуть выше.

`triangle()` — рисует треугольник (хвост) слева от тела.

Координаты подобраны так, чтобы хвост был слева от рыбки.

## Поздравляю! 🎉
Ты создал анимированный подводный мир!

![картинка_9.1](/images/49.png)