// ========== STATE ==========
let songs = [];
let currentIndex = 0;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let queue = []; // Queue for songs

// ========== ELEMENTS ==========
const audio = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const playIcon = document.getElementById('playIcon');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const progressBar = document.getElementById('progressBar');
const volumeBar = document.getElementById('volumeBar');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const currentCover = document.getElementById('currentCover');
const currentTitle = document.getElementById('currentTitle');
const currentArtist = document.getElementById('currentArtist');
const heartBtn = document.getElementById('heartBtn');
const searchInput = document.getElementById('searchInput');

// ========== FORMAT TIME ==========
function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ========== RENDER CARDS ==========
function renderCards(songList, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  if (songList.length === 0) {
    container.innerHTML = '<p class="loading-text">No songs found.</p>';
    return;
  }

  songList.forEach((song, i) => {
    const card = document.createElement('div');
    card.className = 'song-card';
    card.dataset.index = i;

    card.innerHTML = `
      <img src="${song.cover}" alt="${song.title}" loading="lazy"
        onerror="this.src='https://picsum.photos/seed/${song.id}/300/300'"/>
      <div class="card-title">${song.title}</div>
      <div class="card-artist">${song.artist}</div>
      <div class="play-overlay"><i class="fas fa-play"></i></div>
      <button class="add-to-queue-btn" title="Add to Queue">
        <i class="fas fa-plus"></i>
      </button>
    `;

    // Play on card click
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.add-to-queue-btn')) {
        playSong(i);
      }
    });

    // Add to Queue button
    const addBtn = card.querySelector('.add-to-queue-btn');
    addBtn.addEventListener('click', (e) => {
      e.stopImmediatePropagation();
      addToQueue(song);
    });

    container.appendChild(card);
  });
}

// ========== LOAD SONGS FROM JSON ==========
async function loadSongs() {
  const container = document.getElementById('recommendedRow');
  try {
    const res = await fetch('songs.json');
    songs = await res.json();
    renderCards(songs, 'recommendedRow');
    renderCards(songs, 'hindiRow');
  } catch (err) {
    console.error('Songs load nahi hue:', err);
    if (container) {
      container.innerHTML = '<p class="loading-text">Songs load nahi hue. Live Server use karo.</p>';
    }
  }
}

// ========== PLAY SONG ==========
function playSong(index) {
  if (index < 0 || index >= songs.length) return;
  currentIndex = index;
  const song = songs[currentIndex];

  audio.src = song.src;
  audio.volume = volumeBar.value / 100;
  audio.play();
  isPlaying = true;
  updatePlayIcon();

  currentCover.src = song.cover;
  currentCover.onerror = () => {
    currentCover.src = `https://picsum.photos/seed/${song.id}/300/300`;
  };
  currentTitle.textContent = song.title;
  currentArtist.textContent = song.artist;

  // Update Right Sidebar with transition
  const rightSidebar = document.querySelector('.right-sidebar');
  const rightCover = document.getElementById('rightCover');
  const rightTitle = document.getElementById('rightTitle');
  const rightArtist = document.getElementById('rightArtist');

  if (rightSidebar) {
    rightSidebar.style.display = 'block';
    // Trigger transition
    setTimeout(() => {
      rightSidebar.style.opacity = '1';
      rightSidebar.style.transform = 'translateX(0)';
    }, 10);
  }

  if (rightCover) rightCover.src = song.cover;
  if (rightTitle) rightTitle.textContent = song.title;
  if (rightArtist) rightArtist.textContent = song.artist;

  // Update Queue display (in case queue changed)
  updateQueueDisplay();

  // Update Queue Section (Next Song)
  let nextSong;

  if (isShuffle) {
    // Pick a random different song when shuffle is on
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * songs.length);
    } while (randomIndex === currentIndex && songs.length > 1);
    nextSong = songs[randomIndex];
  } else {
    // Normal next song
    const nextIndex = (currentIndex + 1) % songs.length;
    nextSong = songs[nextIndex];
  }

  const queueCover = document.getElementById('queueCover');
  const queueTitle = document.getElementById('queueTitle');
  const queueArtist = document.getElementById('queueArtist');

  if (queueCover) queueCover.src = nextSong.cover;
  if (queueTitle) queueTitle.textContent = nextSong.title;
  if (queueArtist) queueArtist.textContent = nextSong.artist;

  document.querySelectorAll('.song-card').forEach(c => c.classList.remove('active'));
  const activeCard = document.querySelector(`.song-card[data-index="${currentIndex}"]`);
  if (activeCard) {
    activeCard.classList.add('active');
    activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  heartBtn.classList.remove('liked');
}

function updatePlayIcon() {
  playIcon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
}

// ========== CONTROLS ==========
playBtn.addEventListener('click', () => {
  if (songs.length === 0) return;
  if (isPlaying) {
    audio.pause();
    isPlaying = false;
  } else {
    audio.play();
    isPlaying = true;
  }
  updatePlayIcon();
});

prevBtn.addEventListener('click', () => {
  if (songs.length === 0) return;
  currentIndex = (currentIndex - 1 + songs.length) % songs.length;
  playSong(currentIndex);
});

nextBtn.addEventListener('click', () => {
  if (songs.length === 0) return;

  // Priority: Play from queue if available
  if (queue.length > 0) {
    const nextSongFromQueue = queue.shift();
    updateQueueDisplay();

    const songIndex = songs.findIndex(s => s.id === nextSongFromQueue.id);
    if (songIndex !== -1) {
      playSong(songIndex);
    }
    return;
  }

  // Normal next behavior
  if (isShuffle) {
    currentIndex = Math.floor(Math.random() * songs.length);
  } else {
    currentIndex = (currentIndex + 1) % songs.length;
  }
  playSong(currentIndex);
});

shuffleBtn.addEventListener('click', () => {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle('active', isShuffle);
});

repeatBtn.addEventListener('click', () => {
  isRepeat = !isRepeat;
  repeatBtn.classList.toggle('active', isRepeat);
  audio.loop = isRepeat;
});

heartBtn.addEventListener('click', () => {
  heartBtn.classList.toggle('liked');
});

// ========== PROGRESS ==========
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  progressBar.value = pct;
  currentTimeEl.textContent = formatTime(audio.currentTime);
  totalTimeEl.textContent = formatTime(audio.duration);
});

progressBar.addEventListener('input', () => {
  if (!audio.duration) return;
  audio.currentTime = (progressBar.value / 100) * audio.duration;
});

// ========== VOLUME ==========
volumeBar.addEventListener('input', () => {
  audio.volume = volumeBar.value / 100;
});

// ========== SONG END ==========
audio.addEventListener('ended', () => {
  if (isRepeat) return;

  // Priority: Queue first
  if (queue.length > 0) {
    const nextSongFromQueue = queue.shift(); // Take first song from queue
    updateQueueDisplay();

    // Find index in main songs list
    const songIndex = songs.findIndex(s => s.id === nextSongFromQueue.id);
    if (songIndex !== -1) {
      playSong(songIndex);
    }
    return;
  }

  // Normal behavior (Shuffle or Next)
  if (isShuffle) {
    currentIndex = Math.floor(Math.random() * songs.length);
  } else {
    currentIndex = (currentIndex + 1) % songs.length;
  }
  playSong(currentIndex);
});

// ========== SEARCH ==========
searchInput?.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();

  const container = document.getElementById("recommendedRow");
  container.innerHTML = "";

  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(query) ||
    song.artist.toLowerCase().includes(query)
  );

  if (filteredSongs.length === 0) {
    container.innerHTML =
      '<p class="loading-text">No songs found.</p>';
    return;
  }

  filteredSongs.forEach(song => {

    const originalIndex = songs.findIndex(s => s.id === song.id);

    const card = document.createElement("div");
    card.className = "song-card";

    card.innerHTML = `
      <img src="${song.cover}" alt="${song.title}">
      <div class="card-title">${song.title}</div>
      <div class="card-artist">${song.artist}</div>
      <div class="play-overlay">
        <i class="fas fa-play"></i>
      </div>
    `;

    card.addEventListener("click", () => {
      playSong(originalIndex);
    });

    container.appendChild(card);
  });
});

// ========== FILTER TABS ==========
document.querySelectorAll('.content-filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.content-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// ========== QUEUE BUTTON ==========
const queueBtn = document.getElementById('queueBtn');

if (queueBtn) {
  queueBtn.addEventListener('click', () => {
    if (songs.length === 0 || currentIndex < 0) return;

    const currentSong = songs[currentIndex];
    
    // Avoid duplicates at the end
    if (queue.length === 0 || queue[queue.length - 1].id !== currentSong.id) {
      queue.push(currentSong);
      showToast(`"${currentSong.title}" added to queue`);
      updateQueueDisplay();
    }
  });
}

function updateQueueDisplay() {
  const queueList = document.getElementById('queueList');
  if (!queueList) return;

  queueList.innerHTML = '';

  if (queue.length === 0) {
    const queueHeader = document.querySelector('.queue-header span');
    if (queueHeader) queueHeader.textContent = 'Next in queue';
    return;
  }

  // Update header with count
  const queueHeader = document.querySelector('.queue-header span');
  if (queueHeader) {
    queueHeader.textContent = `Next in queue (${queue.length})`;
  }

  // Show up to 4 songs in queue
  const songsToShow = queue.slice(0, 4);

  songsToShow.forEach((song) => {
    const item = document.createElement('div');
    item.className = 'queue-item';
    item.innerHTML = `
      <img src="${song.cover}" alt="${song.title}">
      <div class="queue-info">
        <span>${song.title}</span>
        <small>${song.artist}</small>
      </div>
    `;
    queueList.appendChild(item);
  });
}

function addToQueue(song) {
  queue.push(song);
  showToast(`"${song.title}" added to queue`);
  updateQueueDisplay();
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; bottom: 120px; left: 50%; transform: translateX(-50%);
    background: #1DB954; color: #000; padding: 12px 24px; border-radius: 25px;
    font-size: 14px; font-weight: 600; z-index: 9999;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'all 0.3s ease';
    toast.style.opacity = '0';
    setTimeout(() => toast.parentNode.removeChild(toast), 300);
  }, 2200);
}

// ========== HORIZONTAL SCROLL ARROWS ==========
const scrollLeftBtn = document.getElementById('scrollLeft');
const scrollRightBtn = document.getElementById('scrollRight');
const hindiRow = document.getElementById('hindiRow');

if (scrollLeftBtn && scrollRightBtn && hindiRow) {
  const scrollAmount = 300; // pixels to scroll each click

  scrollLeftBtn.addEventListener('click', () => {
    hindiRow.scrollBy({
      left: -scrollAmount,
      behavior: 'smooth'
    });
  });

  scrollRightBtn.addEventListener('click', () => {
    hindiRow.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  });
}

// Recommended section arrows
const recScrollLeftBtn = document.getElementById('recScrollLeft');
const recScrollRightBtn = document.getElementById('recScrollRight');
const recommendedRow = document.getElementById('recommendedRow');

if (recScrollLeftBtn && recScrollRightBtn && recommendedRow) {
  const recScrollAmount = 300;

  recScrollLeftBtn.addEventListener('click', () => {
    recommendedRow.scrollBy({
      left: -recScrollAmount,
      behavior: 'smooth'
    });
  });

  recScrollRightBtn.addEventListener('click', () => {
    recommendedRow.scrollBy({
      left: recScrollAmount,
      behavior: 'smooth'
    });
  });
}

// ========== INIT ==========
loadSongs();
