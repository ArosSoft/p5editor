# Шаг 8: Рисуем тело рыбки 🎨

Нарисуем тело рыбки в виде овала.

## Код
```javascript
fill(fishy.color);
noStroke();
ellipse(fishy.x, fishy.y, fishy.size, fishy.size * 0.6);
```

## Объяснение
`fill(fishy.color)` — цвет рыбки.

`noStroke()` — убираем контур.

`ellipse(fishy.x, fishy.y, fishy.size, fishy.size * 0.6)` — рисуем овал. Высота меньше ширины, чтобы тело было вытянутым.

![картинка_8.1](images/48.png)

