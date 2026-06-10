// ========== STATE ==========
let songs = [];
let currentIndex = 0;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;

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
    `;

    card.addEventListener('click', () => playSong(i));
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
  if (isShuffle) {
    currentIndex = Math.floor(Math.random() * songs.length);
  } else {
    currentIndex = (currentIndex + 1) % songs.length;
  }
  playSong(currentIndex);
});

// ========== SEARCH ==========
searchInput && searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) {
    renderCards(songs, 'recommendedRow');
    return;
  }
  const filtered = songs.filter(s =>
    s.title.toLowerCase().includes(query) ||
    s.artist.toLowerCase().includes(query)
  );
  renderCards(filtered, 'recommendedRow');
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

// ========== INIT ==========
loadSongs();