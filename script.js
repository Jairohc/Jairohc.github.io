let planNutricion = {};
let rutinas = {};
let diaOverride = null;
let diaEnMemoria = new Date().getDay();

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const respuesta = await fetch('data.json');
        if (!respuesta.ok) throw new Error('Failed to load JSON');
        
        const datos = await respuesta.json();
        planNutricion = datos.nutritionPlan;
        rutinas = datos.routines;

        iniciarAplicacion();
    } catch (error) {
        console.error("Initialization error:", error);
        document.getElementById('main-content').innerHTML = `
            <div class="card" style="text-align: center; color: red;">
                <h2>Connection Error</h2>
                <p>Could not load data.json locally.</p>
            </div>
        `;
    }
});

function iniciarAplicacion() {
    actualizarReloj();
    setInterval(actualizarReloj, 60000);
    
    renderizarRutina();
    renderizarDieta();
    renderizarSemana();

    const vistaGuardada = localStorage.getItem('vistaActiva') || 'rutina';
    cambiarVista(vistaGuardada);
}

function actualizarReloj() {
    const ahora = new Date();
    const opciones = { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    const relojElemento = document.getElementById('fecha-hora');
    if (relojElemento) relojElemento.innerText = ahora.toLocaleDateString('en-US', opciones).toUpperCase();

    if (ahora.getDay() !== diaEnMemoria) {
        diaEnMemoria = ahora.getDay();
        if (diaOverride === null) {
            renderizarRutina();
        }
    }
}

function cambiarVista(vistaDestino) {
    document.querySelectorAll('.vista').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('activo'));
    
    document.getElementById(`vista-${vistaDestino}`).classList.remove('hidden');
    document.getElementById(`nav-${vistaDestino}`).classList.add('activo');
    
    localStorage.setItem('vistaActiva', vistaDestino);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cambiarDiaRutina(valor) {
    if (valor === "auto") {
        diaOverride = null;
    } else {
        diaOverride = parseInt(valor);
    }
    renderizarRutina();
}

function renderizarRutina() {
    const ahora = new Date();
    const diaSemana = diaOverride !== null ? diaOverride : ahora.getDay();
    const rutinaDia = rutinas[diaSemana] || rutinas[1];
    
    const nombreRutina = document.getElementById('nombre-rutina');
    const bloqueCardio = document.getElementById('bloque-cardio');
    const listaEjercicios = document.getElementById('lista-ejercicios');

    if (nombreRutina) nombreRutina.innerText = rutinaDia.name;
    if (bloqueCardio) bloqueCardio.innerText = rutinaDia.cardio;
    
    if (listaEjercicios) {
        listaEjercicios.innerHTML = '';
        if (rutinaDia.exercises && rutinaDia.exercises.length > 0) {
            rutinaDia.exercises.forEach(ej => {
                const idSeguro = btoa(unescape(encodeURIComponent(ej.name)));
                const pesoGuardado = localStorage.getItem('peso_' + idSeguro) || '';
                const basePeso = pesoGuardado ? parseFloat(pesoGuardado) : 0;

                // Quick Overload Chips Render
                let htmlChips = '';
                if (basePeso > 0) {
                    htmlChips = `
                        <div class="quick-chips" id="chips-${idSeguro}">
                            <button type="button" class="btn-chip" onclick="guardarPesoLocal('${idSeguro}', ${Math.max(0, basePeso - 2.5)})">-2.5 kg</button>
                            <button type="button" class="btn-chip" onclick="guardarPesoLocal('${idSeguro}', ${basePeso})">=${basePeso} kg</button>
                            <button type="button" class="btn-chip" onclick="guardarPesoLocal('${idSeguro}', ${basePeso + 2.5})">+2.5 kg</button>
                            <button type="button" class="btn-chip" onclick="guardarPesoLocal('${idSeguro}', ${basePeso + 5})">+5 kg</button>
                        </div>
                    `;
                } else {
                    htmlChips = `
                        <div class="quick-chips" id="chips-${idSeguro}">
                            <button type="button" class="btn-chip" onclick="guardarPesoLocal('${idSeguro}', 20)">20 kg</button>
                            <button type="button" class="btn-chip" onclick="guardarPesoLocal('${idSeguro}', 40)">40 kg</button>
                            <button type="button" class="btn-chip" onclick="guardarPesoLocal('${idSeguro}', 60)">60 kg</button>
                        </div>
                    `;
                }

                const listaAlts = (ej.alternatives && ej.alternatives.length > 0) 
                    ? ej.alternatives.map(alt => `<li>${alt}</li>`).join('') 
                    : '';

                const isCompleted = pesoGuardado ? 'completed' : '';

                const div = document.createElement('div');
                div.className = `ejercicio-card ${isCompleted}`;
                div.id = `card-${idSeguro}`;
                div.innerHTML = `
                    <strong>${ej.name}</strong>
                    <p>${ej.detail}</p>
                    
                    ${htmlChips}

                    <div class="registro">
                        <input type="number" id="input-${idSeguro}" placeholder="${pesoGuardado ? pesoGuardado + ' kg (last)' : 'Kg'}" step="0.5" inputmode="decimal" pattern="[0-9]*" onkeydown="detectarEnter(event, '${idSeguro}')">
                        <button id="btn-${idSeguro}" class="btn-guardar" onclick="guardarPesoLocal('${idSeguro}')">Save</button>
                    </div>

                    ${listaAlts ? `
                    <details>
                        <summary>Alternatives</summary>
                        <ul>${listaAlts}</ul>
                    </details>` : ''}
                `;
                listaEjercicios.appendChild(div);
            });
        } else {
            listaEjercicios.innerHTML = "<p style='padding: 15px; background: #e8f8f5; color: #27ae60; border-radius: 8px; font-weight: bold; text-align: center;'>Cycling focused day. Load route on your Garmin device.</p>";
        }
    }
}

function detectarEnter(event, idSeguro) {
    if (event.key === "Enter") {
        event.preventDefault();
        guardarPesoLocal(idSeguro);
        document.getElementById(`input-${idSeguro}`)?.blur();
    }
}

function guardarPesoLocal(idSeguro, valorEspecifco = null) {
    const inputElement = document.getElementById(`input-${idSeguro}`);
    const boton = document.getElementById(`btn-${idSeguro}`);
    const tarjeta = document.getElementById(`card-${idSeguro}`);
    
    let pesoValue = valorEspecifco !== null ? valorEspecifco : inputElement.value;

    if (!pesoValue || isNaN(pesoValue) || pesoValue <= 0) return;

    localStorage.setItem('peso_' + idSeguro, pesoValue);

    inputElement.placeholder = pesoValue + " kg (last)";
    inputElement.value = '';

    const contenedorChips = document.getElementById(`chips-${idSeguro}`);
    if (contenedorChips) {
        const basePeso = parseFloat(pesoValue);
        contenedorChips.innerHTML = `
            <button type="button" class="btn-chip" onclick="guardarPesoLocal('${idSeguro}', ${Math.max(0, basePeso - 2.5)})">-2.5 kg</button>
            <button type="button" class="btn-chip" onclick="guardarPesoLocal('${idSeguro}', ${basePeso})">=${basePeso} kg</button>
            <button type="button" class="btn-chip" onclick="guardarPesoLocal('${idSeguro}', ${basePeso + 2.5})">+2.5 kg</button>
            <button type="button" class="btn-chip" onclick="guardarPesoLocal('${idSeguro}', ${basePeso + 5})">+5 kg</button>
        `;
    }

    tarjeta?.classList.add('completed');

    if ("vibrate" in navigator) {
        navigator.vibrate(40);
    }

    boton.innerText = "✔";
    boton.classList.add('guardado');
    setTimeout(() => { 
        boton.innerText = "Save"; 
        boton.classList.remove('guardado');
    }, 1200);
}

function renderizarDieta() {
    const ahora = new Date();
    const hora = ahora.getHours();
    
    let comidaActual = 'dinner';
    if (hora >= 4 && hora < 12) comidaActual = 'breakfast';
    else if (hora >= 12 && hora < 18) comidaActual = 'lunch';
    
    mostrarComida(comidaActual);

    if (ahora.getDay() === 0) {
        document.getElementById('alerta-domingo')?.classList.remove('hidden');
    }
}

function mostrarComida(tipo) {
    document.getElementById('btn-breakfast')?.classList.remove('activo');
    document.getElementById('btn-lunch')?.classList.remove('activo');
    document.getElementById('btn-dinner')?.classList.remove('activo');
    document.getElementById('btn-snacks')?.classList.remove('activo');
    document.getElementById('btn-equivalents')?.classList.remove('activo');
    
    document.getElementById(`btn-${tipo}`)?.classList.add('activo');
    
    const listaComidas = document.getElementById('lista-comidas');
    if (!listaComidas) return; 
    
    listaComidas.innerHTML = '';
    if (planNutricion[tipo]) {
        planNutricion[tipo].forEach(item => {
            const li = document.createElement('li');
            li.innerText = item;
            listaComidas.appendChild(li);
        });
    }
}

function copiarListaSuper() {
    let textoLista = "🛒 PROTOCOL GROCERY LIST:\n\n";
    textoLista += "• Eggs & Egg Whites\n";
    textoLista += "• Lean Beef / Chicken Breast / Tilapia / Tuna\n";
    textoLista += "• Rice, Pasta, Potatoes & Corn Tortillas\n";
    textoLista += "• Oats, Peanut Butter & Berries\n";
    textoLista += "• Avocado, Greek Yogurt & Nuts\n";
    textoLista += "• Whey Protein & Light Jello";

    navigator.clipboard.writeText(textoLista).then(() => {
        if ("vibrate" in navigator) navigator.vibrate(30);
        alert("Grocery list copied to clipboard!");
    }).catch(err => {
        console.error("Copy error:", err);
    });
}

function renderizarSemana() {
    const contenedor = document.getElementById('contenedor-semana');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    const ordenDias = [1, 2, 3, 4, 5, 6, 0]; 
    ordenDias.forEach(dia => {
        const rut = rutinas[dia];
        if(!rut) return;

        const div = document.createElement('div');
        div.className = 'dia-semana';
        
        let htmlEjercicios = (rut.exercises && rut.exercises.length > 0) 
            ? rut.exercises.map(e => `<li>${e.name}</li>`).join('') 
            : `<li>MTB / Recovery Cycling</li>`;

        div.innerHTML = `
            <h3>${rut.name}</h3>
            <p style="margin:0 0 10px 0; font-size: 0.9em; color: #666;"><strong>Cardio:</strong> ${rut.cardio}</p>
            <ul style="font-size: 0.9em;">${htmlEjercicios}</ul>
        `;
        contenedor.appendChild(div);
    });
}
