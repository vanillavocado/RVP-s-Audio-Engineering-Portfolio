const projects = [
  {
    title: "Remix - Lihim",
    type: "Remix",
    image: "images/Remixpic.png",
    audio: "audio/Remixaud.mp3",
    tags: ["Arthur Miguel", "2023"]
  },
  {
    title: "Medley - Bruno Major",
    type: "Medley",
    image: "images/Medleypic.png",
    audio: "audio/Medleyaud.mp3",
    tags: ["Bruno Major", "2020"]
  },
  {
    title: "Mashup - Ere and Hanggang Kailan",
    type: "Mashup",
    image: "images/Mashuppic.png",
    audio: "audio/project3.mp3",
    tags: ["Juan Karlos", "2023", "Orange & Lemons", "2005"]
  },
  {
    title: "Beat Match - Love Me and Somebody Else",
    type: "Beat Matching",
    image: "images/Beatmatchpic.png",
    audio: "audio/Beatmatchaud.mp3",
    tags: ["The 1975", "2016"]
  },
  {
    title: "Cut-Up - Never Ending Song",
    type: "Cut-up",
    image: "images/Cutuppic.png",
    audio: "audio/Cutupaud.mp3",
    tags: ["Conan Gray", "2024"]
  },
  {
    title: "Audio Mix - Huwag Kang Matakot",
    type: "Audio mix",
    image: "images/Audmixpic.png",
    audio: "audio/Audmixaud.mp3",
    tags: ["Orange & Lemons", "2005", "Cover"]
  },
  {
    title: "The Sound of My Soul",
    type: "Masterpiece",
    image: "images/Masterpiecepic.png",
    audio: "audio/Masterpieceaud.mp3",
    tags: ["Raven Sibucao", "2026"]
  }
];

// Header menu
const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}

// Main elements
const projectGrid = document.getElementById("projectGrid");
const modal = document.getElementById("musicModal");
const closeModalBtn = document.getElementById("closeModal");

const modalImage = document.getElementById("modalImage");
const modalPlaceholder = document.getElementById("modalPlaceholder");
const modalTitle = document.getElementById("modalTitle");
const modalType = document.getElementById("modalType");
const modalTags = document.getElementById("modalTags");

const audioPlayer = document.getElementById("audioPlayer");
const playPauseBtn = document.getElementById("playPauseBtn");
const progressBar = document.getElementById("progressBar");
const currentTimeText = document.getElementById("currentTime");
const durationText = document.getElementById("duration");

const canvas = document.getElementById("visualizerCanvas");
const canvasContext = canvas.getContext("2d");

// Web Audio API variables
let audioContext;
let analyser;
let source;
let dataArray;
let bufferLength;
let animationId = null;
let audioConnected = false;
let isVisualizerRunning = false;

// Generate project cards
projects.forEach((project, index) => {
  const card = document.createElement("div");
  card.classList.add("project-card");

  card.innerHTML = `
    <div class="card-cover">
      <img src="${project.image}" alt="${project.title}">
      <span class="placeholder-icon">🎧</span>
    </div>

    <div class="project-card-content">
      <h3>${project.title}</h3>
      <span class="card-type">${project.type}</span>
      <p class="listen-label">Click to listen</p>
    </div>
  `;

  const cardImage = card.querySelector("img");
  const placeholderIcon = card.querySelector(".placeholder-icon");

  cardImage.addEventListener("load", () => {
    cardImage.style.display = "block";
    placeholderIcon.style.display = "none";
  });

  cardImage.addEventListener("error", () => {
    cardImage.style.display = "none";
    placeholderIcon.style.display = "block";
  });

  card.addEventListener("click", () => {
    openMusicModal(index);
  });

  projectGrid.appendChild(card);
});

function openMusicModal(index) {
  const project = projects[index];

  stopVisualizer();

  modalTitle.textContent = project.title;
  modalType.textContent = project.type;
  modalTags.innerHTML = "";

  project.tags.forEach(tagText => {
    const tag = document.createElement("span");
    tag.classList.add("tag");
    tag.textContent = tagText;
    modalTags.appendChild(tag);
  });

  modalImage.src = project.image;
  modalImage.style.display = "none";
  modalPlaceholder.style.display = "block";

  modalImage.onload = () => {
    modalImage.style.display = "block";
    modalPlaceholder.style.display = "none";
  };

  modalImage.onerror = () => {
    modalImage.style.display = "none";
    modalPlaceholder.style.display = "block";
  };

  audioPlayer.pause();
  audioPlayer.src = project.audio;
  audioPlayer.load();

  progressBar.value = 0;
  currentTimeText.textContent = "0:00";
  durationText.textContent = "0:00";
  playPauseBtn.textContent = "▶";

  clearCanvas();
  modal.classList.add("active");
}

function closeMusicModal() {
  modal.classList.remove("active");

  audioPlayer.pause();
  audioPlayer.currentTime = 0;
  playPauseBtn.textContent = "▶";

  stopVisualizer();
  clearCanvas();
}

// Close modal with X button
closeModalBtn.addEventListener("click", closeMusicModal);

// Close modal by clicking outside the box
modal.addEventListener("click", event => {
  if (event.target === modal) {
    closeMusicModal();
  }
});

// Close modal with Escape key
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && modal.classList.contains("active")) {
    closeMusicModal();
  }
});

// Play and pause audio
playPauseBtn.addEventListener("click", async () => {
  setupAudioVisualizer();

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  if (audioPlayer.paused) {
    try {
      await audioPlayer.play();
      playPauseBtn.textContent = "❚❚";
      startVisualizer();
    } catch (error) {
      alert("Audio could not play. Check if the audio file path is correct.");
      console.error(error);
    }
  } else {
    audioPlayer.pause();
    playPauseBtn.textContent = "▶";
    stopVisualizer();
    clearCanvas();
  }
});

// Update progress bar while playing
audioPlayer.addEventListener("timeupdate", () => {
  if (!audioPlayer.duration) return;

  const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
  progressBar.value = progressPercent;

  currentTimeText.textContent = formatTime(audioPlayer.currentTime);
  durationText.textContent = formatTime(audioPlayer.duration);
});

// Seek audio
progressBar.addEventListener("input", () => {
  if (!audioPlayer.duration) return;

  const seekTime = (progressBar.value / 100) * audioPlayer.duration;
  audioPlayer.currentTime = seekTime;
});

// Reset when song ends
audioPlayer.addEventListener("ended", () => {
  playPauseBtn.textContent = "▶";
  progressBar.value = 0;

  stopVisualizer();
  clearCanvas();
});

// Setup Web Audio visualizer
function setupAudioVisualizer() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }

  if (!audioConnected) {
    analyser = audioContext.createAnalyser();
    source = audioContext.createMediaElementSource(audioPlayer);

    source.connect(analyser);
    analyser.connect(audioContext.destination);

    // Higher value makes the waveform smoother
    analyser.fftSize = 2048;

    bufferLength = analyser.fftSize;
    dataArray = new Uint8Array(bufferLength);

    audioConnected = true;
  }
}

function startVisualizer() {
  if (isVisualizerRunning) return;

  isVisualizerRunning = true;
  drawVisualizer();
}

function stopVisualizer() {
  isVisualizerRunning = false;

  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

// Draw pastel rainbow waveform visualizer
function drawVisualizer() {
  if (!isVisualizerRunning) return;

  animationId = requestAnimationFrame(drawVisualizer);

  if (!analyser) return;

  analyser.getByteTimeDomainData(dataArray);

  resizeCanvas();
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);

  const centerY = canvas.height / 2;
  const barCount = 150;
  const spacing = canvas.width / barCount;

  const pastelRainbow = [
    "#ffb3c6",
    "#ffd6a5",
    "#fdffb6",
    "#caffbf",
    "#9bf6ff",
    "#a0c4ff",
    "#bdb2ff",
    "#ffc6ff"
  ];

  canvasContext.lineWidth = 2;
  canvasContext.lineCap = "round";

  for (let i = 0; i < barCount; i++) {
    const dataIndex = Math.floor((i / barCount) * bufferLength);
    const value = dataArray[dataIndex];

    const normalized = Math.abs(value - 128) / 128;
    let barHeight = normalized * canvas.height * 0.75;

    // Minimum height so the waveform stays visible
    barHeight = Math.max(barHeight, 3);

    const x = i * spacing;
    const colorIndex = i % pastelRainbow.length;

    canvasContext.strokeStyle = pastelRainbow[colorIndex];

    canvasContext.beginPath();
    canvasContext.moveTo(x, centerY - barHeight / 2);
    canvasContext.lineTo(x, centerY + barHeight / 2);
    canvasContext.stroke();
  }
}

function clearCanvas() {
  resizeCanvas();
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
}

function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}

// Format time to 0:00
function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}

const videos = document.querySelectorAll("video");

videos.forEach(video => {
  video.addEventListener("play", () => {
    videos.forEach(otherVideo => {
      if (otherVideo !== video) {
        otherVideo.pause();
      }
    });
  });
});