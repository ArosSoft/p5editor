# Шаг 5: Функции — расчёт факториала

## Что такое функция?

**Функция** — это именованный блок кода, который можно вызывать многократно. Функции помогают организовать код и избежать повторений.

## Синтаксис функции

```javascript
function имяФункции(параметры) {
  // Тело функции
  return результат; // Возвращает значение
}
```

## Пример: факториал числа

Факториал числа n (обозначается n!) — это произведение всех натуральных чисел от 1 до n.

```javascript
function factorial(n) {
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

console.log(`Факториал 5 = ${factorial(5)}`); // 120
```

## Как это работает?

Мы передаем в функцию значение (параметр) и получаем обратно результат

5! = 1 × 2 × 3 × 4 × 5 = 120
3! = 1 × 2 × 3 = 6
0! = 1 (по определению)

## Вызов функции

```javascript
// Объявление функции
function greet(name) {
  return `Привет, ${name}!`;
}

// Вызов функции
let message = greet("Анна");
console.log(message); // "Привет, Анна!"

// Можно вызывать много раз
console.log(greet("Борис")); // "Привет, Борис!"
console.log(greet("Виктор")); // "Привет, Виктор!"
```

## Функции без параметров

```javascript
function sayHello() {
  console.log("Привет, мир!");
}

sayHello(); // Вызов функции
```

## Задание для ученика

**Создай функцию, которая считает сумму чисел от 1 до n:**

<details>
<summary>Спойлер (Ответ)</summary>

```javascript
function sumToN(n) {
  let sum = 0;
  for (let i = 1; i <= n; i++) {
    sum += i;
  }
  return sum;
}

console.log(`Сумма от 1 до 10 = ${sumToN(10)}`); // 55
```

## Формула Гаусса (оптимизация)

```javascript
function sumToNFast(n) {
  return n * (n + 1) / 2;
}

console.log(`Сумма от 1 до 100 = ${sumToNFast(100)}`); // 5050
```

</details>

## Стрелочные функции (современный синтаксис)

```javascript
// Обычная функция
function square(x) {
  return x * x;
}

// Стрелочная функция
const square = (x) => x * x;

console.log(square(5)); // 25
```

## Проверь себя

Что выведет этот код?

```javascript
function multiply(a, b) {
  return a * b;
}

console.log(multiply(3, 4));
console.log(multiply(5, multiply(2, 3)));
```

<details>
<summary>💡 Показать ответ</summary>

**Ответ:** 12, 30

</details>
