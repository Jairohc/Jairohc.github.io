let appData = {};

document.addEventListener("DOMContentLoaded", async () => {
    await loadData();
    checkDailyReset(); // Reinicia checkboxes si es un nuevo día
    
    // Configurar UI
    setupDaySelector();
    const today = new Date().getDay().toString();
    const initialDay = appData.routines[today] ? today : "1";
    document.getElementById('daySelector').value = initialDay;
    
    renderRoutine(initialDay);
    renderNutrition();
    setupLocalBackend();

    // Eventos de Pestañas
    document.getElementById('tabWorkout').addEventListener('click', () => switchTab('workout'));
    document.getElementById('tabDiet').addEventListener('click', () => switchTab('diet'));
});

// --- PESTAÑAS ---
function switchTab(tabName) {
    document.getElementById('tabWorkout').classList.toggle('active', tabName === 'workout');
    document.getElementById('tabDiet').classList.toggle('active', tabName === 'diet');
    document.getElementById('workoutSection').classList.toggle('active', tabName === 'workout');
    document.getElementById('dietSection').classList.toggle('active', tabName === 'diet');
}

// --- DATOS Y RESET ---
async function loadData() {
    const localData = localStorage.getItem('miEntrenamiento');
    if (localData) {
        appData = JSON.parse(localData);
    } else {
        try {
            const response = await fetch('data.json');
            appData = await response.json();
        } catch (error) {
            console.error("Error cargando data.json:", error);
        }
    }
}

function saveData() {
    localStorage.setItem('miEntrenamiento', JSON.stringify(appData));
}

// Reinicia los checkboxes si detecta que cambió de día
function checkDailyReset() {
    const todayStr = new Date().toLocaleDateString();
    if (appData.lastLoginDate !== todayStr) {
        for (let day in appData.routines) {
            appData.routines[day].exercises.forEach(ex => {
                ex.completed = false;
            });
        }
        appData.lastLoginDate = todayStr;
        saveData();
    }
}

// --- ENTRENAMIENTO ---
function setupDaySelector() {
    const selector = document.getElementById('daySelector');
    selector.innerHTML = '';
    for (let dayKey in appData.routines) {
        const option = document.createElement('option');
        option.value = dayKey;
        option.textContent = appData.routines[dayKey].name.split(':')[0]; 
        selector.appendChild(option);
    }
    selector.addEventListener('change', (e) => renderRoutine(e.target.value));
}

function renderRoutine(dayKey) {
    const routine = appData.routines[dayKey];
    const exercisesContainer = document.getElementById('exercisesContainer');
    const cardioSection = document.getElementById('cardioSection');

    cardioSection.innerHTML = `<strong>Cardio:</strong> ${routine.cardio}`;
    exercisesContainer.innerHTML = '';

    if (!routine.exercises || routine.exercises.length === 0) {
        exercisesContainer.innerHTML = '<p>Día de descanso o actividad libre.</p>';
        return;
    }

    routine.exercises.forEach((exercise) => {
        if (typeof exercise.completed === 'undefined') exercise.completed = false;
        if (!exercise.originalName) exercise.originalName = exercise.name;
        if (!exercise.lastRecord) exercise.lastRecord = ''; // Inicializar campo de pesos

        const card = document.createElement('div');
        card.className = `exercise-card ${exercise.completed ? 'completed' : ''}`;

        const header = document.createElement('div');
        header.className = 'exercise-header';

        const title = document.createElement('h3');
        title.innerText = exercise.name;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = exercise.completed;
        checkbox.onchange = (e) => {
            exercise.completed = e.target.checked;
            card.classList.toggle('completed', exercise.completed);
            saveData();
        };

        header.appendChild(title);
        header.appendChild(checkbox);

        const details = document.createElement('div');
        details.className = 'exercise-details';
        details.innerHTML = `
            <p><strong>Detalle:</strong> ${exercise.detail}</p>
            ${exercise.tempo ? `<p><strong>Tempo:</strong> ${exercise.tempo}</p>` : ''}
            <p><strong>RIR Objetivo:</strong> ${exercise.rir || 'N/A'}</p>
        `;

        // Input minimalista de pesos
        const recordDiv = document.createElement('div');
        recordDiv.innerHTML = `<input type="text" class="weight-input" placeholder="Registro: Ej. 80kg x 8,8,6" value="${exercise.lastRecord}">`;
        recordDiv.querySelector('input').addEventListener('change', (e) => {
            exercise.lastRecord = e.target.value;
            saveData();
        });

        const altsDiv = document.createElement('div');
        altsDiv.className = 'exercise-alternatives';
        
        if (exercise.alternatives && exercise.alternatives.length > 0) {
            const selectAlt = document.createElement('select');
            selectAlt.innerHTML = `<option value="">🔄 Cambiar ejercicio...</option>`;
            
            if (exercise.name !== exercise.originalName) {
                const optOriginal = document.createElement('option');
                optOriginal.value = exercise.originalName;
                optOriginal.textContent = `⬅️ Volver al original: ${exercise.originalName.split(':')[0]}`;
                selectAlt.appendChild(optOriginal);
            }

            exercise.alternatives.forEach(alt => {
                if (alt !== exercise.name) {
                    const opt = document.createElement('option');
                    opt.value = alt;
                    opt.textContent = alt;
                    selectAlt.appendChild(opt);
                }
            });

            selectAlt.onchange = (e) => {
                if (e.target.value) {
                    exercise.name = e.target.value;
                    exercise.completed = false; 
                    saveData();
                    renderRoutine(dayKey);
                }
            };
            altsDiv.appendChild(selectAlt);
        }

        card.appendChild(header);
        card.appendChild(details);
        card.appendChild(recordDiv); // Se añade el input de peso
        card.appendChild(altsDiv);
        exercisesContainer.appendChild(card);
    });
}

// --- LÓGICA DE NUTRICIÓN INTELIGENTE ---
function getCurrentMealCategory() {
    const hour = new Date().getHours();
    if (hour < 11) return 'breakfast';          
    if (hour >= 11 && hour < 14) return 'snacks'; 
    if (hour >= 14 && hour < 19) return 'lunch';  
    return 'dinner';                              
}

function renderNutrition() {
    const container = document.getElementById('nutritionContainer');
    container.innerHTML = '';
    const plan = appData.nutritionPlan;
    if (!plan) return;

    if (!appData.mealPreferences) {
        appData.mealPreferences = { breakfast: 0, lunch: 0, snacks: 0, dinner: 0 };
    }

    const currentCat = getCurrentMealCategory();
    const categories = [
        { key: 'breakfast', title: '🍳 Desayuno' },
        { key: 'snacks', title: '🍎 Snacks' },
        { key: 'lunch', title: '🍲 Comida (Pre-Entreno)' },
        { key: 'dinner', title: '🍽️ Cena (Post-Entreno)' }
    ];

    categories.forEach(cat => {
        if (plan[cat.key] && plan[cat.key].length > 0) {
            const section = document.createElement('div');
            section.className = 'nutrition-category';
            const card = document.createElement('div');
            card.className = `meal-card ${currentCat === cat.key ? 'active-time' : ''}`;

            const headerInfo = document.createElement('div');
            headerInfo.className = 'meal-header-info';
            let headerHTML = `<h2>${cat.title}</h2>`;
            if(currentCat === cat.key) headerHTML += `<span class="current-badge">¡Hora Actual!</span>`;
            headerInfo.innerHTML = headerHTML;
            card.appendChild(headerInfo);

            const select = document.createElement('select');
            select.className = 'meal-selector';
            plan[cat.key].forEach((meal, index) => {
                const opt = document.createElement('option');
                opt.value = index;
                opt.textContent = meal.name;
                select.appendChild(opt);
            });

            const savedIndex = appData.mealPreferences[cat.key] || 0;
            select.value = savedIndex;

            const ingredientsDiv = document.createElement('div');
            const renderIngredients = (index) => {
                const meal = plan[cat.key][index];
                let ingHtml = `<ul class="ingredient-list">`;
                meal.ingredients.forEach(ing => {
                    ingHtml += `<li><span>${ing.icon}</span> <span><strong>${ing.qty} ${ing.unit}</strong> ${ing.name}</span></li>`;
                    if (ing.subs && ing.subs.length > 0) {
                        ingHtml += `<ul class="subs-list">`;
                        ing.subs.forEach(sub => {
                            ingHtml += `<li>Opción: ${sub.icon} <strong>${sub.qty} ${sub.unit}</strong> ${sub.name}</li>`;
                        });
                        ingHtml += `</ul>`;
                    }
                });
                ingHtml += `</ul>`;
                ingredientsDiv.innerHTML = ingHtml;
            };

            renderIngredients(savedIndex);

            select.addEventListener('change', (e) => {
                const newIndex = parseInt(e.target.value);
                appData.mealPreferences[cat.key] = newIndex;
                saveData(); 
                renderIngredients(newIndex);
            });

            card.appendChild(select);
            card.appendChild(ingredientsDiv);
            section.appendChild(card);
            container.appendChild(section);
        }
    });

    if (plan.equivalents && plan.equivalents.length > 0) {
        const eqSection = document.createElement('div');
        eqSection.className = 'nutrition-category';
        eqSection.innerHTML = `<h2>⚠️ Reglas y Equivalencias</h2><div class="equivalents-card"><ul class="ingredient-list"></ul></div>`;
        const ul = eqSection.querySelector('ul');
        plan.equivalents.forEach(rule => {
            const icon = rule.split(' ')[0];
            const text = rule.substring(icon.length).trim();
            ul.innerHTML += `<li><span>${icon}</span> <span>${text}</span></li>`;
        });
        container.appendChild(eqSection);
    }
}

// --- BACKEND LOCAL (EXPORTAR / IMPORTAR) ---
function setupLocalBackend() {
    // Exportar
    document.getElementById('btnExport').addEventListener('click', () => {
        const dataStr = JSON.stringify(appData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().split('T')[0];
        a.download = `gym_backup_${date}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    // Importar
    document.getElementById('fileImport').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const importedData = JSON.parse(event.target.result);
                if (importedData.routines && importedData.nutritionPlan) {
                    appData = importedData;
                    saveData();
                    alert("¡Respaldo importado con éxito!");
                    location.reload(); 
                } else {
                    alert("Formato incorrecto. Asegúrate de subir el archivo correcto.");
                }
            } catch (err) {
                alert("Error al procesar el archivo JSON.");
            }
        };
        reader.readAsText(file);
    });
}
