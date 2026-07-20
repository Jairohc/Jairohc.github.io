let planNutricion = {};
let rutinas = {};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const respuesta = await fetch('data.json');
        if (!respuesta.ok) throw new Error('Fallo al cargar JSON');
        
        const datos = await respuesta.json();
        planNutricion = datos.planNutricion;
        rutinas = datos.rutinas;

        iniciarAplicacion();
    } catch (error) {
        console.error("Error al inicializar la app:", error);
        document.getElementById('main-content').innerHTML = `
            <div class="card" style="text-align: center; color: red;">
                <h2>Error de conexión</h2>
                <p>No se pudo cargar data.json.</p>
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
    if (relojElemento) relojElemento.innerText = ahora.toLocaleDateString('es-MX', opciones).toUpperCase();
}

function cambiarVista(vistaDestino) {
    document.querySelectorAll('.vista').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('activo'));
    
    document.getElementById(`vista-${vistaDestino}`).classList.remove('hidden');
    document.getElementById(`nav-${vistaDestino}`).classList.add('activo');
    
    localStorage.setItem('vistaActiva', vistaDestino);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderizarRutina() {
    const diaSemana = new Date().getDay();
    const rutinaDia = rutinas[diaSemana] || rutinas[1]; // Fallback por seguridad
    
    const nombreRutina = document.getElementById('nombre-rutina');
    const bloqueCardio = document.getElementById('bloque-cardio');
    const listaEjercicios = document.getElementById('lista-ejercicios');

    if (nombreRutina) nombreRutina.innerText = rutinaDia.nombre;
    if (bloqueCardio) bloqueCardio.innerText = "Foco: " + rutinaDia.cardio;
    
    if (listaEjercicios) {
        listaEjercicios.innerHTML = '';
        if (rutinaDia.ejercicios && rutinaDia.ejercicios.length > 0) {
            rutinaDia.ejercicios.forEach(ej => {
                const idSeguro = btoa(unescape(encodeURIComponent(ej.nombre)));
                const pesoGuardado = localStorage.getItem('peso_' + idSeguro) || '';

                const listaAlts = (ej.alternativas && ej.alternativas.length > 0) 
                    ? ej.alternativas.map(alt => `<li>${alt}</li>`).join('') 
                    : '';

                const div = document.createElement('div');
                div.className = 'ejercicio-card';
                div.innerHTML = `
                    <strong>${ej.nombre}</strong>
                    <p>${ej.detalle}</p>
                    
                    <div class="registro">
                        <input type="number" id="input-${idSeguro}" placeholder="${pesoGuardado ? pesoGuardado + ' kg (último)' : 'Kg'}" step="0.5">
                        <button id="btn-${idSeguro}" class="btn-guardar" onclick="guardarPesoLocal('${idSeguro}')">Guardar</button>
                    </div>

                    ${listaAlts ? `
                    <details>
                        <summary>Alternativas</summary>
                        <ul>${listaAlts}</ul>
                    </details>` : ''}
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
    const boton = document.getElementById(`btn-${idSeguro}`);
    const pesoValue = inputElement.value;

    if (!pesoValue || isNaN(pesoValue) || pesoValue <= 0) return;

    localStorage.setItem('peso_' + idSeguro, pesoValue);

    inputElement.placeholder = pesoValue + " kg (último)";
    inputElement.value = '';

    // Retroalimentación visual inmediata
    boton.innerText = "✔";
    boton.classList.add('guardado');
    setTimeout(() => { 
        boton.innerText = "Guardar"; 
        boton.classList.remove('guardado');
    }, 1500);
}

function renderizarDieta() {
    const ahora = new Date();
    const hora = ahora.getHours();
    
    let comidaActual = 'cena';
    if (hora >= 4 && hora < 12) comidaActual = 'desayuno';
    else if (hora >= 12 && hora < 18) comidaActual = 'comida';
    
    mostrarComida(comidaActual);

    if (ahora.getDay() === 0) {
        document.getElementById('alerta-domingo')?.classList.remove('hidden');
    }

    // Renderizar Snacks
    const listaSnacks = document.getElementById('lista-snacks');
    if (listaSnacks && planNutricion.snacks) {
        listaSnacks.innerHTML = '';
        planNutricion.snacks.forEach(item => {
            const li = document.createElement('li');
            li.innerText = item;
            listaSnacks.appendChild(li);
        });
    }
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
        
        let htmlEjercicios = (rut.ejercicios && rut.ejercicios.length > 0) 
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
