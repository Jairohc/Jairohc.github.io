// ==========================================
// 1. BASES DE DATOS LOCALES (Del PDF)
// ==========================================
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
        "B: Base Papa (200g carne magra + 200g papa + 10g aceite)",
        "Snack A: Whey + 150g fruta + 15g nueces",
        "Snack B: 150g yogur griego + 150g fruta + 15g nueces",
        "Libre: Gelatina Light ilimitada"
    ],
    cena: [
        "A: Tacos Atún (200g atún + 3 tortillas + 50g aguacate)",
        "B: Pasta con Pollo (200g pollo + 60g pasta seco + 10g aceite)",
        "C: Tacos Pescado (200g tilapia + 4 tortillas + 50g aguacate)",
        "D: Tacos Pollo (200g pollo + 3 tortillas + 50g aguacate)",
        "E: Tacos Res (200g bistec + 3 tortillas + 50g aguacate)"
    ]
};

const rutinas = {
    1: { 
        nombre: "Lunes: Empuje (Pecho/Hombro/Tríceps)", 
        cardio: "Caminadora Inclinada: 20 min | 5% | 4.2-4.8 km/h",
        ejercicios: ["Press de banca: 3x6-8", "Press inclinado mancuerna: 3x8-10", "Press militar sentado: 3x8-10", "Elevaciones laterales: 3x12-15", "Extensión de tríceps: 3x10-12"]
    },
    2: { 
        nombre: "Martes: Pierna 1 (Cuádriceps) + Core", 
        cardio: "Caminadora Plana: 20 min | 0% | 4.0 km/h",
        ejercicios: ["Sentadilla libre o Hack: 3x6-8", "Prensa de piernas: 3x10-12", "Extensión de cuádriceps: 3x12-15", "Curl de isquios tumbado: 3x10-12", "Elevación de talones: 4x10-15"]
    },
    3: { 
        nombre: "Miércoles: Tirón (Espalda/Bíceps)", 
        cardio: "Caminadora Inclinada: 20 min | 5% | 4.2-4.8 km/h",
        ejercicios: ["Dominadas o Jalón: 3x6-8", "Remo con barra/máquina: 3x8-10", "Pullover en polea: 2x12-15", "Face pulls: 3x12-15", "Curl de bíceps mancuerna: 3x10-12"]
    },
    4: { 
        nombre: "Jueves: Pierna 2 (Isquios/Glúteo) + Core", 
        cardio: "Caminadora Plana: 20 min | 0% | 4.0 km/h",
        ejercicios: ["Peso muerto rumano: 3x8-10", "Zancadas búlgaras: 3x10-12", "Curl de isquios sentado: 3x12-15", "Prensa pies altos: 2x12-15", "Elevación de talones: 4x10-15"]
    },
    5: { 
        nombre: "Viernes: Torso (Mantenimiento)", 
        cardio: "Caminadora Inclinada: 20 min | 6% | 4.5 km/h",
        ejercicios: ["Aperturas en polea: 3x10-12", "Remo unilateral mancuerna: 3x8-10", "Press hombros máquina: 3x10-12", "Curl bíceps polea: 2x12-15", "Extensión tríceps copa: 2x12-15"]
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

// ==========================================
// 2. LÓGICA DE RENDERIZADO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    actualizarReloj();
    setInterval(actualizarReloj, 60000);
    renderizarHoy();
    renderizarSemana();
});

function actualizarReloj() {
    const ahora = new Date();
    const opciones = { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    document.getElementById('fecha-hora').innerText = ahora.toLocaleDateString('es-MX', opciones).toUpperCase();
}

function renderizarHoy() {
    const ahora = new Date();
    const diaSemana = ahora.getDay();
    const hora = ahora.getHours();

    // -- Lógica Nutricional --
    let momentoStr = "";
    let opcionesComida = [];

    if (hora >= 4 && hora < 12) {
        momentoStr = "☀️ Desayuno (450 kcal | 35g Prot)";
        opcionesComida = planNutricion.desayuno;
    } else if (hora >= 12 && hora < 18) {
        momentoStr = "🌤️ Comida / Snack";
        opcionesComida = planNutricion.comida;
    } else {
        momentoStr = "🌙 Cena (450 kcal | 40g Prot)";
        opcionesComida = planNutricion.cena;
    }

    if (diaSemana === 0) {
        document.getElementById('alerta-domingo').classList.remove('hidden');
    }

    document.getElementById('momento-dia').innerText = momentoStr;
    const listaComidas = document.getElementById('lista-comidas');
    opcionesComida.forEach(item => {
        const li = document.createElement('li');
        li.innerText = item;
        listaComidas.appendChild(li);
    });

    // -- Lógica de Entrenamiento --
    const rutinaDia = rutinas[diaSemana];
    document.getElementById('nombre-rutina').innerText = rutinaDia.nombre;
    document.getElementById('bloque-cardio').innerText = "Cardio/Actividad: " + rutinaDia.cardio;

    const listaEjercicios = document.getElementById('lista-ejercicios');
    if (rutinaDia.ejercicios.length > 0) {
        rutinaDia.ejercicios.forEach(ej => {
            const li = document.createElement('li');
            li.innerText = ej;
            listaEjercicios.appendChild(li);
        });
    } else {
        listaEjercicios.innerHTML = "<li>Carga tus rutas y monitorea FC en Garmin Connect.</li>";
    }
}

function renderizarSemana() {
    const contenedor = document.getElementById('contenedor-semana');
    // Iteramos del 1 (Lunes) al 6 (Sábado), y al final agregamos el 0 (Domingo)
    const ordenDias = [1, 2, 3, 4, 5, 6, 0]; 

    ordenDias.forEach(dia => {
        const rut = rutinas[dia];
        const div = document.createElement('div');
        div.className = 'dia-semana';
        
        let htmlEjercicios = rut.ejercicios.length > 0 
            ? rut.ejercicios.map(e => `<li>${e}</li>`).join('') 
            : `<li>Día de Ciclismo</li>`;

        div.innerHTML = `
            <h3>${rut.nombre}</h3>
            <p><strong>Foco:</strong> ${rut.cardio}</p>
            <ul>${htmlEjercicios}</ul>
        `;
        contenedor.appendChild(div);
    });
}

function toggleVista() {
    const vistaHoy = document.getElementById('vista-hoy');
    const vistaSemana = document.getElementById('vista-semana');
    
    if (vistaHoy.classList.contains('hidden')) {
        vistaHoy.classList.remove('hidden');
        vistaSemana.classList.add('hidden');
    } else {
        vistaHoy.classList.add('hidden');
        vistaSemana.classList.remove('hidden');
    }
}
