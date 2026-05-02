class TodoApp {
  constructor() {
    this.todos = this.load();
    this.filter = "all";
    this.dragSrcIndex = null;

    this.input = document.getElementById("todo-input");
    this.dateInput = document.getElementById("todo-date");
    this.addBtn = document.getElementById("add-btn");
    this.list = document.getElementById("todo-list");
    this.itemsLeft = document.getElementById("items-left");
    this.clearBtn = document.getElementById("clear-completed");

    this.addBtn.addEventListener("click", () => this.add());
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.add();
    });

    this.list.addEventListener("click", (e) => this.handleClick(e));
    this.list.addEventListener("dblclick", (e) => this.handleDblClick(e));
    this.list.addEventListener("keydown", (e) => this.handleEditKey(e));
    this.list.addEventListener("dragstart", (e) => this.handleDragStart(e));
    this.list.addEventListener("dragover", (e) => this.handleDragOver(e));
    this.list.addEventListener("dragend", (e) => this.handleDragEnd(e));
    this.list.addEventListener("drop", (e) => this.handleDrop(e));

    this.clearBtn.addEventListener("click", () => this.clearCompleted());

    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelector(".filter-btn.active").classList.remove("active");
        btn.classList.add("active");
        this.filter = btn.dataset.filter;
        this.render();
      });
    });

    this.render();
  }

  load() {
    try {
      const data = localStorage.getItem("todos");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  save() {
    localStorage.setItem("todos", JSON.stringify(this.todos));
  }

  add() {
    const text = this.input.value.trim();
    if (!text) return;

    const due = this.dateInput.value || null;

    this.todos.push({
      id: Date.now(),
      text,
      completed: false,
      due,
      createdAt: new Date().toISOString(),
    });

    this.input.value = "";
    this.dateInput.value = "";
    this.save();
    this.render();
  }

  toggle(id) {
    const todo = this.todos.find((t) => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      this.save();
      this.render();
    }
  }

  delete(id) {
    this.todos = this.todos.filter((t) => t.id !== id);
    this.save();
    this.render();
  }

  clearCompleted() {
    this.todos = this.todos.filter((t) => !t.completed);
    this.save();
    this.render();
  }

  edit(id, newText) {
    const todo = this.todos.find((t) => t.id === id);
    if (todo && newText.trim()) {
      todo.text = newText.trim();
      this.save();
      this.render();
    }
  }

  getFiltered() {
    if (this.filter === "active") return this.todos.filter((t) => !t.completed);
    if (this.filter === "completed") return this.todos.filter((t) => t.completed);
    return this.todos;
  }

  isOverdue(due) {
    if (!due) return false;
    const today = new Date().toISOString().split("T")[0];
    return due < today;
  }

  handleClick(e) {
    const item = e.target.closest(".todo-item");
    if (!item) return;
    const id = Number(item.dataset.id);

    if (e.target.matches(".todo-checkbox")) {
      this.toggle(id);
    } else if (e.target.matches(".todo-delete")) {
      this.delete(id);
    }
  }

  handleDblClick(e) {
    const item = e.target.closest(".todo-item");
    if (!item) return;
    const span = item.querySelector(".todo-text");
    if (span.isContentEditable) return;

    span.contentEditable = true;
    span.focus();
    const range = document.createRange();
    range.selectNodeContents(span);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  handleEditKey(e) {
    const span = e.target;
    if (!span.matches(".todo-text") || !span.isContentEditable) return;

    const item = span.closest(".todo-item");
    const id = Number(item.dataset.id);

    if (e.key === "Enter") {
      e.preventDefault();
      span.contentEditable = false;
      this.edit(id, span.textContent);
    } else if (e.key === "Escape") {
      span.contentEditable = false;
      this.render();
    }
  }

  handleDragStart(e) {
    const item = e.target.closest(".todo-item");
    if (!item) return;
    this.dragSrcIndex = this.todos.findIndex(
      (t) => t.id === Number(item.dataset.id)
    );
    item.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  handleDragEnd(e) {
    const item = e.target.closest(".todo-item");
    if (item) item.classList.remove("dragging");
    this.dragSrcIndex = null;
  }

  handleDrop(e) {
    e.preventDefault();
    const item = e.target.closest(".todo-item");
    if (!item || this.dragSrcIndex === null) return;

    const dropIndex = this.todos.findIndex(
      (t) => t.id === Number(item.dataset.id)
    );
    if (dropIndex === this.dragSrcIndex) return;

    const [moved] = this.todos.splice(this.dragSrcIndex, 1);
    this.todos.splice(dropIndex, 0, moved);
    this.save();
    this.render();
  }

  render() {
    const filtered = this.getFiltered();
    this.list.innerHTML = filtered
      .map(
        (todo) => `
      <li class="todo-item${todo.completed ? " completed" : ""}"
          data-id="${todo.id}" draggable="true">
        <input type="checkbox" class="todo-checkbox"
          ${todo.completed ? " checked" : ""}>
        <span class="todo-text">${this.escape(todo.text)}</span>
        ${todo.due ? `<span class="todo-due${this.isOverdue(todo.due) && !todo.completed ? " overdue" : ""}">${todo.due}</span>` : ""}
        <button class="todo-delete">&times;</button>
      </li>
    `
      )
      .join("");

    const activeCount = this.todos.filter((t) => !t.completed).length;
    this.itemsLeft.textContent = `${activeCount} item${activeCount !== 1 ? "s" : ""} left`;
  }

  escape(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new TodoApp();
});
