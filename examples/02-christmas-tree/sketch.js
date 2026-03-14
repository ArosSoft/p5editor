// 🎄 НОВОГОДНЯЯ ЁЛКА
// Попробуй добавить игрушки мышкой. Как исправить баг?


function setup() {
  createCanvas(400, 400);
  background(25, 25, 70);
  // Белая поверхность под ёлкой
  fill(255);
  noStroke();
  ellipse(200, 333, 1000, 200);

  // Ёлка
  fill(0, 100, 0);
  triangle(50, 250, 350, 250, 200, 120); // низ
  fill(0, 120, 0);
  triangle(80, 190, 320, 190, 200, 80); // середина
  fill(0, 140, 0);
  triangle(110, 140, 290, 140, 200, 40); // верх

  // Ствол
  fill(101, 67, 33);
  rect(180, 240, 40, 80);

  // Рубиновая звезда на вершине
  fill(200, 0, 0); // Красный цвет
  stroke(255, 215, 0); // Золотой контур
  strokeWeight(2);

  // Рисуем звезду
  push();
  translate(200, 30);
  beginShape();
  for (let i = 0; i < 5; i++) {
    let angle = TWO_PI * i / 5 - HALF_PI;
    let x = cos(angle) * 15;
    let y = sin(angle) * 15;
    vertex(x, y);

    let innerAngle = angle + TWO_PI / 10;
    let innerX = cos(innerAngle) * 7;
    let innerY = sin(innerAngle) * 7;
    vertex(innerX, innerY);
  }
  endShape(CLOSE);
  pop();
}

function draw() {

}

function mousePressed() {
  // Проверяем, является ли пиксель под мышкой зеленым
  let c = get(mouseX, mouseY);

  // Зеленый оттенок: много зеленого (G > 100) и мало красного и синего
  if (c[1] > 100 && c[0] < 100 && c[2] < 100) {
    // Добавляем игрушку
    fill(random(200, 255), random(0, 100), random(0, 100));
    noStroke();
    circle(mouseX, mouseY, 15);

    // Маленький блик на игрушке
    fill(255, 255, 255, 150);
    circle(mouseX - 3, mouseY - 3, 4);
  }
}
