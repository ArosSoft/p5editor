// 🍂 ОСЕННИЙ ПАРК
// Реалистичные деревья с падающими листьями

let leaves = [];
let treePositions = [];
let grassBlades = [];

function setup() {
  createCanvas(400, 400);
  
  // Позиции деревьев с ВЫСОКИМИ и реалистичными кронами
  treePositions = [
    {
      x: 120, y: 300, 
      crownWidth: 90,      // ширина кроны
      crownHeight: 110,    // высота кроны (больше ширины!)
      trunkHeight: 180,
      trunkWidth: 25,
      type: 'oak'          // тип дерева
    },
    {
      x: 280, y: 300, 
      crownWidth: 110,
      crownHeight: 130,     // очень высокая крона
      trunkHeight: 220,
      trunkWidth: 30,
      type: 'maple'
    },
    {
      x: 200, y: 300, 
      crownWidth: 80,
      crownHeight: 100,      // вытянутая крона
      trunkHeight: 160,
      trunkWidth: 22,
      type: 'birch'
    }
  ];
  
  // Создаём травинки
  for (let x = 0; x < width; x += 4) {
    grassBlades.push({
      x: x + random(-2, 2),
      height: random(8, 20),
      tilt: random(-4, 4)
    });
  }
  
  // Создаём листья на деревьях
  for (let i = 0; i < 60; i++) {
    leaves.push(createLeaf());
  }
}

function createLeaf() {
  let tree = random(treePositions);
  
  return {
    treeX: tree.x,
    treeY: tree.y,
    x: tree.x + random(-tree.crownWidth * 0.5, tree.crownWidth * 0.5),
    y: tree.y - tree.trunkHeight + random(20, tree.crownHeight),
    size: random(6, 15),
    speed: random(0.3, 1.2),
    rotation: random(TWO_PI),
    rotSpeed: random(-0.03, 0.03),
    swingAmount: random(0.3, 1),
    swingSpeed: random(0.02, 0.04),
    timeOffset: random(TWO_PI),
    falling: false,
    fallDelay: random(100, 400),
    colorHue: random(20, 40)  // оттенок для реалистичности
  };
}

function draw() {
  // Реалистичное небо с облаками
  drawSky();
  
  // Солнце с ореолом
  drawSun();
  
  // Дальний план (холмы)
  drawBackgroundHills();
  
  // Земля
  fill(34, 89, 34);
  rect(0, 280, width, 120);
  
  // Тени от деревьев
  drawTreeShadows();
  
  // Трава (разная высота и оттенки)
  drawGrass();
  
  // Рисуем деревья
  for (let tree of treePositions) {
    drawRealisticTree(tree);
  }
  
  // Несколько листьев на земле
  drawLeavesOnGround();
  
  // Обновляем и рисуем падающие листья
  for (let leaf of leaves) {
    if (!leaf.falling) {
      leaf.fallDelay--;
      if (leaf.fallDelay <= 0) {
        leaf.falling = true;
      }
    } else {
      leaf.y += leaf.speed;
      leaf.x += sin(frameCount * leaf.swingSpeed + leaf.timeOffset) * leaf.swingAmount;
      leaf.rotation += leaf.rotSpeed;
      
      if (leaf.y > height + 30) {
        let newLeaf = createLeaf();
        leaf.x = newLeaf.x;
        leaf.y = newLeaf.y;
        leaf.falling = false;
        leaf.fallDelay = random(200, 500);
        leaf.colorHue = newLeaf.colorHue;
      }
    }
    
    drawRealisticLeaf(leaf);
  }
}

function drawSky() {
  // Градиент неба
  for (let i = 0; i <= height; i++) {
    let inter = map(i, 0, height * 0.6, 0, 1);
    let c = lerpColor(color(100, 150, 230), color(255, 200, 150), inter);
    stroke(c);
    line(0, i, width, i);
  }
  
  // Облака
  noStroke();
  fill(255, 255, 255, 200);
  ellipse(50, 50, 60, 30);
  ellipse(80, 40, 50, 25);
  ellipse(300, 80, 80, 35);
  ellipse(340, 70, 60, 25);
}

function drawSun() {
  // Ореол
  noStroke();
  for (let i = 3; i > 0; i--) {
    fill(255, 200, 100, 30 - i * 5);
    ellipse(350, 70, 70 + i * 15, 70 + i * 15);
  }
  
  // Солнце
  fill(255, 220, 100);
  ellipse(350, 70, 60, 60);
}

function drawBackgroundHills() {
  // Холмы на заднем плане
  noStroke();
  fill(60, 120, 60, 100);
  beginShape();
  vertex(0, 200);
  vertex(100, 170);
  vertex(200, 190);
  vertex(300, 150);
  vertex(width, 180);
  vertex(width, 280);
  vertex(0, 280);
  endShape(CLOSE);
}

function drawTreeShadows() {
  // Тени от деревьев
  noStroke();
  fill(20, 40, 20, 50);
  for (let tree of treePositions) {
    ellipse(tree.x - 5, tree.y + 5, tree.crownWidth * 0.8, tree.crownWidth * 0.3);
  }
}

function drawGrass() {
  // Трава разными оттенками
  for (let blade of grassBlades) {
    let green = random(40, 100);
    stroke(0, green, 0, 200);
    strokeWeight(random(1, 2));
    line(blade.x, 280, blade.x + blade.tilt, 280 - blade.height);
  }
  
  // Несколько травинок покороче (передний план)
  stroke(20, 80, 20);
  strokeWeight(1.5);
  for (let x = 0; x < width; x += 10) {
    line(x + random(-3, 3), 280, x + random(-5, 5), 270);
  }
}

function drawLeavesOnGround() {
  // Листья на земле
  noStroke();
  for (let i = 0; i < 20; i++) {
    let x = random(width);
    let y = random(290, 350);
    fill(200, random(80, 120), random(20, 40), 150);
    ellipse(x, y, random(5, 12), random(3, 8));
  }
}

function drawRealisticTree(tree) {
  // Ствол с текстурой коры
  drawTreeTrunk(tree);
  
  // Ветви
  drawTreeBranches(tree);
  
  // Крона (высокая и реалистичная)
  drawTreeCrown(tree);
}

function drawTreeTrunk(tree) {
  // Основной ствол
  fill(80, 50, 20);
  noStroke();
  rect(tree.x - tree.trunkWidth/2, tree.y - tree.trunkHeight, 
       tree.trunkWidth, tree.trunkHeight);
  
  // Текстура коры (вертикальные линии)
  stroke(60, 40, 15);
  strokeWeight(1);
  for (let i = 0; i < 3; i++) {
    let xOffset = -tree.trunkWidth/2 + i * tree.trunkWidth/2;
    for (let y = tree.y - tree.trunkHeight; y < tree.y; y += 15) {
      line(tree.x + xOffset, y, tree.x + xOffset + random(-2, 2), y + 10);
    }
  }
  
  // Темные пятна на коре
  noStroke();
  fill(50, 30, 10, 100);
  for (let i = 0; i < 5; i++) {
    ellipse(tree.x + random(-8, 8), 
            tree.y - tree.trunkHeight + random(20, tree.trunkHeight - 20), 
            5, 8);
  }
}

function drawTreeBranches(tree) {
  stroke(70, 40, 15);
  strokeWeight(3);
  
  // Главные ветви
  // Левая нижняя
  line(tree.x, tree.y - tree.trunkHeight * 0.7, 
       tree.x - tree.crownWidth * 0.4, tree.y - tree.trunkHeight * 0.8);
  // Правая нижняя
  line(tree.x, tree.y - tree.trunkHeight * 0.6, 
       tree.x + tree.crownWidth * 0.5, tree.y - tree.trunkHeight * 0.7);
  
  strokeWeight(2);
  // Верхние ветви
  line(tree.x, tree.y - tree.trunkHeight * 0.4, 
       tree.x - tree.crownWidth * 0.3, tree.y - tree.trunkHeight * 0.5);
  line(tree.x, tree.y - tree.trunkHeight * 0.3, 
       tree.x + tree.crownWidth * 0.4, tree.y - tree.trunkHeight * 0.4);
  
  // Тонкие веточки
  strokeWeight(1);
  for (let i = 0; i < 5; i++) {
    let branchX = tree.x - tree.crownWidth * 0.3 + i * 10;
    let branchY = tree.y - tree.trunkHeight * 0.8 + i * 8;
    line(branchX, branchY, branchX - 10, branchY - 15);
    
    branchX = tree.x + tree.crownWidth * 0.3 - i * 10;
    line(branchX, branchY, branchX + 10, branchY - 15);
  }
}

function drawTreeCrown(tree) {
  noStroke();
  
  // Осенние цвета для листвы (вариации)
  let color1, color2, color3;
  
  switch(tree.type) {
    case 'oak':
      color1 = color(200, 80, 20, 200);    // ржавый
      color2 = color(180, 100, 30, 180);   // золотистый
      color3 = color(150, 70, 10, 160);     // коричневый
      break;
    case 'maple':
      color1 = color(220, 60, 30, 200);     // красный
      color2 = color(200, 120, 20, 180);    // оранжевый
      color3 = color(160, 70, 40, 160);      // красно-коричневый
      break;
    case 'birch':
      color1 = color(210, 150, 30, 200);    // желтый
      color2 = color(190, 120, 20, 180);    // золотой
      color3 = color(140, 90, 25, 160);      // оливковый
      break;
  }
  
  // ВЕРХНЯЯ ЧАСТЬ КРОНЫ (вытянутая вверх)
  push();
  translate(tree.x, tree.y - tree.trunkHeight + tree.crownHeight * 0.4);
  
  // Основной объем - вытянутый вверх
  fill(color1);
  ellipse(0, -tree.crownHeight * 0.3, tree.crownWidth * 0.9, tree.crownHeight * 0.7);
  
  // Верхушка (самая высокая часть)
  fill(color2);
  ellipse(0, -tree.crownHeight * 0.6, tree.crownWidth * 0.6, tree.crownHeight * 0.5);
  
  // Боковые объемы
  fill(color3);
  ellipse(-tree.crownWidth * 0.3, -tree.crownHeight * 0.2, tree.crownWidth * 0.5, tree.crownHeight * 0.4);
  ellipse(tree.crownWidth * 0.3, -tree.crownHeight * 0.2, tree.crownWidth * 0.5, tree.crownHeight * 0.4);
  
  // Нижние части кроны
  fill(color1);
  ellipse(-tree.crownWidth * 0.2, tree.crownHeight * 0.1, tree.crownWidth * 0.4, tree.crownHeight * 0.3);
  ellipse(tree.crownWidth * 0.2, tree.crownHeight * 0.1, tree.crownWidth * 0.4, tree.crownHeight * 0.3);
  
  // Дополнительные объемы для высоты
  fill(red(color2), green(color2), blue(color2), 150);
  ellipse(-tree.crownWidth * 0.15, -tree.crownHeight * 0.8, tree.crownWidth * 0.3, tree.crownHeight * 0.3);
  ellipse(tree.crownWidth * 0.15, -tree.crownHeight * 0.8, tree.crownWidth * 0.3, tree.crownHeight * 0.3);
  
  pop();
}

function drawRealisticLeaf(leaf) {
  push();
  translate(leaf.x, leaf.y);
  rotate(leaf.rotation);
  
  // Реалистичный цвет листа
  colorMode(HSB, 360, 100, 100, 100);
  fill(leaf.colorHue, 80, 90, 80);
  colorMode(RGB, 255, 255, 255, 255);
  
  noStroke();
  
  // Форма листа (более реалистичная)
  beginShape();
  for (let a = 0; a < TWO_PI; a += 0.3) {
    let r1 = leaf.size * (0.6 + 0.3 * sin(3 * a) + 0.1 * sin(5 * a));
    let x1 = cos(a) * r1;
    let y1 = sin(a) * r1 * 0.7;
    vertex(x1, y1);
  }
  endShape(CLOSE);
  
  // Прожилки
  stroke(100, 50, 20, 100);
  strokeWeight(0.5);
  line(0, 0, leaf.size * 0.3, leaf.size * 0.2);
  line(0, 0, leaf.size * 0.2, -leaf.size * 0.2);
  
  // Черенок
  stroke(120, 60, 20);
  strokeWeight(1);
  line(0, 0, leaf.size * 0.4, leaf.size * 0.4);
  
  pop();
}