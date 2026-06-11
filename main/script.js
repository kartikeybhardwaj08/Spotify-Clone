// ========== STATE ==========
let songs = [];
let currentIndex = 0;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let queue = []; // Queue for songs
let savedPlaybackTime = 0;
let playlists = []; // User playlists
let currentEditingPlaylistId = null;
let currentAddingSong = null;
let likedSongIds = new Set(); // Track liked song IDs
let currentPlaylistType = null; // 'liked', playlist id, or null
let currentPlaylistSongs = []; // Songs of current playing playlist

// ========== LOCAL STORAGE ==========
function saveStateToLocalStorage() {
  const state = {
    currentIndex,
    playbackTime: audio.currentTime,
    volume: volumeBar.value,
    isShuffle,
    isRepeat,
    queue,
    playlists,
    likedSongIds: Array.from(likedSongIds) // Convert Set to array for storage
  };
  localStorage.setItem('spotifyCloneState', JSON.stringify(state));
}

function loadStateFromLocalStorage() {
  const savedState = localStorage.getItem('spotifyCloneState');
  if (savedState) {
    const state = JSON.parse(savedState);
    currentIndex = state.currentIndex || 0;
    savedPlaybackTime = state.playbackTime || 0;
    isShuffle = state.isShuffle || false;
    isRepeat = state.isRepeat || false;
    queue = state.queue || [];
    playlists = state.playlists || [];
    likedSongIds = new Set(state.likedSongIds || []); // Load liked songs
    
    // Update UI for shuffle and repeat
    shuffleBtn.classList.toggle('active', isShuffle);
    repeatBtn.classList.toggle('active', isRepeat);
    audio.loop = isRepeat;
    
    // Update volume
    if (volumeBar) volumeBar.value = state.volume || 100;
    if (rightVolumeBar) rightVolumeBar.value = state.volume || 100;
    audio.volume = (state.volume || 100) / 100;
  } else {
    // Set default volume if no saved state
    if (volumeBar) volumeBar.value = 100;
    if (rightVolumeBar) rightVolumeBar.value = 100;
    audio.volume = 1;
  }
}

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

// Set default audio volume to 100%
audio.volume = 1;

// Right Sidebar Elements
const rightHeartBtn = document.getElementById('rightHeartBtn');
const rightPlayBtn = document.getElementById('rightPlayBtn');
const rightPrevBtn = document.getElementById('rightPrevBtn');
const rightNextBtn = document.getElementById('rightNextBtn');
const rightProgressBar = document.getElementById('rightProgressBar');
const rightVolumeBar = document.getElementById('rightVolumeBar');
const rightCurrentTime = document.getElementById('rightCurrentTime');
const rightTotalTime = document.getElementById('rightTotalTime');

// Playlist Modal Elements
const createPlaylistBtn = document.getElementById('create-playlist');
const playlistModal = document.getElementById('playlistModal');
const closeModalBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');
const playlistNameInput = document.getElementById('playlistNameInput');
const modalTitle = document.getElementById('modalTitle');
const addToPlaylistModal = document.getElementById('addToPlaylistModal');
const closeAddToPlaylistModal = document.getElementById('closeAddToPlaylistModal');
const playlistOptions = document.getElementById('playlistOptions');
const libraryList = document.getElementById('libraryList');

// ========== PLAYLIST FUNCTIONS ==========
function renderLibraryList() {
  libraryList.innerHTML = '';
  
  // Liked Songs
  const likedItem = document.createElement('li');
  likedItem.className = 'library-item liked';
  likedItem.innerHTML = `
    <div class="liked-icon"><i class="fas fa-heart"></i></div>
    <div class="lib-info">
      <span class="lib-name">Liked Songs</span>
      <span class="lib-meta">Playlist</span>
    </div>
  `;
  likedItem.addEventListener('click', () => openPlaylistView('liked'));
  libraryList.appendChild(likedItem);

  // User Playlists
  playlists.forEach(playlist => {
    const item = document.createElement('li');
    item.className = 'library-item';
    const cover = playlist.songs.length > 0 
      ? playlist.songs[0].cover 
      : 'https://picsum.photos/seed/' + playlist.id + '/300/300';
    item.innerHTML = `
      <img src="${cover}" alt="${playlist.name}" />
      <div class="lib-info">
        <span class="lib-name">${playlist.name}</span>
        <span class="lib-meta">Playlist • ${playlist.songs.length} songs</span>
      </div>
      <div class="library-item-actions" style="margin-left: auto; display: flex; gap: 8px;">
        <button class="edit-playlist-btn" data-id="${playlist.id}" title="Edit">
          <i class="fas fa-pencil-alt"></i>
        </button>
        <button class="delete-playlist-btn" data-id="${playlist.id}" title="Delete">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `;
    item.querySelector('.lib-info, img').addEventListener('click', () => openPlaylistView(playlist.id));
    item.querySelector('.edit-playlist-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openEditPlaylistModal(playlist.id);
    });
    item.querySelector('.delete-playlist-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      deletePlaylist(playlist.id);
    });
    libraryList.appendChild(item);
  });
}

function createPlaylist(name) {
  const newPlaylist = {
    id: Date.now(),
    name,
    songs: []
  };
  playlists.push(newPlaylist);
  saveStateToLocalStorage();
  renderLibraryList();
}

function openEditPlaylistModal(playlistId) {
  const playlist = playlists.find(p => p.id === playlistId);
  if (!playlist) return;
  currentEditingPlaylistId = playlistId;
  modalTitle.textContent = 'Edit Playlist';
  playlistNameInput.value = playlist.name;
  saveBtn.textContent = 'Save';
  playlistModal.classList.add('show');
}

function updatePlaylistName(playlistId, newName) {
  const playlist = playlists.find(p => p.id === playlistId);
  if (!playlist) return;
  playlist.name = newName;
  saveStateToLocalStorage();
  renderLibraryList();
}

function deletePlaylist(playlistId) {
  if (!confirm('Are you sure you want to delete this playlist?')) return;
  playlists = playlists.filter(p => p.id !== playlistId);
  saveStateToLocalStorage();
  renderLibraryList();
}

function openAddToPlaylistModal(song) {
  currentAddingSong = song;
  playlistOptions.innerHTML = '';
  
  // Liked Songs option
  const likedOption = document.createElement('div');
  likedOption.className = 'playlist-option';
  likedOption.innerHTML = `
    <div class="liked-icon"><i class="fas fa-heart"></i></div>
    <span>Liked Songs</span>
  `;
  likedOption.addEventListener('click', () => {
    if (likedSongIds.has(song.id)) {
      showToast('Song already liked');
    } else {
      likedSongIds.add(song.id);
      saveStateToLocalStorage();
      showToast('Added to Liked Songs');
    }
    addToPlaylistModal.classList.remove('show');
  });
  playlistOptions.appendChild(likedOption);

  // User playlists options
  playlists.forEach(playlist => {
    const option = document.createElement('div');
    option.className = 'playlist-option';
    const cover = playlist.songs.length > 0 
      ? playlist.songs[0].cover 
      : 'https://picsum.photos/seed/' + playlist.id + '/300/300';
    option.innerHTML = `
      <img src="${cover}" alt="${playlist.name}" />
      <span>${playlist.name}</span>
    `;
    option.addEventListener('click', () => addSongToPlaylist(playlist.id, song));
    playlistOptions.appendChild(option);
  });

  addToPlaylistModal.classList.add('show');
}

function addSongToPlaylist(playlistId, song) {
  const playlist = playlists.find(p => p.id === playlistId);
  if (!playlist) return;
  
  // Check if song already in playlist
  const exists = playlist.songs.some(s => s.id === song.id);
  if (exists) {
    showToast('Song already in playlist');
  } else {
    playlist.songs.push(song);
    saveStateToLocalStorage();
    renderLibraryList();
    showToast('Added to ' + playlist.name);
  }
  addToPlaylistModal.classList.remove('show');
}

function openPlaylistView(playlistId) {
  let playlistSongs = [];
  let playlistName = 'All Songs';
  
  if (playlistId === 'liked') {
    playlistName = 'Liked Songs';
    playlistSongs = songs.filter(s => likedSongIds.has(s.id));
  } else {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    playlistName = playlist.name;
    playlistSongs = playlist.songs;
  }
  
  // Update main content to show playlist
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
    <div class="playlist-header" data-playlist-type="${playlistId}" style="background: linear-gradient(180deg, ${playlistId === 'liked' ? '#450af5' : '#535353'} 0%, #181818 100%); padding: 40px 24px; border-radius: 12px; margin-bottom: 24px;">
      <div style="display: flex; align-items: end; gap: 24px;">
        <div style="width: 200px; height: 200px; background: #282828; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
          ${playlistId === 'liked' 
            ? '<div class="liked-icon" style="width: 80px; height: 80px; background: linear-gradient(135deg, #450af5, #c4efd9); display: flex; align-items: center; justify-content: center;"><i class="fas fa-heart" style="font-size: 2.5rem; color: white;"></i></div>'
            : playlistSongs.length > 0 
              ? '<img src="' + playlistSongs[0].cover + '" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" />'
              : '<i class="fas fa-music" style="font-size: 4rem; color: #535353;"></i>'
          }
        </div>
        <div>
          <p style="color: #b3b3b3; margin: 0 0 8px;">PLAYLIST</p>
          <h1 style="color: white; font-size: 4rem; margin: 0 0 16px;">${playlistName}</h1>
          <p style="color: #b3b3b3; margin: 0;">${playlistSongs.length} songs</p>
        </div>
      </div>
    </div>
    <div class="playlist-controls" style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
      <button class="play-pause-btn" id="playlistPlayBtn" style="width: 64px; height: 64px; border-radius: 50%; background: #1DB954; border: none; color: black; font-size: 1.7rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
        <i class="fas fa-play"></i>
      </button>
      <button class="playlist-shuffle-btn" id="playlistShuffleBtn" style="width: 40px; height: 40px; border-radius: 50%; background: transparent; border: none; color: ${isShuffle ? '#1DB954' : '#b3b3b3'}; font-size: 1.2rem; cursor: pointer; transition: all 0.2s;">
        <i class="fas fa-shuffle"></i>
      </button>
    </div>
    <div class="playlist-songs" id="playlistSongsContainer" style="width: 100%;"></div>
  `;
  
  // Render playlist songs
  const playlistSongsContainer = document.getElementById('playlistSongsContainer');
  playlistSongs.forEach((song, i) => {
    const songRow = document.createElement('div');
    songRow.className = 'playlist-song';
    songRow.style.cssText = 'display: flex; align-items: center; gap: 16px; padding: 12px 24px; border-radius: 8px; cursor: pointer; transition: background 0.2s;';
    songRow.innerHTML = `
      <div style="width: 40px; text-align: center;">
        <span class="song-number" style="color: #b3b3b3; font-size: 0.9rem;">${i + 1}</span>
        <i class="fas fa-play song-play-icon" style="color: white; font-size: 0.9rem; display: none;"></i>
      </div>
      <div style="width: 56px; height: 56px; border-radius: 4px; background: #282828; flex-shrink: 0;">
        <img src="${song.cover}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" />
      </div>
      <div style="flex: 1;">
        <p style="color: white; margin: 0; font-weight: 500;">${song.title}</p>
        <p style="color: #b3b3b3; margin: 4px 0 0; font-size: 0.9rem;">${song.artist}</p>
      </div>
      <button class="remove-song-btn" data-song-id="${song.id}" data-playlist-id="${playlistId}" style="background: none; border: none; color: #b3b3b3; cursor: pointer; padding: 8px; opacity: 0; transition: opacity 0.2s;">
        <i class="fas fa-trash-alt"></i>
      </button>
    `;
    
    // Show remove button and play icon on hover
    songRow.addEventListener('mouseenter', () => {
      songRow.querySelector('.remove-song-btn').style.opacity = '1';
      songRow.querySelector('.song-number').style.display = 'none';
      songRow.querySelector('.song-play-icon').style.display = 'inline';
    });
    songRow.addEventListener('mouseleave', () => {
      songRow.querySelector('.remove-song-btn').style.opacity = '0';
      songRow.querySelector('.song-number').style.display = 'inline';
      songRow.querySelector('.song-play-icon').style.display = 'none';
    });
    
    // Play song when clicking anywhere except remove button
    songRow.addEventListener('click', (e) => {
      if (!e.target.closest('.remove-song-btn')) {
        const songIndex = songs.findIndex(s => s.id === song.id);
        if (songIndex !== -1) {
          // Set current playlist state
          currentPlaylistType = playlistId;
          currentPlaylistSongs = playlistSongs;
          playSong(songIndex);
        }
      }
    });
    
    // Remove song from playlist/liked songs
    const removeBtn = songRow.querySelector('.remove-song-btn');
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (playlistId === 'liked') {
        likedSongIds.delete(song.id);
      } else {
        const playlist = playlists.find(p => p.id === playlistId);
        if (playlist) {
          playlist.songs = playlist.songs.filter(s => s.id !== song.id);
        }
      }
      saveStateToLocalStorage();
      openPlaylistView(playlistId); // Refresh view
    });
    
    playlistSongsContainer.appendChild(songRow);
  });
  
  // Add functionality to playlist play button
  const playlistPlayBtn = document.getElementById('playlistPlayBtn');
  const playlistPlayIcon = playlistPlayBtn.querySelector('i');
  
  // Update play button icon initially
  const currentSong = songs[currentIndex];
  const isCurrentPlaylistSong = playlistSongs.some(s => s.id === currentSong.id);
  if (isCurrentPlaylistSong && isPlaying) {
    playlistPlayIcon.className = 'fas fa-pause';
  } else {
    playlistPlayIcon.className = 'fas fa-play';
  }

  playlistPlayBtn.addEventListener('click', () => {
    if (playlistSongs.length === 0) return;

    const currentSongPlaying = songs[currentIndex];
    const isSongInPlaylist = playlistSongs.some(s => s.id === currentSongPlaying.id);
    
    if (isSongInPlaylist && isPlaying) {
      // Pause
      audio.pause();
      isPlaying = false;
      updatePlayIcon();
    } else if (isSongInPlaylist && !isPlaying) {
      // Resume
      audio.play();
      isPlaying = true;
      updatePlayIcon();
    } else {
      // Play first song in playlist
      const firstSong = playlistSongs[0];
      const songIndex = songs.findIndex(s => s.id === firstSong.id);
      if (songIndex !== -1) {
        currentPlaylistType = playlistId;
        currentPlaylistSongs = playlistSongs;
        playSong(songIndex);
      }
    }
  });

  // Playlist shuffle button
  const playlistShuffleBtn = document.getElementById('playlistShuffleBtn');
  if (playlistShuffleBtn) {
    playlistShuffleBtn.addEventListener('click', () => {
      isShuffle = !isShuffle;
      shuffleBtn.classList.toggle('active', isShuffle);
      // Update this shuffle button's color
      playlistShuffleBtn.style.color = isShuffle ? '#1DB954' : '#b3b3b3';
      // If we're already playing this playlist, shuffle next
      currentPlaylistType = playlistId;
      currentPlaylistSongs = playlistSongs;
    });
  }

  // Hover effect on song rows
  playlistSongsContainer.querySelectorAll('.playlist-song').forEach(row => {
    row.addEventListener('mouseenter', () => {
      row.style.background = 'rgba(255, 255, 255, 0.1)';
    });
    row.addEventListener('mouseleave', () => {
      row.style.background = 'transparent';
    });
  });

  // Back button to home
  const playlistHeader = mainContent.querySelector('.playlist-header');
  const backBtn = document.createElement('button');
  backBtn.innerHTML = '<i class="fas fa-arrow-left"></i>';
  backBtn.style.cssText = 'background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; margin-bottom: 16px;';
  backBtn.addEventListener('click', () => {
    // Reset main content to home view
    window.location.reload(); // Simple way to reset
  });
  mainContent.insertBefore(backBtn, playlistHeader);
}

// ========== MODAL EVENT LISTENERS ==========
createPlaylistBtn.addEventListener('click', () => {
  currentEditingPlaylistId = null;
  modalTitle.textContent = 'Create New Playlist';
  playlistNameInput.value = '';
  saveBtn.textContent = 'Create';
  playlistModal.classList.add('show');
});

closeModalBtn.addEventListener('click', () => playlistModal.classList.remove('show'));
cancelBtn.addEventListener('click', () => playlistModal.classList.remove('show'));
closeAddToPlaylistModal.addEventListener('click', () => addToPlaylistModal.classList.remove('show'));

// Close modals when clicking outside
playlistModal.addEventListener('click', (e) => {
  if (e.target === playlistModal) {
    playlistModal.classList.remove('show');
  }
});
addToPlaylistModal.addEventListener('click', (e) => {
  if (e.target === addToPlaylistModal) {
    addToPlaylistModal.classList.remove('show');
  }
});

saveBtn.addEventListener('click', () => {
  const name = playlistNameInput.value.trim();
  if (!name) return;
  
  if (currentEditingPlaylistId) {
    updatePlaylistName(currentEditingPlaylistId, name);
  } else {
    createPlaylist(name);
  }
  
  playlistModal.classList.remove('show');
});

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
      <button class="add-to-playlist-btn" title="Add to Playlist">
        <i class="fas fa-list"></i>
      </button>
    `;

    // Play on card click
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.add-to-queue-btn') && !e.target.closest('.add-to-playlist-btn')) {
        // Reset playlist state since we're playing from home
        currentPlaylistType = null;
        currentPlaylistSongs = [];
        playSong(i);
      }
    });

    // Add to Queue button
    const addBtn = card.querySelector('.add-to-queue-btn');
    addBtn.addEventListener('click', (e) => {
      e.stopImmediatePropagation();
      addToQueue(song);
    });

    // Add to Playlist button
    const addPlaylistBtn = card.querySelector('.add-to-playlist-btn');
    addPlaylistBtn.addEventListener('click', (e) => {
      e.stopImmediatePropagation();
      openAddToPlaylistModal(song);
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
    
    // Load saved state after songs are loaded
    loadStateFromLocalStorage();
    
    // Render library list
    renderLibraryList();
    
    // If we have a saved state, initialize the song
    if (songs.length > 0) {
      const savedState = localStorage.getItem('spotifyCloneState');
      if (savedState) {
        const state = JSON.parse(savedState);
        
        // Load the song
        const song = songs[state.currentIndex];
        if (song) {
          // Update UI
          currentCover.src = song.cover;
          currentCover.onerror = () => {
            currentCover.src = `https://picsum.photos/seed/${song.id}/300/300`;
          };
          currentTitle.textContent = song.title;
          currentArtist.textContent = song.artist;
          
          // Update right sidebar
          const rightSidebar = document.querySelector('.right-sidebar');
          const rightCover = document.getElementById('rightCover');
          const rightTitle = document.getElementById('rightTitle');
          const rightArtist = document.getElementById('rightArtist');
          
          if (rightSidebar) {
            rightSidebar.style.display = 'block';
            setTimeout(() => {
              rightSidebar.style.opacity = '1';
              rightSidebar.style.transform = 'translateX(0)';
            }, 10);
          }
          if (rightCover) rightCover.src = song.cover;
          if (rightTitle) rightTitle.textContent = song.title;
          if (rightArtist) rightArtist.textContent = song.artist;
          
          // Update liked state
          if (state.isLiked) {
            heartBtn.classList.add('liked');
            if (rightHeartBtn) {
              rightHeartBtn.classList.add('liked');
              const rightIcon = rightHeartBtn.querySelector('i');
              if (rightIcon) rightIcon.className = 'fas fa-heart';
            }
          }
          
          // Update queue display
          updateQueueDisplay();
          
          // Set up audio to seek when it's ready
          audio.src = song.src;
          audio.addEventListener('loadedmetadata', function onMetadataLoaded() {
            audio.currentTime = state.playbackTime || 0;
            audio.removeEventListener('loadedmetadata', onMetadataLoaded);
          }, { once: true });
          
          // Update active card
          document.querySelectorAll('.song-card').forEach(c => c.classList.remove('active'));
          const activeCard = document.querySelector(`.song-card[data-index="${state.currentIndex}"]`);
          if (activeCard) {
            activeCard.classList.add('active');
          }
        }
      }
    }
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

  // Update heart button state based on liked songs
  const currentSong = songs[index];
  if (currentSong && likedSongIds.has(currentSong.id)) {
    heartBtn.classList.add('liked');
    if (rightHeartBtn) {
      rightHeartBtn.classList.add('liked');
      const rightIcon = rightHeartBtn.querySelector('i');
      if (rightIcon) rightIcon.className = 'fas fa-heart';
    }
  } else {
    heartBtn.classList.remove('liked');
    if (rightHeartBtn) {
      rightHeartBtn.classList.remove('liked');
      const rightIcon = rightHeartBtn.querySelector('i');
      if (rightIcon) rightIcon.className = 'far fa-heart';
    }
  }
  
  // Sync right volume bar
  if (rightVolumeBar) {
    rightVolumeBar.value = volumeBar.value;
  }
  
  // Save the new state
  saveStateToLocalStorage();
}

function updatePlayIcon() {
  playIcon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
  if (rightPlayBtn) {
    const rightPlayIcon = rightPlayBtn.querySelector('i');
    if (rightPlayIcon) {
      rightPlayIcon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
    }
  }
  // Update playlist play button if it exists
  const playlistPlayBtn = document.getElementById('playlistPlayBtn');
  if (playlistPlayBtn) {
    const playlistPlayIcon = playlistPlayBtn.querySelector('i');
    if (playlistPlayIcon) {
      // Check if current song is in the current playlist view
      const currentPlaylistViewType = document.querySelector('.playlist-header')?.dataset.playlistType;
      if (currentPlaylistViewType) {
        let playlistSongsToCheck = [];
        if (currentPlaylistViewType === 'liked') {
          playlistSongsToCheck = songs.filter(s => likedSongIds.has(s.id));
        } else {
          const playlist = playlists.find(p => p.id === currentPlaylistViewType);
          if (playlist) playlistSongsToCheck = playlist.songs;
        }
        const currentSong = songs[currentIndex];
        const isCurrentSongInViewPlaylist = playlistSongsToCheck.some(s => s.id === currentSong.id);
        
        if (isCurrentSongInViewPlaylist && isPlaying) {
          playlistPlayIcon.className = 'fas fa-pause';
        } else {
          playlistPlayIcon.className = 'fas fa-play';
        }
      }
    }
  }
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

// Right Sidebar Play Button
if (rightPlayBtn) {
  rightPlayBtn.addEventListener('click', () => {
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
}

// Right Sidebar Heart Button
if (rightHeartBtn) {
  rightHeartBtn.addEventListener('click', () => {
    const currentSong = songs[currentIndex];
    if (!currentSong) return;
    
    // Toggle liked status
    if (likedSongIds.has(currentSong.id)) {
      likedSongIds.delete(currentSong.id);
      rightHeartBtn.classList.remove('liked');
      const rightIcon = rightHeartBtn.querySelector('i');
      if (rightIcon) rightIcon.className = 'far fa-heart';
      heartBtn.classList.remove('liked');
    } else {
      likedSongIds.add(currentSong.id);
      rightHeartBtn.classList.add('liked');
      const rightIcon = rightHeartBtn.querySelector('i');
      if (rightIcon) rightIcon.className = 'fas fa-heart';
      heartBtn.classList.add('liked');
    }
    
    saveStateToLocalStorage();
  });
}

// Right Sidebar Previous Button
if (rightPrevBtn) {
  rightPrevBtn.addEventListener('click', () => {
    if (songs.length === 0) return;
    const prevIndex = getPrevSongIndex();
    if (prevIndex !== -1) {
      playSong(prevIndex);
    }
  });
}

// Right Sidebar Next Button
if (rightNextBtn) {
  rightNextBtn.addEventListener('click', () => {
    if (songs.length === 0) return;
    const nextIndex = getNextSongIndex();
    if (nextIndex !== -1) {
      playSong(nextIndex);
    }
  });
}

prevBtn.addEventListener('click', () => {
  if (songs.length === 0) return;
  const prevIndex = getPrevSongIndex();
  if (prevIndex !== -1) {
    playSong(prevIndex);
  }
});

nextBtn.addEventListener('click', () => {
  if (songs.length === 0) return;
  const nextIndex = getNextSongIndex();
  if (nextIndex !== -1) {
    playSong(nextIndex);
  }
});

// Helper function to get next song index
function getNextSongIndex() {
  // Priority: Queue first
  if (queue.length > 0) {
    const nextSongFromQueue = queue.shift();
    updateQueueDisplay();
    return songs.findIndex(s => s.id === nextSongFromQueue.id);
  }

  // If we're playing a playlist
  if (currentPlaylistType && currentPlaylistSongs.length > 0) {
    const currentSong = songs[currentIndex];
    let currentPos = currentPlaylistSongs.findIndex(s => s.id === currentSong.id);
    
    if (isShuffle) {
      let randomPos;
      do {
        randomPos = Math.floor(Math.random() * currentPlaylistSongs.length);
      } while (randomPos === currentPos && currentPlaylistSongs.length > 1);
      const nextSong = currentPlaylistSongs[randomPos];
      return songs.findIndex(s => s.id === nextSong.id);
    } else {
      const nextPos = (currentPos + 1) % currentPlaylistSongs.length;
      const nextSong = currentPlaylistSongs[nextPos];
      return songs.findIndex(s => s.id === nextSong.id);
    }
  }

  // Normal behavior (all songs)
  if (isShuffle) {
    return Math.floor(Math.random() * songs.length);
  } else {
    return (currentIndex + 1) % songs.length;
  }
}

// Helper function to get previous song index
function getPrevSongIndex() {
  // If we're playing a playlist
  if (currentPlaylistType && currentPlaylistSongs.length > 0) {
    const currentSong = songs[currentIndex];
    let currentPos = currentPlaylistSongs.findIndex(s => s.id === currentSong.id);
    
    if (isShuffle) {
      let randomPos;
      do {
        randomPos = Math.floor(Math.random() * currentPlaylistSongs.length);
      } while (randomPos === currentPos && currentPlaylistSongs.length > 1);
      const prevSong = currentPlaylistSongs[randomPos];
      return songs.findIndex(s => s.id === prevSong.id);
    } else {
      const prevPos = (currentPos - 1 + currentPlaylistSongs.length) % currentPlaylistSongs.length;
      const prevSong = currentPlaylistSongs[prevPos];
      return songs.findIndex(s => s.id === prevSong.id);
    }
  }

  // Normal behavior (all songs)
  return (currentIndex - 1 + songs.length) % songs.length;
}

shuffleBtn.addEventListener('click', () => {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle('active', isShuffle);
  // Update playlist shuffle button if it exists
  const playlistShuffleBtn = document.getElementById('playlistShuffleBtn');
  if (playlistShuffleBtn) {
    playlistShuffleBtn.style.color = isShuffle ? '#1DB954' : '#b3b3b3';
  }
});

repeatBtn.addEventListener('click', () => {
  isRepeat = !isRepeat;
  repeatBtn.classList.toggle('active', isRepeat);
  audio.loop = isRepeat;
});

heartBtn.addEventListener('click', () => {
  const currentSong = songs[currentIndex];
  if (!currentSong) return;
  
  // Toggle liked status
  if (likedSongIds.has(currentSong.id)) {
    likedSongIds.delete(currentSong.id);
    heartBtn.classList.remove('liked');
    if (rightHeartBtn) {
      rightHeartBtn.classList.remove('liked');
      const rightIcon = rightHeartBtn.querySelector('i');
      if (rightIcon) rightIcon.className = 'far fa-heart';
    }
  } else {
    likedSongIds.add(currentSong.id);
    heartBtn.classList.add('liked');
    if (rightHeartBtn) {
      rightHeartBtn.classList.add('liked');
      const rightIcon = rightHeartBtn.querySelector('i');
      if (rightIcon) rightIcon.className = 'fas fa-heart';
    }
  }
  
  saveStateToLocalStorage();
});

// ========== PROGRESS ==========
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  
  // Update bottom player
  progressBar.value = pct;
  currentTimeEl.textContent = formatTime(audio.currentTime);
  totalTimeEl.textContent = formatTime(audio.duration);
  
  // Update right sidebar
  if (rightProgressBar) rightProgressBar.value = pct;
  if (rightCurrentTime) rightCurrentTime.textContent = formatTime(audio.currentTime);
  if (rightTotalTime) rightTotalTime.textContent = formatTime(audio.duration);
});

progressBar.addEventListener('input', () => {
  if (!audio.duration) return;
  audio.currentTime = (progressBar.value / 100) * audio.duration;
  if (rightProgressBar) rightProgressBar.value = progressBar.value;
});

if (rightProgressBar) {
  rightProgressBar.addEventListener('input', () => {
    if (!audio.duration) return;
    audio.currentTime = (rightProgressBar.value / 100) * audio.duration;
    progressBar.value = rightProgressBar.value;
  });
}

// ========== VOLUME ==========
volumeBar.addEventListener('input', () => {
  audio.volume = volumeBar.value / 100;
  if (rightVolumeBar) rightVolumeBar.value = volumeBar.value;
});

if (rightVolumeBar) {
  rightVolumeBar.addEventListener('input', () => {
    audio.volume = rightVolumeBar.value / 100;
    volumeBar.value = rightVolumeBar.value;
  });
}

// ========== SONG END ==========
audio.addEventListener('ended', () => {
  if (isRepeat) return;
  
  const nextIndex = getNextSongIndex();
  if (nextIndex !== -1) {
    playSong(nextIndex);
  }
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
    card.dataset.index = originalIndex;

    card.innerHTML = `
      <img src="${song.cover}" alt="${song.title}">
      <div class="card-title">${song.title}</div>
      <div class="card-artist">${song.artist}</div>
      <div class="play-overlay">
        <i class="fas fa-play"></i>
      </div>
      <button class="add-to-queue-btn" title="Add to Queue">
        <i class="fas fa-plus"></i>
      </button>
      <button class="add-to-playlist-btn" title="Add to Playlist">
        <i class="fas fa-list"></i>
      </button>
    `;

    // Play on card click
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.add-to-queue-btn') && !e.target.closest('.add-to-playlist-btn')) {
        // Reset playlist state since we're playing from home
        currentPlaylistType = null;
        currentPlaylistSongs = [];
        playSong(originalIndex);
      }
    });

    // Add to Queue button
    const addBtn = card.querySelector('.add-to-queue-btn');
    addBtn.addEventListener('click', (e) => {
      e.stopImmediatePropagation();
      addToQueue(song);
    });

    // Add to Playlist button
    const addPlaylistBtn = card.querySelector('.add-to-playlist-btn');
    addPlaylistBtn.addEventListener('click', (e) => {
      e.stopImmediatePropagation();
      openAddToPlaylistModal(song);
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
      saveStateToLocalStorage();
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
  // Check if song already exists in queue
  const songExists = queue.some(s => s.id === song.id);
  if (songExists) {
    showToast(`"${song.title}" is already in queue`);
    return;
  }
  queue.push(song);
  showToast(`"${song.title}" added to queue`);
  updateQueueDisplay();
  saveStateToLocalStorage();
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

// ========== SAVE STATE LISTENERS ==========
// Save state periodically
setInterval(saveStateToLocalStorage, 5000);

// Save state when page is closed
window.addEventListener('beforeunload', saveStateToLocalStorage);

// Save state on important events
audio.addEventListener('pause', saveStateToLocalStorage);
audio.addEventListener('play', saveStateToLocalStorage);
volumeBar.addEventListener('input', saveStateToLocalStorage);
if (rightVolumeBar) {
  rightVolumeBar.addEventListener('input', saveStateToLocalStorage);
}
heartBtn.addEventListener('click', saveStateToLocalStorage);
if (rightHeartBtn) {
  rightHeartBtn.addEventListener('click', saveStateToLocalStorage);
}

// ========== INIT ==========
loadSongs();
