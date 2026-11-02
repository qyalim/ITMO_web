'use strict';

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function button(text, action, className = 'button') {
  const node = element('button', className, text);
  node.type = 'button';
  node.addEventListener('click', action);
  return node;
}
function field(labelText, input) {
  const label = element('label', 'field');
  label.append(element('span', '', labelText), input);
  return label;
}
function input(type, placeholder = '') {
  const node = element('input');
  node.type = type;
  node.placeholder = placeholder;
  return node;
}
function select(options) {
  const node = element('select');
  for (const [value, title] of options) {
    const option = element('option', '', title);
    option.value = value;
    node.append(option);
  }
  return node;
}

document.title = 'ToDo';
const css = element('link');
css.rel = 'stylesheet';
css.href = 'style.css';
document.head.append(css);

const STORAGE_KEY = 'web-lab-2-tasks';
let tasks = [];
let editingId = null;
let draggedId = null;
let storageWarning = '';
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if (!Array.isArray(saved)) throw new Error('Invalid data');
  tasks = saved.filter(task => task && typeof task.id === 'string' &&
    typeof task.title === 'string' && typeof task.date === 'string' &&
    typeof task.completed === 'boolean');
} catch {
  storageWarning = 'Не удалось прочитать сохранённые задачи. Можно продолжить работу.';
}

const main = element('main', 'app');
const header = element('header', 'header');
const HEADING_KEY = 'web-lab-2-heading';

const headingRow = element('div', 'heading-row');
const heading = element('h1', '', 'Мой день');

try {
  const savedHeading = localStorage.getItem(HEADING_KEY);
  if (savedHeading?.trim()) {
    heading.textContent = savedHeading;
  }
} catch {
  // При недоступном хранилище используем стандартное название.
}

const editHeading = button('✎', () => {
  const value = prompt('Название списка:', heading.textContent);

  // Нажатие «Отмена» или пустая строка оставляют название прежним.
  if (value === null || !value.trim()) return;

  const newHeading = value.trim().slice(0, 60);
  heading.textContent = newHeading;
  document.title = `${newHeading} — список задач`;

  try {
    localStorage.setItem(HEADING_KEY, newHeading);
  } catch {
    message.textContent = 'Название изменено, но сохранить его не удалось.';
  }
}, 'heading-edit');

editHeading.title = 'Изменить название';
editHeading.setAttribute('aria-label', 'Изменить название списка');

headingRow.append(editHeading, heading);
document.title = `${heading.textContent} — список задач`;

header.append(
  element('p', 'eyebrow', 'ЛАБОРАТОРНАЯ РАБОТА № 2'),
  headingRow,
  element('p', 'subtitle', 'Освободи голову. Запиши главное.')
);
const counter = element('p', 'counter');
header.append(counter);

const form = element('form', 'panel task-form');
const titleInput = input('text', 'Например, сделать сальто');
titleInput.required = true;
titleInput.maxLength = 200;
const dateInput = input('date');
const submit = element('button', 'button primary', 'Добавить задачу');
submit.type = 'submit';
const cancel = button('Отменить', resetForm);
cancel.hidden = true;
form.append(field('Что нужно сделать?', titleInput), field('Дата', dateInput), submit, cancel);

const controls = element('section', 'controls');
controls.setAttribute('aria-label', 'Поиск и фильтры');
const search = input('search', 'Найти задачу…');
const status = select([['all', 'Все задачи'], ['active', 'Невыполненные'], ['done', 'Выполненные']]);
const sort = select([['manual', 'Мой порядок'], ['asc', 'Сначала ближайшие'], ['desc', 'Сначала поздние']]);
const dateFilter = input('date');
controls.append(field('Поиск по названию', search), field('Статус', status),
  field('Порядок', sort), field('Задачи на дату', dateFilter));
const hint = element('p', 'hint', 'Перетаскивай задачи за ⋮⋮ в режиме «Мой порядок». Кнопки ↑ и ↓ тоже меняют порядок.');
const message = element('p', 'message');
message.setAttribute('role', 'status');
message.textContent = storageWarning;
const list = element('ul', 'task-list');
list.setAttribute('aria-label', 'Задачи');
const empty = element('p', 'empty');
const footer = element('footer', 'footer', 'Каждое завершённое дело делает путь ближе.');
main.append(header, form, controls, hint, message, list, empty, footer);
document.body.append(main);

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    message.textContent = '';
  } catch {
    message.textContent = 'Не удалось сохранить задачи. Проверь настройки хранилища браузера.';
  }
  render();
}
function resetForm() {
  editingId = null;
  form.reset();
  submit.textContent = 'Добавить задачу';
  cancel.hidden = true;
}
form.addEventListener('submit', event => {
  event.preventDefault();
  const title = titleInput.value.trim();
  if (!title) {
    titleInput.setCustomValidity('Введите название задачи.');
    titleInput.reportValidity();
    return;
  }
  if (editingId !== null) {
    const task = tasks.find(item => item.id === editingId);
    if (task) Object.assign(task, { title, date: dateInput.value });
  } else {
    tasks.push({ id: crypto.randomUUID(), title, date: dateInput.value, completed: false });
  }
  resetForm();
  save();
  titleInput.focus();
});
titleInput.addEventListener('input', () => titleInput.setCustomValidity(''));
for (const control of [search, status, sort, dateFilter]) control.addEventListener('input', render);

function visibleTasks() {
  const query = search.value.trim().toLocaleLowerCase('ru');
  const result = tasks.filter(task => task.title.toLocaleLowerCase('ru').includes(query) &&
    (status.value === 'all' || (status.value === 'done' ? task.completed : !task.completed)) &&
    (!dateFilter.value || task.date === dateFilter.value));
  if (sort.value !== 'manual') result.sort((a, b) => {
    // Задачи без даты всегда находятся в конце.
    if (!a.date) return b.date ? 1 : 0;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date) * (sort.value === 'asc' ? 1 : -1);
  });
  return result;
}
function moveTask(sourceId, targetId) {
  if (sort.value !== 'manual' || sourceId === targetId) return;
  const from = tasks.findIndex(task => task.id === sourceId);
  const to = tasks.findIndex(task => task.id === targetId);
  if (from < 0 || to < 0) return;
  const [task] = tasks.splice(from, 1);
  tasks.splice(to, 0, task);
  save();
}
function render() {
  list.replaceChildren();
  const done = tasks.filter(task => task.completed).length;
  counter.textContent = `${tasks.length - done} осталось · ${done} выполнено`;
  const visible = visibleTasks();
  empty.hidden = visible.length > 0;
  empty.textContent = tasks.length ? 'По этим условиям задач нет. Измени поиск или фильтры.' : 'Пока здесь чистый лист. Добавь первую задачу выше.';
  visible.forEach((task, index) => {
    const item = element('li', `task${task.completed ? ' completed' : ''}`);
    item.draggable = sort.value === 'manual';
    const handle = element('span', 'handle', '⋮⋮');
    handle.setAttribute('aria-hidden', 'true');
    const check = input('checkbox');
    check.checked = task.completed;
    check.setAttribute('aria-label', `Выполнено: ${task.title}`);
    check.addEventListener('change', () => { task.completed = check.checked; save(); });
    const content = element('div', 'task-content');
    content.append(element('p', 'task-title', task.title));
    const date = element(task.date ? 'time' : 'span', 'task-date', task.date ?
      new Date(`${task.date}T00:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Без даты');
    if (task.date) date.dateTime = task.date;
    content.append(date);
    const actions = element('div', 'actions');
    const up = button('↑', () => moveTask(task.id, visible[index - 1]?.id), 'icon-button');
    up.disabled = sort.value !== 'manual' || index === 0;
    up.setAttribute('aria-label', `Поднять: ${task.title}`);
    const down = button('↓', () => moveTask(task.id, visible[index + 1]?.id), 'icon-button');
    down.disabled = sort.value !== 'manual' || index === visible.length - 1;
    down.setAttribute('aria-label', `Опустить: ${task.title}`);
    const edit = button('Изменить', () => {
      editingId = task.id;
      titleInput.value = task.title;
      dateInput.value = task.date;
      submit.textContent = 'Сохранить';
      cancel.hidden = false;
      titleInput.focus();
    }, 'button subtle');
    const remove = button('Удалить', () => {
      tasks = tasks.filter(item => item.id !== task.id);
      if (editingId === task.id) resetForm();
      save();
    }, 'button danger');
    actions.append(up, down, edit, remove);
    item.append(handle, check, content, actions);
    item.addEventListener('dragstart', event => {
      if (sort.value !== 'manual') { event.preventDefault(); return; }
      draggedId = task.id;
      event.dataTransfer.setData('text/plain', task.id);
      event.dataTransfer.effectAllowed = 'move';
      item.classList.add('dragging');
    });
    item.addEventListener('dragover', event => {
      if (draggedId && sort.value === 'manual') { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }
    });
    item.addEventListener('drop', event => {
      event.preventDefault();
      if (draggedId) moveTask(draggedId, task.id);
      draggedId = null;
    });
    item.addEventListener('dragend', () => { draggedId = null; item.classList.remove('dragging'); });
    list.append(item);
  });
}
render();
