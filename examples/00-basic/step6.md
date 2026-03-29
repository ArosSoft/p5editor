# Шаг 6: Массивы и поиск максимального значения

## Что такое массив?

**Массив** — это упорядоченный список значений. Массивы позволяют хранить несколько значений в одной переменной.

## Создание массива

```javascript
// Пустой массив
let empty = [];

// Массив с элементами
let numbers = [1, 2, 3, 4, 5];
let names = ["Анна", "Борис", "Виктор"];
let mixed = [1, "текст", true, null];
```

## Доступ к элементам

```javascript
let fruits = ["яблоко", "банан", "апельсин"];

console.log(fruits[0]); // "яблоко" (индексы начинаются с 0)
console.log(fruits[1]); // "банан"
console.log(fruits[2]); // "апельсин"

// Изменение элемента
fruits[1] = "киви";
console.log(fruits); // ["яблоко", "киви", "апельсин"]
```

## Пример: поиск максимума

```javascript
let scores = [87, 95, 72, 88, 91];
let max = scores[0]; // Предполагаем, что первый элемент — максимум

for (let score of scores) {
  if (score > max) {
    max = score;
  }
}

console.log(`Лучший результат: ${max}`); // 95
```

## Методы массивов

```javascript
let numbers = [1, 2, 3, 4, 5];

// Длина массива
console.log(numbers.length); // 5

// Добавить элемент в конец
numbers.push(6); // [1, 2, 3, 4, 5, 6]

// Удалить последний элемент
numbers.pop(); // [1, 2, 3, 4, 5]

// Найти индекс элемента
console.log(numbers.indexOf(3)); // 2

// Проверить наличие элемента
console.log(numbers.includes(3)); // true

// Встроенные функции для поиска
console.log(Math.max(...numbers)); // 5
console.log(Math.min(...numbers)); // 1
```

## Перебор массива разными способами

```javascript
let numbers = [10, 20, 30, 40, 50];

// Классический for
for (let i = 0; i < numbers.length; i++) {
  console.log(numbers[i]);
}

// for...of (современный)
for (let num of numbers) {
  console.log(num);
}

// forEach (метод массива)
numbers.forEach((num) => console.log(num));
```

## Задание для ученика

**Добавь поиск минимального значения и среднего арифметического:**

<details>
<summary>Спойлер (Ответ)</summary>

```javascript
let scores = [87, 95, 72, 88, 91];

// Поиск максимума
let max = scores[0];
for (let score of scores) {
  if (score > max) max = score;
}

// Поиск минимума
let min = scores[0];
for (let score of scores) {
  if (score < min) min = score;
}

// Поиск среднего арифметического
let sum = 0;
for (let score of scores) {
  sum += score;
}
let average = sum / scores.length;

console.log(`Максимум: ${max}`);
console.log(`Минимум: ${min}`);
console.log(`Среднее: ${average}`);
```

</details>

## Проверь себя

Что выведет этот код?

```javascript
let arr = [5, 10, 15, 20];
console.log(arr[arr.length - 1]);
```

<details>
<summary>💡 Показать ответ</summary>

**Ответ:** 20 (последний элемент массива)

</details>
