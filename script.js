let appData = {};

document.addEventListener("DOMContentLoaded", async () => {
    await loadData();
    setupDaySelector();
    
    // Obtener el día actual (0 = Domingo, 1 = Lunes, etc.)
    const today = new Date().getDay().toString();
    
    // Si el día existe en la rutina, lo selecciona, si no, carga el lunes ("1")
    const initialDay = appData.routines[today] ? today : "1";
    document.getElementById('daySelector').value = initialDay;
    renderRoutine(initialDay);
});

// Carga datos de localStorage o del archivo data.json la primera vez
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
            document.getElementById('exercisesContainer').innerHTML = "<p>Error cargando la rutina.</p>";
        }
    }
}

// Guarda el estado actual en el navegador
function saveData() {
    localStorage.setItem('miEntrenamiento', JSON.stringify(appData));
}

// Llena el selector de días
function setupDaySelector() {
    const selector = document.getElementById('daySelector');
    selector.innerHTML = '';
    
    for (let dayKey in appData.routines) {
        const option = document.createElement('option');
        option.value = dayKey;
        // Muestra solo el nombre del día (ej. "Monday", "Tuesday")
        option.textContent = appData.routines[dayKey].name.split(':')[0]; 
        selector.appendChild(option);
    }
    
    selector.addEventListener('change', (e) => renderRoutine(e.target.value));
}

// Dibuja las tarjetas de los ejercicios
function renderRoutine(dayKey) {
    const routine = appData.routines[dayKey];
    const exercisesContainer = document.getElementById('exercisesContainer');
    const cardioSection = document.getElementById('cardioSection');

    // Renderizar Cardio
    cardioSection.innerHTML = `<strong>Cardio:</strong> ${routine.cardio}`;
    exercisesContainer.innerHTML = '';

    // Manejar días de descanso
    if (!routine.exercises || routine.exercises.length === 0) {
        exercisesContainer.innerHTML = '<p>Día de descanso o actividad sin pesas programada.</p>';
        return;
    }

    // Renderizar Ejercicios
    routine.exercises.forEach((exercise) => {
        // Asegurar que el ejercicio tenga la propiedad completed
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
                    // Actualiza el nombre del ejercicio
                    exercise.name = e.target.value;
                    // Resetea el checkbox al cambiar de ejercicio
                    exercise.completed = false; 
                    saveData();
                    renderRoutine(dayKey); // Recarga la vista para reflejar el cambio
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
