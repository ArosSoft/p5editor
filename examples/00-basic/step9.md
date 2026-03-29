# Шаг 9: Алгоритм Евклида — наибольший общий делитель (НОД)

## Что такое НОД?

**Наибольший общий делитель (НОД)** двух чисел — это наибольшее число, которое делит оба числа без остатка.

Пример:
- Делители 48: 1, 2, 3, 4, 6, 8, 12, 16, 24, 48
- Делители 18: 1, 2, 3, 6, 9, 18
- Общие делители: 1, 2, 3, 6
- **НОД(48, 18) = 6**

## Алгоритм Евклида

Древнегреческий математик Евклид придумал эффективный способ нахождения НОД.

### Основная идея

```
НОД(a, b) = НОД(b, a % b)

где % — оператор остатка от деления
```

![Блок-схема](images/NOD.png)

## Пример кода

```javascript
function gcd(a, b) {
  while (b !== 0) {
    let temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

console.log(`НОД(48, 18) = ${gcd(48, 18)}`); // 6
```

## Как это работает?

```
НОД(48, 18):
48 % 18 = 12  →  НОД(18, 12)
18 % 12 = 6   →  НОД(12, 6)
12 % 6 = 0    →  НОД(6, 0) = 6

Ответ: 6
```

## Рекурсивная версия

```javascript
function gcdRecursive(a, b) {
  if (b === 0) return a;  // Базовый случай
  return gcdRecursive(b, a % b);  // Рекурсия
}

console.log(gcdRecursive(48, 18)); // 6
```

## Задание для ученика

**Найди НОД нескольких пар чисел:**

<details>
<summary>Спойлер (Ответ)</summary>

```javascript
function gcd(a, b) {
  while (b !== 0) {
    let temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

console.log(`НОД(100, 25) = ${gcd(100, 25)}`);   // 25
console.log(`НОД(17, 19) = ${gcd(17, 19)}`);     // 1 (простые числа)
console.log(`НОД(144, 60) = ${gcd(144, 60)}`);   // 12
console.log(`НОД(1071, 462) = ${gcd(1071, 462)}`); // 21
```

</details>

## Применение НОД: сокращение дробей

```javascript
function reduceFraction(numerator, denominator) {
  let divisor = gcd(numerator, denominator);
  return {
    num: numerator / divisor,
    den: denominator / divisor
  };
}

function gcd(a, b) {
  while (b !== 0) {
    let temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

let result = reduceFraction(48, 18);
console.log(`48/18 = ${result.num}/${result.den}`); // 8/3
```

## НОД для нескольких чисел

```javascript
function gcd(a, b) {
  while (b !== 0) {
    let temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

function gcdMultiple(...numbers) {
  let result = numbers[0];
  for (let i = 1; i < numbers.length; i++) {
    result = gcd(result, numbers[i]);
  }
  return result;
}

console.log(gcdMultiple(24, 36, 60)); // 12
```

## Проверь себя

Найди НОД(56, 98) вручную по шагам алгоритма Евклида:

<details>
<summary>💡 Показать ответ</summary>

```
98 % 56 = 42  →  НОД(56, 42)
56 % 42 = 14  →  НОД(42, 14)
42 % 14 = 0   →  НОД(14, 0) = 14

НОД(56, 98) = 14
```

</details>
