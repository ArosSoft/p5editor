let img; // Переменная для хранения изображения

function preload() {
  // Загружаем изображение (замените URL на свой)
  img = loadImage('images/snowman.png');
}

function setup() {
  createCanvas(400, 400);
  noLoop(); // Останавливаем draw, чтобы не перерисовывать постоянно
}

function draw() {
  background(220);

  // Отображаем изображение в позиции (0, 0)
  image(img, 0, 0, 400, 400);
}
