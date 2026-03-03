// 🎄 НОВОГОДНЯЯ ЁЛКА
// Попробуй изменить цвета игрушек или скорость мигания!

function setup() {
    createCanvas(400, 400);
  }
  
  function draw() {
    // Тёмно-синее небо
    background(25, 25, 112);
    
    // Снег внизу
    fill(255);
    noStroke();
    rect(0, 300, 400, 100);
    
    // Ствол ёлки
    fill(139, 69, 19);
    rect(180, 240, 40, 80);
    
    // Ярусы ёлки
    fill(34, 139, 34);
    triangle(50, 250, 350, 250, 200, 120);  // нижний
    triangle(80, 190, 320, 190, 200, 80);    // средний
    triangle(110, 140, 290, 140, 200, 40);   // верхний
    
    // Звезда
    fill(255, 215, 0);
    drawStar(200, 30, 15, 30, 5);
    
    // Игрушки
    // Красные
    fill(255, 0, 0);
    ellipse(150, 220, 15, 15);
    ellipse(250, 180, 15, 15);
    
    // Синие
    fill(0, 0, 255);
    ellipse(230, 230, 15, 15);
    ellipse(170, 150, 15, 15);
    
    // Жёлтые
    fill(255, 255, 0);
    ellipse(200, 200, 15, 15);
    ellipse(120, 170, 15, 15);
    
    // Мигающая гирлянда
    for (let i = 0; i < 8; i++) {
      if ((frameCount + i) % 30 < 15) {
        fill(255, 0, 0); // красный
      } else {
        fill(0, 0, 255); // синий
      }
      
      let x = 200 + 80 * cos(i * 0.8 + frameCount * 0.05);
      let y = 150 + 60 * sin(i * 0.8 + frameCount * 0.05);
      ellipse(x, y, 10, 10);
    }
    
    // Падающий снег
    fill(255);
    for (let i = 0; i < 20; i++) {
      let x = (i * 37 + frameCount) % 400;
      let y = (i * 23 + frameCount * 2) % 400;
      ellipse(x, y, 3, 3);
    }
  }
  
  // Функция для рисования звезды
  function drawStar(x, y, radius1, radius2, npoints) {
    let angle = TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    
    beginShape();
    for (let a = 0; a < TWO_PI; a += angle) {
      let sx = x + cos(a) * radius2;
      let sy = y + sin(a) * radius2;
      vertex(sx, sy);
      
      sx = x + cos(a + halfAngle) * radius1;
      sy = y + sin(a + halfAngle) * radius1;
      vertex(sx, sy);
    }
    endShape(CLOSE);
  }