import { sb } from "../core/supabase.js";
import { state } from "../core/state.js";

export function renderLogin() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const appContent = document.getElementById('app-content');
    
    if (hamburgerBtn) hamburgerBtn.classList.add('hidden');

    appContent.innerHTML = `
        <div class="fade-in h-full flex flex-col items-center justify-center mt-10">
            <i class="fas fa-lock text-5xl text-[var(--gryffindor-red)] mb-6 filter drop-shadow-md"></i>
            <h1 class="text-3xl font-bold text-center magic-font mb-8">El Andén 9 ¾</h1>
            
            <div class="parchment-box p-8 rounded-lg w-full max-w-sm text-center">
                <p class="text-sm italic text-stone-700 mb-6 font-bold">Identifícate, joven mago, para entrar.</p>
                
                <form id="login-form" class="space-y-4">
                    <input type="email" id="magic-email" placeholder="Correo mágico..." required
                        class="w-full p-3 border-b-2 border-[var(--gold)] bg-white/50 focus:outline-none focus:bg-white transition text-lg">
                    
                    <input type="password" id="magic-password" placeholder="Contraseña..." required
                        class="w-full p-3 border-b-2 border-[var(--gold)] bg-white/50 focus:outline-none focus:bg-white transition text-lg tracking-widest">
                    
                    <button type="submit" id="login-btn" class="w-full bg-[var(--gryffindor-red)] text-white font-bold py-3 rounded shadow-md active:scale-95 transition mt-4">
                        <i class="fas fa-wand-magic-sparkles mr-2"></i> Iniciar Sesión (Alohomora)
                    </button>
                    
                    <button type="button" id="signup-btn" class="w-full bg-[#2b1b17] text-[var(--gold)] font-bold py-3 rounded shadow-md active:scale-95 transition mt-2 border border-[var(--gold)]">
                        <i class="fas fa-user-plus mr-2"></i> Crear nueva cuenta
                    </button>
                    
                    <p id="login-error" class="text-red-600 text-sm hidden font-bold mt-2"></p>
                </form>
            </div>
        </div>
    `;

    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('signup-btn').addEventListener('click', handleSignUp);
}

export async function handleLogin(e) {
    e.preventDefault();
    const emailInput = document.getElementById('magic-email').value; // Captura email
    const passwordInput = document.getElementById('magic-password').value;
    const errorMsg = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');
    const appContent = document.getElementById('app-content');

    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Revelando...`;
    btn.disabled = true;

    const { error } = await sb.auth.signInWithPassword({
        email: emailInput,
        password: passwordInput,
    });

    if (error) {
        errorMsg.textContent = "Credenciales incorrectas. ¡Muggle detectado!";
        errorMsg.classList.remove('hidden');
        btn.innerHTML = `<i class="fas fa-wand-magic-sparkles mr-2"></i> Alohomora`;
        btn.disabled = false;
    } else {
        // AQUÍ ESTÁ LA CLAVE: 
        // En lugar de inyectar el spinner y llamar a fetchTravelData() directamente,
        // vaciamos el appContent y llamamos a loadUserTrips() para que el usuario elija su viaje.
        appContent.innerHTML = '';
        if(window.loadUserTrips) window.loadUserTrips();
    }
}

export async function handleSignUp(e) {
    e.preventDefault();
    const emailInput = document.getElementById('magic-email').value;
    const passwordInput = document.getElementById('magic-password').value;
    const errorMsg = document.getElementById('login-error');
    const btn = document.getElementById('signup-btn');

    // Ocultar mensajes de error previos
    errorMsg.classList.add('hidden');

    if (!emailInput || !passwordInput) {
        errorMsg.textContent = "Introduce correo y contraseña para crear la cuenta.";
        errorMsg.classList.remove('hidden');
        return;
    }

    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Forjando cuenta...`;
    btn.disabled = true;

    // Llamada a Supabase para registrar al usuario
    const { data, error } = await sb.auth.signUp({
        email: emailInput,
        password: passwordInput,
    });

    if (error) {
        errorMsg.textContent = "Error al crear cuenta: " + error.message;
        errorMsg.classList.remove('hidden');
        btn.innerHTML = `<i class="fas fa-user-plus mr-2"></i> Crear nueva cuenta`;
        btn.disabled = false;
    } else {
        // ¡ÉXITO! Lanzamos el modal dinámico
        mostrarModalExito(emailInput, passwordInput);
    }
}

export function mostrarModalExito(email, password) {
    const modalHtml = `
        <div id="signup-success-modal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] px-4 fade-in">
            <div class="parchment-box p-8 rounded-lg text-center max-w-sm w-full relative border-2 border-[var(--gold)] shadow-2xl">
                <i class="fas fa-envelope-open-text text-6xl text-[var(--gold)] mb-4 filter drop-shadow-md"></i>
                <h2 class="text-2xl font-bold text-[var(--gryffindor-red)] mb-2 magic-font">¡Carta Aceptada!</h2>
                <p class="text-stone-700 font-medium mb-6 text-sm">Tu cuenta ha sido forjada con éxito en los registros del Ministerio de Magia.</p>
                
                <button id="btn-enter-app" class="w-full bg-[var(--gryffindor-red)] text-white font-bold py-3 rounded shadow-md active:scale-95 transition border border-[var(--gold)]">
                    <i class="fas fa-door-open mr-2"></i> Entrar al Andén 9 ¾
                </button>
            </div>
        </div>
    `;

    // Lo inyectamos al final del body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Le damos vida al botón del modal
    document.getElementById('btn-enter-app').addEventListener('click', async () => {
        const btn = document.getElementById('btn-enter-app');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Cruzando el muro...';
        btn.disabled = true;

        // Iniciar sesión automáticamente de fondo
        const { error } = await sb.auth.signInWithPassword({
            email: email,
            password: password,
        });

        // Destruimos el modal del HTML
        document.getElementById('signup-success-modal').remove();

        if (error) {
            if(window.customAlert) window.customAlert("Acceso Bloqueado", "Error al intentar cruzar el muro: " + error.message, "fa-lock");
        } else {
            // Entramos de lleno a la aplicación
            const appContent = document.getElementById('app-content');
            if(appContent) appContent.innerHTML = '';
            if(window.loadUserTrips) window.loadUserTrips();
        }
    });
}

export async function logout() {
    const { error } = await sb.auth.signOut();
    if (!error) {
        localStorage.removeItem('travel_data_cache_' + state.currentViajeId); // Limpiar caché al salir
        location.reload();
    }
}

export function toggleLogoutButton(show) {
    const actions = document.getElementById('header-actions');
    if (actions) {
        if (show) actions.classList.remove('hidden');
        else actions.classList.add('hidden');
    }
}
