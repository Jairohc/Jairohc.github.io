let planNutricion = {};
let rutinas = {};
let diaOverride = null;
let diaEnMemoria = new Date().getDay();
let currentMealCategory = 'breakfast';
let wakeLock = null;
let activeSwaps = {};
let isExpressMode = false; // Variable global de estado Exprés

document.addEventListener('DOMContentLoaded', async () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('Service Worker Registered'))
            .catch(err => console.error('Service Worker Error:', err));
    }

    document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible' && localStorage.getItem('vistaActiva') === 'rutina') {
            solicitarWakeLock();
        } else if (wakeLock !== null) {
            wakeLock.release().then(() => wakeLock = null);
        }
    });

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

async function solicitarWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
        }
    } catch (err) {
        console.log(`Wake Lock Error: ${err.message}`);
    }
}

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
            activeSwaps = {}; 
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

    if (vistaDestino === 'rutina') solicitarWakeLock();
}

function cambiarDiaRutina(valor) {
    diaOverride = (valor === "auto") ? null : parseInt(valor);
    activeSwaps = {}; 
    renderizarRutina();
}

/* ================== MODO EXPRÉS ================== */
function toggleExpressMode() {
    isExpressMode = !isExpressMode;
    const btn = document.getElementById('btn-express');
    if(isExpressMode) {
        btn.classList.add('active');
        btn.innerHTML = '⚡ Modo Exprés (Activo - Solo Compuestos)';
    } else {
        btn.classList.remove('active');
        btn.innerHTML = '⚡ Modo Exprés (Desactivado)';
    }
    renderizarRutina();
}

/* ================== CÁLCULO DE DISCOS ================== */
function calcularDiscos(pesoTotal) {
    const pesoBarra = 20;
    const val = parseFloat(pesoTotal);

    if (isNaN(val) || val < pesoBarra) return '';
    if (val === pesoBarra) return 'Barra sola (20 kg)';

    let pesoPorLado = (val - pesoBarra) / 2;
    const discosDisponibles = [20, 15, 10, 5, 2.5, 1.25];
    let resultado = [];

    for (let disco of discosDisponibles) {
        while (pesoPorLado >= disco) {
            resultado.push(`${disco}kg`);
            pesoPorLado -= disco;
        }
    }

    return resultado.length > 0 ? `Por lado: [ ${resultado.join(' ] [ ')} ]` : '';
}

function actualizarDisplayDiscos(idSeguro, peso) {
    const infoEl = document.getElementById(`plate-info-${idSeguro}`);
    if (infoEl) {
        infoEl.innerText = calcularDiscos(peso);
    }
}

/* ================== BLOQUE RUTINA ================== */
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
            
            // Iterar sobre todos para no romper el índice de Hot Swap
            rutinaDia.exercises.forEach((ej, index) => {
                
                // LÓGICA MODO EXPRÉS: Filtra pasivamente
                if (isExpressMode && ej.isMain === false) return; 

                const originalName = ej.name;
                const currentName = activeSwaps[index] || originalName;
                
                const idSeguro = btoa(unescape(encodeURIComponent(currentName)));
                const pesoGuardado = localStorage.getItem('peso_' + idSeguro) || '';
                const basePeso = pesoGuardado ? parseFloat(pesoGuardado) : 0;

                let htmlChips = '';
                if (basePeso > 0) {
                    htmlChips = `
                        <div class="quick-chips" id="chips-${idSeguro}">
                            <button type="button" class="btn-chip" onclick="aplicarChip('${idSeguro}', ${Math.max(0, basePeso - 2.5)})">-2.5</button>
                            <button type="button" class="btn-chip" onclick="aplicarChip('${idSeguro}', ${basePeso})">=${basePeso}</button>
                            <button type="button" class="btn-chip" onclick="aplicarChip('${idSeguro}', ${basePeso + 2.5})">+2.5</button>
                            <button type="button" class="btn-chip" onclick="aplicarChip('${idSeguro}', ${basePeso + 5})">+5</button>
                        </div>
                    `;
                } else {
                    htmlChips = `
                        <div class="quick-chips" id="chips-${idSeguro}">
                            <button type="button" class="btn-chip" onclick="aplicarChip('${idSeguro}', 20)">20</button>
                            <button type="button" class="btn-chip" onclick="aplicarChip('${idSeguro}', 40)">40</button>
                            <button type="button" class="btn-chip" onclick="aplicarChip('${idSeguro}', 60)">60</button>
                        </div>
                    `;
                }

                let currentAlts = [...(ej.alternatives || [])];
                if (currentName !== originalName) {
                    currentAlts = currentAlts.filter(a => a !== currentName);
                    currentAlts.unshift(originalName);
                }

                const listaAltsHTML = currentAlts.length > 0 
                    ? currentAlts.map(alt => {
                        const altB64 = btoa(unescape(encodeURIComponent(alt)));
                        return `
                        <li class="alt-list-item">
                            <span>${alt}</span>
                            <button type="button" class="btn-swap" onclick="ejecutarSwap(${index}, '${altB64}')">⇄ Swap</button>
                        </li>`;
                    }).join('') 
                    : '';

                const div = document.createElement('div');
                div.className = `ejercicio-card`;
                div.id = `card-${idSeguro}`;
                
                if (pesoGuardado) div.classList.add('completed');

                div.innerHTML = `
                    <div class="card-header" onclick="toggleCard('${idSeguro}')">
                        <strong>${currentName}</strong>
                        <span id="summary-${idSeguro}" class="completed-summary">${pesoGuardado ? '✔️ ' + pesoGuardado + ' kg' : ''}</span>
                    </div>
                    
                    <div class="card-body">
                        <p>${ej.detail}</p>
                        ${htmlChips}
                        <div class="registro">
                            <input type="number" id="input-${idSeguro}" placeholder="${pesoGuardado ? pesoGuardado + ' kg (last)' : 'Kg'}" step="0.5" inputmode="decimal" pattern="[0-9]*" oninput="actualizarDisplayDiscos('${idSeguro}', this.value)" onfocus="autoCompletarInput(this, '${pesoGuardado}', '${idSeguro}')" onkeydown="detectarEnter(event, '${idSeguro}')">
                            <button id="btn-${idSeguro}" class="btn-guardar" onclick="guardarPesoLocal('${idSeguro}')">Save</button>
                        </div>
                        <div id="plate-info-${idSeguro}" class="plate-info-text">${calcularDiscos(basePeso)}</div>
                        ${listaAltsHTML ? `<details><summary>Alternatives</summary><ul>${listaAltsHTML}</ul></details>` : ''}
                    </div>
                `;
                listaEjercicios.appendChild(div);
            });
        } else {
            listaEjercicios.innerHTML = "<p style='padding: 15px; background: #e8f8f5; color: #27ae60; border-radius: 8px; font-weight: bold; text-align: center;'>Cycling focused day. Load route on your Garmin device.</p>";
        }
    }
}

function aplicarChip(idSeguro, peso) {
    const inputElement = document.getElementById(`input-${idSeguro}`);
    if (inputElement) {
        inputElement.value = peso;
        actualizarDisplayDiscos(idSeguro, peso);
    }
    guardarPesoLocal(idSeguro, peso);
}

function ejecutarSwap(ejIndex, newNameB64) {
    const newName = decodeURIComponent(escape(atob(newNameB64)));
    activeSwaps[ejIndex] = newName;
    renderizarRutina();
    if ("vibrate" in navigator) navigator.vibrate(20);
}

function autoCompletarInput(inputElement, ultimoPeso, idSeguro) {
    if (!inputElement.value && ultimoPeso && ultimoPeso !== '0') {
        inputElement.value = ultimoPeso;
        actualizarDisplayDiscos(idSeguro, ultimoPeso);
    }
}

function toggleCard(idSeguro) {
    const tarjeta = document.getElementById(`card-${idSeguro}`);
    if (tarjeta && tarjeta.classList.contains('completed')) {
        tarjeta.classList.remove('completed');
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
    const summary = document.getElementById(`summary-${idSeguro}`);
    
    let pesoValue = valorEspecifco !== null ? valorEspecifco : inputElement.value;
    if (!pesoValue || isNaN(pesoValue) || pesoValue <= 0) return;

    localStorage.setItem('peso_' + idSeguro, pesoValue);
    inputElement.placeholder = pesoValue + " kg (last)";
    inputElement.value = '';

    const contenedorChips = document.getElementById(`chips-${idSeguro}`);
    if (contenedorChips) {
        const basePeso = parseFloat(pesoValue);
        contenedorChips.innerHTML = `
            <button type="button" class="btn-chip" onclick="aplicarChip('${idSeguro}', ${Math.max(0, basePeso - 2.5)})">-2.5</button>
            <button type="button" class="btn-chip" onclick="aplicarChip('${idSeguro}', ${basePeso})">=${basePeso}</button>
            <button type="button" class="btn-chip" onclick="aplicarChip('${idSeguro}', ${basePeso + 2.5})">+2.5</button>
            <button type="button" class="btn-chip" onclick="aplicarChip('${idSeguro}', ${basePeso + 5})">+5</button>
        `;
    }

    if (summary) summary.innerText = `✔️ ${pesoValue} kg`;
    tarjeta?.classList.add('completed');
    if ("vibrate" in navigator) navigator.vibrate(40);

    boton.innerText = "✔";
    boton.classList.add('guardado');
    setTimeout(() => { boton.innerText = "Save"; boton.classList.remove('guardado'); }, 1200);
}

/* ================== BLOQUE DIETA ================== */
function renderizarDieta() {
    const ahora = new Date();
    const hora = ahora.getHours();
    
    let comidaActual = 'dinner';
    if (hora >= 4 && hora < 12) comidaActual = 'breakfast';
    else if (hora >= 12 && hora < 18) comidaActual = 'lunch';
    
    cambiarComida(comidaActual);
    if (ahora.getDay() === 0) document.getElementById('alerta-domingo')?.classList.remove('hidden');
}

function cambiarComida(tipo) {
    currentMealCategory = tipo;
    
    document.getElementById('btn-breakfast')?.classList.remove('activo');
    document.getElementById('btn-lunch')?.classList.remove('activo');
    document.getElementById('btn-dinner')?.classList.remove('activo');
    document.getElementById('btn-snacks')?.classList.remove('activo');
    document.getElementById('btn-equivalents')?.classList.remove('activo');
    
    document.getElementById(`btn-${tipo}`)?.classList.add('activo');

    const selectorContainer = document.getElementById('meal-selector-container');
    const selectOpt = document.getElementById('select-meal-opt');
    const grid = document.getElementById('ingredients-grid');

    if (tipo === 'equivalents') {
        selectorContainer.classList.add('hidden');
        grid.style.display = 'block';
        grid.innerHTML = '<ul class="equivalent-list">' + planNutricion.equivalents.map(eq => `<li>${eq}</li>`).join('') + '</ul>';
        return;
    }

    grid.style.display = 'grid';
    const opciones = planNutricion[tipo];
    
    if (opciones && opciones.length > 0) {
        selectorContainer.classList.remove('hidden');
        selectOpt.innerHTML = '';
        opciones.forEach((opt, index) => {
            const optionEl = document.createElement('option');
            optionEl.value = index;
            optionEl.innerText = opt.name;
            selectOpt.appendChild(optionEl);
        });
        
        let indexGuardado = localStorage.getItem(`pref_${tipo}`) || 0;
        if (indexGuardado >= opciones.length) indexGuardado = 0;
        
        selectOpt.value = indexGuardado;
        renderizarIngredientes(indexGuardado);
    } else {
        selectorContainer.classList.add('hidden');
        grid.innerHTML = '';
    }
}

function renderizarIngredientes(optionIndex) {
    localStorage.setItem(`pref_${currentMealCategory}`, optionIndex);

    const grid = document.getElementById('ingredients-grid');
    grid.innerHTML = '';
    
    const optIdx = parseInt(optionIndex);
    const mealData = planNutricion[currentMealCategory][optIdx];
    
    if (!mealData || !mealData.ingredients) return;

    mealData.ingredients.forEach((ing, i) => {
        const div = document.createElement('div');
        const hasSubs = ing.subs && ing.subs.length > 0;
        
        div.className = `ing-tile ${hasSubs ? 'has-sub' : ''}`;
        div.id = `tile-${i}`;
        div.dataset.subIdx = 0; 
        
        if (hasSubs) {
            div.onclick = () => rotarSubstituto(optIdx, i);
        }

        div.innerHTML = generarHTMLFicha(ing, hasSubs);
        grid.appendChild(div);
    });
}

function rotarSubstituto(optionIndex, ingIndex) {
    const tile = document.getElementById(`tile-${ingIndex}`);
    if (!tile) return;

    const ingObj = planNutricion[currentMealCategory][optionIndex].ingredients[ingIndex];
    
    let currentIdx = parseInt(tile.dataset.subIdx);
    const totalOptions = ingObj.subs.length + 1;
    
    currentIdx = (currentIdx + 1) % totalOptions;
    tile.dataset.subIdx = currentIdx;
    
    let activeIng = currentIdx === 0 ? ingObj : ingObj.subs[currentIdx - 1];
    
    tile.innerHTML = generarHTMLFicha(activeIng, true);

    if ("vibrate" in navigator) navigator.vibrate(20);
}

function generarHTMLFicha(ing, isRotatable) {
    return `
        ${isRotatable ? `<div class="swap-badge">↻</div>` : ''}
        <div class="ing-icon">${ing.icon}</div>
        <div class="ing-qty">${ing.qty} <span style="font-size: 0.6em">${ing.unit}</span></div>
        <div class="ing-name">${ing.name}</div>
    `;
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

        div.innerHTML = `
            <h3>${rut.name}</h3>
            <p style="margin:0 0 10px 0; font-size: 0.9em; color: #666;"><strong>Cardio:</strong> ${rut.cardio}</p>
            <ul style="font-size: 0.9em; padding:0; margin:0; list-style-type:none;">
                ${rut.exercises ? rut.exercises.map(e => `<li style="padding: 5px 0; border-bottom: 1px solid #eee;">${e.name}</li>`).join('') : '<li>MTB / Recovery Cycling</li>'}
            </ul>
        `;
        contenedor.appendChild(div);
    });
}
