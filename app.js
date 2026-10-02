'use strict';

const STORAGE_KEY = 'simple-task-list';
const PRIORITY_LABELS = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta'
};

const PRIORITY_SHORT_LABELS = {
  baixa: 'B',
  media: 'M',
  alta: 'A'
};

const PRIORITY_COLORS = {
  baixa: '#16a34a',
  media: '#f59e0b',
  alta: '#dc2626'
};

const LEGACY_TEXT_MAP = {
  'Add visual styles': 'Estilizar a página',
  'Add light and dark themes': 'Adicionar tema claro e escuro',
  'Enable switching the theme': 'Ativar troca de tema'
};

const defaultTasks = [
  { text: 'Estilizar a página', done: false, priority: 'media', project: 'Design', dueDate: '2026-10-08' },
  { text: 'Adicionar tema claro e escuro', done: false, priority: 'alta', project: 'UI', dueDate: '2026-10-05' },
  { text: 'Ativar troca de tema', done: false, priority: 'baixa', project: 'Frontend', dueDate: '2026-10-12' }
];

const switcher = document.querySelector('.btn');
const taskForm = document.querySelector('#task-form');
const taskInput = document.querySelector('#task-input');
const taskProject = document.querySelector('#task-project');
const taskPriority = document.querySelector('#task-priority');
const taskDueDate = document.querySelector('#task-due-date');
const taskCounter = document.querySelector('#task-counter');
const projectSuggestions = document.querySelector('#project-suggestions');
const taskList = document.querySelector('.task-list');
const filterButtons = document.querySelectorAll('.filter-btn');
const clearCompletedButton = document.querySelector('#clear-completed');
const editModal = document.querySelector('#edit-modal');
const editTaskForm = document.querySelector('#edit-task-form');
const editTaskInput = document.querySelector('#edit-task-input');
const editTaskProject = document.querySelector('#edit-task-project');
const editTaskPriority = document.querySelector('#edit-task-priority');
const editTaskDueDate = document.querySelector('#edit-task-due-date');
const closeEditModalButton = document.querySelector('#close-edit-modal');
const cancelEditTaskButton = document.querySelector('#cancel-edit-task');
let currentFilter = 'all';
let editingTaskIndex = null;

const escapeHtml = function (value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const normalizeTask = function (task) {
  const validPriority = ['baixa', 'media', 'alta'].includes(task.priority) ? task.priority : 'media';
  const normalizedText = typeof task.text === 'string' ? task.text : 'Nova tarefa';
  const normalizedProject = typeof task.project === 'string' ? task.project.trim() : '';
  const normalizedDueDate = typeof task.dueDate === 'string' ? task.dueDate : '';

  return {
    text: LEGACY_TEXT_MAP[normalizedText] || normalizedText,
    done: Boolean(task.done),
    priority: validPriority,
    project: normalizedProject,
    dueDate: normalizedDueDate
  };
};

const readTasks = function () {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [...defaultTasks].map(normalizeTask);
    }

    const parsed = JSON.parse(stored);
    const normalized = Array.isArray(parsed) ? parsed.map(normalizeTask) : [...defaultTasks].map(normalizeTask);

    return normalized.length ? normalized : [...defaultTasks].map(normalizeTask);
  } catch (error) {
    console.warn('Não foi possível carregar as tarefas salvas:', error);
    return [...defaultTasks].map(normalizeTask);
  }
};

let tasks = readTasks();

const saveTasks = function () {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

const parseLocalDate = function (dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  const [year, month, day] = dateString.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const formatDueDate = function (dateString) {
  if (!dateString) {
    return 'Sem vencimento';
  }

  const date = parseLocalDate(dateString);

  if (!date) {
    return 'Sem vencimento';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

const getDaysUntilDue = function (task) {
  if (!task.dueDate || task.done) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = parseLocalDate(task.dueDate);

  if (!dueDate) {
    return null;
  }

  const diffMs = dueDate.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const shouldShowDueReminder = function (task) {
  if (!task.dueDate || task.done) {
    return false;
  }

  const daysUntilDue = getDaysUntilDue(task);
  return daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 10;
};

const getDueReminderMeta = function (task) {
  if (!task.dueDate || task.done) {
    return null;
  }

  const daysUntilDue = getDaysUntilDue(task);

  if (daysUntilDue === null || daysUntilDue < 0) {
    return null;
  }

  if (daysUntilDue === 0) {
    return { icon: '⚠', tone: 'danger', label: 'Vence hoje' };
  }

  if (daysUntilDue === 1) {
    return { icon: '⚠', tone: 'warning', label: 'Vence amanhã' };
  }

  if (daysUntilDue <= 5) {
    return { icon: '⚠', tone: 'amber', label: 'Vence em 5 dias' };
  }

  if (daysUntilDue <= 10) {
    return { icon: '⚠', tone: 'success', label: 'Vence em 10 dias' };
  }

  return null;
};

const updateTaskCounter = function () {
  const completedTasks = tasks.filter((task) => task.done).length;
  taskCounter.textContent = `${completedTasks}/${tasks.length} tarefas concluídas`;
};

const getFilteredTasks = function () {
  if (currentFilter === 'active') {
    return tasks.filter((task) => !task.done);
  }

  if (currentFilter === 'completed') {
    return tasks.filter((task) => task.done);
  }

  return tasks;
};

const updateProjectSuggestions = function () {
  if (!projectSuggestions) {
    return;
  }

  const projectNames = [...new Set(tasks.map((task) => task.project).filter(Boolean))].sort();
  projectSuggestions.innerHTML = projectNames
    .map((project) => `<option value="${escapeHtml(project)}"></option>`)
    .join('');
};

const applyPriorityStyle = function (selectElement, priority) {
  if (!selectElement) {
    return;
  }

  const color = PRIORITY_COLORS[priority] || PRIORITY_COLORS.media;
  selectElement.style.setProperty('--priority-color', color);
  selectElement.style.color = color;
  selectElement.style.borderColor = color;
  selectElement.title = PRIORITY_LABELS[priority] || PRIORITY_LABELS.media;
};

const renderTasks = function () {
  if (!taskList) {
    return;
  }

  const filteredTasks = getFilteredTasks();
  taskList.innerHTML = '';

  filteredTasks.forEach((task) => {
    const index = tasks.findIndex((item) => item === task);
    const listItem = document.createElement('li');
    listItem.className = `task-item ${task.priority} ${task.done ? 'done' : ''}`;
    listItem.draggable = currentFilter === 'all';
    listItem.dataset.index = String(index);

    const projectLabel = task.project ? escapeHtml(task.project) : 'Geral';
    const taskLabel = escapeHtml(task.text);
    const reminderMeta = shouldShowDueReminder(task) ? getDueReminderMeta(task) : null;
    const reminderHtml = reminderMeta ? `<span class="due-reminder ${reminderMeta.tone}" title="${reminderMeta.label}" aria-label="${reminderMeta.label}">${reminderMeta.icon}</span>` : '';

    listItem.innerHTML = `
      <label class="task-main">
        <input type="checkbox" ${task.done ? 'checked' : ''}>
        <span class="task-text">${taskLabel}</span>
      </label>
      <div class="task-actions">
        <span class="project-badge">${projectLabel}</span>
        ${reminderHtml}
        <select class="task-priority" aria-label="Prioridade da tarefa" title="${PRIORITY_LABELS[task.priority]}">
          <option value="baixa" ${task.priority === 'baixa' ? 'selected' : ''}>${PRIORITY_SHORT_LABELS.baixa}</option>
          <option value="media" ${task.priority === 'media' ? 'selected' : ''}>${PRIORITY_SHORT_LABELS.media}</option>
          <option value="alta" ${task.priority === 'alta' ? 'selected' : ''}>${PRIORITY_SHORT_LABELS.alta}</option>
        </select>
        <button type="button" class="edit-task" data-index="${index}" aria-label="Editar ${taskLabel}" title="Editar tarefa">🔧</button>
        <button type="button" class="remove-task" aria-label="Remover ${taskLabel}" title="Remover tarefa">🗑️</button>
      </div>
    `;

    const checkbox = listItem.querySelector('input');
    const prioritySelect = listItem.querySelector('.task-priority');
    const editButton = listItem.querySelector('.edit-task');
    const removeButton = listItem.querySelector('.remove-task');

    applyPriorityStyle(prioritySelect, task.priority);

    checkbox.addEventListener('change', function () {
      tasks[index].done = this.checked;
      saveTasks();
      renderTasks();
    });

    prioritySelect.addEventListener('change', function () {
      tasks[index].priority = this.value;
      applyPriorityStyle(this, this.value);
      saveTasks();
      renderTasks();
    });

    editButton.addEventListener('click', function () {
      openEditModal(index);
    });

    removeButton.addEventListener('click', function () {
      tasks.splice(index, 1);
      saveTasks();
      renderTasks();
    });

    if (currentFilter === 'all') {
      listItem.addEventListener('dragstart', function (event) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(index));
        listItem.classList.add('dragging');
      });

      listItem.addEventListener('dragover', function (event) {
        event.preventDefault();
        listItem.classList.add('drag-over');
      });

      listItem.addEventListener('dragleave', function () {
        listItem.classList.remove('drag-over');
      });

      listItem.addEventListener('drop', function (event) {
        event.preventDefault();
        const fromIndex = Number(event.dataTransfer.getData('text/plain'));
        const toIndex = Number(listItem.dataset.index);

        if (Number.isNaN(fromIndex) || Number.isNaN(toIndex) || fromIndex === toIndex) {
          return;
        }

        const [movedTask] = tasks.splice(fromIndex, 1);
        tasks.splice(toIndex, 0, movedTask);
        saveTasks();
        renderTasks();
      });

      listItem.addEventListener('dragend', function () {
        listItem.classList.remove('dragging');
        listItem.classList.remove('drag-over');
      });
    }

    taskList.appendChild(listItem);
  });

  updateProjectSuggestions();
  updateTaskCounter();
};

if (switcher) {
  const updateThemeButton = function () {
    const isLightTheme = document.body.classList.contains('light-theme');

    switcher.textContent = isLightTheme ? 'Escuro' : 'Claro';
    switcher.setAttribute(
      'aria-label',
      isLightTheme ? 'Alternar para tema escuro' : 'Alternar para tema claro'
    );
  };

  switcher.addEventListener('click', function () {
    document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme');
    updateThemeButton();
  });

  updateThemeButton();
}

const updatePriorityFormStyles = function () {
  applyPriorityStyle(taskPriority, taskPriority.value);
  applyPriorityStyle(editTaskPriority, editTaskPriority ? editTaskPriority.value : 'media');
};

if (taskForm && taskInput && taskProject && taskPriority && taskDueDate && taskList) {
  taskPriority.addEventListener('change', function () {
    applyPriorityStyle(this, this.value);
  });

  taskForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const taskText = taskInput.value.trim();
    const projectValue = taskProject.value.trim();
    const selectedPriority = taskPriority.value;
    const dueDateValue = taskDueDate.value;

    if (!taskText) {
      taskInput.focus();
      return;
    }

    tasks.push({
      text: taskText,
      done: false,
      priority: selectedPriority,
      project: projectValue,
      dueDate: dueDateValue
    });

    saveTasks();
    renderTasks();
    taskInput.value = '';
    taskProject.value = '';
    taskPriority.value = 'media';
    taskDueDate.value = '';
    taskInput.focus();
  });
}

filterButtons.forEach((button) => {
  button.addEventListener('click', function () {
    currentFilter = this.dataset.filter;

    filterButtons.forEach((btn) => {
      btn.classList.toggle('active', btn === this);
    }, this);

    renderTasks();
  });
});

if (clearCompletedButton) {
  clearCompletedButton.addEventListener('click', function () {
    tasks = tasks.filter((task) => !task.done);
    saveTasks();
    renderTasks();
  });
}

const closeEditModal = function () {
  if (!editModal) {
    return;
  }

  editModal.classList.remove('open');
  editModal.setAttribute('aria-hidden', 'true');
  editingTaskIndex = null;
};

const openEditModal = function (index) {
  if (!editModal || !editTaskInput || !editTaskProject || !editTaskPriority || !editTaskDueDate) {
    return;
  }

  editingTaskIndex = index;
  const task = tasks[index];

  editTaskInput.value = task.text;
  editTaskProject.value = task.project || '';
  editTaskPriority.value = task.priority;
  editTaskDueDate.value = task.dueDate || '';
  editModal.classList.add('open');
  editModal.setAttribute('aria-hidden', 'false');
  window.setTimeout(() => editTaskInput.focus(), 0);
};

if (editTaskPriority) {
  editTaskPriority.addEventListener('change', function () {
    applyPriorityStyle(this, this.value);
  });
}

if (editTaskForm) {
  editTaskForm.addEventListener('submit', function (event) {
    event.preventDefault();

    if (editingTaskIndex === null || editingTaskIndex < 0 || !tasks[editingTaskIndex]) {
      return;
    }

    const nextText = editTaskInput.value.trim();

    if (!nextText) {
      editTaskInput.focus();
      return;
    }

    tasks[editingTaskIndex].text = nextText;
    tasks[editingTaskIndex].priority = editTaskPriority.value;
    tasks[editingTaskIndex].project = editTaskProject.value.trim();
    tasks[editingTaskIndex].dueDate = editTaskDueDate.value;
    saveTasks();
    renderTasks();
    closeEditModal();
  });
}

if (closeEditModalButton) {
  closeEditModalButton.addEventListener('click', closeEditModal);
}

if (cancelEditTaskButton) {
  cancelEditTaskButton.addEventListener('click', closeEditModal);
}

if (editModal) {
  editModal.addEventListener('click', function (event) {
    if (event.target === editModal) {
      closeEditModal();
    }
  });
}

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape' && editModal && editModal.classList.contains('open')) {
    closeEditModal();
  }
});

updatePriorityFormStyles();
updateProjectSuggestions();
renderTasks();
