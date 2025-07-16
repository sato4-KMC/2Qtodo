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
    color: generateRandomHueColor(),
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
  console.log('renderTasks called with projectId:', projectId);
  const allTasks = loadDB("tasks", []);
  console.log('allTasks:', allTasks);

  // 必要ならプロジェクトIDでフィルタ
  const list = projectId
    ? allTasks.filter(t => String(t.pjId) === String(projectId))
    : allTasks;
  console.log('filtered list:', list);

  if (projectId) {
    // 特定のプロジェクトに対して描画
    const card = document.querySelector(`.card[data-pjid="${projectId}"]`);
    console.log('card:', card);
    if (!card) return;

    const container = card.querySelector('.task-container');
    console.log('container:', container);
    if (!container) return;

    // .task-add 以外を削除
    container.querySelectorAll('.task').forEach(e => e.remove());

    // sortTasksで並べ替え
    const sortedTasks = sortTasks(list, window.nextEvent);
    sortedTasks.forEach((task) => {
      const taskDiv = document.createElement("div");
      taskDiv.className = "task";
      taskDiv.innerHTML = `
        <div class="task-minute">${task.durationMin}</div>
        <div class="task-title">${task.title}</div>
        <div class="task-checkbox"><input type="checkbox" ${task.completed ? 'checked' : ''} data-task-id="${task.id}" /></div>
      `;
      // Set background color and text color to parent project's color
      const project = projects.find(p => String(p.id) === String(task.pjId));
      if (project) {
        taskDiv.style.backgroundColor = project.color;
        const minuteEl = taskDiv.querySelector('.task-minute');
        if (minuteEl) minuteEl.style.color = project.color;
        const titleEl = taskDiv.querySelector('.task-title');
        if (titleEl) titleEl.style.color = project.color;
      }
      // チェックボックスのイベントリスナーを追加
      // この部分を削除
    });

    // .task-addの色をプロジェクトカラーに設定
    const project = projects.find(p => String(p.id) === String(projectId));
    const taskAdd = card.querySelector('.task-add');
    if (taskAdd && project) {
      taskAdd.style.backgroundColor = project.color;
      taskAdd.style.color = project.color;
    }

    // 進捗バー更新処理を追加
    const tasksForThisProject = list;
    const total = tasksForThisProject.length;
    const current = tasksForThisProject.filter(t => t.completed).length;
    const percent = total === 0 ? 0 : Math.round((current / total) * 100);
    const progressNumber = card.querySelector('.progress-number');
    if (progressNumber) {
      // i
      const currentSpan = progressNumber.querySelector('.current');
      const totalSpan = progressNumber.querySelector('.total');
      if (currentSpan) currentSpan.textContent = current;
      if (totalSpan) totalSpan.textContent = `/${total}`;
    }
    const progressBarFill = card.querySelector('.progress-bar-fill');
    if (progressBarFill) progressBarFill.style.width = percent + '%';

  } else {
    // 全プロジェクトを対象に描画
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      const pjId = card.getAttribute('data-pjid');
      const container = card.querySelector('.task-container');
      if (!container) return;

      // .task-add 以外を削除
      container.querySelectorAll('.task').forEach(e => e.remove());

      const tasksForThisProject = allTasks.filter(t => String(t.pjId) === String(pjId));
      // sortTasksで並べ替え
      const sortedTasks = sortTasks(tasksForThisProject, window.nextEvent);
      sortedTasks.forEach((task) => {
        const taskDiv = document.createElement("div");
        taskDiv.className = "task";
        taskDiv.innerHTML = `
          <div class="task-minute">${task.durationMin}</div>
          <div class="task-title">${task.title}</div>
          <div class="task-checkbox"><input type="checkbox" ${task.completed ? 'checked' : ''} data-task-id="${task.id}" /></div>
        `;
        // Set background color and text color to parent project's color
        const project = projects.find(p => String(p.id) === String(task.pjId));
        if (project) {
          taskDiv.style.backgroundColor = project.color;
          const minuteEl = taskDiv.querySelector('.task-minute');
          if (minuteEl) minuteEl.style.color = project.color;
          const titleEl = taskDiv.querySelector('.task-title');
          if (titleEl) titleEl.style.color = project.color;
        }
        // チェックボックスのイベントリスナーを追加
        // この部分を削除
      });
      // .task-addの色をプロジェクトカラーに設定
      const project = projects.find(p => String(p.id) === String(pjId));
      const taskAdd = card.querySelector('.task-add');
      if (taskAdd && project) {
        taskAdd.style.backgroundColor = project.color;
        taskAdd.style.color = project.color;
      }
      // 進捗バー更新処理を追加
      const total = tasksForThisProject.length;
      const current = tasksForThisProject.filter(t => t.completed).length;
      const percent = total === 0 ? 0 : Math.round((current / total) * 100);
      const progressNumber = card.querySelector('.progress-number');
      if (progressNumber) {
        const currentSpan = progressNumber.querySelector('.current');
        const totalSpan = progressNumber.querySelector('.total');
        if (currentSpan) currentSpan.textContent = current;
        if (totalSpan) totalSpan.textContent = `/${total}`;
      }
      const progressBarFill = card.querySelector('.progress-bar-fill');
      if (progressBarFill) progressBarFill.style.width = percent + '%';
    });
  }
}

// nextEventをグローバルで保持
window.nextEvent = null;

// nextEventまでに終わる未完了タスクを所要時間順で返す
function sortTasks(tasks, nextEvent) {
  if (!nextEvent) {
    // 完了・未完了で分けて、未完了→完了の順で昇順
    const incompleted = tasks.filter(t => !t.completed).sort((a, b) => a.durationMin - b.durationMin);
    const completed = tasks.filter(t => t.completed).sort((a, b) => a.durationMin - b.durationMin);
    return [...incompleted, ...completed];
  }
  const now = new Date();
  const start = new Date(nextEvent.start?.dateTime || nextEvent.start?.date);
  const remainMin = Math.floor((start - now) / 60000);

  // 未完了で今できるもの→未完了で今できないもの→完了、の順
  const incompletedAvailable = tasks.filter(t => !t.completed && t.durationMin <= remainMin).sort((a, b) => a.durationMin - b.durationMin);
  const incompletedUnavailable = tasks.filter(t => !t.completed && t.durationMin > remainMin).sort((a, b) => a.durationMin - b.durationMin);
  const completed = tasks.filter(t => t.completed).sort((a, b) => a.durationMin - b.durationMin);
  return [...incompletedAvailable, ...incompletedUnavailable, ...completed];
}

// タスク一覧セクションに全タスクを表示
function renderTasksList() {
  const allTasks = loadDB("tasks", []);
  const tasksContainer = document.querySelector('#tasks .card-list-container');

  if (!tasksContainer) return;

  // 既存のタスクをクリア
  tasksContainer.innerHTML = '';

  // nextEventまでに終わるタスクを所要時間順で表示
  const sortedTasks = sortTasks(allTasks, window.nextEvent);
  sortedTasks.forEach((task) => {
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
    // Set background and text color to parent project's color
    const project = projects.find(p => String(p.id) === String(task.pjId));
    if (project) {
      taskDiv.style.backgroundColor = project.color;
      const minuteEl = taskDiv.querySelector('.task-minute');
      if (minuteEl) minuteEl.style.color = project.color;
    }
    // この部分を削除
    // 削除ボタンのイベントリスナーを追加
    const deleteBtn = taskDiv.querySelector('.delete-task-btn');
    deleteBtn.addEventListener('click', function() {
      const taskId = this.getAttribute('data-task-id');
      deleteTask(taskId);
    });
    tasksContainer.appendChild(taskDiv);
  });

  // タスクが存在しない場合のメッセージ
  if (sortedTasks.length === 0) {
    const noTasksDiv = document.createElement("div");
    noTasksDiv.style.textAlign = "center";
    noTasksDiv.style.padding = "20px";
    noTasksDiv.style.color = "var(--blue)";
    noTasksDiv.style.fontWeight = "bold";
    noTasksDiv.innerHTML = "タスクがありません";
    tasksContainer.appendChild(noTasksDiv);
  }
}

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

// タスク削除
function deleteTask(taskId) {
  const allTasks = loadDB("tasks", []);
  const updatedTasks = allTasks.filter(task => task.id !== taskId);
  saveDB("tasks", updatedTasks);

  // 表示を更新
  renderTasks();
  renderTasksList();
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
    function handleTaskAddButtonClick(e) {
      e.stopPropagation();
      handleTaskAdd(this);
    }
    button.removeEventListener('click', handleTaskAddButtonClick);
    button.addEventListener('click', handleTaskAddButtonClick);
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
  if (isTaskSubmitting) {
    console.log('handleTaskAdd: isTaskSubmitting=true, return');
    return; // 2度押し防止
  }
  isTaskSubmitting = true;
  console.log('handleTaskAdd called'); // デバッグログ
  const card = button.closest('.card, .card-add');
  console.log('card:', card);
  const pjId = card ? card.getAttribute('data-pjid') : null;
  console.log('pjId:', pjId);

  // 同じカード内の入力フィールドを取得
  const taskAdd = button.closest('.task-add');
  console.log('taskAdd:', taskAdd);
  const minuteInput = taskAdd ? taskAdd.querySelector('.task-add-top .task-minute input') : null;
  const titleInput = taskAdd ? taskAdd.querySelector('.task-add-top .task-title input') : null;
  const levelInput = taskAdd ? taskAdd.querySelector('.task-add-bottom .task-level input') : null;
  console.log('minuteInput:', minuteInput, 'value:', minuteInput && minuteInput.value);
  console.log('titleInput:', titleInput, 'value:', titleInput && titleInput.value);
  console.log('levelInput:', levelInput, 'value:', levelInput && levelInput.value);

  // 入力値の取得
  const durationMin = minuteInput ? minuteInput.value.trim() : '';
  const title = titleInput ? titleInput.value.trim() : '';
  const level = levelInput ? levelInput.value.trim() : '';
  console.log('durationMin:', durationMin, 'title:', title, 'level:', level);

  // バリデーション
  if (!durationMin || !title) {
    console.log('バリデーション失敗: 分数またはタスク名が空');
    alert('分数とタスク名を入力してください');
    isTaskSubmitting = false;
    return;
  }

  if (isNaN(durationMin) || parseInt(durationMin) <= 0) {
    console.log('バリデーション失敗: 分数が不正', durationMin);
    alert('有効な分数を入力してください');
    isTaskSubmitting = false;
    return;
  }

  // addTaskに渡す値をすべて表示
  console.log('addTaskに渡す値:', {
    pjId: pjId,
    title: title,
    durationMin: durationMin,
    level: level
  });
  alert(
    `addTaskに渡す値:\n` +
    `pjId: ${pjId}\n` +
    `title: ${title}\n` +
    `durationMin: ${durationMin}\n` +
    `level: ${level}\n`
  );

  // タスクを追加
  const newTask = addTask({
    pjId: String(pjId),
    title: title,
    durationMin: parseInt(durationMin),
    level: parseInt(level)
  });
  console.log('addTaskで追加されたnewTask:', newTask);

  // 入力フィールドをクリア
  if (minuteInput) minuteInput.value = '';
  if (titleInput) titleInput.value = '';

  // タスクを再描画
  console.log('renderTasksを呼び出します', pjId);
  renderTasks(pjId);
  console.log('renderTasksListを呼び出します');
  renderTasksList();
  isTaskSubmitting = false;
  console.log('handleTaskAdd 完了');
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
    <div class="card-title" style="color: ${project.color};">${project.name}</div>
    <div class="task-container">
    </div>
    <div class="task-add" style="display: flex; flex-direction: column; justify-content: space-evenly; align-items: center; background-color: ${project.color};">
      <div class="task-add-top" style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%;">
        <div class="task-minute" style="width: 65px;">
          <input type="number" placeholder="分数" maxlength="3" max="999" min="1" style="color: ${project.color};" />
        </div>
        <div class="task-title">
          <input type="text" placeholder="タスク名を入力" />
        </div>
      </div>
      <div class="task-add-bottom" style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%;">
        <div class="task-level">
          <input type="range" max="5" min="1" value="3" style="accent-color: #ffffff;" class="priority-range" />
          <span class="priority-value" style="margin-left: 8px; color: #fff; font-weight: bold;">優先度: 3</span>
        </div>
        <div class="task-checkbox">
          <button class="task-add-button" data-pjid="${project.id}">
            <span class="material-icons" style="color: ${project.color};">
              add
            </span>
          </button>
        </div>
      </div>
    </div>
    <div class="card-bottom-progress">
      <div class="progress-number" style="color: ${project.color};">
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

  // イベントデリゲーションを設定
  newCard.querySelector('.task-container').addEventListener('change', function(e) {
    if (e.target && e.target.matches('input[type="checkbox"][data-task-id]')) {
      const taskId = e.target.getAttribute('data-task-id');
      const allTasks = loadDB("tasks", []);
      const t = allTasks.find(t => t.id === taskId);
      if (t) {
        t.completed = e.target.checked;
        saveDB("tasks", allTasks);
        renderTasks(t.pjId);
        renderTasksList();
      }
    }
  });

  // 優先度スライダーの値をリアルタイム表示
  const priorityRange = newCard.querySelector('.priority-range');
  const priorityValue = newCard.querySelector('.priority-value');
  if (priorityRange && priorityValue) {
    priorityRange.addEventListener('input', function() {
      priorityValue.textContent = `優先度: ${this.value}`;
    });
  }
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

  // 既存のタスクコンテナにイベントデリゲーションを設定
  document.querySelectorAll('.task-container').forEach(container => {
    container.addEventListener('change', function(e) {
      if (e.target && e.target.matches('input[type="checkbox"][data-task-id]')) {
        const taskId = e.target.getAttribute('data-task-id');
        const allTasks = loadDB("tasks", []);
        const t = allTasks.find(t => t.id === taskId);
        if (t) {
          t.completed = e.target.checked;
          saveDB("tasks", allTasks);
          renderTasks(t.pjId);
          renderTasksList();
        }
      }
    });
  });
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

function generateRandomHueColor() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 60; // %
  const lightness = 56;  // %
  return hslToHex(hue, saturation, lightness);
}

// HSL -> HEX 変換
function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs((h / 60) % 2 - 1));
  let m = l - c/2;
  let r=0, g=0, b=0;

  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return "#" + [r,g,b].map(x =>
    x.toString(16).padStart(2, '0')
  ).join('');
}