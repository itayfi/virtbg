import './style.css'

let videoEl, cap, bgImg;
let frameInput, frameInputRGB, frameOutput, frameGray, fgmask;
let classifier, faces, bgdModel, fgdModel;

async function onLoad() {
  // Get camera stream
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  videoEl = document.createElement('video');
  videoEl.srcObject = stream;
  bgImg = document.getElementById('bgImg');
  classifier = new cv.CascadeClassifier();
  faces = new cv.RectVector();
  bgdModel = new cv.Mat();
  fgdModel = new cv.Mat();

  document.getElementById('bg-select').addEventListener('change', (e) => {
    bgImg.src = URL.createObjectURL(e.target.files[0]);
  });

  const faceRecResp = await fetch('haarcascade_frontalface_default.xml');
  const faceRecData = new Uint8Array(await faceRecResp.arrayBuffer());
  cv.FS_createDataFile('/', 'haarcascade_frontalface_default.xml', faceRecData, true, false, false);
  classifier.load('haarcascade_frontalface_default.xml');

  videoEl.addEventListener('loadedmetadata', () => {
    const canvas = document.getElementById('canvasOutput');
    videoEl.width = videoEl.videoWidth;
    videoEl.height = videoEl.videoHeight;
    videoEl.play();
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    bgImg.width = videoEl.videoWidth;
    bgImg.height = videoEl.videoHeight;
    bgImg.style.display = 'block';

    frameInput = new cv.Mat(videoEl.height, videoEl.width, cv.CV_8UC4);
    frameOutput = new cv.Mat(videoEl.height, videoEl.width, cv.CV_8UC4);
    frameInputRGB = new cv.Mat(videoEl.height, videoEl.width, cv.CV_8UC3);
    frameGray = new cv.Mat();
    fgmask = new cv.Mat(videoEl.height, videoEl.width, cv.CV_8UC1);

    cap = new cv.VideoCapture(videoEl);
    animate();
  });
}


let lastDt = 0;
function animate(dt) {
  let fps = 1000 / (dt - lastDt);
  lastDt = dt;
  document.getElementById('fps').innerText = fps.toFixed(1);
  cap.read(frameInput);
  cv.cvtColor(frameInput, frameInputRGB, cv.COLOR_RGBA2RGB, 0);
  frameOutput.setTo([0, 0, 0, 0]);

  cv.cvtColor(frameInput, frameGray, cv.COLOR_RGBA2GRAY, 0);

  classifier.detectMultiScale(frameGray, faces, 1.1, 3, 0);

  fgmask.setTo([cv.GC_PR_BGD, cv.GC_PR_BGD, cv.GC_PR_BGD, cv.GC_PR_BGD]);
  for (let i = 0; i < faces.size(); ++i) {
    let face = faces.get(i);
    let point1 = new cv.Point(face.x, face.y);
    let point2 = new cv.Point(face.x + face.width, face.y + face.height);
    cv.rectangle(fgmask, point1, point2, [cv.GC_PR_FGD, cv.GC_PR_FGD, cv.GC_PR_FGD, cv.GC_PR_FGD], cv.FILLED);
    let point3 = new cv.Point(face.x, face.y + face.height);
    let point4 = new cv.Point(face.x + face.width, face.y + 2 * face.height);
    cv.rectangle(fgmask, point3, point4, [cv.GC_PR_FGD, cv.GC_PR_FGD, cv.GC_PR_FGD, cv.GC_PR_FGD], cv.FILLED);
  }
  if (faces.size() > 0) {
    cv.grabCut(frameInputRGB, fgmask, faces.get(0), bgdModel, fgdModel, 1, cv.GC_INIT_WITH_MASK);
  }

  for (let x = 0; x < frameInputRGB.cols; x++) {
    for (let y = 0; y < frameInputRGB.rows; y++) {
      let pixel = fgmask.ucharPtr(y, x);
      if (pixel[0] == cv.GC_BGD || pixel[0] == cv.GC_PR_BGD) {
        pixel[0] = 0;
        pixel[1] = 0;
        pixel[2] = 0;
      }
    }
  }

  cv.add(frameOutput, frameInput, frameOutput, fgmask);

  cv.imshow('canvasOutput', frameOutput);
  requestAnimationFrame(animate);
}

document.addEventListener('DOMContentLoaded', onLoad);
