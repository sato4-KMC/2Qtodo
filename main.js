// Google Calendar API constants
const CLIENT_ID = '693462078129-6udiv93h2ip1gjkfi1n78vd20nppfvq7.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDwWeP04_wH7cW7JbT1OATv5C_JdhG7j74';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

// Google Calendar API functions
function handleClientLoad() {
  // GIS uses its own initialization, so no need to load gapi client:auth2 here
  initClient();
}

function initClient() {
  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: handleCredentialResponse,
  });
  google.accounts.id.prompt(); // 自動表示。手動ログインならこの行を削除して別ボタンで呼ぶ
}

function handleCredentialResponse(response) {
  console.log("ID Token:", response.credential);
  // ここでIDトークンを使った認証処理を追加できます
}

function handleAuthClick() {
  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: async (response) => {
      const idToken = response.credential;

      // Load the Google API client
      await gapi.load('client', async () => {
        await gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        });

        // Set the access token manually using the ID token from GIS
        gapi.client.setToken({ id_token: idToken });

        // Now call the calendar API
        listUpcomingEvents();
      });
    },
  });

  // Trigger the sign-in prompt
  google.accounts.id.prompt();
}

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

window.onload = handleClientLoad;
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