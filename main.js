let mediaRecorder;
let recordedChunks = [];
let screenStream;
let webcamStream;

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const screenPreview = document.getElementById('screenPreview');
const webcamPreview = document.getElementById('webcamPreview');
const recordedVideo = document.getElementById('recordedVideo');

startBtn.addEventListener('click', startRecording);
stopBtn.addEventListener('click', stopRecording);

async function startRecording() {
  recordedChunks = [];
  
  try {
    screenStream = await navigator.mediaDevices.getDisplayMedia({ 
      video: true,
      audio: true // Request audio from the screen capture
    });
    webcamStream = await navigator.mediaDevices.getUserMedia({ 
      video: true,
      audio: true // Keep microphone audio
    });
    
    screenPreview.srcObject = screenStream;
    webcamPreview.srcObject = webcamStream;
    
    const audioContext = new AudioContext();
    const screenAudio = audioContext.createMediaStreamSource(screenStream);
    const micAudio = audioContext.createMediaStreamSource(webcamStream);
    const destination = audioContext.createMediaStreamDestination();

    screenAudio.connect(destination);
    micAudio.connect(destination);

    const tracks = [
      ...screenStream.getVideoTracks(),
      ...destination.stream.getTracks()
    ];
    const combinedStream = new MediaStream(tracks);
    
    mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: 'video/webm;codecs=vp9,opus'
    });
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      recordedVideo.src = URL.createObjectURL(blob);
    };
    
    mediaRecorder.start();
    startBtn.disabled = true;
    stopBtn.disabled = false;
  } catch (error) {
    console.error('Error starting recording:', error);
  }
}

function stopRecording() {
  mediaRecorder.stop();
  screenStream.getTracks().forEach(track => track.stop());
  webcamStream.getTracks().forEach(track => track.stop());
  startBtn.disabled = false;
  stopBtn.disabled = true;
}

// Make webcam preview draggable
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

webcamPreview.addEventListener("mousedown", dragStart);
document.addEventListener("mousemove", drag);
document.addEventListener("mouseup", dragEnd);

function dragStart(e) {
  initialX = e.clientX - xOffset;
  initialY = e.clientY - yOffset;

  if (e.target === webcamPreview) {
    isDragging = true;
  }
}

function drag(e) {
  if (isDragging) {
    e.preventDefault();
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;

    xOffset = currentX;
    yOffset = currentY;

    setTranslate(currentX, currentY, webcamPreview);
  }
}

function setTranslate(xPos, yPos, el) {
  el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
}

function dragEnd(e) {
  initialX = currentX;
  initialY = currentY;

  isDragging = false;
}