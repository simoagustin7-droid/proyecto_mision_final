const SUPABASE_URL = "https://kmtuczyvdyejjfnnkuml.supabase.co/rest/v1/";
const SUPABASE_KEY = "sb_publishable_-Qr1ncAKi7zi3b8aQZGG1Q_n8pR8jap";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. ESTADO GLOBAL DEL JUGADOR
let currentPlayer = {
    id: null,
    username: "",
    xp: 0,
    level: 1
};

// 3. EFECTO DE BARRA DE CARGA INICIAL
window.addEventListener('DOMContentLoaded', () => {
    const progress = document.getElementById('progress');
    const registerForm = document.getElementById('registerForm');
    let width = 0;

    const interval = setInterval(() => {
        if (width >= 100) {
            clearInterval(interval);
            registerForm.style.display = 'block';
        } else {
            width += 2;
            progress.style.width = width + '%';
        }
    }, 30);
});

// 4. LOGUEO / REGISTRO EN SUPABASE
document.getElementById('btnStart').addEventListener('click', async () => {
    const nameInput = document.getElementById('username').value.trim();
    if (!nameInput) return alert("Por favor, introduce un nombre de agente.");

    try {
        // Buscar si el perfil de usuario ya existe
        let { data: user, error } = await supabaseClient
            .from('players') // Tu tabla debe llamarse 'players'
            .select('*')
            .eq('username', nameInput)
            .single();

        if (error && error.code !== 'PGRST116') throw error; 

        if (user) {
            // Usuario existe: Cargar datos
            currentPlayer = user;
        } else {
            // Usuario nuevo: Insertar en la base de datos
            const { data: newUser, error: insertError } = await supabaseClient
                .from('players')
                .insert([{ username: nameInput, xp: 0, level: 1 }])
                .select()
                .single();

            if (insertError) throw insertError;
            currentPlayer = newUser;
        }

        // Actualizar UI e ingresar
        document.getElementById('playerIdentity').innerText = currentPlayer.username;
        document.getElementById('playerXP').innerText = currentPlayer.xp;
        document.getElementById('playerLevel').innerText = currentPlayer.level;

        document.getElementById('loader').classList.add('hidden');
        document.getElementById('gameContainer').classList.remove('hidden');

    catch (err) {
    console.error("Error completo de Supabase:", err);
    // Esto imprimirá el mensaje de error real del servidor en la consola
    if (err.message) {
        alert("Error: " + err.message);
    }
}
    }
});

// 5. SISTEMA DE ACTUALIZACIÓN DE XP REMOTO
async function addXP(amount) {
    currentPlayer.xp += amount;
    currentPlayer.level = Math.floor(currentPlayer.xp / 100) + 1;

    document.getElementById('playerXP').innerText = currentPlayer.xp;
    document.getElementById('playerLevel').innerText = currentPlayer.level;

    // Guardar cambios en Supabase en tiempo real
    await supabaseClient
        .from('players')
        .update({ xp: currentPlayer.xp, level: currentPlayer.level })
        .eq('id', currentPlayer.id);
}

// 6. ACTIVACIÓN DE LOS MINI-JUEGOS
function startMision(type) {
    if (type === 'biology') {
        document.getElementById('snake-game').classList.remove('hidden');
        initSnake();
    } else if (type === 'physics') {
        document.getElementById('pacman-game').classList.remove('hidden');
        initPacman();
    }
}

// --- SIMULADORES DE MOTORES GRÁFICOS (SNAKE & PACMAN) ---
let snakeInterval, pacmanInterval;

function initSnake() {
    const canvas = document.getElementById('snakeCanvas');
    const ctx = canvas.getContext('2d');
    let score = 0;
    document.getElementById('snakeScore').innerText = score;

    snakeInterval = setInterval(() => {
        ctx.clearRect(0,0,400,400);
        ctx.fillStyle = '#00ffcc';
        // Dibujo de prueba moviéndose
        ctx.fillRect(Math.random() * 380, Math.random() * 380, 20, 20);
        score += 5;
        document.getElementById('snakeScore').innerText = score;
    }, 500);
}

function closeSnake() {
    clearInterval(snakeInterval);
    document.getElementById('snake-game').classList.add('hidden');
    addXP(20); // Recompensa científica al cerrar
}

function initPacman() {
    const canvas = document.getElementById('pacmanCanvas');
    const ctx = canvas.getContext('2d');
    let score = 0;
    document.getElementById('pacmanScore').innerText = score;

    pacmanInterval = setInterval(() => {
        ctx.clearRect(0,0,400,400);
        ctx.fillStyle = '#ffee00';
        ctx.beginPath();
        ctx.arc(200, 200, 30, 0.2 * Math.PI, 1.8 * Math.PI);
        ctx.lineTo(200, 200);
        ctx.fill();
        score += 10;
        document.getElementById('pacmanScore').innerText = score;
    }, 400);
}

function closePacman() {
    clearInterval(pacmanInterval);
    document.getElementById('pacman-game').classList.add('hidden');
    addXP(40); // Recompensa científica al cerrar
}
