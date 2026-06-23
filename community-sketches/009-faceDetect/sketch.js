/*
 * 👋 Hello! This is an ml5.js example made and shared with ❤️.
 * Learn more about the ml5.js project: https://ml5js.org/
 * ml5.js license and Code of Conduct: https://github.com/ml5js/ml5-next-gen/blob/main/LICENSE.md
 * This example demonstrates face tracking on live video through ml5.faceMesh.
 * The original code is from https://editor.p5js.org/ml5/sketches/lCurUW1TT
 */

let faceMesh;
let video;
let faces = []; // this array will hold 2D face mesh positions 

// these options define specifics to ml5
let options = { maxFaces: 1, refineLandmarks: false, flipHorizontal: false };

function preload() {
  // Load the faceMesh model
  faceMesh = ml5.faceMesh(options);
}

function setup() {
  createCanvas(920, 690);
  // Create the webcam video and hide it
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  // Start detecting faces from the webcam video
  faceMesh.detectStart(video, gotFaces);
  fill(0, 255, 0); // make mesh dots green
  noStroke();
}

function draw() {
  // Set the background to black with a small alpha for trailing effect
  background(0, 30); // Slightly transparent background for trail effect

  // Draw each face detected
  for (let i = 0; i < faces.length; i++) {
    let face = faces[i];

    // Define the fixed offsets for left, center, and right
    let leftOffset = -250;   // Position for the left mesh
    let centerOffset = 0;    // Position for the center mesh
    let rightOffset = 250;    // Position for the right mesh

    // Draw each face mesh with an offset
    let offsets = [leftOffset, centerOffset, rightOffset];
    for (let k = 0; k < offsets.length; k++) {
      fill(0, 255, 0, 255 - (k * 80)); // Green with decreasing alpha
      for (let j = 0; j < face.keypoints.length; j++) {
        let keypoint = face.keypoints[j];

        // Draw the face mesh points at different horizontal positions
        circle(keypoint.x + offsets[k], keypoint.y, 3);
      }
    }
  }
}

// Callback function for when faceMesh outputs data
function gotFaces(results) {
  // Save the output to the faces variable
  faces = results;
}

let lapse = 0; // mouse timer
function mousePressed() {
  // prevents mouse press from registering twice
  if (millis() - lapse > 400) {
    save("img_" + month() + '-' + day() + '_' + hour() + '-' + minute() + '-' + second() + ".jpg");
    lapse = millis();
  }
}
