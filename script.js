let appData = {};
let restTimerInterval;

document.addEventListener("DOMContentLoaded", async () => {
    await loadData();
    checkDailyReset(); 
    
    setupDaySelector();
    const today = new Date().getDay().toString();
    const initialDay = appData.routines[today] ? today : "1";
    document.getElementById('daySelector').value = initialDay;
    
    renderRoutine(initialDay);
    renderNutrition();
    setupLocalBackend();

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

// --- DATOS Y RESET AUTOMÁTICO ---
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

function checkDailyReset() {
    const todayStr = new Date().toLocaleDateString();
    if (appData.lastLoginDate !== todayStr) {
        for (let day in appData.routines) {
            appData.routines[day].exercises.forEach(ex => {
                ex.prevWeight = ex.weight || 0;
                ex.completed = false;
            });
        }
        appData.lastLoginDate = todayStr;
        saveData();
    }
}

// --- TEMPORIZADOR DE DESCANSO ---
function startTimer(seconds) {
    clearInterval(restTimerInterval);
    let timeRemaining = seconds;
    const display = document.getElementById('timerDisplay');
    const timerDiv = document.getElementById('floatingTimer');
    
    timerDiv.style.display = 'flex';
    
    restTimerInterval = setInterval(() => {
        let m = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
        let s = (timeRemaining % 60).toString().padStart(2, '0');
        display.innerText = `${m}:${s}`;
        
        if (timeRemaining <= 0) {
            clearInterval(restTimerInterval);
            display.innerText = "¡TIEMPO!";
            if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
        }
        timeRemaining--;
    }, 1000);
}

function stopTimer() {
    clearInterval(restTimerInterval);
    document.getElementById('floatingTimer').style.display = 'none';
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

function updateDeltaVisual(exercise, weightSpan) {
    if(typeof exercise.prevWeight === 'undefined') exercise.prevWeight = exercise.weight || 0;
    
    let delta = parseFloat((exercise.weight - exercise.prevWeight).toFixed(1));
    let deltaClass = delta > 0 ? 'delta-positive' : (delta < 0 ? 'delta-negative' : 'delta-neutral');
    let deltaText = delta > 0 ? `(↑ +${delta} kg)` : (delta < 0 ? `(↓ ${delta} kg)` : `(=)`);
    
    weightSpan.innerHTML = `${exercise.weight} <span class="delta-val ${deltaClass}">${deltaText}</span>`;
}

function getWarmupSetsHTML(targetWeight) {
    if (targetWeight < 20) return "<p>Peso insuficiente para aproximaciones.</p>";
    let w50 = Math.round((targetWeight * 0.5) / 2.5) * 2.5;
    let w70 = Math.round((targetWeight * 0.7) / 2.5) * 2.5;
    let w90 = Math.round((targetWeight * 0.9) / 2.5) * 2.5;
    
    return `<ul>
        <li><strong>50%:</strong> ${w50} kg x 10 reps</li>
        <li><strong>70%:</strong> ${w70} kg x 5 reps</li>
        <li><strong>90%:</strong> ${w90} kg x 1-2 reps</li>
    </ul>`;
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
        if (typeof exercise.weight === 'undefined') exercise.weight = 0;
        if (typeof exercise.prevWeight === 'undefined') exercise.prevWeight = exercise.weight;
        if (typeof exercise.reps === 'undefined') exercise.reps = '';

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
            <div class="timer-controls">
                <button class="btn-timer" onclick="startTimer(90)">⏱️ 90s</button>
                <button class="btn-timer" onclick="startTimer(120)">⏱️ 2m</button>
                <button class="btn-timer" onclick="startTimer(180)">⏱️ 3m</button>
            </div>
        `;

        const trackerDiv = document.createElement('div');
        trackerDiv.className = 'tracker-container';
        trackerDiv.innerHTML = `
            <div class="weight-display"><span class="val-weight"></span></div>
            <div class="weight-controls">
                <button class="weight-btn sub" data-val="-20">-20</button>
                <button class="weight-btn sub" data-val="-10">-10</button>
                <button class="weight-btn sub" data-val="-5">-5</button>
                <button class="weight-btn sub" data-val="-2.5">-2.5</button>
                <button class="weight-btn add" data-val="2.5">+2.5</button>
                <button class="weight-btn add" data-val="5">+5</button>
                <button class="weight-btn add" data-val="10">+10</button>
                <button class="weight-btn add" data-val="20">+20</button>
            </div>
            <input type="text" class="reps-input" placeholder="Reps: Ej. 8, 8, 6" value="${exercise.reps}">
            <button class="warmup-btn">🔥 Calculadora de Aproximación</button>
            <div class="warmup-content"></div>
        `;

        const weightSpan = trackerDiv.querySelector('.val-weight');
        const warmupBtn = trackerDiv.querySelector('.warmup-btn');
        const warmupContent = trackerDiv.querySelector('.warmup-content');

        updateDeltaVisual(exercise, weightSpan);

        trackerDiv.querySelectorAll('.weight-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const val = parseFloat(e.target.getAttribute('data-val'));
                exercise.weight = Math.max(0, parseFloat((exercise.weight + val).toFixed(1)));
                updateDeltaVisual(exercise, weightSpan);
                if(warmupContent.style.display === 'block') {
                    warmupContent.innerHTML = getWarmupSetsHTML(exercise.weight);
                }
                saveData();
            });
        });

        trackerDiv.querySelector('.reps-input').addEventListener('change', (e) => {
            exercise.reps = e.target.value;
            saveData();
        });

        warmupBtn.addEventListener('click', () => {
            if (warmupContent.style.display === 'none' || warmupContent.style.display === '') {
                warmupContent.innerHTML = getWarmupSetsHTML(exercise.weight);
                warmupContent.style.display = 'block';
            } else {
                warmupContent.style.display = 'none';
            }
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
        card.appendChild(trackerDiv);
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
        
        let rulesHTML = `
            <h2>⚠️ Protocolos del Sistema</h2>
            <details class="rules-accordion">
                <summary>Ver Reglas y Equivalencias</summary>
                <div class="rule-content">
        `;

        plan.equivalents.forEach(rule => {
            const separatorIndex = rule.indexOf(':');
            if (separatorIndex !== -1) {
                const titlePart = rule.substring(0, separatorIndex).trim();
                const descPart = rule.substring(separatorIndex + 1).trim();
                const icon = titlePart.split(' ')[0];
                const title = titlePart.substring(icon.length).trim();

                rulesHTML += `
                    <div class="rule-item">
                        <div class="rule-item-header"><span>${icon}</span> ${title}</div>
                        <div class="rule-item-desc">${descPart}</div>
                    </div>
                `;
            } else {
                rulesHTML += `<div class="rule-item"><div class="rule-item-desc">${rule}</div></div>`;
            }
        });

        rulesHTML += `</div></details>`;
        eqSection.innerHTML = rulesHTML;
        container.appendChild(eqSection);
    }
}

// --- BACKEND LOCAL (EXPORTAR / IMPORTAR) ---
function setupLocalBackend() {
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
