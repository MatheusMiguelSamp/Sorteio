const MAX_NAMES = 10;

// Estado
let names = [];
let editingIndex = null; // índice do item em edição
let winnerIndex = null;  // índice do sorteado
let drawing = false;

// Elementos
const form = document.getElementById("add-form");
const input = document.getElementById("name-input");
const addBtn = document.getElementById("add-btn");
const feedback = document.getElementById("feedback");
const countEl = document.getElementById("count");
const list = document.getElementById("names-list");
const emptyMsg = document.getElementById("empty-msg");
const drawBtn = document.getElementById("draw-btn");
const result = document.getElementById("result");

// ---------- Helpers ----------
function showFeedback(msg) {
  feedback.textContent = msg;
}

function nameExists(name, ignoreIndex = -1) {
  const lower = name.toLowerCase();
  return names.some((n, i) => i !== ignoreIndex && n.toLowerCase() === lower);
}

function clearResult() {
  winnerIndex = null;
  result.textContent = "";
}

function centerItem(index, smooth = true) {
  const li = list.children[index];
  if (!li) return;
  const top = li.offsetTop - list.clientHeight / 2 + li.clientHeight / 2;
  list.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
}

// ---------- Renderização ----------
function render() {
  list.innerHTML = "";

  names.forEach((name, index) => {
    const li = document.createElement("li");
    if (index === winnerIndex) li.classList.add("winner");

    if (index === editingIndex) {
      const editInput = document.createElement("input");
      editInput.type = "text";
      editInput.value = name;
      editInput.maxLength = 30;
      editInput.setAttribute("aria-label", "Editar nome");
      editInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") saveEdit(index, editInput.value);
        if (e.key === "Escape") cancelEdit();
      });

      const actions = document.createElement("div");
      actions.className = "actions";
      actions.append(
        makeButton("✔", "save", "Salvar", () => saveEdit(index, editInput.value)),
        makeButton("✖", "cancel", "Cancelar", cancelEdit)
      );

      li.append(editInput, actions);
      list.appendChild(li);
      editInput.focus();
      editInput.select();
      return;
    }

    const span = document.createElement("span");
    span.className = "name";
    span.textContent = name; // textContent evita injeção de HTML

    const actions = document.createElement("div");
    actions.className = "actions";
    actions.append(
      makeButton("✏️", "edit", "Editar", () => startEdit(index)),
      makeButton("🗑️", "remove", "Remover", () => removeName(index))
    );

    li.append(span, actions);
    list.appendChild(li);
  });

  const total = names.length;
  countEl.textContent = total;
  emptyMsg.hidden = total > 0;
  drawBtn.hidden = total < 2; // só aparece com 2 ou mais nomes

  const full = total >= MAX_NAMES;
  addBtn.disabled = full || drawing;
  input.disabled = drawing;
  input.placeholder = full ? "Limite de 10 nomes atingido" : "Digite um nome";
  drawBtn.disabled = drawing || editingIndex !== null;
  setActionsDisabled(drawing);

  if (winnerIndex !== null) centerItem(winnerIndex, false);
}

function makeButton(label, cls, title, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = cls;
  btn.textContent = label;
  btn.title = title;
  btn.setAttribute("aria-label", title);
  btn.addEventListener("click", onClick);
  return btn;
}

function setActionsDisabled(disabled) {
  list.querySelectorAll(".actions button").forEach((b) => (b.disabled = disabled));
}

// ---------- CRUD ----------
function addName(raw) {
  const name = raw.trim();

  if (!name) return showFeedback("Digite um nome.");
  if (names.length >= MAX_NAMES) return showFeedback("Máximo de 10 nomes.");
  if (nameExists(name)) return showFeedback("Esse nome já está na lista.");

  showFeedback("");
  clearResult();
  names.push(name);
  render();
  centerItem(names.length - 1);
}

function removeName(index) {
  if (drawing) return;
  names.splice(index, 1);
  editingIndex = null;
  clearResult();
  showFeedback("");
  render();
}

function startEdit(index) {
  if (drawing) return;
  editingIndex = index;
  clearResult();
  showFeedback("");
  render();
}

function cancelEdit() {
  editingIndex = null;
  showFeedback("");
  render();
}

function saveEdit(index, raw) {
  const name = raw.trim();

  if (!name) return showFeedback("O nome não pode ficar vazio.");
  if (nameExists(name, index)) return showFeedback("Esse nome já está na lista.");

  names[index] = name;
  editingIndex = null;
  showFeedback("");
  render();
}

// ---------- Sorteio ----------
function randomIndex(max) {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % max;
}

function draw() {
  if (drawing || names.length < 2) return;

  drawing = true;
  clearResult();
  showFeedback("");
  editingIndex = null;
  render();

  const total = names.length;
  const winner = randomIndex(total);

  // Passa pela lista ~3 vezes e termina no sorteado
  const steps = total * 3 + winner + 1;
  let current = -1;
  let step = 0;

  function tick() {
    if (current >= 0) list.children[current].classList.remove("active");

    current = (current + 1) % total;
    list.children[current].classList.add("active");
    centerItem(current);
    step++;

    if (step < steps) {
      // desacelera conforme chega ao fim
      const progress = step / steps;
      const delay = 60 + Math.pow(progress, 3) * 380;
      setTimeout(tick, delay);
    } else {
      finish(winner);
    }
  }

  tick();
}

function finish(winner) {
  drawing = false;
  winnerIndex = winner;
  render(); // aplica o destaque e centraliza o sorteado
  result.textContent = `🎉 Sorteado: ${names[winner]}`;
  centerItem(winner);
}

// ---------- Eventos ----------
form.addEventListener("submit", (e) => {
  e.preventDefault();
  addName(input.value);
  input.value = "";
  input.focus();
});

drawBtn.addEventListener("click", draw);

render();
