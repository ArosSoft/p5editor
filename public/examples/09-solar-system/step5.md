# Часть 5. Класс Planet — чертёж планеты

## Что такое класс?

**Класс** — это **чертёж** для создания объектов. С помощью него можно сделать несколько однотипных экземпляров.

```javascript
class Planet {
  constructor(c, r, d, s) {
    this.color = c;
    this.radius = r;
    this.distance = d;
    this.speed = s;
    this.angle = random(TWO_PI);
  }

  update() {
    this.angle += this.speed;
  }

  show() {
    let x = cos(this.angle) * this.distance;
    let y = sin(this.angle) * this.distance;
    fill(this.color);
    noStroke();
    ellipse(x, y, this.radius, this.radius);
  }
}
```

## Конструктор

```javascript
constructor(c, r, d, s) {
  this.color = c;      // Сохранить цвет
  this.radius = r;     // Сохранить размер
  this.distance = d;   // Сохранить расстояние
  this.speed = s;      // Сохранить скорость
  this.angle = random(TWO_PI);  // Случайный угол старта
}
```

- `this.` — «моё собственное» (цвет, размер этой планеты)
- `random(TWO_PI)` — случайное место на орбите (чтобы не все в одной точке)

## Метод update() — движение

```javascript
update() {
  this.angle += this.speed;  // Движение по орбите с учетом скорости
}
```

## Метод show() — рисунок

```javascript
show() {
  let x = cos(this.angle) * this.distance;  // Координата X
  let y = sin(this.angle) * this.distance;  // Координата Y
  fill(this.color);
  noStroke();
  ellipse(x, y, this.radius, this.radius);
}
```

- `cos()` и `sin()` — переводят угол в координаты X и Y

> **[ЗДЕСЬ БУДЕТ ИЗОБРАЖЕНИЕ: Чертеж Planet]**

---

## 🤔 Проверь себя:
1. Что такое `this.`?
2. Зачем `random(TWO_PI)`?
3. Что делает `update()`?
