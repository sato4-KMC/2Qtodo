import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-analytics.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

// Firebase 初期化
const firebaseConfig = {
  apiKey: "AIzaSyDk9Iq4ZGZ3FhVwgpcGju1LlIRBNmqyZos",
  authDomain: "qtodo-d8ec8.firebaseapp.com",
  projectId: "qtodo-d8ec8",
  storageBucket: "qtodo-d8ec8.firebasestorage.app",
  messagingSenderId: "508249025548",
  appId: "1:508249025548:web:68007931abb17fa1415229",
  measurementId: "G-BSGWZJ0RFL"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Google Calendar API 定数定義
const CLIENT_ID = '693462078129-6udiv93h2ip1gjkfi1n78vd20nppfvq7.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDwWeP04_wH7cW7JbT1OATv5C_JdhG7j74';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

// Firebase Auth setup
const auth = getAuth();
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar.readonly');

// 🔐 ユーザーがログインボタンをクリックしたとき
const loginBtn = document.getElementById("login-btn");
loginBtn.addEventListener("click", async () => {
  try {
    console.log("🟢 ログイン開始");
    await signInWithPopup(auth, provider);
    console.log("✅ ログイン成功");
  } catch (e) {
    alert("ログインに失敗しました");
    console.error("❌ ログインエラー:", e);
  }
});

// 🔓 ログアウト処理
const logoutBtn = document.getElementById("logout-btn");
logoutBtn.addEventListener("click", async () => {
  console.log("🔴 ログアウトします");
  await signOut(auth);
});

// 👤 認証状態の変化を監視
const calendarBtn = document.getElementById("calendar-btn");
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("✅ ログイン状態を検出:", user.email);
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    calendarBtn.classList.remove("hidden");
  } else {
    console.log("👋 ログアウト状態です");
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    calendarBtn.classList.add("hidden");
  }
});

// 📅 Googleカレンダー予定を取得
calendarBtn.addEventListener("click", async () => {
  try {
    console.log("📥 予定の取得を開始");
    const user = auth.currentUser;
    if (!user) {
      alert("ログインしていません");
      return;
    }

    const tokenResult = await user.getIdTokenResult();
    const accessToken = tokenResult.token;

    await gapi.load("client", async () => {
      await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
      });
      gapi.client.setToken({ access_token: accessToken });
      console.log("📡 APIにアクセスします");
      listUpcomingEvents();
    });
  } catch (e) {
    alert("予定取得に失敗しました");
    console.error("❌ 予定取得エラー:", e);
  }
});

// Google Calendar API function
function listUpcomingEvents() {
  gapi.client.calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    showDeleted: false,
    singleEvents: true,
    maxResults: 5,
    orderBy: 'startTime'
  }).then(response => {
    const events = response.result.items;
    console.log("📄 カレンダーイベント取得結果:", events);
    const eventsList = document.getElementById('events');
    eventsList.innerHTML = '';

    if (events.length === 0) {
      const li = document.createElement('li');
      li.textContent = '予定は見つかりませんでした。';
      eventsList.appendChild(li);
    } else {
      events.forEach(event => {
        const when = event.start.dateTime || event.start.date;
        const li = document.createElement('li');
        li.textContent = `${event.summary} (${when})`;
        eventsList.appendChild(li);
      });
    }
  });
}

// タスク処理・UI関連関数
const dummyTasks = [
  {
    id: "1",
    title: "プレゼン資料作り",
    durationMin: 15,
    level: 3,
    createdAt: new Date().toISOString(),
    completed: false,
  },
  {
    id: "2",
    title: "CG課題",
    durationMin: 15,
    level: 2,
    createdAt: new Date().toISOString(),
    completed: false,
  },
  {
    id: "3",
    title: "メール送信",
    durationMin: 8,
    level: 1,
    createdAt: new Date().toISOString(),
    completed: false,
  },
];

function renderTasks() {
  const container = document.querySelector('.middle-block');
  if (!container) return;

  container.innerHTML = "<div class='task-list-title'>タスク一覧</div>";
  dummyTasks.forEach((task) => {
    const card = document.createElement("div");
    card.className = "task-card";
    card.innerHTML = `
      <div class="task-time">${task.durationMin}分</div>
      <div>
        <div class="task-title">${task.title}</div>
        <div class="task-level">レベル${task.level}</div>
      </div>
    `;
    container.appendChild(card);
  });
}

// 初期表示
renderTasks();

// #next-eventクリックで予定詳細の表示/非表示を切り替え
const nextEvent = document.getElementById("next-event");
const eventDetail = document.getElementById("event-detail");
if (nextEvent && eventDetail) {
  nextEvent.addEventListener("click", () => {
    eventDetail.classList.toggle("hidden");
    // アイコンの向きも切り替え
    if (nextEvent.textContent?.startsWith("▶")) {
      nextEvent.textContent = nextEvent.textContent.replace("▶", "▼");
    } else if (nextEvent.textContent?.startsWith("▼")) {
      nextEvent.textContent = nextEvent.textContent.replace("▼", "▶");
    }
  });
}

function resizeTextarea(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
  const bottomBlock = document.querySelector('.bottom-block');
  if (textarea.scrollHeight > "80vh") {
    bottomBlock.style.height = "85vh";
  } else {
    bottomBlock.style.height = textarea.scrollHeight + 'px';
  }
  
  const thirtyVh = window.innerHeight * 0.3;
  const ninetyVh = window.innerHeight * 0.9 - "48px";
  
  if (textarea.scrollHeight > ninetyVh) {
    // 90vhを超えた場合：expandボタンを非表示、スクロール有効
    document.getElementById("expand-input-btn").style.opacity = "0";
    document.getElementById("expand-input-btn").disabled = true;
    textarea.style.overflowY = "auto";
    textarea.scrollTop = "80vh"; // 最新の文字を一番下に表示
  } else if (textarea.scrollHeight > thirtyVh) {
    document.getElementById("expand-input-btn").style.opacity = "1";
    document.getElementById("expand-input-btn").disabled = false;
    textarea.style.overflowY = "hidden";
  } else {
    document.getElementById("expand-input-btn").style.opacity = "0";
    document.getElementById("expand-input-btn").disabled = true;
    textarea.style.overflowY = "hidden";
  }
}

// task-input focus時にモーダル表示、modalBgクリックで非表示
const taskInput = document.getElementById("bottom-block-input");
const modalBg = document.getElementById("modal-bg");
const bottomBlock = document.querySelector('.bottom-block');
if (taskInput && modalBg) {
  taskInput.addEventListener("focus", () => {
    resizeTextarea(taskInput);
    modalBg.style.display = "block";
  });

  modalBg.addEventListener("click", () => {
    taskInput.blur();
    modalBg.style.display = "none";
    taskInput.style.height = '100%';
    bottomBlock.style.height = '100px';
  });
}

function setTask() {
  const taskInput = document.getElementById("bottom-block-input");
  const taskTitle = taskInput.value;
  if (taskTitle.trim() == "") {
    alert("❌ タスクを入力してください");
    return;
  }
  toggleSettingView(true);
}

document.addEventListener('DOMContentLoaded', () => {
  renderTasks();
});

function addTask() {
  const taskInput = document.getElementById("bottom-block-input");
  const taskTitle = taskInput.value;
  const newTask = {
    id: Date.now().toString(),
    title: taskTitle,
    durationMin: document.getElementById('duration-range').value,
    level: document.getElementById('level-range').value,
    createdAt: new Date().toISOString(),
    completed: false,
  }
  dummyTasks.push(newTask);
  document.getElementById('task-input-view').style.display = 'flex';
  document.getElementById('task-setting-view').style.display = 'none';
  document.querySelector('.bottom-block').style.height = '100px';
  document.getElementById('modal-bg').style.display = 'none';
  taskInput.value = "";
  renderTasks();
}

function toggleSettingView(showSettings) {
  document.getElementById('task-input-view').style.display = showSettings ? 'none' : 'flex';
  document.getElementById('task-setting-view').style.display = showSettings ? 'flex' : 'none';
  if (showSettings) {
    document.querySelector('.bottom-block').style.height = '300px';
  } else {
    document.querySelector('.bottom-block').style.height = '100px';
  }
}

function updateDurationLabel() {
  const value = document.getElementById('duration-range').value;
  document.getElementById('duration-label').textContent = `${value}分`;
}

function updateLevelLabel() {
  const value = document.getElementById('level-range').value;
  document.getElementById('level-label').textContent = `レベル ${value}`;
}