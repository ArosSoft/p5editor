// ☃️ СНЕГОВИК
// Рисуем весёлого снеговика с анимацией снегопада

function setup() {
    createCanvas(400, 400);
  }
  
  function draw() {
    // Рисуем синее небо
    background(135, 206, 235);
    
    // Рисуем снег на земле
    fill(255);
    noStroke();
    ellipse(200, 350, 400, 100);
    
    // Рисуем тело снеговика
    fill(255);
    stroke(200);
    strokeWeight(2);
    
    // Нижняя часть
    ellipse(200, 280, 120, 120);
    // Средняя часть
    ellipse(200, 200, 90, 90);
    // Голова
    ellipse(200, 130, 70, 70);
    
    // Рисуем шляпу
    fill(0);
    noStroke();
    rect(160, 90, 80, 10);
    rect(175, 40, 50, 50);
    
    // Рисуем глаза
    fill(0);
    ellipse(185, 120, 8, 8);
    ellipse(215, 120, 8, 8);
    
    // Рисуем нос-морковку
    fill(255, 165, 0);
    triangle(200, 135, 220, 130, 200, 145);
    
    // Рисуем рот
    fill(0);
    ellipse(190, 150, 3, 3);
    ellipse(200, 155, 3, 3);
    ellipse(210, 150, 3, 3);
    
    // Рисуем пуговицы
    fill(0);
    ellipse(200, 180, 8, 8);
    ellipse(200, 210, 8, 8);
    ellipse(200, 240, 8, 8);
    
    // Рисуем руки
    stroke(139, 69, 19);
    strokeWeight(4);
    line(160, 190, 100, 170);
    line(240, 190, 300, 170);
    
    // Рисуем падающий снег
    stroke(255);
    strokeWeight(2);
    for (let i = 0; i < 10; i++) {
      let x = 50 + i * 35 + sin(frameCount * 0.02 + i) * 10;
      let y = (frameCount * 0.5 + i * 30) % 400;
      point(x, y);
    }
  }