import './style.css'

let videoEl, cap, bgImg;
let fgbg = new cv.BackgroundSubtractorMOG2(500, 16, true);
let frameInput, frameOutput, fgmask, fgmask2;
// let fgmask;

async function onLoad() {
  // Get camera stream
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  videoEl = document.createElement('video');
  videoEl.srcObject = stream;
  bgImg = document.getElementById('bgImg');

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

    // fgmask = new cv.Mat(videoEl.height, videoEl.width, cv.CV_8UC1);
    frameInput = new cv.Mat(videoEl.height, videoEl.width, cv.CV_8UC4);
    frameOutput = new cv.Mat(videoEl.height, videoEl.width, cv.CV_8UC4);
    fgmask = new cv.Mat(videoEl.height, videoEl.width, cv.CV_8UC1);
    fgmask2 = new cv.Mat(videoEl.height, videoEl.width, cv.CV_8UC1);

    cap = new cv.VideoCapture(videoEl);
    animate();
  });
}

function animate() {
  try {
    cap.read(frameInput);
    frameOutput.setTo([0, 0, 0, 0]);

    fgbg.apply(frameInput, fgmask);
    // const ksize = new cv.Size(3, 3);
    // cv.GaussianBlur(fgmask, fgmask2, ksize, 0, 0, cv.BORDER_DEFAULT);

    cv.add(frameOutput, frameInput, frameOutput, fgmask);
    // cv.mixChannels([frameInput, fgmask2], [frameOutput], [0,0, 1,1, 2,2, 4,3]);

    // cv.imshow('canvasOutput', frameOutput);
    cv.imshow('canvasOutput', frameOutput);
    requestAnimationFrame(animate);
  } catch (e) {
    console.error(e);
    document.getElementById('app').innerHTML = `
      <h1 class="error">An error occurred</h1>
      <p>${e}</p>
      <p>Try reloading the page.</p>
    `;
    bgImg.style.display = 'none';
    document.getElementById('canvasOutput').style.display = 'none';
  } finally {
    // frameInput.delete();
    // frameOutput.delete();
    // fgmask.delete();
    // fgmask2.delete();
  }
}

document.addEventListener('DOMContentLoaded', onLoad);
