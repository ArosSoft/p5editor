let angle;
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
}
