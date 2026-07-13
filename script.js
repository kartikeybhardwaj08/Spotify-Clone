// APP STATE (Saara data yahan store hota hai)
let songs = [];
let currentIndex = 0;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let queue = [];
let savedPlaybackTime = 0;
let playlists = [];
let currentEditingPlaylistId = null;
let currentAddingSong = null;
let likedSongIds = new Set();
let currentPlaylistType = null;
let currentPlaylistSongs = [];

// Loader hatane ke liye button listener
const gotToWebbtn = document.getElementById("go-to-web");
gotToWebbtn.addEventListener("click", () => {
  document.querySelector(".loader-div").style.transform = "translateY(-100%)";
  setTimeout(() => {
    document.querySelector(".loader-div").style.display = "none";
  }, 2000);
});

// LOCAL STORAGE FUNCTIONS
function saveStateToLocalStorage() {
  const state = {
    currentIndex,
    playbackTime: audio.currentTime,
    volume: volumeBar.value,
    isShuffle,
    isRepeat,
    queue,
    playlists,
    likedSongIds: Array.from(likedSongIds),
  };
  localStorage.setItem("spotifyCloneState", JSON.stringify(state));
}

function loadStateFromLocalStorage() {
  const savedState = localStorage.getItem("spotifyCloneState");
  if (savedState) {
    const state = JSON.parse(savedState);
    currentIndex = state.currentIndex || 0;
    savedPlaybackTime = state.playbackTime || 0;
    isShuffle = state.isShuffle || false;
    isRepeat = state.isRepeat || false;
    queue = state.queue || [];
    playlists = state.playlists || [];
    likedSongIds = new Set(state.likedSongIds || []);

    shuffleBtn.classList.toggle("active", isShuffle);
    repeatBtn.classList.toggle("active", isRepeat);
    audio.loop = isRepeat;

    if (volumeBar) volumeBar.value = state.volume || 100;
    if (rightVolumeBar) rightVolumeBar.value = state.volume || 100;
    audio.volume = (state.volume || 100) / 100;
  } else {
    if (volumeBar) volumeBar.value = 100;
    if (rightVolumeBar) rightVolumeBar.value = 100;
    audio.volume = 1;
  }
}

const audio = document.getElementById("audioPlayer");
const playBtn = document.getElementById("playBtn");
const playIcon = document.getElementById("playIcon");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const repeatBtn = document.getElementById("repeatBtn");
const progressBar = document.getElementById("progressBar");
const volumeBar = document.getElementById("volumeBar");
const currentTimeEl = document.getElementById("currentTime");
const totalTimeEl = document.getElementById("totalTime");
const currentCover = document.getElementById("currentCover");
const currentTitle = document.getElementById("currentTitle");
const currentArtist = document.getElementById("currentArtist");
const heartBtn = document.getElementById("heartBtn");
const searchInput = document.getElementById("searchInput");

audio.volume = 1;
let searchTimer;

// KEYBOARD SHORTCUTS(Space to play, arrows to skip)
document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

  if (e.code === "Space") {
    e.preventDefault();
    if (songs.length === 0) return;

    if (isPlaying) {
      audio.pause();
      isPlaying = false;
    } else {
      audio.play();
      isPlaying = true;
    }
    updatePlayIcon();
  } else if (e.code === "ArrowRight") {
    e.preventDefault();
    if (songs.length === 0) return;
    const nextIndex = nextSongIndex();
    if (nextIndex !== -1) playSong(nextIndex);
  } else if (e.code === "ArrowLeft") {
    e.preventDefault();
    if (songs.length === 0) return;
    const prevIndex = prevSongIndex();
    if (prevIndex !== -1) playSong(prevIndex);
  }

  // Like shortcut: Ctrl + Shift + L
  if (e.ctrlKey && e.shiftKey && e.code === "KeyL") {
    const currentSong = songs[currentIndex];
    if (!currentSong) return;

    if (likedSongIds.has(currentSong.id)) {
      likedSongIds.delete(currentSong.id);
      heartBtn.classList.remove("liked");
      if (rightHeartBtn) {
        rightHeartBtn.classList.remove("liked");
        const rightIcon = rightHeartBtn.querySelector("i");
        if (rightIcon) rightIcon.className = "far fa-heart";
      }
    } else {
      likedSongIds.add(currentSong.id);
      heartBtn.classList.add("liked");
      if (rightHeartBtn) {
        rightHeartBtn.classList.add("liked");
        const rightIcon = rightHeartBtn.querySelector("i");
        if (rightIcon) rightIcon.className = "fas fa-heart";
      }
    }
    saveStateToLocalStorage();
  }
});

// Right sidebar links
const rightHeartBtn = document.getElementById("rightHeartBtn");
const rightPlayBtn = document.getElementById("rightPlayBtn");
const rightPrevBtn = document.getElementById("rightPrevBtn");
const rightNextBtn = document.getElementById("rightNextBtn");
const rightProgressBar = document.getElementById("rightProgressBar");
const rightVolumeBar = document.getElementById("rightVolumeBar");
const rightCurrentTime = document.getElementById("rightCurrentTime");
const rightTotalTime = document.getElementById("rightTotalTime");

// Playlist
const createPlaylistBtn = document.getElementById("create-playlist");
const playlistModal = document.getElementById("playlistModal");
const closeModalBtn = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const saveBtn = document.getElementById("saveBtn");
const playlistNameInput = document.getElementById("playlistNameInput");
const modalTitle = document.getElementById("modalTitle");
const addToPlaylistModal = document.getElementById("addToPlaylistModal");
const closeAddToPlaylistModal = document.getElementById(
  "closeAddToPlaylistModal",
);
const playlistOptions = document.getElementById("playlistOptions");
const libraryList = document.getElementById("libraryList");
//for random songs
function getRandomSongs(arr, count) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function renderRecentPlaylists() {
  const row = document.getElementById("recentPlaylistsRow");
  if (!row) return;
  row.innerHTML = "";

  // Create Card element
  const createCard = document.createElement("div");
  createCard.className = "recent-card";
  createCard.innerHTML = `
    <div class="create-playlist-icon"><i class="fas fa-plus"></i></div>
    <span>Create Playlist</span>
  `;
  createCard.addEventListener("click", () => {
    currentEditingPlaylistId = null;
    modalTitle.textContent = "Create New Playlist";
    playlistNameInput.value = "";
    saveBtn.textContent = "Create";
    playlistModal.classList.add("show");
  });
  row.appendChild(createCard);

  const likedCard = document.createElement("div");
  likedCard.className = "recent-card";
  likedCard.innerHTML = `
    <div class="liked-icon"><i class="fas fa-heart"></i></div>
    <span>Liked Songs</span>
  `;
  likedCard.addEventListener("click", () => openPlaylistView("liked"));
  row.appendChild(likedCard);

  playlists.forEach((playlist) => {
    const cover =
      playlist.songs.length > 0
        ? `<img src="${playlist.songs[0].cover}" alt="${playlist.name}" onerror="this.src='https://picsum.photos/seed/${playlist.id}/60/60'" />`
        : `<div class="empty-playlist-cover"><i class="fas fa-music"></i></div>`;

    const card = document.createElement("div");
    card.className = "recent-card";
    card.innerHTML = `${cover}<span>${playlist.name}</span>`;
    card.addEventListener("click", () => openPlaylistView(playlist.id));
    row.appendChild(card);
  });
}

function attachRecentCardListeners() {
  renderRecentPlaylists();
}

function renderLibraryList() {
  libraryList.innerHTML = "";

  const likedItem = document.createElement("li");
  likedItem.className = "library-item liked";
  likedItem.innerHTML = `
    <div class="liked-icon"><i class="fas fa-heart"></i></div>
    <div class="lib-info">
      <span class="lib-name">Liked Songs</span>
      <span class="lib-meta">Playlist</span>
    </div>
  `;
  likedItem.addEventListener("click", () => openPlaylistView("liked"));
  libraryList.appendChild(likedItem);

  playlists.forEach((playlist) => {
    const item = document.createElement("li");
    item.className = "library-item";
    const cover =
      playlist.songs.length > 0
        ? playlist.songs[0].cover
        : "https://picsum.photos/seed/" + playlist.id + "/300/300";
    item.innerHTML = `
      <img src="${cover}" alt="${playlist.name}" />
      <div class="lib-info lib-info-flex">
        <span class="lib-name">${playlist.name}</span>
        <span class="lib-meta">Playlist • ${playlist.songs.length} songs</span>
      </div>
      <div class="library-item-actions library-item-actions-flex">
        <button class="edit-playlist-btn" data-id="${playlist.id}" title="Edit">
          <i class="fas fa-pencil-alt"></i>
        </button>
        <button class="delete-playlist-btn" data-id="${playlist.id}" title="Delete">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `;

    item.addEventListener("click", (e) => {
      if (
        !e.target.closest(".edit-playlist-btn") &&
        !e.target.closest(".delete-playlist-btn")
      ) {
        openPlaylistView(playlist.id);
      }
    });

    item.querySelector(".edit-playlist-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      openEditPlaylistModal(playlist.id);
    });
    item
      .querySelector(".delete-playlist-btn")
      .addEventListener("click", (e) => {
        e.stopPropagation();
        deletePlaylist(playlist.id);
      });
    libraryList.appendChild(item);
  });
}

function createPlaylist(name) {
  const newPlaylist = { id: Date.now(), name, songs: [] };
  playlists.push(newPlaylist);
  saveStateToLocalStorage();
  renderLibraryList();
  renderRecentPlaylists();
}

function openEditPlaylistModal(playlistId) {
  const playlist = playlists.find((p) => p.id === playlistId);
  if (!playlist) return;
  currentEditingPlaylistId = playlistId;
  modalTitle.textContent = "Edit Playlist";
  playlistNameInput.value = playlist.name;
  saveBtn.textContent = "Save";
  playlistModal.classList.add("show");
}

function updatePlaylistName(playlistId, newName) {
  const playlist = playlists.find((p) => p.id === playlistId);
  if (!playlist) return;
  playlist.name = newName;
  saveStateToLocalStorage();
  renderLibraryList();
}

function deletePlaylist(playlistId) {
  if (!confirm("Are you sure you want to delete this playlist?")) return;
  playlists = playlists.filter((p) => p.id !== playlistId);
  saveStateToLocalStorage();
  renderLibraryList();
  renderRecentPlaylists();
}

function openAddToPlaylistModal(song) {
  currentAddingSong = song;
  playlistOptions.innerHTML = "";

  const likedOption = document.createElement("div");
  likedOption.className = "playlist-option";
  likedOption.innerHTML = `
    <div class="liked-icon"><i class="fas fa-heart"></i></div>
    <span>Liked Songs</span>
  `;
  likedOption.addEventListener("click", () => {
    if (likedSongIds.has(song.id)) {
      showToast("Song already liked");
    } else {
      likedSongIds.add(song.id);
      saveStateToLocalStorage();
      renderRecentPlaylists();
      showToast("Added to Liked Songs");
    }
    addToPlaylistModal.classList.remove("show");
  });
  playlistOptions.appendChild(likedOption);

  playlists.forEach((playlist) => {
    const option = document.createElement("div");
    option.className = "playlist-option";
    const cover =
      playlist.songs.length > 0
        ? playlist.songs[0].cover
        : "https://picsum.photos/seed/" + playlist.id + "/300/300";
    option.innerHTML = `
      <img src="${cover}" alt="${playlist.name}" />
      <span>${playlist.name}</span>
    `;
    option.addEventListener("click", () =>
      addSongToPlaylist(playlist.id, song),
    );
    playlistOptions.appendChild(option);
  });

  addToPlaylistModal.classList.add("show");
}

function addSongToPlaylist(playlistId, song) {
  const playlist = playlists.find((p) => p.id === playlistId);
  if (!playlist) return;

  const exists = playlist.songs.some((s) => s.id === song.id);
  if (exists) {
    showToast("Song already in playlist");
  } else {
    playlist.songs.push(song);
    saveStateToLocalStorage();
    renderLibraryList();
    renderRecentPlaylists();
    showToast("Added to " + playlist.name);
  }
  addToPlaylistModal.classList.remove("show");
}

function openPlaylistView(playlistId) {
  const sidebar = document.querySelector(".left-sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  if (sidebar) {
    sidebar.style.transition = "none";
    sidebar.classList.remove("open");
    sidebar.classList.add("left-sidebar-hidden");
    setTimeout(() => {
      sidebar.style.transition = "";
    }, 50);
  }
  if (overlay) overlay.classList.remove("show");
  document.body.style.overflow = "";

  const mc = document.getElementById("mainContent");
  if (mc) mc.classList.add("playlist-mode");

  _renderPlaylistView(playlistId);
}

function _renderPlaylistView(playlistId) {
  let playlistSongs = [];
  let playlistName = "All Songs";

  if (playlistId === "liked") {
    playlistName = "Liked Songs";
    playlistSongs = songs.filter((s) => likedSongIds.has(s.id));
  } else {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;
    playlistName = playlist.name;
    playlistSongs = [...playlist.songs];
  }

  const mainContent = document.getElementById("mainContent");

  const accentColor =
    playlistId === "liked"
      ? "#450af5"
      : playlistSongs.length > 0
        ? "#c0392b"
        : "#1DB954";

  const coverHTML =
    playlistId === "liked"
      ? `<div class="pl-cover-liked"><i class="fas fa-heart"></i></div>`
      : playlistSongs.length > 0
        ? `<img class="pl-cover-img" src="${playlistSongs[0].cover}" onerror="this.src='https://picsum.photos/seed/pl/200/200'" />`
        : `<div class="pl-cover-empty"><i class="fas fa-music"></i></div>`;

  mainContent.innerHTML = `
    <div class="pl-hero" style="--accent: ${accentColor};">
      <div class="pl-hero-bg"></div>
      <div class="pl-hero-content">
        <div class="pl-cover-wrap">${coverHTML}</div>
        <div class="pl-meta">
          <span class="pl-type-label">Playlist</span>
          <h1 class="pl-title">${playlistName}</h1>
          <p class="pl-songcount">${playlistSongs.length} song${playlistSongs.length !== 1 ? "s" : ""}</p>
        </div>
      </div>
      <div class="pl-controls">
        <button id="playlistPlayBtn" class="pl-play-btn">
          <i class="fas fa-play"></i>
        </button>
        <button id="playlistShuffleBtn" class="pl-shuffle-btn ${isShuffle ? "pl-shuffle-btn-active" : "pl-shuffle-btn-inactive"}">
          <i class="fas fa-shuffle"></i>
        </button>
        <span class="pl-duration-label">${playlistSongs.length} tracks</span>
      </div>
    </div>
    <div id="playlistSongsContainer" class="pl-songs-list"></div>
  `;

  const container = document.getElementById("playlistSongsContainer");

  if (playlistSongs.length === 0) {
    container.innerHTML =
      '<p class="playlist-empty-message">No songs yet. Add some!</p>';
  }

  playlistSongs.forEach((song, i) => {
    const row = document.createElement("div");
    row.className = "playlist-song-row";
    row.innerHTML = `
      <div class="playlist-song-number">${i + 1}</div>
      <img src="${song.cover}" onerror="this.src='https://picsum.photos/seed/${song.id}/48/48'" class="playlist-song-cover" />
      <div class="playlist-song-info">
        <p class="playlist-song-title">${song.title}</p>
        <p class="playlist-song-artist">${song.artist}</p>
      </div>
      <button class="remove-song-btn">
        <i class="fas fa-trash-alt"></i>
      </button>
    `;

    row.addEventListener("click", (e) => {
      if (e.target.closest(".remove-song-btn")) return;
      currentPlaylistType = playlistId;
      currentPlaylistSongs = playlistSongs;
      playSong(song.id);
    });

    row.querySelector(".remove-song-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      if (playlistId === "liked") {
        likedSongIds.delete(song.id);
      } else {
        const pl = playlists.find((p) => p.id === playlistId);
        if (pl) pl.songs = pl.songs.filter((s) => s.id !== song.id);
      }
      saveStateToLocalStorage();
      _renderPlaylistView(playlistId);
    });

    container.appendChild(row);
  });

  const playlistPlayBtn = document.getElementById("playlistPlayBtn");
  playlistPlayBtn.addEventListener("click", () => {
    if (playlistSongs.length === 0) return;
    const cur = songs[currentIndex];
    const inList = playlistSongs.some((s) => s.id === cur.id);
    if (inList && isPlaying) {
      audio.pause();
      isPlaying = false;
      updatePlayIcon();
    } else if (inList && !isPlaying) {
      audio.play();
      isPlaying = true;
      updatePlayIcon();
    } else {
      const idx = songs.findIndex((s) => s.id === playlistSongs[0].id);
      if (idx !== -1) {
        currentPlaylistType = playlistId;
        currentPlaylistSongs = playlistSongs;
        playSong(idx);
      }
    }
  });

  document
    .getElementById("playlistShuffleBtn")
    .addEventListener("click", function () {
      isShuffle = !isShuffle;
      shuffleBtn.classList.toggle("active", isShuffle);
      this.classList.toggle("pl-shuffle-btn-active", isShuffle);
      this.classList.toggle("pl-shuffle-btn-inactive", !isShuffle);
      currentPlaylistType = playlistId;
      currentPlaylistSongs = playlistSongs;
    });

  const backBtn = document.createElement("button");
  backBtn.className = "pl-back-btn";
  backBtn.setAttribute("aria-label", "Back to home");
  backBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Back';
  backBtn.addEventListener("click", restoreHomeView);
  mainContent.insertBefore(backBtn, mainContent.firstChild);

  mainContent.scrollTop = 0;
  addBackToTopButton();
}

createPlaylistBtn.addEventListener("click", () => {
  currentEditingPlaylistId = null;
  modalTitle.textContent = "Create New Playlist";
  playlistNameInput.value = "";
  saveBtn.textContent = "Create";
  playlistModal.classList.add("show");
});

closeModalBtn.addEventListener("click", () =>
  playlistModal.classList.remove("show"),
);
cancelBtn.addEventListener("click", () =>
  playlistModal.classList.remove("show"),
);
closeAddToPlaylistModal.addEventListener("click", () =>
  addToPlaylistModal.classList.remove("show"),
);

playlistModal.addEventListener("click", (e) => {
  if (e.target === playlistModal) playlistModal.classList.remove("show");
});
addToPlaylistModal.addEventListener("click", (e) => {
  if (e.target === addToPlaylistModal)
    addToPlaylistModal.classList.remove("show");
});

saveBtn.addEventListener("click", () => {
  const name = playlistNameInput.value.trim();
  if (!name) return;

  if (currentEditingPlaylistId) {
    updatePlaylistName(currentEditingPlaylistId, name);
  } else {
    createPlaylist(name);
  }
  playlistModal.classList.remove("show");
});

// Time formatting (min:sec)
function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// skeleton cards while songs.json is loading (basically copied the youtube idea)
function renderSkeletons(containerId, count = 6) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement("div");
    skeleton.className = "skeleton-card";
    skeleton.innerHTML = `
      <div class="skeleton-cover"></div>
      <div class="skeleton-title"></div>
      <div class="skeleton-artist"></div>
    `;
    container.appendChild(skeleton);
  }
}

function attachScrollArrows(leftId, rightId, rowEl, amount = 300) {
  const l = document.getElementById(leftId);
  const r = document.getElementById(rightId);
  if (!l || !r || !rowEl) return;
  l.onclick = () => rowEl.scrollBy({ left: -amount, behavior: "smooth" });
  r.onclick = () => rowEl.scrollBy({ left: amount, behavior: "smooth" });
}

function renderCards(songList, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  if (songList.length === 0) {
    container.innerHTML = '<p class="loading-text">No songs found.</p>';
    return;
  }

  songList.forEach((song) => {
    const card = document.createElement("div");
    card.className = "song-card";
    card.dataset.songId = song.id;

    card.innerHTML = `
      <img src="${song.cover}" alt="${song.title}" loading="lazy"
        onerror="this.src='https://picsum.photos/seed/${song.id}/300/300'"/>
      <div class="card-title">${song.title}</div>
      <div class="card-artist">${song.artist}</div>
      <div class="play-overlay"><i class="fas fa-play"></i></div>
      <button class="add-to-queue-btn" title="Add to Queue" aria-label="Add to queue">
        <i class="fas fa-plus"></i>
      </button>
      <button class="add-to-playlist-btn" title="Add to Playlist" aria-label="Add to playlist">
        <i class="fas fa-list"></i>
      </button>
    `;

    card.addEventListener("click", (e) => {
      if (
        !e.target.closest(".add-to-queue-btn") &&
        !e.target.closest(".add-to-playlist-btn")
      ) {
        currentPlaylistType = null;
        currentPlaylistSongs = [];
        playSong(song.id);
      }
    });

    card.querySelector(".add-to-queue-btn").addEventListener("click", (e) => {
      e.stopImmediatePropagation();
      addToQueue(song);
    });

    card
      .querySelector(".add-to-playlist-btn")
      .addEventListener("click", (e) => {
        e.stopImmediatePropagation();
        openAddToPlaylistModal(song);
      });

    container.appendChild(card);
  });
  observeNewCards();
}

let _homeHTML = null;

function snapshotHomeView() {
  const mc = document.getElementById("mainContent");
  if (mc) _homeHTML = mc.innerHTML;
}

function restoreHomeView() {
  const mc = document.getElementById("mainContent");
  if (!mc || !_homeHTML) return;

  mc.classList.remove("playlist-mode");
  const sidebar = document.querySelector(".left-sidebar");
  if (sidebar) sidebar.classList.remove("left-sidebar-hidden");

  mc.innerHTML = _homeHTML;

  const nonAmvSongs = songs.filter((song) => !song.amv);
  renderCards(getRandomSongs(nonAmvSongs, 20), "recommendedRow");
  renderCards(songs, "hindiRow");

  const amvSongs = songs.filter((song) => song.amv === true);
  const amvSection = document.getElementById("amvSection");
  const amvRow = document.getElementById("amvRow");

  if (amvSongs.length > 0) {
    amvSection.classList.remove("section-hidden");
    amvSection.classList.add("section-visible");
    renderCards(amvSongs, "amvRow");
    attachScrollArrows("amvScrollLeft", "amvScrollRight", amvRow);
  }

  const phonkSongs = songs.filter((song) => song.phonk === true);
  const phonkSection = document.getElementById("phonkSection");
  const phonkRow = document.getElementById("phonkRow");

  if (phonkSongs.length > 0) {
    phonkSection.classList.remove("section-hidden");
    phonkSection.classList.add("section-visible");
    renderCards(phonkSongs, "phonkRow");
    attachScrollArrows("phonkScrollLeft", "phonkScrollRight", phonkRow);
  }

  document
    .querySelectorAll(".song-card")
    .forEach((c) => c.classList.remove("active"));
  const activeCard = document.querySelector(
    `.song-card[data-song-id="${currentIndex}"]`,
  );
  if (activeCard) activeCard.classList.add("active");

  document.querySelectorAll(".content-filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".content-filter")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  attachScrollArrows(
    "scrollLeft",
    "scrollRight",
    document.getElementById("hindiRow"),
  );
  attachScrollArrows(
    "recScrollLeft",
    "recScrollRight",
    document.getElementById("recommendedRow"),
  );

  attachRecentCardListeners();
  renderRecentPlaylists();
  addBackToTopButton();
}

function addBackToTopButton() {
  const mc = document.getElementById("mainContent");
  if (!mc) return;
  if (document.getElementById("backToTopBtn")) return;

  const button = document.createElement("button");
  button.id = "backToTopBtn";
  button.type = "button";
  button.className = "back-to-top-btn";
  button.textContent = "Back to Top";
  button.setAttribute("aria-label", "Back to Top");
  button.addEventListener("click", () => {
    mc.scrollTo({ top: 0, behavior: "smooth" });
  });

  mc.appendChild(button);
  observeBackToTopButton(button);
}

function observeBackToTopButton(button) {
  const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("fade-in", entry.isIntersecting);
    });
  }, observerOptions);

  observer.observe(button);
}

async function fetchSongs() {
  const res = await fetch("songs.json");
  songs = (await res.json()).map((song) => ({
    ...song,
    phonk: song.phonk ?? false,
  }));
}

function renderAllSections() {
  const nonAmvSongs = songs.filter((song) => !song.amv);
  renderCards(getRandomSongs(nonAmvSongs, 20), "recommendedRow");
  renderCards(songs, "hindiRow");

  const amvSongs = songs.filter((song) => song.amv === true);
  const amvSection = document.getElementById("amvSection");
  const amvRow = document.getElementById("amvRow");
  if (amvSongs.length > 0) {
    amvSection.classList.remove("section-hidden");
    amvSection.classList.add("section-visible");
    renderCards(amvSongs, "amvRow");
    attachScrollArrows("amvScrollLeft", "amvScrollRight", amvRow);
  } else {
    amvSection.classList.remove("section-visible");
    amvSection.classList.add("section-hidden");
  }

  const phonkSongs = songs.filter((song) => song.phonk === true);
  const phonkSection = document.getElementById("phonkSection");
  const phonkRow = document.getElementById("phonkRow");
  if (phonkSongs.length > 0) {
    phonkSection.classList.remove("section-hidden");
    phonkSection.classList.add("section-visible");
    renderCards(phonkSongs, "phonkRow");
    attachScrollArrows("phonkScrollLeft", "phonkScrollRight", phonkRow);
  } else {
    phonkSection.classList.remove("section-visible");
    phonkSection.classList.add("section-hidden");
  }

  snapshotHomeView();
  attachRecentCardListeners();
  renderLibraryList();
  renderRecentPlaylists();
  addBackToTopButton();

  attachScrollArrows(
    "scrollLeft",
    "scrollRight",
    document.getElementById("hindiRow"),
  );
  attachScrollArrows(
    "recScrollLeft",
    "recScrollRight",
    document.getElementById("recommendedRow"),
  );
}

function initSavedState() {
  loadStateFromLocalStorage();

  if (songs.length === 0) return;
  if (currentIndex < 0 || currentIndex >= songs.length) return;

  const song = songs[currentIndex];
  if (!song) return;

  currentCover.src = song.cover;
  currentCover.onerror = () => {
    currentCover.src = `https://picsum.photos/seed/${song.id}/300/300`;
  };
  currentTitle.textContent = song.title;
  currentArtist.textContent = song.artist;

  const rightSidebar = document.querySelector(".right-sidebar");
  const rightCover = document.getElementById("rightCover");
  const rightTitle = document.getElementById("rightTitle");
  const rightArtist = document.getElementById("rightArtist");
  if (rightSidebar) {
    rightSidebar.style.display = "block";
    setTimeout(() => {
      rightSidebar.style.opacity = "1";
      rightSidebar.style.transform = "translateX(0)";
      if (window._applyRightSidebarState) window._applyRightSidebarState();
    }, 10);
  }
  if (rightCover) rightCover.src = song.cover;
  if (rightTitle) rightTitle.textContent = song.title;
  if (rightArtist) rightArtist.textContent = song.artist;

  if (likedSongIds.has(song.id)) {
    heartBtn.classList.add("liked");
    if (rightHeartBtn) {
      rightHeartBtn.classList.add("liked");
      const rightIcon = rightHeartBtn.querySelector("i");
      if (rightIcon) rightIcon.className = "fas fa-heart";
    }
  }

  refreshQueue();
  audio.src = song.src;
  audio.addEventListener(
    "loadedmetadata",
    function onMetadataLoaded() {
      audio.currentTime = savedPlaybackTime || 0;
      audio.removeEventListener("loadedmetadata", onMetadataLoaded);
    },
    { once: true },
  );

  document
    .querySelectorAll(".song-card")
    .forEach((c) => c.classList.remove("active"));
  const activeCard = document.querySelector(
    `.song-card[data-song-id="${song.id}"]`,
  );
  if (activeCard) activeCard.classList.add("active");
}

async function loadSongs() {
  const wrap = document.getElementById("recommendedRow");
  ["recommendedRow", "hindiRow", "amvRow", "phonkRow"].forEach((section) =>
    renderSkeletons(section, 6),
  );

  try {
    await fetchSongs();
    if (!songs.length) {
      showToast("No songs found");
      return;
    }
    renderAllSections();
    initSavedState();
    refreshQueue();
  } catch (error) {
    if (wrap) {
      wrap.innerHTML =
        '<p class="loading-text">Songs load nahi hue. Live Server use karo.</p>';
    }
    showToast("Songs load failed");
  }
}

function playSong(input) {
  const index =
    typeof input === "number" ? input : songs.findIndex((s) => s.id === input);
  if (index < 0 || index >= songs.length) return;

  currentIndex = index;
  const song = songs[currentIndex];
  // console.log(currentIndex);

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

  try {
    document.title = `${song.title} • Spotify Clone`;
  } catch (e) {
    /* Tab bar title fail safe */
  }

  if ("mediaSession" in navigator) {
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist,
        artwork: [{ src: song.cover }],
      });
    } catch (e) {
      console.error("Failed to set media session metadata:", e);
    }
  }

  const rightSidebar = document.querySelector(".right-sidebar");
  const rightCover = document.getElementById("rightCover");
  const rightTitle = document.getElementById("rightTitle");
  const rightArtist = document.getElementById("rightArtist");

  if (rightSidebar) {
    rightSidebar.style.display = "block";
    setTimeout(() => {
      rightSidebar.style.opacity = "1";
      rightSidebar.style.transform = "translateX(0)";
      if (window._applyRightSidebarState) window._applyRightSidebarState();
    }, 10);
  }

  if (rightCover) rightCover.src = song.cover;
  if (rightTitle) rightTitle.textContent = song.title;
  if (rightArtist) rightArtist.textContent = song.artist;

  refreshQueue();

  let nextSong;
  if (isShuffle) {
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * songs.length);
    } while (randomIndex === currentIndex && songs.length > 1);
    nextSong = songs[randomIndex];
  } else {
    nextSong = songs[(currentIndex + 1) % songs.length];
  }

  const queueCover = document.getElementById("queueCover");
  const queueTitle = document.getElementById("queueTitle");
  const queueArtist = document.getElementById("queueArtist");

  if (queueCover) queueCover.src = nextSong.cover;
  if (queueTitle) queueTitle.textContent = nextSong.title;
  if (queueArtist) queueArtist.textContent = nextSong.artist;

  document
    .querySelectorAll(".song-card")
    .forEach((c) => c.classList.remove("active"));
  const currentSongId = songs[currentIndex].id;
  const activeCard = document.querySelector(
    `.song-card[data-song-id="${currentSongId}"]`,
  );
  if (activeCard) {
    activeCard.classList.add("active");
    activeCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  const currentSong = songs[index];
  if (currentSong && likedSongIds.has(currentSong.id)) {
    heartBtn.classList.add("liked");
    if (rightHeartBtn) {
      rightHeartBtn.classList.add("liked");
      const rightIcon = rightHeartBtn.querySelector("i");
      if (rightIcon) rightIcon.className = "fas fa-heart";
    }
  } else {
    heartBtn.classList.remove("liked");
    if (rightHeartBtn) {
      rightHeartBtn.classList.remove("liked");
      const rightIcon = rightHeartBtn.querySelector("i");
      if (rightIcon) rightIcon.className = "far fa-heart";
    }
  }

  if (rightVolumeBar) rightVolumeBar.value = volumeBar.value;
  saveStateToLocalStorage();
}

function updatePlayIcon() {
  playIcon.className = isPlaying ? "fas fa-pause" : "fas fa-play";

  if (rightPlayBtn) {
    const rightPlayIcon = rightPlayBtn.querySelector("i");
    if (rightPlayIcon)
      rightPlayIcon.className = isPlaying ? "fas fa-pause" : "fas fa-play";
  }

  const playlistPlayBtn = document.getElementById("playlistPlayBtn");
  if (!playlistPlayBtn) return;

  const playlistPlayIcon = playlistPlayBtn.querySelector("i");
  if (!playlistPlayIcon) return;

  const currentPlaylistViewType =
    document.querySelector(".playlist-header")?.dataset.playlistType;
  if (!currentPlaylistViewType) return;

  let playlistSongsToCheck = [];
  if (currentPlaylistViewType === "liked") {
    playlistSongsToCheck = songs.filter((s) => likedSongIds.has(s.id));
  } else {
    const playlist = playlists.find((p) => p.id === currentPlaylistViewType);
    if (playlist) playlistSongsToCheck = playlist.songs;
  }

  const currentSong = songs[currentIndex];
  const isCurrentSongInViewPlaylist = playlistSongsToCheck.some(
    (s) => s.id === currentSong.id,
  );
  playlistPlayIcon.className =
    isCurrentSongInViewPlaylist && isPlaying ? "fas fa-pause" : "fas fa-play";
}

playBtn.addEventListener("click", () => {
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

if (rightPlayBtn) {
  rightPlayBtn.addEventListener("click", () => {
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

if (rightHeartBtn) {
  rightHeartBtn.addEventListener("click", () => {
    const currentSong = songs[currentIndex];
    if (!currentSong) return;

    if (likedSongIds.has(currentSong.id)) {
      likedSongIds.delete(currentSong.id);
      rightHeartBtn.classList.remove("liked");
      const rightIcon = rightHeartBtn.querySelector("i");
      if (rightIcon) rightIcon.className = "far fa-heart";
      heartBtn.classList.remove("liked");
    } else {
      likedSongIds.add(currentSong.id);
      rightHeartBtn.classList.add("liked");
      const rightIcon = rightHeartBtn.querySelector("i");
      if (rightIcon) rightIcon.className = "fas fa-heart";
      heartBtn.classList.add("liked");
    }
    saveStateToLocalStorage();
  });
}

if (rightPrevBtn) {
  rightPrevBtn.addEventListener("click", () => {
    if (songs.length === 0) return;
    const prevIndex = prevSongIndex();
    if (prevIndex !== -1) playSong(prevIndex);
  });
}

if (rightNextBtn) {
  rightNextBtn.addEventListener("click", () => {
    if (songs.length === 0) return;
    const nextIndex = nextSongIndex();
    if (nextIndex !== -1) playSong(nextIndex);
  });
}

prevBtn.addEventListener("click", () => {
  if (songs.length === 0) return;
  const prevIndex = prevSongIndex();
  if (prevIndex !== -1) playSong(prevIndex);
});

nextBtn.addEventListener("click", () => {
  if (songs.length === 0) return;
  const nextIndex = nextSongIndex();
  if (nextIndex !== -1) playSong(nextIndex);
});

function nextSongIndex() {
  if (queue.length > 0) {
    const nextSongFromQueue = queue.shift();
    refreshQueue();
    return songs.findIndex((s) => s.id === nextSongFromQueue.id);
  }

  if (currentPlaylistType && currentPlaylistSongs.length > 0) {
    const currentSong = songs[currentIndex];
    const pos = currentPlaylistSongs.findIndex((s) => s.id === currentSong.id);

    if (isShuffle) {
      let randomPos;
      do {
        randomPos = Math.floor(Math.random() * currentPlaylistSongs.length);
      } while (randomPos === pos && currentPlaylistSongs.length > 1);
      return songs.findIndex(
        (s) => s.id === currentPlaylistSongs[randomPos].id,
      );
    }

    const nextPos = (pos + 1) % currentPlaylistSongs.length;
    return songs.findIndex((s) => s.id === currentPlaylistSongs[nextPos].id);
  }

  if (isShuffle) return Math.floor(Math.random() * songs.length);
  return (currentIndex + 1) % songs.length;
}

function prevSongIndex() {
  if (currentPlaylistType && currentPlaylistSongs.length > 0) {
    const currentSong = songs[currentIndex];
    const pos = currentPlaylistSongs.findIndex((s) => s.id === currentSong.id);

    if (isShuffle) {
      let randomPos;
      do {
        randomPos = Math.floor(Math.random() * currentPlaylistSongs.length);
      } while (randomPos === pos && currentPlaylistSongs.length > 1);
      return songs.findIndex(
        (s) => s.id === currentPlaylistSongs[randomPos].id,
      );
    }

    const prevPos =
      (pos - 1 + currentPlaylistSongs.length) % currentPlaylistSongs.length;
    return songs.findIndex((s) => s.id === currentPlaylistSongs[prevPos].id);
  }
  return (currentIndex - 1 + songs.length) % songs.length;
}

shuffleBtn.addEventListener("click", () => {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle("active", isShuffle);
  const playlistShuffleBtn = document.getElementById("playlistShuffleBtn");
  if (playlistShuffleBtn) {
    playlistShuffleBtn.style.color = isShuffle ? "#1DB954" : "#b3b3b3";
  }
});

repeatBtn.addEventListener("click", () => {
  isRepeat = !isRepeat;
  repeatBtn.classList.toggle("active", isRepeat);
  audio.loop = isRepeat;
});

heartBtn.addEventListener("click", () => {
  const currentSong = songs[currentIndex];
  if (!currentSong) return;
  if (likedSongIds.has(currentSong.id)) {
    likedSongIds.delete(currentSong.id);
    heartBtn.classList.remove("liked");
    if (rightHeartBtn) {
      rightHeartBtn.classList.remove("liked");
      const rightIcon = rightHeartBtn.querySelector("i");
      if (rightIcon) rightIcon.className = "far fa-heart";
    }
  } else {
    likedSongIds.add(currentSong.id);
    heartBtn.classList.add("liked");
    if (rightHeartBtn) {
      rightHeartBtn.classList.add("liked");
      const rightIcon = rightHeartBtn.querySelector("i");
      if (rightIcon) rightIcon.className = "fas fa-heart";
    }
  }
  saveStateToLocalStorage();
});

audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;

  progressBar.value = pct;
  currentTimeEl.textContent = formatTime(audio.currentTime);
  totalTimeEl.textContent = formatTime(audio.duration);

  if (rightProgressBar) rightProgressBar.value = pct;
  if (rightCurrentTime)
    rightCurrentTime.textContent = formatTime(audio.currentTime);
  if (rightTotalTime) rightTotalTime.textContent = formatTime(audio.duration);
});

progressBar.addEventListener("input", () => {
  if (!audio.duration) return;
  audio.currentTime = (progressBar.value / 100) * audio.duration;
  if (rightProgressBar) rightProgressBar.value = progressBar.value;
});

if (rightProgressBar) {
  rightProgressBar.addEventListener("input", () => {
    if (!audio.duration) return;
    audio.currentTime = (rightProgressBar.value / 100) * audio.duration;
    progressBar.value = rightProgressBar.value;
  });
}

volumeBar.addEventListener("input", () => {
  audio.volume = volumeBar.value / 100;
  if (rightVolumeBar) rightVolumeBar.value = volumeBar.value;
});

if (rightVolumeBar) {
  rightVolumeBar.addEventListener("input", () => {
    audio.volume = rightVolumeBar.value / 100;
    volumeBar.value = rightVolumeBar.value;
  });
}

audio.addEventListener("ended", () => {
  if (isRepeat) return;
  const nextIndex = nextSongIndex();
  if (nextIndex !== -1) playSong(nextIndex);
});

// SEARCH
function performSearch(query) {
  const container = document.getElementById("recommendedRow");
  if (!container) return;
  container.innerHTML = "";

  const q = query.trim().toLowerCase();
  if (!q) {
    const nonAmvSongs = songs.filter((song) => !song.amv);
    renderCards(getRandomSongs(nonAmvSongs, 20), "recommendedRow");
    return;
  }

  const filteredSongs = songs.filter(
    (song) =>
      song.title.toLowerCase().includes(q) ||
      song.artist.toLowerCase().includes(q),
  );

  if (filteredSongs.length === 0) {
    container.innerHTML = '<p class="loading-text">No songs found.</p>';
    return;
  }

  filteredSongs.forEach((song) => {
    const card = document.createElement("div");
    card.className = "song-card";
    card.dataset.songId = song.id;
    card.innerHTML = `
      <img src="${song.cover}" alt="${song.title}">
      <div class="card-title">${song.title}</div>
      <div class="card-artist">${song.artist}</div>
      <div class="play-overlay"><i class="fas fa-play"></i></div>
      <button class="add-to-queue-btn" title="Add to Queue" aria-label="Add to queue"><i class="fas fa-plus"></i></button>
      <button class="add-to-playlist-btn" title="Add to Playlist" aria-label="Add to playlist"><i class="fas fa-list"></i></button>
    `;

    card.addEventListener("click", (e) => {
      if (
        !e.target.closest(".add-to-queue-btn") &&
        !e.target.closest(".add-to-playlist-btn")
      ) {
        currentPlaylistType = null;
        currentPlaylistSongs = [];
        playSong(song.id);
      }
    });

    card.querySelector(".add-to-queue-btn").addEventListener("click", (e) => {
      e.stopImmediatePropagation();
      addToQueue(song);
    });
    card
      .querySelector(".add-to-playlist-btn")
      .addEventListener("click", (e) => {
        e.stopImmediatePropagation();
        openAddToPlaylistModal(song);
      });

    container.appendChild(card);
  });
  observeNewCards();
}

searchInput?.addEventListener("input", () => {
  clearTimeout(searchTimer);
  // Debouncing laga rakhi hai taaki fatfat API calls ya search crash na ho
  searchTimer = setTimeout(() => performSearch(searchInput.value || ""), 300);
});

document.querySelectorAll(".content-filter").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".content-filter")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".filter-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

const queueBtn = document.getElementById("queueBtn");
if (queueBtn) {
  queueBtn.addEventListener("click", () => {
    if (songs.length === 0 || currentIndex < 0) return;
    const currentSong = songs[currentIndex];
    if (!currentSong) return;
    showToast(
      `"${currentSong.title}" is already playing and cannot be added to queue`,
    );
  });
}

function refreshQueue() {
  const queueList = document.getElementById("queueList");
  if (!queueList) return;

  queueList.innerHTML = "";
  const queueHeader = document.querySelector(".queue-header span");

  if (queue.length === 0) {
    if (queueHeader) queueHeader.textContent = "Next in queue";
    return;
  }

  if (queueHeader) queueHeader.textContent = `Next in queue (${queue.length})`;

  queue.slice(0, 4).forEach((song) => {
    const item = document.createElement("div");
    item.className = "queue-item";
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
  const currentSong = songs[currentIndex];
  if (currentSong && song.id === currentSong.id) {
    showToast(`Already playing can't be add`);
    return;
  }

  if (queue.some((s) => s.id === song.id)) {
    showToast(`"${song.title}" is already in queue`);
    return;
  }

  queue.push(song);
  showToast(`"${song.title}" added to queue`);
  refreshQueue();
  saveStateToLocalStorage();
}

// Toast alerts
function showToast(message) {
  const toast = document.createElement("div");
  toast.classList.add("showToast");
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = "all 0.3s ease";
    toast.style.opacity = "0";
    setTimeout(() => toast.parentNode.removeChild(toast), 300);
  }, 2200);
}

attachScrollArrows(
  "scrollLeft",
  "scrollRight",
  document.getElementById("hindiRow"),
);
attachScrollArrows(
  "recScrollLeft",
  "recScrollRight",
  document.getElementById("recommendedRow"),
);

setInterval(saveStateToLocalStorage, 5000);
window.addEventListener("beforeunload", saveStateToLocalStorage);

audio.addEventListener("pause", saveStateToLocalStorage);
audio.addEventListener("play", saveStateToLocalStorage);
volumeBar.addEventListener("input", saveStateToLocalStorage);
if (rightVolumeBar)
  rightVolumeBar.addEventListener("input", saveStateToLocalStorage);
heartBtn.addEventListener("click", saveStateToLocalStorage);
if (rightHeartBtn)
  rightHeartBtn.addEventListener("click", saveStateToLocalStorage);

(function () {
  const menuToggle = document.getElementById("mobileMenuToggle");
  const sidebar = document.querySelector(".left-sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  function openSidebar() {
    sidebar.classList.add("open");
    overlay.classList.add("show");
    document.body.style.overflow = "hidden";
  }
  function closeSidebar() {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
    document.body.style.overflow = "";
  }

  if (menuToggle) menuToggle.addEventListener("click", openSidebar);
  if (overlay) overlay.addEventListener("click", closeSidebar);

  const mobileHomeBtn = document.getElementById("mobileHomeBtn");
  const mobileSearchBtn = document.getElementById("mobileSearchBtn");
  const mobileLibraryBtn = document.getElementById("mobileLibraryBtn");
  const searchInput = document.getElementById("searchInput");

  function setMobileActive(btn) {
    [mobileHomeBtn, mobileSearchBtn, mobileLibraryBtn].forEach(
      (b) => b && b.classList.remove("active"),
    );
    if (btn) btn.classList.add("active");
  }

  if (mobileHomeBtn) {
    mobileHomeBtn.addEventListener("click", () => {
      setMobileActive(mobileHomeBtn);
      window.location.reload();
    });
  }

  if (mobileSearchBtn) {
    mobileSearchBtn.addEventListener("click", () => {
      setMobileActive(mobileSearchBtn);
      if (searchInput) {
        searchInput.focus();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  if (mobileLibraryBtn) {
    mobileLibraryBtn.addEventListener("click", () => {
      setMobileActive(mobileLibraryBtn);
      openSidebar();
    });
  }
  window._closeSidebar = closeSidebar;
})();

// Collapsible Right side panel script
(function () {
  const rightSidebar = document.getElementById("rightSidebar");
  const collapseBtn = document.getElementById("rightSidebarCollapseBtn");
  const expandBtn = document.getElementById("expandRightSidebarBtn");
  const expandTab = document.getElementById("rightExpandTab");

  let isCollapsed = localStorage.getItem("rightSidebarCollapsed") === "true";

  function applyState() {
    if (!rightSidebar) return;
    if (isCollapsed) {
      rightSidebar.classList.add("collapsed");
      if (collapseBtn)
        collapseBtn.querySelector("i").className = "fas fa-chevron-left";
      if (expandBtn) expandBtn.classList.add("active");
      if (expandTab) expandTab.style.display = "flex";
    } else {
      rightSidebar.classList.remove("collapsed");
      if (collapseBtn)
        collapseBtn.querySelector("i").className = "fas fa-chevron-right";
      if (expandBtn) expandBtn.classList.remove("active");
      if (expandTab) expandTab.style.display = "none";
    }
    localStorage.setItem("rightSidebarCollapsed", isCollapsed);
  }

  function toggle() {
    isCollapsed = !isCollapsed;
    applyState();
  }

  if (collapseBtn) collapseBtn.addEventListener("click", toggle);
  if (expandBtn) expandBtn.addEventListener("click", toggle);
  if (expandTab) expandTab.addEventListener("click", toggle);

  window._applyRightSidebarState = applyState;
})();

function createScrollObserver() {
  const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
  return new IntersectionObserver((entries) => {
    entries.forEach((entry) =>
      entry.target.classList.toggle("fade-in", entry.isIntersecting),
    );
  }, observerOptions);
}

function initScrollAnimations() {
  const observer = createScrollObserver();
  document
    .querySelectorAll(".section")
    .forEach((section) => observer.observe(section));
  document
    .querySelectorAll(".song-card")
    .forEach((card) => observer.observe(card));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initScrollAnimations);
} else {
  initScrollAnimations();
}

function observeNewCards() {
  const observer = createScrollObserver();
  document
    .querySelectorAll(".song-card:not(.fade-in)")
    .forEach((card) => observer.observe(card));
}

const crsr = document.getElementById("cursor");
document.addEventListener("pointermove", (e) => {
  crsr.style.transform = `translate(${e.clientX + 12.4}px, ${e.clientY + 12.4}px)`;
});

function outOfServicesBtn() {
  showToast("Out Of Service");
}

loadSongs();