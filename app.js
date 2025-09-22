"use strict"; // Modo estricto: ayuda a detectar errores comunes.

/* =========================
   Referencias a elementos
   ========================= */
const taskForm = document.getElementById("task-form");                // Formulario para agregar tareas.
const taskInput = document.getElementById("task-input");              // Input de texto para la nueva tarea.
const taskList = document.getElementById("task-list");                // Lista (UL/OL) donde se pintan tareas.
const themeToggleButton = document.getElementById("toggle-theme-btn");// Botón para alternar tema oscuro/claro.
const filters = document.getElementById("filters");                   // Fieldset con radios para filtrar.
const counter = document.getElementById("counter");                   // Span que muestra conteo.

/* =========================
   Arranque de tema persistente
   ========================= */
const currentTheme = localStorage.getItem("theme");                   // Lee el tema guardado (dark|light|null).
if (currentTheme === "dark") {                                        // Si es "dark"...
  document.body.classList.add("dark-theme");                          // ...aplica clase en body.
}

/* =========================
   Estado de filtro persistente
   ========================= */
const storedFilter = localStorage.getItem("taskFilter") || "all";     // Lee filtro guardado (por defecto "all").
setActiveFilterRadio(storedFilter);                                    // Marca el radio adecuado.

/* =========================
   Utilidades de almacenamiento
   ========================= */
// Estructura de cada tarea: { id: string, text: string, done: boolean }
function getTasks() {                                                 // Obtiene arreglo de tareas del storage.
  try {
    return JSON.parse(localStorage.getItem("tasks")) || [];           // Devuelve [] si no hay nada.
  } catch {
    return [];                                                        // Si hay error de parseo, arranca vacío.
  }
}

function setTasks(tasks) {                                            // Persiste arreglo de tareas.
  try {
    localStorage.setItem("tasks", JSON.stringify(tasks));             // Serializa y guarda.
  } catch (err) {
    console.error("No se pudo guardar en localStorage:", err);        // Log del error (cuota llena, etc).
    alert("No se pudo guardar la tarea. Libera espacio o desactiva modos privados.");
  }
}

/* =========================
   Helpers de UI / IDs
   ========================= */
function uid() {                                                      // Genera ID único corto.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function setActiveFilterRadio(value) {                                // Marca el radio del filtro según valor.
  const radio = filters.querySelector(`input[name="status"][value="${value}"]`);
  if (radio) radio.checked = true;                                    // Si existe, lo marca.
}

function getActiveFilter() {                                          // Devuelve filtro activo actual.
  const checked = filters.querySelector('input[name="status"]:checked');
  return checked ? checked.value : "all";                             // "all" si nada seleccionado.
}

/* =========================
   Render
   ========================= */
function createTaskElement(task) {                                    // Crea el <li> de una tarea.
  const li = document.createElement("li");                            // Contenedor <li>.
  li.dataset.id = task.id;                                            // Guarda ID en data-attr.
  li.className = "task-item";                                         // Clase para estilos.

  const checkbox = document.createElement("input");                   // Checkbox de “hecha”.
  checkbox.type = "checkbox";                                         // Tipo checkbox.
  checkbox.className = "task-check";                                  // Clase para estilos.
  checkbox.checked = !!task.done;                                     // Estado según la tarea.
  checkbox.setAttribute("aria-label", "Marcar como completada");      // Accesible.
  li.appendChild(checkbox);                                           // Inserta checkbox.

  const text = document.createElement("span");                        // Texto de la tarea.
  text.textContent = task.text;                                       // Asigna el contenido.
  text.className = "task-text";                                       // Clase de estilos.
  if (task.done) text.classList.add("is-done");                       // Si está hecha, aplica estilo (tachado).
  li.appendChild(text);                                               // Inserta texto.

  const actions = document.createElement("div");                      // Contenedor de botones.
  actions.className = "task-actions";                                 // Clase para estilos.

  const editBtn = document.createElement("button");                   // Botón editar.
  editBtn.type = "button";                                            // Evita submit.
  editBtn.className = "edit-btn";                                     // Clase para estilos.
  editBtn.setAttribute("aria-label", "Editar tarea");                 // Accesible.
  editBtn.textContent = "✏️";                                         // Emoji.
  actions.appendChild(editBtn);                                       // Agrega botón.

  const deleteBtn = document.createElement("button");                 // Botón eliminar.
  deleteBtn.type = "button";                                          // Evita submit.
  deleteBtn.className = "delete-btn";                                 // Clase para estilos.
  deleteBtn.setAttribute("aria-label", "Eliminar tarea");             // Accesible.
  deleteBtn.textContent = "❌";                                        // Emoji.
  actions.appendChild(deleteBtn);                                     // Agrega botón.

  li.appendChild(actions);                                            // Agrega contenedor de acciones.

  return li;                                                          // Devuelve el <li> listo.
}

function renderTasks() {                                              // Pinta la lista según filtro.
  const tasks = getTasks();                                           // Toma todas las tareas.
  const filter = getActiveFilter();                                   // Filtro actual (all|active|done).

  taskList.innerHTML = "";                                            // Limpia la lista.
  const filtered = tasks.filter((t) => {                              // Aplica filtro.
    if (filter === "active") return !t.done;                          // Pendientes.
    if (filter === "done") return t.done;                             // Hechas.
    return true;                                                      // Todas.
  });

  filtered.forEach((t) => taskList.appendChild(createTaskElement(t))); // Pinta filtradas.
  updateCounter(tasks);                                               // Actualiza contador (global).
}

function updateCounter(tasks) {                                       // Actualiza badge con conteo.
  const total = tasks.length;                                         // Total tareas.
  const done = tasks.filter((t) => t.done).length;                    // Hechas.
  const pending = total - done;                                       // Pendientes.
  counter.textContent = `Total: ${total} • Pendientes: ${pending} • Hechas: ${done}`; // Texto.
}

/* =========================
   Acciones CRUD
   ========================= */
function addTask(rawText) {                                           // Agrega nueva tarea.
  const text = rawText.trim();                                        // Quita espacios sobrantes.
  if (!text) return;                                                  // No agrega si vacío.

  const tasks = getTasks();                                           // Tareas actuales.
  const existsExact = tasks.some((t) => t.text === text);             // Evita duplicados exactos.
  if (existsExact) {                                                  // Si existe...
    alert("Esa tarea ya existe.");                                    // Informa.
    return;                                                           // Detiene.
  }

  const task = { id: uid(), text, done: false };                      // Crea tarea.
  tasks.push(task);                                                   // Agrega al array.
  setTasks(tasks);                                                    // Persiste.
  renderTasks();                                                      // Re-pinta con filtro vigente.
  taskInput.value = "";                                               // Limpia input.
  taskInput.focus();                                                  // Enfoca para escribir otra.
}

function deleteTaskById(id) {                                         // Elimina por ID.
  const tasks = getTasks().filter((t) => t.id !== id);                // Filtra fuera la tarea.
  setTasks(tasks);                                                    // Persiste.
  renderTasks();                                                      // Re-pinta.
}

function toggleDoneById(id, checked) {                                // Cambia estado done.
  const tasks = getTasks();                                           // Toma tareas.
  const idx = tasks.findIndex((t) => t.id === id);                    // Busca índice.
  if (idx === -1) return;                                             // Si no existe, nada.
  tasks[idx].done = !!checked;                                        // Actualiza estado.
  setTasks(tasks);                                                    // Persiste.
  renderTasks();                                                      // Re-pinta (para que respete filtro).
}

function editTaskById(id) {                                           // Edita texto por ID.
  const tasks = getTasks();                                           // Toma tareas.
  const idx = tasks.findIndex((t) => t.id === id);                    // Busca índice.
  if (idx === -1) return;                                             // Si no existe, nada.

  const currentText = tasks[idx].text;                                // Texto actual.
  const newTextRaw = prompt("Edita la tarea:", currentText);          // Prompt edición.
  if (newTextRaw === null) return;                                    // Canceló.
  const newText = newTextRaw.trim();                                  // Quita espacios.

  if (!newText) {                                                     // Vacío no permitido.
    alert("El texto no puede estar vacío.");
    return;
  }
  const duplicated = tasks.some((t, i) => i !== idx && t.text === newText); // Duplicado exacto.
  if (duplicated) {
    alert("Ya existe otra tarea con ese texto.");
    return;
  }

  tasks[idx].text = newText;                                          // Actualiza texto.
  setTasks(tasks);                                                    // Persiste.
  renderTasks();                                                      // Re-pinta.
}

/* =========================
   Event listeners
   ========================= */
renderTasks();                                                        // Pintado inicial.

taskForm.addEventListener("submit", (event) => {                      // Al enviar formulario...
  event.preventDefault();                                             // Evita recarga.
  addTask(taskInput.value);                                           // Agrega tarea.
});

taskList.addEventListener("click", (event) => {                       // Delegación de clicks en lista.
  const target = event.target;                                        // Elemento clicado.
  if (!(target instanceof HTMLElement)) return;                       // Asegura HTML.

  const li = target.closest("li");                                    // Encuentra <li> contenedor.
  if (!li) return;                                                    // Si no hay, termina.
  const id = li.dataset.id;                                           // ID de la tarea.

  if (target.classList.contains("delete-btn")) {                      // Click en eliminar.
    if (confirm("¿Seguro que quieres borrar esta tarea?")) {          // Confirmación.
      deleteTaskById(id);                                             // Elimina.
    }
  } else if (target.classList.contains("edit-btn")) {                 // Click en editar.
    editTaskById(id);                                                 // Edita.
  }
});

taskList.addEventListener("change", (event) => {                      // Cambios (checkbox).
  const target = event.target;                                        // Elemento origen.
  if (!(target instanceof HTMLInputElement)) return;                  // Debe ser input.
  if (target.type !== "checkbox") return;                             // Solo si es checkbox.

  const li = target.closest("li");                                    // <li> contenedor.
  if (!li) return;                                                    // Sin <li>, nada.
  toggleDoneById(li.dataset.id, target.checked);                      // Cambia estado.
});

filters.addEventListener("change", () => {                            // Cambio de filtro (radios).
  const value = getActiveFilter();                                    // Lee filtro activo.
  localStorage.setItem("taskFilter", value);                          // Persiste preferencia.
  renderTasks();                                                      // Re-pinta según filtro.
});

themeToggleButton.addEventListener("click", () => {                   // Alternar tema.
  document.body.classList.toggle("dark-theme");                       // Cambia clase.
  const theme = document.body.classList.contains("dark-theme")        // Determina valor...
    ? "dark"
    : "light";
  localStorage.setItem("theme", theme);                               // Persiste.
});
