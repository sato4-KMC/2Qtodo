
// タスク処理・UI関連関数
const savedTasks = JSON.parse(localStorage.getItem("tasks"));
const dummyTasks = savedTasks || [
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
    // Load latest tasks from localStorage if available
    const savedTasks = JSON.parse(localStorage.getItem("tasks"));
    if (savedTasks) {
      dummyTasks.length = 0;
      dummyTasks.push(...savedTasks);
    }
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
  // Scroll the first card into view on page load
  const initialCard = document.getElementById("initial-card");
  if (initialCard) {
    initialCard.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }
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
    localStorage.setItem("tasks", JSON.stringify(dummyTasks));
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

  