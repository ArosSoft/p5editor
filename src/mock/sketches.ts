// Mock-данные для скетчей сообщества
// В будущем будут заменены на API запросы

export interface Sketch {
  id: string
  title: string
  description: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  thumbnail: string
  code: string
  tags: string[]
  category: string
  difficulty: 'Лёгкая' | 'Средняя' | 'Тяжёлая'
  likes: number
  views: number
  createdAt: string
  status: 'pending' | 'approved' | 'rejected' | 'draft'
}

export const sketches: Sketch[] = [
  {
    id: '1',
    title: 'Анимированные частицы',
    description: 'Красивая анимация летающих частиц с эффектом шлейфа',
    author: {
      id: 'user123',
      name: 'Alex Creative'
    },
    thumbnail: '/community-sketches/001-particles/thumbnail.png',
    code: `let particles = [];

function setup() {
  createCanvas(800, 600);
  colorMode(HSB, 360, 100, 100, 100);
  for (let i = 0; i < 100; i++) {
    particles.push({
      x: random(width),
      y: random(height),
      vx: random(-2, 2),
      vy: random(-2, 2),
      hue: random(360)
    });
  }
}

function draw() {
  background(0, 0, 10, 10);
  noStroke();
  
  for (let p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    
    if (p.x < 0 || p.x > width) p.vx *= -1;
    if (p.y < 0 || p.y > height) p.vy *= -1;
    
    fill(p.hue, 80, 100, 80);
    ellipse(p.x, p.y, 20);
  }
}`,
    tags: ['анимация', 'частицы', 'эффекты'],
    category: 'Анимация',
    difficulty: 'Средняя',
    likes: 42,
    views: 156,
    createdAt: '2026-03-15',
    status: 'approved'
  },
  {
    id: '2',
    title: 'Фрактальное дерево',
    description: 'Рекурсивное дерево с изменяемыми параметрами',
    author: {
      id: 'user456',
      name: 'Maria Fractal'
    },
    thumbnail: '/community-sketches/002-tree/thumbnail.png',
    code: `let angle;
let slider;

function setup() {
  createCanvas(600, 600);
  slider = createSlider(0, PI / 2, PI / 4, 0.01);
}

function draw() {
  background(30);
  angle = slider.value();
  stroke(255, 100);
  translate(300, height);
  branch(120);
}

function branch(len) {
  line(0, 0, 0, -len);
  translate(0, -len);
  
  if (len > 4) {
    push();
    rotate(angle);
    branch(len * 0.67);
    pop();
    
    push();
    rotate(-angle);
    branch(len * 0.67);
    pop();
  }
}`,
    tags: ['фрактал', 'рекурсия', 'дерево'],
    category: 'Генеративное',
    difficulty: 'Средняя',
    likes: 87,
    views: 312,
    createdAt: '2026-03-14',
    status: 'approved'
  },
  {
    id: '3',
    title: 'Интерактивный снег',
    description: 'Падающие снежинки, реагирующие на курсор мыши',
    author: {
      id: 'user789',
      name: 'Winter Coder'
    },
    thumbnail: '/community-sketches/003-snow/thumbnail.png',
    code: `let snowflakes = [];

function setup() {
  createCanvas(800, 600);
  for (let i = 0; i < 200; i++) {
    snowflakes.push({
      x: random(width),
      y: random(-height, 0),
      speed: random(1, 3),
      size: random(2, 6)
    });
  }
}

function draw() {
  background(20, 30, 60);
  noStroke();
  fill(255, 200);
  
  for (let flake of snowflakes) {
    ellipse(flake.x, flake.y, flake.size);
    flake.y += flake.speed;
    
    // Реакция на мышь
    let d = dist(flake.x, flake.y, mouseX, mouseY);
    if (d < 100) {
      flake.x += map(d, 0, 100, 2, 0);
    }
    
    if (flake.y > height) {
      flake.y = -10;
      flake.x = random(width);
    }
  }
}`,
    tags: ['зима', 'снег', 'интерактив'],
    category: 'Анимация',
    difficulty: 'Лёгкая',
    likes: 124,
    views: 489,
    createdAt: '2026-03-13',
    status: 'approved'
  },
  {
    id: '4',
    title: 'Мандельброт',
    description: 'Визуализация множества Мандельброта с зумом',
    author: {
      id: 'user101',
      name: 'Math Artist'
    },
    thumbnail: '/community-sketches/004-mandelbrot/thumbnail.png',
    code: `let zoom = 200;
let offsetX = width / 2;
let offsetY = height / 2;
let maxIter = 50;

function setup() {
  createCanvas(600, 600);
  colorMode(HSB, 360, 100, 100);
}

function draw() {
  loadPixels();
  
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let a = (x - offsetX) / zoom;
      let b = (y - offsetY) / zoom;
      let ca = a;
      let cb = b;
      let n = 0;
      
      while (n < maxIter) {
        let aa = a * a - b * b;
        let bb = 2 * a * b;
        a = aa + ca;
        b = bb + cb;
        if (a * a + b * b > 4) break;
        n++;
      }
      
      let bright = map(n, 0, maxIter, 0, 1);
      if (n === maxIter) bright = 0;
      
      let idx = (x + y * width) * 4;
      pixels[idx] = bright * 255;
      pixels[idx + 1] = bright * 100;
      pixels[idx + 2] = bright * 200;
      pixels[idx + 3] = 255;
    }
  }
  updatePixels();
}`,
    tags: ['фрактал', 'математика', 'зум'],
    category: 'Генеративное',
    difficulty: 'Тяжёлая',
    likes: 201,
    views: 678,
    createdAt: '2026-03-12',
    status: 'approved'
  },
  {
    id: '5',
    title: 'Звуковые волны',
    description: 'Визуализация звуковых волн в реальном времени',
    author: {
      id: 'user202',
      name: 'Sound Visualizer'
    },
    thumbnail: '/community-sketches/005-waves/thumbnail.png',
    code: `let mic;
let fft;

function setup() {
  createCanvas(600, 400);
  mic = new p5.AudioIn();
  mic.start();
  fft = new p5.FFT();
  fft.setInput(mic);
}

function draw() {
  background(20);
  
  let spectrum = fft.analyze();
  
  noStroke();
  fill(0, 200);
  
  beginShape();
  for (let i = 0; i < spectrum.length; i++) {
    let x = map(i, 0, spectrum.length, 0, width);
    let h = map(spectrum[i], 0, 255, 0, height);
    vertex(x, height - h);
  }
  endShape();
  
  stroke(255, 100);
  line(0, height / 2, width, height / 2);
}`,
    tags: ['звук', 'аудио', 'визуализация'],
    category: 'Аудио',
    difficulty: 'Средняя',
    likes: 95,
    views: 234,
    createdAt: '2026-03-11',
    status: 'approved'
  },
  {
    id: '6',
    title: 'Клеточный автомат',
    description: 'Игра «Жизнь» Конвея с возможностью рисования',
    author: {
      id: 'user303',
      name: 'Cell Master'
    },
    thumbnail: '/community-sketches/006-life/thumbnail.png',
    code: `let cols, rows;
let sz = 10;
let grid;

function setup() {
  createCanvas(600, 600);
  cols = floor(width / sz);
  rows = floor(height / sz);
  grid = make2Darray(cols, rows);
  
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid[i][j] = floor(random(2));
    }
  }
}

function draw() {
  background(255);
  
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let x = i * sz;
      let y = j * sz;
      if (grid[i][j] === 1) {
        fill(0);
        rect(x, y, sz - 1, sz - 1);
      }
    }
  }
  
  let next = make2Darray(cols, rows);
  
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let state = grid[i][j];
      let neighbors = countNeighbors(grid, i, j, cols, rows);
      
      if (state === 0 && neighbors === 3) {
        next[i][j] = 1;
      } else if (state === 1 && (neighbors < 2 || neighbors > 3)) {
        next[i][j] = 0;
      } else {
        next[i][j] = state;
      }
    }
  }
  
  grid = next;
  frameRate(10);
}

function make2Darray(cols, rows) {
  let arr = new Array(cols);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = new Array(rows);
  }
  return arr;
}

function countNeighbors(grid, x, y, cols, rows) {
  let sum = 0;
  for (let i = -1; i < 2; i++) {
    for (let j = -1; j < 2; j++) {
      let col = (x + i + cols) % cols;
      let row = (y + j + rows) % rows;
      sum += grid[col][row];
    }
  }
  sum -= grid[x][y];
  return sum;
}`,
    tags: ['клеточный автомат', 'игра жизнь', 'симуляция'],
    category: 'Симуляция',
    difficulty: 'Тяжёлая',
    likes: 156,
    views: 521,
    createdAt: '2026-03-10',
    status: 'approved'
  },
  {
    id: '7',
    title: 'Радужный градиент',
    description: 'Простой анимированный радужный фон',
    author: {
      id: 'user404',
      name: 'Color Lover'
    },
    thumbnail: '/community-sketches/007-rainbow/thumbnail.png',
    code: `let hue = 0;

function setup() {
  createCanvas(800, 600);
  colorMode(HSB, 360, 100, 100);
  noStroke();
}

function draw() {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let h = (hue + x + y) % 360;
      fill(h, 80, 100);
      rect(x, y, 1, 1);
    }
  }
  hue += 0.5;
}`,
    tags: ['цвет', 'градиент', 'радуга'],
    category: 'Анимация',
    difficulty: 'Лёгкая',
    likes: 67,
    views: 198,
    createdAt: '2026-03-09',
    status: 'approved'
  },
  {
    id: '8',
    title: 'Лабиринт',
    description: 'Генерация лабиринта алгоритмом DFS',
    author: {
      id: 'user505',
      name: 'Maze Runner'
    },
    thumbnail: '/community-sketches/008-maze/thumbnail.png',
    code: `let cols, rows;
let w = 40;
let grid = [];
let current;
let stack = [];

function setup() {
  createCanvas(600, 600);
  cols = floor(width / w);
  rows = floor(height / w);
  
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      grid.push(new Cell(i, j));
    }
  }
  current = grid[0];
}

function draw() {
  background(50);
  for (let cell of grid) {
    cell.show();
  }
  
  current.visited = true;
  let next = current.checkNeighbors();
  
  if (next) {
    next.visited = true;
    stack.push(current);
    removeWalls(current, next);
    current = next;
  } else if (stack.length > 0) {
    current = stack.pop();
  }
}

function index(i, j) {
  if (i < 0 || j < 0 || i > cols - 1 || j > rows - 1) {
    return -1;
  }
  return i + j * cols;
}

function Cell(i, j) {
  this.i = i;
  this.j = j;
  this.walls = [true, true, true, true];
  this.visited = false;
  
  this.checkNeighbors = function() {
    let neighbors = [];
    let top = grid[index(i, j - 1)];
    let right = grid[index(i + 1, j)];
    let bottom = grid[index(i, j + 1)];
    let left = grid[index(i - 1, j)];
    
    if (top && !top.visited) neighbors.push(top);
    if (right && !right.visited) neighbors.push(right);
    if (bottom && !bottom.visited) neighbors.push(bottom);
    if (left && !left.visited) neighbors.push(left);
    
    if (neighbors.length > 0) {
      let r = floor(random(0, neighbors.length));
      return neighbors[r];
    } else {
      return undefined;
    }
  }
  
  this.show = function() {
    let x = this.i * w;
    let y = this.j * w;
    stroke(255);
    if (this.walls[0]) line(x, y, x + w, y);
    if (this.walls[1]) line(x + w, y, x + w, y + w);
    if (this.walls[2]) line(x + w, y + w, x, y + w);
    if (this.walls[3]) line(x, y + w, x, y);
    if (this.visited) {
      noStroke();
      fill(100, 100, 255, 100);
      rect(x, y, w, w);
    }
  }
}

function removeWalls(a, b) {
  let x = a.i - b.i;
  if (x === 1) { a.walls[3] = false; b.walls[1] = false; }
  if (x === -1) { a.walls[1] = false; b.walls[3] = false; }
  let y = a.j - b.j;
  if (y === 1) { a.walls[0] = false; b.walls[2] = false; }
  if (y === -1) { a.walls[2] = false; b.walls[0] = false;
}`,
    tags: ['лабиринт', 'генерация', 'алгоритм'],
    category: 'Генеративное',
    difficulty: 'Средняя',
    likes: 112,
    views: 367,
    createdAt: '2026-03-08',
    status: 'approved'
  }
]

// Функции для работы со скетчами
export function getSketchById(id: string): Sketch | undefined {
  return sketches.find(s => s.id === id)
}

export function searchSketches(query: string): Sketch[] {
  const q = query.toLowerCase()
  return sketches.filter(s =>
    s.title.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q) ||
    s.tags.some(t => t.toLowerCase().includes(q)) ||
    s.author.name.toLowerCase().includes(q)
  )
}

export function getSketchesByCategory(category: string): Sketch[] {
  return sketches.filter(s => s.category === category)
}

export function getSketchesByDifficulty(difficulty: string): Sketch[] {
  return sketches.filter(s => s.difficulty === difficulty)
}

export function getPopularSketches(limit = 5): Sketch[] {
  return [...sketches].sort((a, b) => b.likes - a.likes).slice(0, limit)
}

export function getNewSketches(limit = 5): Sketch[] {
  return [...sketches].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, limit)
}

export function getAllTags(): string[] {
  const tags = new Set<string>()
  sketches.forEach(s => s.tags.forEach(t => tags.add(t)))
  return Array.from(tags).sort()
}

export function getAllCategories(): string[] {
  return [...new Set(sketches.map(s => s.category))].sort()
}
