let appData = {};

document.addEventListener("DOMContentLoaded", async () => {
    await loadData();
    
    // Configurar Entrenamiento
    setupDaySelector();
    const today = new Date().getDay().toString();
    const initialDay = appData.routines[today] ? today : "1";
    document.getElementById('daySelector').value = initialDay;
    renderRoutine(initialDay);

    // Configurar Nutrición
    renderNutrition();

    // Eventos de Pestañas
    document.getElementById('tabWorkout').addEventListener('click', () => switchTab('workout'));
    document.getElementById('tabDiet').addEventListener('click', () => switchTab('diet'));
});

// Función de Pestañas
function switchTab(tabName) {
    document.getElementById('tabWorkout').classList.toggle('active', tabName === 'workout');
    document.getElementById('tabDiet').classList.toggle('active', tabName === 'diet');
    
    document.getElementById('workoutSection').classList.toggle('active', tabName === 'workout');
    document.getElementById('dietSection').classList.toggle('active', tabName === 'diet');
}

// Carga datos
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

// --- LÓGICA DE ENTRENAMIENTO ---
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

        const altsDiv = document.createElement('div');
        altsDiv.className = 'exercise-alternatives';
        
        if (exercise.alternatives && exercise.alternatives.length > 0) {
            const selectAlt = document.createElement('select');
            selectAlt.innerHTML = `<option value="">🔄 Cambiar ejercicio...</option>`;
            
            exercise.alternatives.forEach(alt => {
                const opt = document.createElement('option');
                opt.value = alt;
                opt.textContent = alt;
                selectAlt.appendChild(opt);
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
        card.appendChild(altsDiv);
        exercisesContainer.appendChild(card);
    });
}

// --- LÓGICA DE NUTRICIÓN ---
function renderNutrition() {
    const container = document.getElementById('nutritionContainer');
    const plan = appData.nutritionPlan;
    if (!plan) return;

    let html = '';

    // Diccionario de categorías para títulos bonitos
    const categories = [
        { key: 'breakfast', title: '🍳 Desayuno' },
        { key: 'lunch', title: '🍲 Comida (Pre-Entreno)' },
        { key: 'snacks', title: '🍎 Snacks' },
        { key: 'dinner', title: '🍽️ Cena (Post-Entreno)' }
    ];

    categories.forEach(cat => {
        if (plan[cat.key] && plan[cat.key].length > 0) {
            html += `<div class="nutrition-category"><h2>${cat.title}</h2>`;
            
            plan[cat.key].forEach(meal => {
                html += `<div class="meal-card">
                            <h4>${meal.name}</h4>
                            <ul class="ingredient-list">`;
                
                meal.ingredients.forEach(ing => {
                    html += `<li><span>${ing.icon}</span> <span><strong>${ing.qty} ${ing.unit}</strong> ${ing.name}</span></li>`;
                    
                    // Renderizar sustituciones (subs) si existen (ej. el aguacate por aderezo)
                    if (ing.subs && ing.subs.length > 0) {
                        html += `<ul class="subs-list">`;
                        ing.subs.forEach(sub => {
                            html += `<li>Opción: ${sub.icon} <strong>${sub.qty} ${sub.unit}</strong> ${sub.name}</li>`;
                        });
                        html += `</ul>`;
                    }
                });
                
                html += `</ul></div>`;
            });
            html += `</div>`;
        }
    });

    // Renderizar sección de Equivalencias y Reglas
    if (plan.equivalents && plan.equivalents.length > 0) {
        html += `<div class="nutrition-category">
                    <h2>⚠️ Reglas y Equivalencias</h2>
                    <div class="equivalents-card">
                        <ul class="ingredient-list">`;
        plan.equivalents.forEach(rule => {
            // Separa el ícono del texto para que se vea limpio
            const icon = rule.split(' ')[0];
            const text = rule.substring(icon.length).trim();
            html += `<li><span>${icon}</span> <span>${text}</span></li>`;
        });
        html += `       </ul>
                    </div>
                 </div>`;
    }

    container.innerHTML = html;
}
