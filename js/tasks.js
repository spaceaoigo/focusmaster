/**
 * Tasks Module
 */

const Tasks = {
    currentFilter: 'all',
    elements: {},

    // Initialize
    init() {
        this.cacheElements();
        this.bindEvents();
        this.render();
    },

    // Cache DOM elements
    cacheElements() {
        this.elements = {
            tasksList: document.getElementById('tasksList'),
            tasksEmpty: document.getElementById('tasksEmpty'),
            addTaskForm: document.getElementById('addTaskForm'),
            taskInput: document.getElementById('taskInput'),
            taskPriority: document.getElementById('taskPriority'),
            taskPomodoros: document.getElementById('taskPomodoros'),
            filterBtns: document.querySelectorAll('.filter-btn')
        };
    },

    // Bind events
    bindEvents() {
        // Add task form
        this.elements.addTaskForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Filter buttons
        this.elements.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentFilter = btn.dataset.filter;
                this.updateFilterButtons();
                this.render();
            });
        });
    },

    // Add task
    addTask() {
        const name = this.elements.taskInput?.value.trim();
        if (!name) return;

        const task = {
            id: generateId(),
            name,
            priority: this.elements.taskPriority?.value || 'medium',
            estimatedPomodoros: parseInt(this.elements.taskPomodoros?.value) || 1,
            completedPomodoros: 0,
            completed: false,
            createdAt: new Date().toISOString()
        };

        TaskStorage.add(task);

        // Clear form
        if (this.elements.taskInput) this.elements.taskInput.value = '';
        if (this.elements.taskPomodoros) this.elements.taskPomodoros.value = 1;

        // Log activity
        ActivityStorage.add({
            type: 'task_add',
            icon: '📝',
            title: 'タスクを追加',
            detail: name
        });

        this.render();
        showToast('タスクを追加しました', 'success');
    },

    // Toggle task completion
    toggleComplete(id) {
        const tasks = TaskStorage.getAll();
        const task = tasks.find(t => t.id === id);

        if (task) {
            const completed = !task.completed;
            TaskStorage.update(id, {
                completed,
                completedAt: completed ? new Date().toISOString() : null
            });

            if (completed) {
                StatsStorage.incrementTasksCompleted();

                ActivityStorage.add({
                    type: 'task_complete',
                    icon: '✅',
                    title: 'タスクを完了',
                    detail: task.name
                });

                // If this was the selected task, clear it
                if (Timer.selectedTaskId === id) {
                    Timer.clearSelectedTask();
                }
            }

            this.render();
        }
    },

    // Delete task
    deleteTask(id) {
        if (!confirm('このタスクを削除しますか？')) return;

        const task = TaskStorage.getAll().find(t => t.id === id);
        TaskStorage.delete(id);

        // Clear selection if deleted task was selected
        if (Timer.selectedTaskId === id) {
            Timer.clearSelectedTask();
        }

        ActivityStorage.add({
            type: 'task_delete',
            icon: '🗑️',
            title: 'タスクを削除',
            detail: task?.name
        });

        this.render();
        showToast('タスクを削除しました', 'info');
    },

    // Select task for timer
    selectTask(id) {
        const task = TaskStorage.getAll().find(t => t.id === id);
        if (task && !task.completed) {
            Timer.selectTask(id, task.name);
            this.render();
            showToast(`「${task.name}」を選択しました`, 'success');

            // Switch to timer view
            showView('timer');
        }
    },

    // Edit task
    editTask(id) {
        const task = TaskStorage.getAll().find(t => t.id === id);
        if (!task) return;

        const newName = prompt('タスク名を編集:', task.name);
        if (newName && newName.trim()) {
            TaskStorage.update(id, { name: newName.trim() });

            // Update timer display if this is selected task
            if (Timer.selectedTaskId === id) {
                Timer.updateCurrentTask(newName.trim());
            }

            this.render();
        }
    },

    // Get filtered tasks
    getFilteredTasks() {
        const tasks = TaskStorage.getAll();

        switch (this.currentFilter) {
            case 'active':
                return tasks.filter(t => !t.completed);
            case 'completed':
                return tasks.filter(t => t.completed);
            default:
                return tasks;
        }
    },

    // Sort tasks
    sortTasks(tasks) {
        const priorityOrder = { high: 0, medium: 1, low: 2 };

        return tasks.sort((a, b) => {
            // Completed tasks at bottom
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            // Then by priority
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            // Then by creation date (newest first)
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    },

    // Render tasks
    render() {
        if (!this.elements.tasksList) return;

        const tasks = this.sortTasks(this.getFilteredTasks());

        // Toggle empty state
        if (this.elements.tasksEmpty) {
            this.elements.tasksEmpty.classList.toggle('show', tasks.length === 0);
        }

        if (tasks.length === 0) {
            this.elements.tasksList.innerHTML = '';
            return;
        }

        this.elements.tasksList.innerHTML = tasks.map(task => this.renderTask(task)).join('');

        // Bind task events
        this.bindTaskEvents();
    },

    // Render single task
    renderTask(task) {
        const isSelected = Timer.selectedTaskId === task.id;
        const pomodoroProgress = task.completedPomodoros ?
            `${task.completedPomodoros}/${task.estimatedPomodoros}` :
            `0/${task.estimatedPomodoros}`;

        return `
            <div class="task-item ${task.completed ? 'completed' : ''} ${isSelected ? 'selected' : ''}" 
                 data-id="${task.id}" draggable="true">
                <label class="task-checkbox">
                    <input type="checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="task-checkbox-custom">
                        <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </span>
                </label>
                <div class="task-content">
                    <span class="task-name">${escapeHtml(task.name)}</span>
                    <div class="task-meta">
                        <span class="priority-badge ${task.priority}">${priorityToLabel(task.priority)}</span>
                        <span class="task-pomodoro-count">🍅 ${pomodoroProgress}</span>
                    </div>
                </div>
                <div class="task-actions">
                    ${!task.completed ? `
                        <button class="task-action-btn select" title="タイマーに設定">
                            <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/></svg>
                        </button>
                    ` : ''}
                    <button class="task-action-btn edit" title="編集">
                        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" fill="none" stroke="currentColor" stroke-width="2"/></svg>
                    </button>
                    <button class="task-action-btn delete" title="削除">
                        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" fill="none" stroke="currentColor" stroke-width="2"/></svg>
                    </button>
                </div>
            </div>
        `;
    },

    // Bind events to task items
    bindTaskEvents() {
        const taskItems = this.elements.tasksList.querySelectorAll('.task-item');

        taskItems.forEach(item => {
            const id = item.dataset.id;

            // Checkbox
            const checkbox = item.querySelector('.task-checkbox input');
            checkbox?.addEventListener('change', () => this.toggleComplete(id));

            // Select button
            const selectBtn = item.querySelector('.task-action-btn.select');
            selectBtn?.addEventListener('click', () => this.selectTask(id));

            // Edit button
            const editBtn = item.querySelector('.task-action-btn.edit');
            editBtn?.addEventListener('click', () => this.editTask(id));

            // Delete button
            const deleteBtn = item.querySelector('.task-action-btn.delete');
            deleteBtn?.addEventListener('click', () => this.deleteTask(id));

            // Drag and drop
            item.addEventListener('dragstart', (e) => this.handleDragStart(e, id));
            item.addEventListener('dragover', (e) => this.handleDragOver(e));
            item.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            item.addEventListener('drop', (e) => this.handleDrop(e, id));
            item.addEventListener('dragend', () => this.handleDragEnd());
        });
    },

    // Update filter buttons
    updateFilterButtons() {
        this.elements.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === this.currentFilter);
        });
    },

    // Drag and Drop handlers
    draggedId: null,

    handleDragStart(e, id) {
        this.draggedId = id;
        e.target.classList.add('dragging');
    },

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    },

    handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    },

    handleDrop(e, targetId) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');

        if (this.draggedId && this.draggedId !== targetId) {
            const tasks = TaskStorage.getAll();
            const draggedIndex = tasks.findIndex(t => t.id === this.draggedId);
            const targetIndex = tasks.findIndex(t => t.id === targetId);

            if (draggedIndex !== -1 && targetIndex !== -1) {
                const [draggedTask] = tasks.splice(draggedIndex, 1);
                tasks.splice(targetIndex, 0, draggedTask);
                TaskStorage.save(tasks);
                this.render();
            }
        }
    },

    handleDragEnd() {
        this.draggedId = null;
        document.querySelectorAll('.task-item').forEach(item => {
            item.classList.remove('dragging', 'drag-over');
        });
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    Tasks.init();
});
