# Шаг 8: Рекурсия — числа Фибоначчи

## Что такое рекурсия?

**Рекурсия** — это когда функция вызывает саму себя. Рекурсивные функции должны иметь **базовый случай** (условие остановки), иначе они будут вызываться бесконечно.

## Пример: числа Фибоначчи

Последовательность Фибоначчи: каждое число равно сумме двух предыдущих.

```
0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55...
```

## Рекурсивная функция

```javascript
function fib(n) {
  if (n <= 1) return n;  // Базовый случай
  return fib(n - 1) + fib(n - 2);  // Рекурсивный вызов
}

console.log(`Фибоначчи 10 = ${fib(10)}`); // 55
```

## Как это работает?

```
fib(5)
├── fib(4)
│   ├── fib(3)
│   │   ├── fib(2)
│   │   │   ├── fib(1) = 1
│   │   │   └── fib(0) = 0
│   │   └── fib(1) = 1
│   └── fib(2)
│       ├── fib(1) = 1
│       └── fib(0) = 0
└── fib(3)
    ├── fib(2)
    │   ├── fib(1) = 1
    │   └── fib(0) = 0
    └── fib(1) = 1

Результат: 5
```

## Итеративная версия (без рекурсии)

```javascript
function fibIterative(n) {
  if (n <= 1) return n;
  
  let prev = 0;
  let curr = 1;
  
  for (let i = 2; i <= n; i++) {
    let next = prev + curr;
    prev = curr;
    curr = next;
  }
  
  return curr;
}

console.log(fibIterative(10)); // 55
```

## Задание для ученика

**Объясни своими словами, как работает рекурсия.**

Попробуй нарисовать дерево вызовов для `fib(6)`:

```
                    fib(6)
                   /      \
              fib(5)       fib(4)
             /     \       /     \
         fib(4)   fib(3) fib(3) fib(2)
         ...      ...    ...    ...
```

## Другие примеры рекурсии

### Факториал через рекурсию

```javascript
function factorial(n) {
  if (n <= 1) return 1;  // Базовый случай
  return n * factorial(n - 1);  // Рекурсивный вызов
}

console.log(factorial(5)); // 120
```

### Сумма цифр числа

```javascript
function sumDigits(n) {
  if (n < 10) return n;  // Базовый случай
  return (n % 10) + sumDigits(Math.floor(n / 10));
}

console.log(sumDigits(123)); // 1 + 2 + 3 = 6
```

## Важность базового случая

```javascript
// ❌ НЕПРАВИЛЬНО: бесконечная рекурсия
function badRecursion(n) {
  return badRecursion(n - 1); // Нет условия остановки!
}

// ✅ ПРАВИЛЬНО: есть базовый случай
function goodRecursion(n) {
  if (n <= 0) return 0;  // Базовый случай
  return n + goodRecursion(n - 1);
}
```

## Проверь себя

Что выведет этот код?

```javascript
function mystery(n) {
  if (n === 0) return 1;
  return 2 * mystery(n - 1);
}

console.log(mystery(3));
```

<details>
<summary>💡 Показать ответ</summary>

**Ответ:** 8 (2 × 2 × 2 × 1 = 2³)

</details>
