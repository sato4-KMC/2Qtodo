// データベース初期化 (projects と tasks を localStorage にセット)
function loadDB(key, defaultValue) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : defaultValue;
}
function saveDB(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// projects: { id, name } の配列
const projects = loadDB("projects", []);
// tasks: { id, pjId, title, durationMin, level, createdAt, completed } の配列
const tasks = loadDB("tasks", []);

// プロジェクト追加
function addProject(name) {
  const newProject = {
    id: Date.now().toString(),
    name,
    createdAt: new Date().toISOString(),
  };
  projects.push(newProject);
  saveDB("projects", projects);
  return newProject;
}

// タスク追加
function addTask({ pjId, title, durationMin, level }) {
  const newTask = {
    id: Date.now().toString(),
    pjId,
    title,
    durationMin,
    level,
    createdAt: new Date().toISOString(),
    completed: false,
  };
  tasks.push(newTask);
  saveDB("tasks", tasks);
  return newTask;
}

// タスクを各プロジェクトの.task-container内に描画し、.task-addは残す
function renderTasks(projectId = null) {
  const allTasks = loadDB("tasks", []);

  // 必要ならプロジェクトIDでフィルタ
  const list = projectId
    ? allTasks.filter(t => t.pjId === projectId)
    : allTasks;

  if (projectId) {
    // 特定のプロジェクトに対して描画
    const card = document.querySelector(`.card[data-pjid="${projectId}"]`);
    if (!card) return;

    const container = card.querySelector('.task-container');
    if (!container) return;

    // .task-add 以外を削除
    container.querySelectorAll('.task').forEach(e => e.remove());

    list.forEach((task) => {
      const taskDiv = document.createElement("div");
      taskDiv.className = "task";
      taskDiv.innerHTML = `
        <div class="task-minute">${task.durationMin}</div>
        <div class="task-title">${task.title}</div>
        <div class="task-checkbox"><input type="checkbox" /></div>
      `;
      container.insertBefore(taskDiv, container.querySelector('.task-add'));
    });

  } else {
    // 全プロジェクトを対象に描画
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      const pjId = card.getAttribute('data-pjid');
      const container = card.querySelector('.task-container');
      if (!container) return;

      // .task-add 以外を削除
      container.querySelectorAll('.task').forEach(e => e.remove());

      const tasksForThisProject = allTasks.filter(t => t.pjId === pjId);
      tasksForThisProject.forEach((task) => {
        const taskDiv = document.createElement("div");
        taskDiv.className = "task";
        taskDiv.innerHTML = `
          <div class="task-minute">${task.durationMin}</div>
          <div class="task-title">${task.title}</div>
          <div class="task-checkbox"><input type="checkbox" /></div>
        `;
        container.insertBefore(taskDiv, container.querySelector('.task-add'));
      });
    });
  }
  
  // タスク一覧セクションも更新
  renderTasksList();
}

// タスク削除
function deleteTask(taskId) {
  const allTasks = loadDB("tasks", []);
  const updatedTasks = allTasks.filter(task => task.id !== taskId);
  saveDB("tasks", updatedTasks);
  
  // 表示を更新
  renderTasks();
  renderTasksList();
}

// タスク一覧セクションに全タスクを表示
function renderTasksList() {
  const allTasks = loadDB("tasks", []);
  const tasksContainer = document.querySelector('#tasks .card-list-container');
  
  if (!tasksContainer) return;
  
  // 既存のタスクをクリア
  tasksContainer.innerHTML = '';
  
  // 全タスクを表示
  allTasks.forEach((task) => {
    const taskDiv = document.createElement("div");
    taskDiv.className = "task";
    taskDiv.innerHTML = `
      <div class="task-minute">${task.durationMin}</div>
      <div class="task-title">${task.title}</div>
      <div class="task-checkbox">
        <input type="checkbox" ${task.completed ? 'checked' : ''} />
      </div>
      <div class="task-delete">
        <button class="delete-task-btn" data-task-id="${task.id}">
          <span class="material-icons" style="font-size: 16px; color: #ff4444;">delete</span>
        </button>
      </div>
    `;
    
    // チェックボックスのイベントリスナーを追加
    const checkbox = taskDiv.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', function() {
      task.completed = this.checked;
      saveDB("tasks", allTasks);
    });
    
    // 削除ボタンのイベントリスナーを追加
    const deleteBtn = taskDiv.querySelector('.delete-task-btn');
    deleteBtn.addEventListener('click', function() {
      const taskId = this.getAttribute('data-task-id');
      deleteTask(taskId);
    });
    
    tasksContainer.appendChild(taskDiv);
  });
  
  // タスクが存在しない場合のメッセージ
  if (allTasks.length === 0) {
    const noTasksDiv = document.createElement("div");
    noTasksDiv.style.textAlign = "center";
    noTasksDiv.style.padding = "20px";
    noTasksDiv.style.color = "var(--blue)";
    noTasksDiv.innerHTML = "タスクがありません";
    tasksContainer.appendChild(noTasksDiv);
  }
}

// 初期表示
renderTasks();

// 保存されたプロジェクトを表示
function renderProjects() {
  const allProjects = loadDB("projects", []);
  const cardScrollContainer = document.querySelector('.card-scroll-container');
  if (!cardScrollContainer) return;
  
  // 既存のカード（card-addとcard-sized-box以外）を削除
  const existingCards = cardScrollContainer.querySelectorAll('.card:not(.card-add)');
  existingCards.forEach(card => {
    if (!card.classList.contains('card-sized-box')) {
      card.remove();
    }
  });
  
  // 保存されたプロジェクトのカードを作成
  allProjects.forEach(project => {
    createNewCard(project);
  });
}

// タスク追加ボタンのイベントリスナーを設定
function setupTaskAddButtons() {
  // 既存のイベントリスナーを削除（重複を防ぐため）
  const existingButtons = document.querySelectorAll('.task-add-button');
  existingButtons.forEach(button => {
    button.removeEventListener('click', handleTaskAdd);
  });
  
  const existingInputs = document.querySelectorAll('.task-add input');
  existingInputs.forEach(input => {
    input.removeEventListener('keypress', handleEnterKey);
  });
  
  // 新しいイベントリスナーを追加
  const taskAddButtons = document.querySelectorAll('.task-add-button');
  taskAddButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.stopPropagation(); // イベントの伝播を停止
      handleTaskAdd(this);
    });
  });
  
  // Enterキーでのタスク追加も対応
  const taskInputs = document.querySelectorAll('.task-add input');
  taskInputs.forEach(input => {
    input.addEventListener('keypress', handleEnterKey);
  });
}

// Enterキー処理の共通関数
function handleEnterKey(e) {
  if (e.key === 'Enter') {
    e.stopPropagation(); // イベントの伝播を停止
    const button = this.closest('.task-add').querySelector('.task-add-button');
    if (button) {
      handleTaskAdd(button);
    }
  }
}

let isTaskSubmitting = false; // タスク追加用の2度押し防止フラグ

// タスク追加の共通処理
function handleTaskAdd(button) {
  if (isTaskSubmitting) return; // 2度押し防止
  isTaskSubmitting = true;
  console.log('handleTaskAdd called'); // デバッグログ
  const card = button.closest('.card, .card-add');
  const pjId = card.getAttribute('data-pjid');
  
  // 同じカード内の入力フィールドを取得
  const minuteInput = card.querySelector('.task-add .task-minute input');
  const titleInput = card.querySelector('.task-add .task-title input');
  
  // 入力値の取得
  const durationMin = minuteInput.value.trim();
  const title = titleInput.value.trim();
  
  // バリデーション
  if (!durationMin || !title) {
    alert('分数とタスク名を入力してください');
    isTaskSubmitting = false;
    return;
  }
  
  if (isNaN(durationMin) || parseInt(durationMin) <= 0) {
    alert('有効な分数を入力してください');
    isTaskSubmitting = false;
    return;
  }
  
  // タスクを追加
  const newTask = addTask({
    pjId: pjId,
    title: title,
    durationMin: parseInt(durationMin),
    level: 1
  });
  
  // 入力フィールドをクリア
  minuteInput.value = '';
  titleInput.value = '';
  
  // タスクを再描画
  renderTasks(pjId);
  // タスク一覧も更新
  renderTasksList();
  isTaskSubmitting = false;
}

// プロジェクト追加ボタンのイベントリスナーを設定
function setupProjectAddButtons() {
  // 名前付き関数を用意
  function onProjectAddClick(e) {
    e.stopPropagation();
    handleProjectAdd(this);
  }

  // 既存のイベントリスナーを削除（重複を防ぐため）
  const existingProjectButtons = document.querySelectorAll('.pj-add-button');
  existingProjectButtons.forEach(button => {
    button.removeEventListener('click', onProjectAddClick); // まず外す
    button.addEventListener('click', onProjectAddClick);    // そして付ける
  });
  
  const existingProjectInputs = document.querySelectorAll('.card-add .input-underline');
  existingProjectInputs.forEach(input => {
    input.removeEventListener('keypress', handleProjectEnterKey);
  });
  
  // 新しいイベントリスナーを追加
  const projectAddButtons = document.querySelectorAll('.pj-add-button');
  projectAddButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.stopPropagation();
      handleProjectAdd(this);
    });
  });
  
  // Enterキーでのプロジェクト追加も対応
  const projectNameInputs = document.querySelectorAll('.card-add .input-underline');
  projectNameInputs.forEach(input => {
    input.addEventListener('keypress', handleProjectEnterKey);
  });
}

// プロジェクト追加のEnterキー処理
function handleProjectEnterKey(e) {
  if (e.key === 'Enter') {
    e.stopPropagation();
    const button = this.closest('.card-add').querySelector('.pj-add-button');
    if (button) {
      handleProjectAdd(button);
    }
  }
}

let isSubmitting = false; // グローバルで宣言

// プロジェクト追加の共通処理
function handleProjectAdd(button) {
  if (isSubmitting) return; // 2度押し防止
  isSubmitting = true;
  console.log('handleProjectAdd called'); // デバッグログ
  const cardAdd = button.closest('.card-add');
  if (!cardAdd) return;
  
  // プロジェクト名の入力フィールドを取得
  const projectNameInput = cardAdd.querySelector('.input-underline');
  const projectName = projectNameInput.value.trim();
  
  // バリデーション
  if (!projectName) {
    alert('プロジェクト名を入力してください');
    isSubmitting = false;
    return;
  }
  
  // プロジェクトを追加
  const newProject = addProject(projectName);
  
  // 入力フィールドをクリア
  projectNameInput.value = '';
  
  // 新しいカードを作成して追加
  createNewCard(newProject);
  
  // MutationObserverが自動的に新しいボタンにイベントリスナーを設定するため、
  // ここで手動で設定する必要はありません
  isSubmitting = false;
}

// 新しいカードを作成
function createNewCard(project) {
  const cardScrollContainer = document.querySelector('.card-scroll-container');
  if (!cardScrollContainer) return;
  
  // card-sized-boxの前に新しいカードを挿入
  const cardSizedBox = cardScrollContainer.querySelector('.card-sized-box');
  
  const newCard = document.createElement('div');
  newCard.className = 'card';
  newCard.setAttribute('data-pjid', project.id);
  
  newCard.innerHTML = `
    <div class="card-title">${project.name}</div>
    <div class="task-container">
    </div>
    <div class="task-add">
      <div class="task-minute">
        <input type="number" placeholder="分数" maxlength="3" max="999" min="0" />
      </div>
      <div class="task-title">
        <input type="text" placeholder="タスク名を入力" />
      </div>
      <div class="task-checkbox">
        <button class="task-add-button" data-pjid="${project.id}">
          <span class="material-icons">
            add
          </span>
        </button>
      </div>
    </div>
    
    <div class="card-bottom-progress">
      <div class="progress-number">
        <span class="current">0</span><span class="total">/0</span>
      </div>
      <div class="progress-bar">
        <div class="progress-bar-fill" style="width: 0%;"></div>
      </div>
    </div>
  `;
  
  // card-sized-boxの前に挿入
  cardScrollContainer.insertBefore(newCard, cardSizedBox);
  
  // 新しいカードをスクロール表示
  newCard.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
}

// DOMContentLoadedイベントでボタン設定を実行
document.addEventListener('DOMContentLoaded', () => {
  renderProjects(); // 保存されたプロジェクトを表示
  renderTasks();
  renderTasksList(); // タスク一覧も表示
  setupTaskAddButtons();
  setupProjectAddButtons(); // プロジェクト追加ボタンも設定
  
  // Scroll the first card into view on page load
  const initialCard = document.getElementById("initial-card");
  if (initialCard) {
    initialCard.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }
});

// 動的に追加される要素にも対応するため、MutationObserverを使用
const observer = new MutationObserver(function(mutations) {
  let shouldReSetupTasks = false;
  let shouldReSetupProjects = false;
  
  mutations.forEach(function(mutation) {
    if (mutation.type === 'childList') {
      // task-add-buttonが追加または削除された場合のみ再設定
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1 && (node.classList?.contains('task-add-button') || node.querySelector?.('.task-add-button'))) {
          shouldReSetupTasks = true;
        }
        if (node.nodeType === 1 && (node.classList?.contains('pj-add-button') || node.querySelector?.('.pj-add-button'))) {
          shouldReSetupProjects = true;
        }
      });
      mutation.removedNodes.forEach(node => {
        if (node.nodeType === 1 && (node.classList?.contains('task-add-button') || node.querySelector?.('.task-add-button'))) {
          shouldReSetupTasks = true;
        }
        if (node.nodeType === 1 && (node.classList?.contains('pj-add-button') || node.querySelector?.('.pj-add-button'))) {
          shouldReSetupProjects = true;
        }
      });
    }
  });
  
  if (shouldReSetupTasks) {
    setupTaskAddButtons();
  }
  if (shouldReSetupProjects) {
    setupProjectAddButtons();
  }
});

// 監視を開始
observer.observe(document.body, {
  childList: true,
  subtree: true
});
  
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
  
function addTaskFromBottomBlock() {
  const taskInput = document.getElementById("bottom-block-input");
  const taskTitle = taskInput.value.trim();
  if (taskTitle === "") {
    alert("❌ タスクを入力してください");
    return;
  }

  const durationMin = document.getElementById('duration-range').value;
  const selectedPjId = localStorage.getItem("selectedProjectId") || "default"; // you can decide how to set this

  const newTask = addTask({
    pjId: selectedPjId,
    title: taskTitle,
    durationMin: durationMin,
    level: 1
  });

  console.log("新規タスク追加:", newTask);

  document.getElementById('task-input-view').style.display = 'flex';
  document.getElementById('task-setting-view').style.display = 'none';
  document.querySelector('.bottom-block').style.height = '100px';
  document.getElementById('modal-bg').style.display = 'none';
  taskInput.value = "";
  renderTasks(selectedPjId);
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
