import { sb } from "../../js/core/supabase.js";
import { state } from "../../js/core/state.js";
import { DataService } from "../../js/api/dataService.js";
import { generarGuiaPDF } from "./features/pdf.js";
import { renderGastos, addGasto, deleteGasto } from "./features/gastos.js";
import { renderExtras, openFullscreenMap, closeFullscreenMap, toggleChecklist, toggleSecretos } from "./features/checklist.js";
import { renderItineraryList, renderDayDetail, renderSecretDetails } from "./features/itinerario.js";
import { renderTransport } from "./features/transporte.js";
import { renderFood } from "./features/comida.js";
import { renderExplorerPass } from "./features/explorer-pass.js";
import { renderLogin, handleLogin, handleSignUp, logout, toggleLogoutButton } from "../../js/auth/auth.js";

window.openFullscreenMap = openFullscreenMap;
window.closeFullscreenMap = closeFullscreenMap;
window.toggleChecklist = toggleChecklist;
window.toggleSecretos = toggleSecretos;

window.renderItineraryList = renderItineraryList;
window.renderDayDetail = renderDayDetail;
window.renderSecretDetails = renderSecretDetails;

// Make setActiveNav globally available for imported modules
window.setActiveNav = setActiveNav;

// Variables globales
let appContent, hamburgerBtn, navItems;

async function checkAuthAndInit() {
    appContent = document.getElementById('app-content');
    hamburgerBtn = document.getElementById('hamburger-btn');
    navItems = document.querySelectorAll('.nav-item');

    const { data: { session } } = await sb.auth.getSession();

    if (session) {
        // ¿Venimos desde el botón del Admin?
        const urlParams = new URLSearchParams(window.location.search);
        const goToViaje = urlParams.get('viaje');

        if (goToViaje) {
            // Limpiamos la URL para que quede bonita (index.html a secas)
            window.history.replaceState({}, document.title, window.location.pathname);

            // Buscamos el nombre de ese viaje para ponerlo en el menú de carga
            const nombre = await DataService.getTripName(goToViaje);
            if (nombre) {
                selectTrip(goToViaje, nombre);
            }
        }

        // Si no venimos del admin, cargamos la lista normal
        loadUserTrips();
    } else {
        document.getElementById('trip-selection-container').style.display = 'none';
        appContent.style.display = 'block';
        renderLogin();
    }
}

// Escuchar cambios de estado
sb.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
        // Usuario no logueado: Ocultar selector de viajes, mostrar appContent y renderizar login
        if (hamburgerBtn) hamburgerBtn.classList.add('hidden');
        document.getElementById('trip-selection-container').style.display = 'none';
        appContent.style.display = 'block'; // Aseguramos que el main es visible
        renderLogin();
    }
});


// Iniciar la app
document.addEventListener('DOMContentLoaded', checkAuthAndInit);

// --- FETCH DE DATOS DESDE SUPABASE (MAGIA RELACIONAL 3FN) ---
async function fetchTravelData() {
    try {
        const cacheKey = 'travel_data_cache_' + state.currentViajeId;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            state.organizadorViaje = JSON.parse(cached);
            renderHome();
            toggleLogoutButton(true);
        }

        const data = await DataService.getTravelData(state.currentViajeId);
        state.organizadorViaje = data;

        document.title = state.organizadorViaje.config.titulo || "Expedición";
        localStorage.setItem(cacheKey, JSON.stringify(state.organizadorViaje));

        if (hamburgerBtn) hamburgerBtn.classList.remove('hidden');
        toggleLogoutButton(true);
        if (!cached) renderHome();

    } catch (error) {
        console.error("Error:", error);
        appContent.innerHTML = '...';
        const btn = document.getElementById('login-btn');
        if (btn) btn.disabled = false;
    }
}
function setActiveNav(id) {
    navItems.forEach(item => {
        item.classList.remove('active', 'text-[var(--gold)]', 'bg-white/10');
        item.classList.add('text-gray-400');
    });
    const activeItem = document.getElementById(id);
    if (activeItem) {
        activeItem.classList.remove('text-gray-400');
        activeItem.classList.add('active', 'text-[var(--gold)]', 'bg-white/10');
    }
}


// ==========================================
// --- FUNCIONES DE RENDERIZADO VISUAL ---
// ==========================================

function renderHome() {
    setActiveNav('nav-home');
    appContent.innerHTML = `
        <div class="fade-in">
            <div class="text-center mb-6 pt-4">
                <i class="fas fa-hat-wizard text-5xl text-[var(--gryffindor-red)] mb-3 filter drop-shadow-md"></i>
                <h1 class="text-3xl font-bold text-[var(--gryffindor-red)] mb-1">${state.organizadorViaje.config.titulo}</h1>
                <p class="text-xl italic font-bold text-stone-700">${state.organizadorViaje.config.subtitulo}</p>
                <p class="text-sm mt-3 font-bold bg-yellow-100/80 inline-block px-4 py-1.5 rounded-full border border-yellow-400 shadow-sm">
                    <i class="fas fa-home"></i> Base: ${state.organizadorViaje.config.base}
                </p>
            </div>

            <div class="parchment-box p-6 rounded-lg mb-6 transform">
                <h2 class="text-xl font-bold mb-3 border-b border-[var(--ink)] pb-2 flex items-center gap-2">
                    <i class="fas fa-scroll text-[var(--gryffindor-red)]"></i> Contexto
                </h2>
                <p class="text-base leading-relaxed text-justify mb-4 font-medium text-stone-800">
                    ${state.organizadorViaje.intro.texto}
                </p>
                <div class="flex items-start gap-3 text-sm font-bold text-[var(--gryffindor-red)] bg-white/50 p-2 rounded">
                    <i class="fas fa-bed mt-1"></i> 
                    <span>${state.organizadorViaje.intro.alojamiento}</span>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="parchment-box p-4 rounded text-center active:bg-yellow-100 transition" onclick="renderItineraryList()">
                    <i class="fas fa-map-marked-alt text-3xl mb-2 text-[var(--gryffindor-red)]"></i>
                    <h3 class="font-bold" style="cursor:pointer">Itinerario</h3>
                    <p class="text-xs text-gray-600">Día a día</p>
                </div>
                <div class="parchment-box p-4 rounded text-center active:bg-yellow-100 transition" onclick="renderTransport()">
                    <i class="fas fa-bus text-3xl mb-2 text-[var(--gryffindor-red)]"></i>
                    <h3 class="font-bold" style="cursor:pointer">Transporte</h3>
                    <p class="text-xs text-gray-600">Oyster & Metro</p>
                </div>
            </div>

            <div class="parchment-box p-5 rounded-lg bg-red-50 border-red-200 mb-4">
                <h3 class="font-bold text-[var(--gryffindor-red)] mb-2 flex items-center gap-2">
                    <i class="fas fa-coins"></i> Presupuesto
                </h3>
                <p class="text-sm italic mb-2 font-bold">Objetivo: ${state.organizadorViaje.config.presupuesto}</p>
            </div>
        </div>
        <button onclick="generarGuiaPDF()" class="w-full parchment-box p-4 rounded-lg shadow-md flex items-center justify-center gap-3 mt-6 bg-red-50 border-[var(--gold)] active:scale-95 transition-all">
            <i class="fas fa-file-pdf text-2xl text-[var(--gryffindor-red)]"></i>
            <span class="font-bold magic-font text-[var(--ink)]">Descargar Guía Mágica (PDF)</span>
        </button>
    `;

}

window.renderExplorerPass = renderExplorerPass;

window.openMap = function (destination) {
    const query = encodeURIComponent(destination);
    // Usamos la URL oficial de búsqueda de Google Maps
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
}



window.toggleMenu = function () {
    const sidebar = document.getElementById('sidebar-nav');
    const overlay = document.getElementById('sidebar-overlay');

    if (sidebar.classList.contains('-translate-x-full')) {
        // Abrir menú
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
        // Pequeño retardo para que la transición de opacidad se vea suave
        setTimeout(() => overlay.classList.remove('opacity-0'), 10);
    } else {
        // Cerrar menú
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('opacity-0');
        // Esperamos a que termine la animación css para ocultarlo del todo
        setTimeout(() => overlay.classList.add('hidden'), 300);
    }
}

function formatearFecha(fechaString) {
    if (!fechaString) return '';
    // Añadimos 'T00:00:00' para evitar problemas de zona horaria al convertir
    const fecha = new Date(fechaString + 'T00:00:00');
    const opciones = { weekday: 'long', day: 'numeric', month: 'long' };
    let texto = fecha.toLocaleDateString('es-ES', opciones);
    // Capitalizamos y quitamos el " de " para que quede "Lunes 30 Marzo"
    return texto.charAt(0).toUpperCase() + texto.slice(1).replace(' de ', ' ');
}

window.generarGuiaPDF = function () {
    generarGuiaPDF(state.organizadorViaje);
};

async function loadUserTrips() {
    document.getElementById('app-content').style.display = 'none';
    document.getElementById('trip-selection-container').style.display = 'flex';

    const btnHamburguesa = document.getElementById('hamburger-btn');
    if (btnHamburguesa) btnHamburguesa.classList.add('hidden');

    const btnAdminHeader = document.querySelector('button[title="Administración"]');
    const btnAdminNav = document.getElementById('nav-admin');

    if (btnAdminHeader) btnAdminHeader.style.setProperty('display', 'none', 'important');
    if (btnAdminNav) btnAdminNav.style.setProperty('display', 'none', 'important');

    const tripList = document.getElementById('trip-list');
    tripList.innerHTML = '<p class="text-stone-600 italic text-sm"><i class="fas fa-spinner fa-spin text-[var(--gold)] mr-2"></i>Consultando con Gringotts...</p>';

    const { data: { user }, error: authErr } = await sb.auth.getUser();
    if (authErr || !user) return;

    try {
        const invitacionesPendientes = await DataService.getPendingInvitations(user.id);
        if (invitacionesPendientes && invitacionesPendientes.length > 0) {
            mostrarModalInvitacion(invitacionesPendientes[0]);
            return;
        }

        const misViajes = await DataService.getUserTrips(user.id);
        const invitacionesAceptadas = await DataService.getAcceptedInvitations(user.id);

        const viajesPropios = (misViajes || []).map(v => ({ ...v, isReadOnly: false }));
        const viajesCompartidos = (invitacionesAceptadas || [])
            .filter(inv => inv.viajes !== null && inv.viajes.activo === true)
            .map(inv => ({ ...inv.viajes, isReadOnly: true }));

        const todosLosViajes = [...viajesPropios, ...viajesCompartidos];

        tripList.innerHTML = '';

        if (todosLosViajes.length === 0) {
            tripList.innerHTML = '<p class="text-stone-700 font-medium text-sm">No tienes ningún activo. ¡Forja el primero abajo!</p>';
        } else {
            todosLosViajes.forEach(viaje => {
                const btn = document.createElement('button');
                btn.className = 'w-full mb-2 bg-white/80 p-3 rounded shadow-sm border border-[var(--gold)] text-[var(--ink)] font-bold active:scale-95 transition hover:bg-yellow-50 flex justify-between items-center group';
                const etiquetaInvitado = viaje.isReadOnly ? '<span class="text-xs font-bold bg-stone-200 text-stone-600 px-2 py-0.5 ml-2 rounded uppercase border border-stone-300">Invitado</span>' : '';
                btn.innerHTML = `
                    <span class="text-left flex-1 truncate pr-2 text-lg flex items-center">${viaje.nombre} ${etiquetaInvitado}</span> 
                    <i class="fas fa-chevron-right text-[var(--gryffindor-red)] opacity-50 group-hover:opacity-100 transition-opacity"></i>
                `;
                btn.onclick = () => selectTrip(viaje.id, viaje.nombre, viaje.isReadOnly);
                tripList.appendChild(btn);
            });
        }
    } catch (err) {
        console.error(err);
        tripList.innerHTML = '<p class="text-red-600 font-bold text-sm">Maldición detectada al cargar los viajes.</p>';
    }
}

function selectTrip(viajeId, viajeNombre, isReadOnly = false) {
    // 1. Guardar el ID globalmente y su estado de lectura
    state.currentViajeId = viajeId;
    localStorage.setItem('state.currentViajeId', viajeId);

    // Guardamos en una variable global si es invitado para usarlo en otras funciones
    state.isCurrentTripReadOnly = isReadOnly;

    // ==========================================
    // BLOQUEO VISUAL DE BOTONES DE ADMIN
    // ==========================================
    // Buscamos el botón de cabecera por su 'title' ya que no tiene ID
    const btnAdminHeader = document.querySelector('button[title="Administración"]');
    // Buscamos el botón del menú lateral
    const btnAdminNav = document.getElementById('nav-admin');

    if (isReadOnly) {
        // Es un invitado: Usamos style directo con !important para machacar el "md:flex" y "flex" de Tailwind
        if (btnAdminHeader) btnAdminHeader.style.setProperty('display', 'none', 'important');
        if (btnAdminNav) btnAdminNav.style.setProperty('display', 'none', 'important');
    } else {
        // Es el dueño: Eliminamos el estilo en línea para que Tailwind recupere el control y lo muestre
        if (btnAdminHeader) btnAdminHeader.style.removeProperty('display');
        if (btnAdminNav) btnAdminNav.style.removeProperty('display');
    }
    // ==========================================

    // 2. Ocultar selector de viajes, mostrar el contenedor principal
    document.getElementById('trip-selection-container').style.display = 'none';
    document.getElementById('app-content').style.display = 'block';

    // 3. Poner un spinner de carga bonito
    document.getElementById('app-content').innerHTML = `
        <div class="h-full flex flex-col items-center justify-center mt-20 fade-in">
            <i class="fas fa-spinner fa-spin text-5xl text-[var(--gold)] mb-4"></i>
            <p class="font-bold magic-font text-[var(--ink)] text-xl">Viajando a ${viajeNombre}...</p>
        </div>
    `;

    // 4. Cargar los datos
    fetchTravelData();
};

async function createNewTrip() {
    const inputName = document.getElementById('new-trip-name');
    const nombreViaje = inputName.value.trim();

    if (!nombreViaje) {
        customAlert("Atención", "Por favor, introduce un nombre para el viaje.", "fa-feather-alt");
        return;
    }

    const { data: { user } } = await sb.auth.getUser();

    try {
        const data = await DataService.createNewTrip(nombreViaje, user.id);
        inputName.value = '';
        selectTrip(data[0].id, data[0].nombre);
    } catch (error) {
        console.error("Error creando el viaje:", error);
        customAlert("Error", "Hubo un error al crear el viaje.", "fa-times-circle");
    }
};

function backToTrips() {
    // 1. Opcional: Limpiar el ID del viaje actual en caché para evitar auto-cargas extrañas
    state.currentViajeId = null;

    // 2. Vaciamos el contenido de la app para que no se quede "congelado" el viaje anterior de fondo
    document.getElementById('app-content').innerHTML = '';

    // 3. Ocultamos la app y mostramos el selector de viajes
    document.getElementById('app-content').style.display = 'none';
    document.getElementById('trip-selection-container').style.display = 'flex';

    // 5. Volvemos a cargar la lista para que se muestre actualizada
    loadUserTrips();
};

function goToAdmin() {
    // Si la variable que creamos arriba es true, bloqueamos la entrada
    if (state.isCurrentTripReadOnly) {
        alert("Magia oscura detectada: No tienes permiso para configurar este viaje.");
        return;
    }

    if (state.currentViajeId) {
        window.location.href = `admin.html?viaje=${state.currentViajeId}`;
    } else {
        window.location.href = 'admin.html';
    }
};


function mostrarModalInvitacion(invitacion) {
    // 1. Extraemos el nombre de forma segura. Si 'viajes' es null, ponemos un texto genérico.
    const nombreViaje = invitacion.viajes?.nombre || "una expedición secreta";

    const modalHtml = `
        <div id="invitation-modal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] px-4 fade-in">
            <div class="parchment-box p-8 rounded-lg text-center max-w-sm w-full relative border-2 border-[var(--gold)] shadow-2xl">
                <i class="fas fa-envelope-open-text text-6xl text-[var(--gold)] mb-4 filter drop-shadow-md"></i>
                <h2 class="text-2xl font-bold text-[var(--gryffindor-red)] mb-2 magic-font">¡Tienes una Lechuza!</h2>
                
                <p class="text-stone-700 font-medium mb-6 text-sm">Has sido invitado a participar como observador (Modo Lectura) en la expedición: <br><strong class="text-lg">"${nombreViaje}"</strong></p>
                
                <div class="flex gap-3">
                    <button id="btn-decline-inv" onclick="responderInvitacion(${invitacion.id}, 'declinada')" class="w-full bg-stone-300 text-stone-800 font-bold py-3 rounded shadow-md active:scale-95 transition">
                        Declinar
                    </button>
                    <button id="btn-accept-inv" onclick="responderInvitacion(${invitacion.id}, 'aceptada')" class="w-full bg-[var(--gryffindor-red)] text-white font-bold py-3 rounded shadow-md active:scale-95 transition border border-[var(--gold)]">
                        Aceptar
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

async function responderInvitacion(invitacionId, respuesta) {
    document.getElementById('invitation-modal').remove();

    try {
        await DataService.respondToInvitation(invitacionId, respuesta);
    } catch (e) {
        console.error(e);
    }

    // Recargar para ver el viaje (si aceptó) o para seguir el flujo
    loadUserTrips();
}

// ==========================================
// --- SISTEMA DE MODALES MÁGICOS (APP) ---
// ==========================================
window.initCustomModal = function () {
    if (document.getElementById('custom-modal-overlay')) return;
    const modalHTML = `
        <div id="custom-modal-overlay" class="fixed inset-0 bg-black/80 z-[300] hidden flex items-center justify-center p-4 transition-opacity duration-300 opacity-0">
            <div class="parchment-box border-2 border-[var(--gold)] p-8 rounded-lg shadow-2xl max-w-md w-full transform transition-transform duration-300 scale-95" id="custom-modal-box">
                <h3 class="text-3xl font-bold text-[var(--gryffindor-red)] magic-font mb-4 flex items-center gap-3">
                    <i id="custom-modal-icon" class="fas fa-question-circle text-[var(--gold)]"></i> 
                    <span id="custom-modal-title">Atención</span>
                </h3>
                <p id="custom-modal-message" class="text-stone-800 text-lg mb-8 font-medium"></p>
                <div class="flex justify-end gap-4 mt-6 pt-4 border-t border-[var(--gold)]/30" id="custom-modal-buttons"></div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}


window.showModal = function (type, title, message, icon) {
    return new Promise((resolve) => {
        initCustomModal();
        const overlay = document.getElementById('custom-modal-overlay');
        const box = document.getElementById('custom-modal-box');

        document.getElementById('custom-modal-title').textContent = title;
        document.getElementById('custom-modal-message').innerHTML = message;
        document.getElementById('custom-modal-icon').className = `fas ${icon} text-[var(--gold)]`;

        const close = (result) => {
            overlay.classList.remove('opacity-100');
            box.classList.remove('scale-100');
            setTimeout(() => {
                overlay.classList.add('hidden');
                resolve(result);
            }, 300);
        };

        const buttonsEl = document.getElementById('custom-modal-buttons');
        if (type === 'confirm') {
            buttonsEl.innerHTML = `
                <button id="modal-btn-cancel" class="px-5 py-2 bg-[#1a100d] text-[var(--gold)] border border-[var(--gold)] rounded font-bold hover:bg-black transition">Cancelar</button>
                <button id="modal-btn-confirm" class="px-5 py-2 bg-[var(--gryffindor-red)] text-white border border-[var(--gold)] rounded font-bold hover:bg-red-900 transition shadow-md">Confirmar</button>
            `;
            document.getElementById('modal-btn-cancel').onclick = () => close(false);
            document.getElementById('modal-btn-confirm').onclick = () => close(true);
        } else {
            buttonsEl.innerHTML = `
                <button id="modal-btn-ok" class="px-5 py-2 bg-[var(--gryffindor-red)] text-white border border-[var(--gold)] rounded font-bold hover:bg-red-900 transition shadow-md">Aceptar</button>
            `;
            document.getElementById('modal-btn-ok').onclick = () => close(true);
        }

        overlay.classList.remove('hidden');
        setTimeout(() => {
            overlay.classList.add('opacity-100');
            box.classList.add('scale-100');
        }, 10);
    });
};

window.customConfirm = (title, message, icon = 'fa-question-circle') => showModal('confirm', title, message, icon);
window.customAlert = (title, message, icon = 'fa-exclamation-triangle') => showModal('alert', title, message, icon);

// --- EXPORTAR FUNCIONES AL ÁMBITO GLOBAL ---
window.renderHome = renderHome;
window.renderItineraryList = renderItineraryList;
window.renderDayDetail = renderDayDetail;
window.renderTransport = renderTransport;
window.renderFood = renderFood;
window.renderExtras = renderExtras;
window.renderExplorerPass = renderExplorerPass;
window.logout = logout;
window.handleLogin = handleLogin;
window.renderSecretDetails = renderSecretDetails;
// Añadidos para Gringotts y el Checklist
window.renderGastos = renderGastos;
window.addGasto = addGasto;
window.deleteGasto = deleteGasto;
window.toggleChecklist = toggleChecklist;
window.toggleSecretos = toggleSecretos;
window.toggleMenu = toggleMenu;
window.selectTrip = selectTrip;
window.createNewTrip = createNewTrip;
window.backToTrips = backToTrips;
window.goToAdmin = goToAdmin;
window.loadUserTrips = loadUserTrips;
window.handleSignUp = handleSignUp;
window.responderInvitacion = responderInvitacion;

