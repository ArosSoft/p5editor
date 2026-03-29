# Шаг 4: Цикл while — игра «Угадай число»

## Что такое цикл while?

**Цикл while** выполняет код, пока условие истинно. В отличие от `for`, он не имеет счётчика и может выполняться неизвестное количество раз.

## Синтаксис while

```javascript
while (условие) {
  // Код выполняется, пока условие истинно
}
```

## Пример: игра «Угадай число»

```javascript
let secret = Math.floor(Math.random() * 100) + 1;
let guess = 0;

while (guess !== secret) {
  guess = parseInt(prompt("Угадай число от 1 до 100:"));
  if (guess < secret) console.log("Больше!");
  else if (guess > secret) console.log("Меньше!");
}

console.log("Угадал! Ты молодец! 🎉");
```

## Как это работает?

1. `Math.random()` — генерирует случайное число от 0 до 1
2. `Math.floor()` — округляет до целого вниз
3. Цикл продолжается, пока пользователь не угадает число
4. После каждого ввода даётся подсказка

## Задание для ученика

**Ограничь количество попыток до 7 и сообщи, если игрок проиграл:**

<details>
<summary>Спойлер (Ответ)</summary>

```javascript
let secret = Math.floor(Math.random() * 100) + 1;
let guess = 0;
let attempts = 0;
let maxAttempts = 7;

while (guess !== secret && attempts < maxAttempts) {
  guess = parseInt(prompt(`Попытка ${attempts + 1} из ${maxAttempts}:`));
  attempts++;
  
  if (guess < secret) {
    console.log("Больше!");
  } else if (guess > secret) {
    console.log("Меньше!");
  }
}

if (guess === secret) {
  console.log("Угадал! Ты молодец! 🎉");
} else {
  console.log(`Проиграл! Было загадано число ${secret}`);
}
```

</details>

## Разница между for и while

| for | while |
|-----|-------|
| Знаем количество итераций | Не знаем количество итераций |
| Есть счётчик | Условие основано на логике |

## Проверь себя

Что выведет этот код?

```javascript
let i = 0;
while (i < 5) {
  console.log(i);
  i++;
}
```

<details>
<summary>💡 Показать ответ</summary>

**Ответ:** 0, 1, 2, 3, 4

</details>
