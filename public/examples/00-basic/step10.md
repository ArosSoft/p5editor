# Шаг 10: Поиск в массиве

## Что такое поиск?

**Поиск** — это алгоритм нахождения нужного элемента в массиве. Существует несколько способов поиска.

## Линейный поиск

Самый простой способ: проверяем каждый элемент по очереди.

```javascript
let numbers = [10, 20, 30, 40, 50, 60];

function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i;  // Возвращаем индекс найденного элемента
    }
  }
  return -1;  // Элемент не найден
}

console.log("Индекс числа 40:", linearSearch(numbers, 40)); // 3
console.log("Индекс числа 100:", linearSearch(numbers, 100)); // -1
```

## Как это работает?

```
Ищем 40 в [10, 20, 30, 40, 50, 60]:

i = 0: arr[0] = 10 ≠ 40 → продолжаем
i = 1: arr[1] = 20 ≠ 40 → продолжаем
i = 2: arr[2] = 30 ≠ 40 → продолжаем
i = 3: arr[3] = 40 = 40 → нашли! Возвращаем 3
```

## Поиск с возвратом всех совпадений

```javascript
function findAllIndexes(arr, target) {
  let indexes = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      indexes.push(i);
    }
  }
  return indexes;
}

let numbers = [10, 20, 30, 20, 40, 20];
console.log(findAllIndexes(numbers, 20)); // [1, 3, 5]
```

## Бинарный поиск (для отсортированных массивов)

Бинарный поиск работает намного быстрее линейного, но требует отсортированный массив.

```javascript
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  
  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    
    if (arr[mid] === target) {
      return mid;  // Нашли
    } else if (arr[mid] < target) {
      left = mid + 1;  // Ищем в правой половине
    } else {
      right = mid - 1;  // Ищем в левой половине
    }
  }
  
  return -1;  // Не нашли
}

let sorted = [10, 20, 30, 40, 50, 60, 70];
console.log("Индекс 40:", binarySearch(sorted, 40)); // 3
```

## Как работает бинарный поиск?

```
Ищем 40 в [10, 20, 30, 40, 50, 60, 70]:

left = 0, right = 6, mid = 3
arr[3] = 40 = 40 → нашли!

Ищем 25 в [10, 20, 30, 40, 50]:

left = 0, right = 4, mid = 2
arr[2] = 30 > 25 → ищем слева (left = 0, right = 1)
left = 0, right = 1, mid = 0
arr[0] = 10 < 25 → ищем справа (left = 1, right = 1)
left = 1, right = 1, mid = 1
arr[1] = 20 < 25 → ищем справа (left = 2, right = 1)
left > right → не нашли, возвращаем -1
```

## Задание для ученика

**Добавь бинарный поиск в код:**

```javascript
// Бинарный поиск (требует отсортированный массив)
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  ...
  // Напиши Алгоритм
  ...
}

// Тестирование
let sorted = [2, 5, 8, 12, 16, 23, 38, 45, 56, 67];
console.log("Бинарный:", binarySearch(sorted, 23)); // 5
```

<details>
<summary>Спойлер (Ответ)</summary>

```javascript
// Линейный поиск
function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}

// Бинарный поиск (требует отсортированный массив)
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  
  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    
    if (arr[mid] === target) {
      return mid;
    } else if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  return -1;
}

// Тестирование
let sorted = [2, 5, 8, 12, 16, 23, 38, 45, 56, 67];
console.log("Линейный:", linearSearch(sorted, 23)); // 5
console.log("Бинарный:", binarySearch(sorted, 23)); // 5
```

</details>

## Сравнение алгоритмов

| Алгоритм | Скорость | Требования |
|----------|----------|------------|
| Линейный | O(n) | Любые данные |
| Бинарный | O(log n) | Отсортированные данные |

## Проверь себя

Сколько сравнений сделает бинарный поиск в массиве из 1000 элементов в худшем случае?

<details>
<summary>💡 Показать ответ</summary>

**Ответ:** 10 сравнений (log₂(1000) ≈ 10)

</details>
