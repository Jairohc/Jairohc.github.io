let appData = {};
let progressChartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
    bootApp();
});

// --- INICIO Y BLOQUEO ANTI-PÉRDIDA ---
async function bootApp() {
    const localData = localStorage.getItem('miEntrenamiento');
    
    // Configurar Eventos del Modal
    document.getElementById('overlayFileImport').addEventListener('change', handleImport);
    document.getElementById('fileImport').addEventListener('change', handleImport);
    document.getElementById('btnStartFresh').addEventListener('click', loadDefaultBase);

    if (localData) {
        appData = JSON.parse(localData);
        initializeApp();
    } else {
        document.getElementById('importOverlay').style.display = 'flex';
        document.getElementById('mainAppContainer').style.display = 'none';
    }
}

async function loadDefaultBase() {
    try {
        const response = await fetch('data.json');
        appData = await response.json();
        saveData();
        initializeApp();
    } catch (error) {
        alert("Error cargando la base de datos (data.json). Asegúrate de que el archivo exista en la raíz.");
    }
}

function initializeApp() {
    document.getElementById('importOverlay').style.display = 'none';
    document.getElementById('mainAppContainer').style.display = 'block';

    checkDailyReset();
    
    setupDaySelector();
    const today = new Date().getDay().toString();
    const initialDay = appData.routines[today] ? today : "1";
    document.getElementById('daySelector').value = initialDay;
    
    renderRoutine(initialDay);
    renderNutrition();

    if(window.Chart) {
        Chart.defaults.color = '#a0a0a0';
        Chart.defaults.font.family = 'system-ui, -apple-system, sans-serif';
    }

    document.getElementById('tabWorkout').addEventListener('click', () => switchTab('workout'));
    document.getElementById('tabDiet').addEventListener('click', () => switchTab('diet'));
    document.getElementById('tabProgress').addEventListener('click', () => switchTab('progress'));
    
    document.getElementById('btnExport').addEventListener('click', () => exportData(false));
}

// --- PESTAÑAS ---
function switchTab(tabName) {
    document.getElementById('tabWorkout').classList.toggle('active', tabName === 'workout');
    document.getElementById('tabDiet').classList.toggle('active', tabName === 'diet');
    document.getElementById('tabProgress').classList.toggle('active', tabName === 'progress');
    
    document.getElementById('workoutSection').classList.toggle('active', tabName === 'workout');
    document.getElementById('dietSection').classList.toggle('active', tabName === 'diet');
    document.getElementById('progressSection').classList.toggle('active', tabName === 'progress');

    if(tabName === 'progress') initProgressTab();
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
                
                // Mover reps actuales a prevReps para la Memoria Fantasma
                ex.prevReps = ex.reps || '';
                ex.reps = ''; // Limpiar campo de texto para hoy
                
                ex.completed = false;
            });
        }
        appData.lastLoginDate = todayStr;
        saveData();
    }
}

// --- EXPORTACIÓN ROBUSTA ---
function exportData(isAuto = false) {
    try {
        const dataStr = JSON.stringify(appData, null, 2);
        const date = new Date().toISOString().split('T')[0];
        
        const suffix = isAuto ? "AUTO" : "MANUAL";
        const fileName = `gym_backup_${date}_${suffix}.json`;
        
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        if (!isAuto) {
            alert("✅ Respaldo forzado generado con éxito en tu carpeta de descargas.");
        }
    } catch (err) {
        console.error("Error al exportar:", err);
        alert("Hubo un error al intentar generar el respaldo.");
    }
}

// --- AUTO-RESPALDO AL TERMINAR RUTINA ---
function checkAndTriggerAutoBackup(dayKey) {
    const todayStr = new Date().toLocaleDateString();
    
    if (appData.autoBackupDate === todayStr) return;

    const routine = appData.routines[dayKey];
    
    // Si es fin de semana/descanso
    if (!routine || !routine.exercises || routine.exercises.length === 0) {
        appData.autoBackupDate = todayStr;
        saveData();
        exportData(true);
        return;
    }

    const allCompleted = routine.exercises.every(ex => ex.completed === true);

    if (allCompleted) {
        appData.autoBackupDate = todayStr;
        saveData();
        exportData(true);
    }
}

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedData = JSON.parse(event.target.result);
            if (importedData.routines && importedData.nutritionPlan) {
                appData = importedData;
                saveData();
                location.reload(); 
            } else {
                alert("Formato incorrecto. Asegúrate de subir el archivo json válido.");
            }
        } catch (err) {
            alert("Error al procesar el archivo JSON.");
        }
    };
    reader.readAsText(file);
}

// --- ENTRENAMIENTO Y VISTAS DEDICADAS ---
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

function recordWeightHistory(exercise) {
    if (!exercise.history) exercise.history = [];
    const todayISO = new Date().toISOString().split('T')[0]; 
    let todayLog = exercise.history.find(h => h.date === todayISO);
    if (todayLog) {
        todayLog.weight = exercise.weight;
    } else {
        if(exercise.weight > 0) {
            exercise.history.push({ date: todayISO, weight: exercise.weight });
        }
    }
}

function renderRoutine(dayKey) {
    const routine = appData.routines[dayKey];
    
    const regularView = document.getElementById('regularDayView');
    const weekendView = document.getElementById('weekendView');
    const exercisesContainer = document.getElementById('exercisesContainer');
    const cardioSection = document.getElementById('cardioSection');

    // Limpiar contenedores
    exercisesContainer.innerHTML = '';

    // LÓGICA DE PANTALLA DEDICADA (Sábado y Domingo)
    if (!routine.exercises || routine.exercises.length === 0) {
        regularView.style.display = 'none';
        weekendView.style.display = 'block';
        
        const wTitle = document.getElementById('weekendTitle');
        const wIcon = document.getElementById('weekendIcon');
        const wDesc = document.getElementById('weekendDesc');
        const dInput = document.getElementById('weekendDistance');
        const tInput = document.getElementById('weekendTime');
        const btnSave = document.getElementById('btnSaveWeekend');

        // Configurar según el día usando el nombre de la rutina
        const nameUpper = routine.name.toUpperCase();
        if (nameUpper.includes("SÁBADO") || nameUpper.includes("SABADO") || nameUpper.includes("6")) {
            wTitle.innerText = "Sábado de MTB";
            wIcon.innerText = "🚵‍♂️";
            wDesc.innerText = routine.cardio || "Recuperación activa y ruta de montaña.";
        } else {
            wTitle.innerText = "Domingo de Descanso";
            wIcon.innerText = "🛋️";
            wDesc.innerText = routine.cardio || "Descanso total para recuperación muscular.";
        }

        // Cargar datos previos si existen (evitar perderlos si cambias de pestaña y regresas)
        if (!routine.weekendData) routine.weekendData = { distance: "", time: "" };
        dInput.value = routine.weekendData.distance;
        tInput.value = routine.weekendData.time;

        btnSave.onclick = () => {
            routine.weekendData.distance = dInput.value;
            routine.weekendData.time = tInput.value;
            saveData();
            checkAndTriggerAutoBackup(dayKey);
            alert("Métricas guardadas y respaldo generado.");
        };

        return;
    }

    // SI HAY EJERCICIOS (Lunes a Viernes)
    weekendView.style.display = 'none';
    regularView.style.display = 'block';

    cardioSection.innerHTML = `<strong>Cardio:</strong> ${routine.cardio}`;

    routine.exercises.forEach((exercise) => {
        if (typeof exercise.completed === 'undefined') exercise.completed = false;
        if (!exercise.originalName) exercise.originalName = exercise.name;
        if (typeof exercise.weight === 'undefined') exercise.weight = 0;
        if (typeof exercise.prevWeight === 'undefined') exercise.prevWeight = exercise.weight;
        if (typeof exercise.reps === 'undefined') exercise.reps = '';
        if (typeof exercise.prevReps === 'undefined') exercise.prevReps = '';
        if (typeof exercise.history === 'undefined') exercise.history = [];

        const card = document.createElement('div');
        card.className = `exercise-card ${exercise.completed ? 'completed collapsed' : ''}`;

        const header = document.createElement('div');
        header.className = 'exercise-header';

        const titleWrapper = document.createElement('div');
        titleWrapper.className = 'title-wrapper';
        titleWrapper.innerHTML = `<h3>${exercise.name}</h3><span class="toggle-icon">▼</span>`;
        titleWrapper.onclick = () => {
            card.classList.toggle('collapsed');
        };

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = exercise.completed;
        checkbox.onchange = (e) => {
            exercise.completed = e.target.checked;
            card.classList.toggle('completed', exercise.completed);
            
            if (exercise.completed) {
                card.classList.add('collapsed');
            } else {
                card.classList.remove('collapsed');
            }
            saveData();
            
            checkAndTriggerAutoBackup(dayKey);
        };

        header.appendChild(titleWrapper);
        header.appendChild(checkbox);

        const bodyWrapper = document.createElement('div');
        bodyWrapper.className = 'exercise-body';

        const details = document.createElement('div');
        details.className = 'exercise-details';
        details.innerHTML = `
            <p><strong>Detalle:</strong> ${exercise.detail}</p>
            ${exercise.tempo ? `<p><strong>Tempo:</strong> ${exercise.tempo}</p>` : ''}
            <p><strong>RIR Objetivo:</strong> ${exercise.rir || 'N/A'}</p>
        `;

        // Input de reps con memoria fantasma en el placeholder
        const placeholderText = exercise.prevReps ? `Última vez: ${exercise.prevReps}` : `Reps: Ej. 8, 8, 6`;

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
            <input type="text" class="reps-input" placeholder="${placeholderText}" value="${exercise.reps}">
        `;

        const weightSpan = trackerDiv.querySelector('.val-weight');

        updateDeltaVisual(exercise, weightSpan);

        trackerDiv.querySelectorAll('.weight-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const val = parseFloat(e.target.getAttribute('data-val'));
                exercise.weight = Math.max(0, parseFloat((exercise.weight + val).toFixed(1)));
                updateDeltaVisual(exercise, weightSpan);
                recordWeightHistory(exercise); 
                saveData();
            });
        });

        trackerDiv.querySelector('.reps-input').addEventListener('change', (e) => {
            exercise.reps = e.target.value;
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

        bodyWrapper.appendChild(details);
        bodyWrapper.appendChild(trackerDiv);
        bodyWrapper.appendChild(altsDiv);

        card.appendChild(header);
        card.appendChild(bodyWrapper);
        exercisesContainer.appendChild(card);
    });
}

// --- GRÁFICOS DE PROGRESO ---
function initProgressTab() {
    const selector = document.getElementById('chartExerciseSelector');
    const msg = document.getElementById('noDataMessage');
    const canvas = document.getElementById('progressChart');
    
    let exercisesWithHistory = [];
    for (let dayKey in appData.routines) {
        appData.routines[dayKey].exercises.forEach(ex => {
            if (ex.history && ex.history.length > 0) {
                exercisesWithHistory.push(ex);
            }
        });
    }

    if (exercisesWithHistory.length === 0) {
        selector.style.display = 'none';
        canvas.style.display = 'none';
        msg.style.display = 'block';
        return;
    }

    msg.style.display = 'none';
    selector.style.display = 'block';
    canvas.style.display = 'block';

    selector.innerHTML = '';
    let addedNames = new Set();
    
    exercisesWithHistory.forEach(ex => {
        let name = ex.originalName || ex.name;
        let cleanName = name.split(':')[0];
        
        if (!addedNames.has(cleanName)) {
            const opt = document.createElement('option');
            opt.value = ex.name; 
            opt.textContent = cleanName;
            selector.appendChild(opt);
            addedNames.add(cleanName);
        }
    });

    drawChart(selector.value, exercisesWithHistory);

    selector.onchange = (e) => {
        drawChart(e.target.value, exercisesWithHistory);
    };
}

function drawChart(exerciseName, allExercises) {
    const exercise = allExercises.find(ex => ex.name === exerciseName);
    if (!exercise || !exercise.history) return;
    if (typeof Chart === 'undefined') return;

    const ctx = document.getElementById('progressChart').getContext('2d');
    
    if (progressChartInstance) {
        progressChartInstance.destroy();
    }

    const labels = exercise.history.map(item => {
        let parts = item.date.split('-');
        return `${parts[1]}-${parts[2]}`;
    });
    const dataPoints = exercise.history.map(item => item.weight);

    progressChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Peso (kg)',
                data: dataPoints,
                borderColor: '#00bcd4',
                backgroundColor: 'rgba(0, 188, 212, 0.15)',
                borderWidth: 3,
                pointBackgroundColor: '#1e1e1e',
                pointBorderColor: '#00bcd4',
                pointBorderWidth: 2,
                pointRadius: 5,
                fill: true,
                tension: 0.3 
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: false, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { grid: { display: false } }
            }
        }
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
