// Variables globales que se llenarán con el JSON
let planNutricion = {};
let rutinas = {};

let diaOverride = null;
let diaEnMemoria = new Date().getDay();

// Carga inicial de datos asíncrona
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const respuesta = await fetch('data.json');
        if (!respuesta.ok) throw new Error('No se pudo cargar el archivo data.json');
        
        const datos = await respuesta.json();
        planNutricion = datos.planNutricion;
        rutinas = datos.rutinas;

        iniciarAplicacion();
    } catch (error) {
        console.error("Error al inicializar la app:", error);
        document.getElementById('main-content').innerHTML = `
            <div class="card" style="text-align: center; color: red;">
                <h2>Error de conexión</h2>
                <p>No se pudo cargar la base de datos (data.json). Verifica que el archivo exista en el repositorio.</p>
            </div>
        `;
    }
});

function iniciarAplicacion() {
    actualizarReloj();
    setInterval(actualizarReloj, 60000);
    
    renderizarHoy();
    renderizarSemana();
    renderizarSnacks();

    const vistaGuardada = localStorage.getItem('vistaActiva') || 'rutina';
    cambiarVista(vistaGuardada);
}

function actualizarReloj() {
    const ahora = new Date();
    const opciones = { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    const relojElemento = document.getElementById('fecha-hora');
    if (relojElemento) relojElemento.innerText = ahora.toLocaleDateString('es-MX', opciones).toUpperCase();

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
