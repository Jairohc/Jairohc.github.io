// ==========================================
// 1. CONFIGURACIÓN SUPABASE
// ==========================================
const supabaseUrl = 'AQUÍ_TU_PROJECT_URL';
const supabaseKey = 'AQUÍ_TU_ANON_KEY';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
let myChart = null; // Instancia global para destruir la gráfica previa

// ==========================================
// 2. BASES DE DATOS LOCALES (Del PDF)
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
        cardio: "Caminadora Inclinada: 20 min | Inclinación 5% | 4.2-4.8 km/h",
        ejercicios: ["Press de banca", "Press inclinado mancuerna", "Press militar sentado", "Elevaciones laterales", "Extensión de tríceps polea"]
    },
    2: { 
        nombre: "Martes: Pierna 1 (Foco Cuádriceps) + Core", 
        cardio: "Caminadora Plana: 20 min | Inclinación 0% | 4.0 km/h",
        ejercicios: ["Sentadilla libre o Hack", "Prensa de piernas", "Extensión de cuádriceps", "Curl de isquios tumbado", "Elevación de talones"]
    },
    3: { 
        nombre: "Miércoles: Tirón (Espalda/Bíceps)", 
        cardio: "Caminadora Inclinada: 20 min | Inclinación 5% | 4.2-4.8 km/h",
        ejercicios: ["Dominadas o Jalón al pecho", "Remo con barra o máquina", "Pullover en polea alta", "Face pulls", "Curl de bíceps mancuerna"]
    },
    4: { 
        nombre: "Jueves: Pierna 2 (Isquios/Glúteo) + Core", 
        cardio: "Caminadora Plana: 20 min | Inclinación 0% | 4.0 km/h",
        ejercicios: ["Peso muerto rumano", "Zancadas búlgaras", "Curl de isquios sentado", "Prensa pies altos", "Elevación de talones"]
    },
    5: { 
        nombre: "Viernes: Torso (Mantenimiento General)", 
        cardio: "Caminadora Inclinada: 20 min | Inclinación 6% | 4.5 km/h",
        ejercicios: ["Aperturas en polea", "Remo unilateral mancuerna", "Press hombros máquina", "Curl bíceps polea", "Extensión tríceps copa"]
    },
    6: { 
        nombre: "Sábado: Ciclismo de Montaña (MTB)", 
        cardio: "Zonas FC: 2 a 4. Monitorear carga aguda en Garmin.",
        ejercicios: [] // Sin pesas
    },
    0: { 
        nombre: "Domingo: Ciclismo Recuperación Activa", 
        cardio: "Zona FC: 1 y 2 estrictas. Cancelar si VFC deprimida.",
        ejercicios: [] // Sin pesas
    }
};

// ==========================================
// 3. LÓGICA PRINCIPAL DEL DOM
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    actualizarReloj();
    setInterval(actualizarReloj, 60000);
    renderizarDashboard();
});

function actualizarReloj() {
    const ahora = new Date();
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    document.getElementById('fecha-hora').innerText = ahora.toLocaleDateString('es-MX', opciones);
}

async function renderizarDashboard() {
    const ahora = new Date();
    const diaSemana = ahora.getDay();
    const hora = ahora.getHours();

    // Lógica Nutricional
    let momentoStr = "";
    let opcionesComida = [];

    if (hora >= 4 && hora < 12) {
        momentoStr = "Desayuno (Objetivo: 450 kcal | 35g Prot)";
        opcionesComida = planNutricion.desayuno;
    } else if (hora >= 12 && hora < 18) {
        momentoStr = "Comida / Snack";
        opcionesComida = planNutricion.comida;
    } else {
        momentoStr = "Cena (Objetivo: 450 kcal | 40g Prot)";
        opcionesComida = planNutricion.cena;
    }

    if (diaSemana === 0) {
        document.getElementById('alerta-domingo').classList.remove('hidden');
    }

    document.getElementById('momento-dia').innerText = momentoStr;
    const listaComidas = document.getElementById('lista-comidas');
    listaComidas.innerHTML = '';
    opcionesComida.forEach(item => {
        const li = document.createElement('li');
        li.innerText = item;
        listaComidas.appendChild(li);
    });

    // Lógica de Entrenamiento
    const rutinaDia = rutinas[diaSemana];
    document.getElementById('nombre-rutina').innerText = rutinaDia.nombre;
    document.getElementById('bloque-cardio').innerText = "Cardio Innegociable: " + rutinaDia.cardio;

    const contenedorEjercicios = document.getElementById('contenedor-ejercicios');
    contenedorEjercicios.innerHTML = '';

    if (rutinaDia.ejercicios.length > 0) {
        for (const ejercicio of rutinaDia.ejercicios) {
            // Se dibuja el HTML base
            const div = document.createElement('div');
            div.className = 'ejercicio-item';
            div.innerHTML = `
                <div class="ejercicio-nombre">${ejercicio}</div>
                <div class="controles-peso">
                    <input type="number" id="peso-${btoa(ejercicio)}" placeholder="Kg" step="0.5">
                    <button class="btn-guardar" onclick="guardarPeso('${ejercicio}')">Guardar</button>
                    <button class="btn-grafica" onclick="verHistorial('${ejercicio}')">📈</button>
                </div>
            `;
            contenedorEjercicios.appendChild(div);

            // Consulta asíncrona para traer el último peso registrado y llenar el placeholder
            const ultimoPeso = await obtenerUltimoPeso(ejercicio);
            if (ultimoPeso) {
                document.getElementById(`peso-${btoa(ejercicio)}`).placeholder = ultimoPeso + " Kg (Último)";
            }
        }
    } else {
        contenedorEjercicios.innerHTML = "<p>Hoy es día enfocado en ciclismo. Carga tus rutas en Garmin Connect.</p>";
    }
}

// ==========================================
// 4. FUNCIONES SUPABASE Y CHART.JS
// ==========================================
async function obtenerUltimoPeso(ejercicio) {
    const { data, error } = await supabase
        .from('historial_entrenamiento')
        .select('peso_levantado')
        .eq('ejercicio', ejercicio)
        .order('fecha', { ascending: false })
        .limit(1);
    
    if (data && data.length > 0) {
        return data[0].peso_levantado;
    }
    return null;
}

async function guardarPeso(ejercicio) {
    const inputId = `peso-${btoa(ejercicio)}`;
    const inputElement = document.getElementById(inputId);
    const pesoValue = parseFloat(inputElement.value);

    if (isNaN(pesoValue) || pesoValue <= 0) {
        alert("Por favor ingresa un peso válido.");
        return;
    }

    const { data, error } = await supabase
        .from('historial_entrenamiento')
        .insert([{
            ejercicio: ejercicio,
            peso_levantado: pesoValue,
            repeticiones: 0 // Simplificado para este MVP
        }]);

    if (error) {
        alert("Error al guardar en BD: " + error.message);
    } else {
        inputElement.style.backgroundColor = "#e8f8f5"; // Feedback visual verde
        setTimeout(() => { inputElement.style.backgroundColor = ""; }, 1500);
        inputElement.value = ''; // Limpiar input
        inputElement.placeholder = pesoValue + " Kg (Guardado)";
    }
}

async function verHistorial(ejercicio) {
    document.getElementById('modal-historial').classList.remove('hidden');
    document.getElementById('titulo-grafica').innerText = "Historial: " + ejercicio;

    const { data, error } = await supabase
        .from('historial_entrenamiento')
        .select('fecha, peso_levantado')
        .eq('ejercicio', ejercicio)
        .order('fecha', { ascending: true });

    if (error) {
        console.error(error);
        return;
    }

    const fechas = data.map(registro => new Date(registro.fecha).toLocaleDateString('es-MX'));
    const pesos = data.map(registro => registro.peso_levantado);

    const ctx = document.getElementById('graficaPesos').getContext('2d');
    
    // Destruir instancia previa si existe para evitar superposición
    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: fechas.length > 0 ? fechas : ['Sin datos'],
            datasets: [{
                label: 'Peso (Kg)',
                data: pesos.length > 0 ? pesos : [0],
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: false }
            }
        }
    });
}

function cerrarModal() {
    document.getElementById('modal-historial').classList.add('hidden');
}
