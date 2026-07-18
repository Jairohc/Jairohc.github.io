const planNutricion = {
    desayuno: [
        "A: Huevo Clásico (3 enteros + 150g claras + 3 tortillas + 5g aceite)",
        "B: Avena Dulce (1.5 scoop Whey + 50g avena + 15g crema cacahuate + 80g frutos rojos)",
        "C: Tacos de Pollo (150g pechuga + 3 tortillas + 50g aguacate)",
        "D: Pasta Roja (1 huevo + 150g claras + 170g pasta preparada)",
        "E: Tacos Jamón/Queso (150g claras + 60g jamón + 40g queso + 3 tortillas + 50g aguacate)"
    ],
    comida: [
        "A: Base Arroz/Pasta (200g carne magra + 70g arroz/pasta seco + 10g aceite)",
        "B: Base Papa (200g carne magra + 200g papa + 10g aceite)"
    ],
    cena: [
        "A: Tacos Atún (200g atún + 3 tortillas + 50g aguacate)",
        "B: Pasta con Pollo (200g pollo + 60g pasta seco + 10g aceite)",
        "C: Tacos Pescado (200g tilapia + 4 tortillas + 50g aguacate)",
        "D: Tacos Pollo (200g pollo + 3 tortillas + 50g aguacate)",
        "E: Tacos Res (200g bistec + 3 tortillas + 50g aguacate)"
    ],
    snacks: [
        "Snack A: 1 scoop Whey + 150g fruta + 15g nueces",
        "Snack B: 150g yogur griego + 150g fruta + 15g nueces",
        "Libre: Gelatina Light (0% azúcar) consumo ilimitado"
    ]
};

const rutinas = {
    1: { 
        nombre: "Lunes: Empuje (Pecho/Hombro/Tríceps)", 
        cardio: "20 min | 5% inclinación | 4.2-4.8 km/h",
        ejercicios: [
            { nombre: "Press de banca: 3x6-8", detalle: "Retracción escapular obligatoria. Los pies empujan el piso. Baja la barra al nivel de los pezones." },
            { nombre: "Press inclinado mancuerna: 3x8-10", detalle: "Banco a 30-45 grados. Baja hasta sentir el estiramiento en el pectoral superior." },
            { nombre: "Press militar sentado: 3x8-10", detalle: "Core apretado, no arquees la espalda baja. Rango de movimiento completo." },
            { nombre: "Elevaciones laterales: 3x12-15", detalle: "Lidera el movimiento con los codos ligeramente flexionados." },
            { nombre: "Extensión de tríceps polea: 3x10-12", detalle: "Codos pegados a las costillas en todo momento. Aprieta un segundo abajo." }
        ]
    },
    2: { 
        nombre: "Martes: Pierna 1 (Foco Cuádriceps) + Core", 
        cardio: "20 min plana | 0% | 4.0 km/h",
        ejercicios: [
            { nombre: "Sentadilla libre o Hack: 3x6-8", detalle: "Romper el paralelo. Foco en empujar con toda la planta del pie." },
            { nombre: "Prensa de piernas: 3x10-12", detalle: "Pies en la parte baja de la plataforma. No bloquees las rodillas al extender." },
            { nombre: "Extensión de cuádriceps: 3x12-15", detalle: "Movimiento controlado, pausa de 1 segundo en la máxima contracción arriba." },
            { nombre: "Curl de isquios tumbado: 3x10-12", detalle: "Mantén la cadera pegada al banco. Controla la bajada en 3 segundos." },
            { nombre: "Elevación de talones + Core: 4x10-15", detalle: "Alterna con 3 series de Crunch en polea alta." }
        ]
    },
    3: { 
        nombre: "Miércoles: Tirón (Espalda/Bíceps)", 
        cardio: "20 min | 5% inclinación | 4.2-4.8 km/h",
        ejercicios: [
            { nombre: "Dominadas o Jalón al pecho: 3x6-8", detalle: "Depresión escapular antes de flexionar. Lleva la barra/pecho hacia arriba." },
            { nombre: "Remo con barra/máquina: 3x8-10", detalle: "Torso firme. Tira desde los codos rozando las costillas." },
            { nombre: "Pullover en polea alta: 2x12-15", detalle: "Brazos semirrectos, siente el estiramiento en los dorsales." },
            { nombre: "Face pulls: 3x12-15", detalle: "Tira hacia tu frente separando la cuerda. Siente el trabajo en el deltoides posterior." },
            { nombre: "Curl de bíceps mancuerna: 3x10-12", detalle: "Codos fijos. Supinación (girar la muñeca) al subir." }
        ]
    },
    4: { 
        nombre: "Jueves: Pierna 2 (Isquios/Glúteo) + Core", 
        cardio: "20 min plana | 0% | 4.0 km/h",
        ejercicios: [
            { nombre: "Peso muerto rumano: 3x8-10", detalle: "Empuja la cadera hacia atrás. Espalda recta, barra pegada a las piernas." },
            { nombre: "Zancadas búlgaras: 3x10-12", detalle: "Torso ligeramente inclinado hacia adelante. Baja profundo." },
            { nombre: "Curl de isquios sentado: 3x12-15", detalle: "Ajusta la almohadilla firme contra los muslos." },
            { nombre: "Prensa pies altos: 2x12-15", detalle: "Pies colocados alto y separados. Baja hasta que las rodillas se acerquen al pecho." },
            { nombre: "Elevación talones + Core: 4x10-15", detalle: "Alterna con 3 series de Rueda abdominal." }
        ]
    },
    5: { 
        nombre: "Viernes: Torso (Mantenimiento)", 
        cardio: "20 min | 6% inclinación | 4.5 km/h",
        ejercicios: [
            { nombre: "Aperturas en polea (pecho): 3x10-12", detalle: "Siente el estiramiento profundo y abraza un barril imaginario al cerrar." },
            { nombre: "Remo unilateral mancuerna: 3x8-10", detalle: "Tira de la mancuerna hacia tu cadera, no hacia tu pecho." },
            { nombre: "Press hombros máquina: 3x10-12", detalle: "Movimiento constante. No dejes que el peso descanse en la pila." },
            { nombre: "Curl bíceps polea: 2x12-15", detalle: "Tensión constante. Aprieta un segundo arriba." },
            { nombre: "Extensión tríceps copa: 2x12-15", detalle: "Codos apuntando hacia arriba y cerrados. Estira completamente." }
        ]
    },
    6: { 
        nombre: "Sábado: Ciclismo de Montaña (MTB)", 
        cardio: "Duración: 90-120 min | Zonas FC: 2 a 4.",
        ejercicios: [] 
    },
    0: { 
        nombre: "Domingo: Ciclismo Recuperación", 
        cardio: "Duración: 45-60 min | Zona FC: 1 y 2 estrictas.",
        ejercicios: [] 
    }
};

// Variable para forzar un día de forma manual
let diaOverride = null;
let diaEnMemoria = new Date().getDay();

document.addEventListener('DOMContentLoaded', () => {
    actualizarReloj();
    setInterval(actualizarReloj, 60000);
    
    renderizarHoy();
    renderizarSemana();
    renderizarSnacks();

    const vistaGuardada = localStorage.getItem('vistaActiva') || 'rutina';
    cambiarVista(vistaGuardada);
});

function actualizarReloj() {
    const ahora = new Date();
    const opciones = { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    const relojElemento = document.getElementById('fecha-hora');
    if (relojElemento) relojElemento.innerText = ahora.toLocaleDateString('es-MX', opciones).toUpperCase();

    // Verificación de cambio de día en segundo plano
    if (ahora.getDay() !== diaEnMemoria) {
        diaEnMemoria = ahora.getDay();
        if (diaOverride === null) {
            renderizarHoy();
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
    renderizarHoy();
}

function renderizarHoy() {
    const ahora = new Date();
    const hora = ahora.getHours();
    
    // El entrenamiento evalúa si existe un cambio manual forzado por el dropdown
    const diaSemana = diaOverride !== null ? diaOverride : ahora.getDay();

    // -- Lógica Dieta --
    let comidaActual = 'cena';
    if (hora >= 4 && hora < 12) comidaActual = 'desayuno';
    else if (hora >= 12 && hora < 18) comidaActual = 'comida';
    mostrarComida(comidaActual);

    if (ahora.getDay() === 0) {
        document.getElementById('alerta-domingo')?.classList.remove('hidden');
    } else {
        document.getElementById('alerta-domingo')?.classList.add('hidden');
    }

    // -- Lógica Rutina --
    const rutinaDia = rutinas[diaSemana];
    const nombreRutina = document.getElementById('nombre-rutina');
    const bloqueCardio = document.getElementById('bloque-cardio');
    const listaEjercicios = document.getElementById('lista-ejercicios');

    if (nombreRutina) nombreRutina.innerText = rutinaDia.nombre;
    if (bloqueCardio) bloqueCardio.innerText = "Foco: " + rutinaDia.cardio;
    
    if (listaEjercicios) {
        listaEjercicios.innerHTML = '';
        if (rutinaDia.ejercicios.length > 0) {
            rutinaDia.ejercicios.forEach(ej => {
                const idSeguro = btoa(unescape(encodeURIComponent(ej.nombre)));
                const pesoGuardado = localStorage.getItem('peso_' + idSeguro) || '--';

                const div = document.createElement('div');
                div.className = 'ejercicio-card';
                div.innerHTML = `
                    <h4>${ej.nombre}</h4>
                    <div class="registro-rapido">
                        <input type="number" id="input-${idSeguro}" placeholder="Kg (último: ${pesoGuardado})" step="0.5">
                        <button class="btn-guardar" onclick="guardarPesoLocal('${idSeguro}')">Guardar</button>
                        <span id="check-${idSeguro}" class="check-exito hidden">✔</span>
                    </div>
                    <p class="ultimo-peso">Carga anterior: <strong id="display-${idSeguro}">${pesoGuardado}</strong> kg</p>
                    <details>
                        <summary>Ver detalle técnico</summary>
                        <div class="detalle-tecnica">${ej.detalle}</div>
                    </details>
                `;
                listaEjercicios.appendChild(div);
            });
        } else {
            listaEjercicios.innerHTML = "<p style='padding: 15px; background: #e8f8f5; color: #27ae60; border-radius: 8px; font-weight: bold; text-align: center;'>Día enfocado en ciclismo. Carga la ruta en tu Garmin.</p>";
        }
    }
}

function guardarPesoLocal(idSeguro) {
    const inputElement = document.getElementById(`input-${idSeguro}`);
    const pesoValue = inputElement.value;

    if (!pesoValue || isNaN(pesoValue) || pesoValue <= 0) return;

    localStorage.setItem('peso_' + idSeguro, pesoValue);

    document.getElementById(`display-${idSeguro}`).innerText = pesoValue;
    inputElement.placeholder = "Kg (último: " + pesoValue + ")";
    inputElement.value = '';

    const checkmark = document.getElementById(`check-${idSeguro}`);
    checkmark.classList.remove('hidden');
    setTimeout(() => { checkmark.classList.add('hidden'); }, 1500);
}

function mostrarComida(tipo) {
    document.getElementById('btn-desayuno')?.classList.remove('activo');
    document.getElementById('btn-comida')?.classList.remove('activo');
    document.getElementById('btn-cena')?.classList.remove('activo');
    
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

function renderizarSnacks() {
    const listaSnacks = document.getElementById('lista-snacks');
    if (!listaSnacks) return;

    planNutricion.snacks.forEach(item => {
        const li = document.createElement('li');
        li.innerText = item;
        listaSnacks.appendChild(li);
    });
}

function renderizarSemana() {
    const contenedor = document.getElementById('contenedor-semana');
    if (!contenedor) return;

    const ordenDias = [1, 2, 3, 4, 5, 6, 0]; 
    ordenDias.forEach(dia => {
        const rut = rutinas[dia];
        const div = document.createElement('div');
        div.className = 'dia-semana';
        
        let htmlEjercicios = rut.ejercicios.length > 0 
            ? rut.ejercicios.map(e => `<li>${e.nombre}</li>`).join('') 
            : `<li>MTB / Ciclismo Recuperación</li>`;

        div.innerHTML = `
            <h3>${rut.nombre}</h3>
            <p style="margin:0 0 10px 0; font-size: 0.9em; color: #666;"><strong>Cardio:</strong> ${rut.cardio}</p>
            <ul style="font-size: 0.9em;">${htmlEjercicios}</ul>
        `;
        contenedor.appendChild(div);
    });
}
