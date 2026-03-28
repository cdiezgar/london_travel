import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

window.misViajes = [];

const supabaseUrl = "https://zephobibrftatzmagjta.supabase.co";
const supabaseKey = "sb_publishable_WFqb8AOLj0GAUq3UJ364kA_vU9tIAXL";
const sb = createClient(supabaseUrl, supabaseKey);

// --- 1. CONFIGURACIÓN ---
const schemaMap = {
    // 1. CONFIGURACIÓN GENERAL
    configuracion: {
        label: "Datos del viaje", icon: "fa-cog",
        columns: [
            { key: 'id', label: 'ID', type: 'readonly' },
            { key: 'titulo', label: 'Título Principal', type: 'text', required: true },
            { key: 'subtitulo', label: 'Subtítulo', type: 'text' },
            { key: 'presupuesto', label: 'Presupuesto total', type: 'text' },
            { key: 'base', label: 'Base de Operaciones', type: 'text' },
            { key: 'intro_texto', label: 'Texto Intro General', type: 'textarea' },
            { key: 'intro_alojamiento', label: 'Texto Intro Alojamiento', type: 'textarea' },
            { key: 'tasa_cambio', label: 'Tasa de Cambio (Ej: 1.17)', type: 'float' },
            { key: 'lat_centro', label: 'Latitud Mapa (Ej: 51.5074)', type: 'float' },
            { key: 'long_centro', label: 'Longitud Mapa (Ej: -0.1278)', type: 'float' }
        ]
    },

    // 2. EL ITINERARIO (El núcleo de la app)
    dias: {
        label: "Días (Itinerario)", icon: "fa-calendar-day",
        columns: [
            { key: 'id', label: 'ID Día', type: 'readonly', required: false },
            { key: 'titulo', label: 'Título', type: 'text', required: true },
            { key: 'fecha', label: 'Fecha', type: 'date', required: true },
            { key: 'icono', label: 'Icono (FontAwesome)', type: 'text' },
            { key: 'resumen', label: 'Resumen Corto', type: 'textarea' },
            { key: 'historia_dia', label: 'Historia Completa', type: 'textarea' },
            { key: 'curiosidad_hp', label: 'Curiosidad HP', type: 'textarea' },
            { key: 'nota_dia', label: 'Nota en rojo', type: 'text' }
        ]
    },

    // 3. LOGÍSTICA
    transportes: {
        label: "Transporte Mágico", icon: "fa-train-subway",
        columns: [
            { key: 'id', label: 'ID', type: 'readonly' },
            { key: 'consejo_oro', label: 'Regla de Oro', type: 'text', required: true },
            { key: 'detalle', label: 'Costes y Límites', type: 'textarea' },
            { key: 'apps', label: 'Apps (separadas por comas)', type: 'text' }
        ]
    },
    pases_turisticos: {
        label: "Pases Turísticos", icon: "fa-ticket-alt",
        columns: [
            { key: 'id', label: 'ID', type: 'readonly' },
            { key: 'titulo', label: 'Título del Pase', type: 'text', required: true },
            { key: 'subtitulo', label: 'Subtítulo', type: 'text' },
            { key: 'precio_total', label: 'Precio Total', type: 'text' },
            { key: 'precio_pp', label: 'Precio por Persona', type: 'text' },
            { key: 'info', label: 'Información y Reglas', type: 'textarea' }
        ]
    },

    // 4. ALIMENTACIÓN
    restaurantes_top: {
        label: "Restaurantes Top", icon: "fa-star",
        columns: [
            { key: 'id', label: 'ID', type: 'readonly' },
            { key: 'nombre', label: 'Nombre', type: 'text', required: true },
            { key: 'tipo', label: 'Tipo de comida/lugar', type: 'text' },
            { key: 'precio', label: 'Precio', type: 'text' },
            { key: 'nota', label: 'Recomendación / Nota', type: 'textarea' }
        ]
    },
    supermercados: {
        label: "Supermercados", icon: "fa-shopping-basket",
        columns: [
            { key: 'id', label: 'ID', type: 'readonly' },
            { key: 'nombre', label: 'Nombre', type: 'text', required: true },
            { key: 'desc_texto', label: 'Descripción', type: 'textarea' },
            { key: 'estrategia', label: 'Estrategia', type: 'text' }
        ]
    },

    // 5. EXTRAS Y JUEGOS
    checklist: {
        label: "Checklist", icon: "fa-check-square",
        columns: [
            { key: 'id', label: 'ID', type: 'readonly' },
            { key: 'item', label: 'Elemento', type: 'text', required: true },
            { key: 'imagen_url', label: 'URL Imagen', type: 'text' },
            { key: 'lat', label: 'Latitud', type: 'float' },
            { key: 'long', label: 'Longitud', type: 'float' }
        ]
    },
    secretos: {
        label: "Secretos Extra", icon: "fa-key",
        columns: [
            { key: 'id', label: 'ID', type: 'readonly' },
            { key: 'titulo', label: 'Título', type: 'text', required: true },
            { key: 'texto', label: 'Contenido', type: 'textarea' }
        ]
    }
};

let currentTable = null;
let currentEditingId = null;
let currentDiaIdForActivity = null; 
let editingActivityId = null; 
let editingLinkId = null;     
let editingItemId = null; // <-- Añade esta línea al principio con el resto de lets
let editingRestaurantId = null;
let currentAdminViajeId = null; // <--- NUEVA VARIABLE GLOBAL
let currentPaseIdForActivity = null;
let editingPassActivityId = null;

// --- MODIFICAR init() y renderSidebar() ---
async function init() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { window.location.href = 'index.html'; return; }
    
    // 1. Obtenemos SOLO los viajes de los que este usuario es PROPIETARIO
    const { data: viajes, error } = await sb.from('viajes')
        .select('*')
        .eq('user_id', session.user.id) // <--- ESTA ES LA CLAVE DE SEGURIDAD
        .order('created_at', { ascending: true });
    
    // Si no tiene viajes propios (es posible que solo sea invitado en otros)
    if (error || !viajes || viajes.length === 0) {
        alert("No tienes expediciones propias para administrar. ¡Crea una en el Andén principal!");
        window.location.href = 'index.html';
        return;
    }

    window.misViajes = viajes;

    const urlParams = new URLSearchParams(window.location.search);
    const viajeDesdeApp = urlParams.get('viaje');

    if (viajeDesdeApp) {
        // 2. Si hay ID en la URL, comprobamos que el viaje esté en SUS viajes
        if (viajes.some(v => v.id == viajeDesdeApp)) {
            entrarAViaje(viajeDesdeApp);
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            // 3. ¡ALERTA DE INTRUSO! Es un invitado intentando forzar la URL
            alert("¡Acceso denegado! Magia oscura detectada. Solo el organizador jefe puede usar la Sala de Configuración.");
            window.history.replaceState({}, document.title, window.location.pathname);
            renderHome(); // Lo devolvemos al panel con sus viajes propios
        }
    } else {
        // Si no hay viaje en la URL, mostramos el Lobby (Pantalla de inicio)
        renderHome();
    }
}

// NUEVA FUNCIÓN: Dibuja la pantalla de inicio (Lobby)
window.renderHome = function(mostrarArchivados = false) {
    currentAdminViajeId = null;
    
    // Ocultamos el sidebar de forma segura sin romper el layout Flex
    const sidebar = document.getElementById('admin-sidebar');
    if (sidebar) sidebar.style.display = 'none'; 

    // Mantenemos la cabecera principal limpia y sin botones extra
    document.getElementById('view-title').textContent = "Panel de Expediciones";
    document.getElementById('btn-add').classList.add('hidden');

    const tableContainer = document.getElementById('data-table').parentElement;
    if (tableContainer) tableContainer.classList.add('hidden');
    
    let container = document.getElementById('dashboard-area');
    if (!container) {
        container = document.createElement('div');
        container.id = 'dashboard-area';
        document.getElementById('content-area').appendChild(container);
    }
    
    container.classList.remove('hidden');

    const viajesAMostrar = window.misViajes.filter(v => mostrarArchivados ? v.activo === false : v.activo !== false);

    // Renderizamos el Lobby (Ya no hay h2 duplicado aquí)
    container.innerHTML = `
        <div class="max-w-5xl mx-auto mt-4">
            <div class="text-center mb-8">
                <p class="text-stone-600 text-lg">Selecciona un viaje para administrar su contenido y configuración.</p>
            </div>

            <div class="flex justify-center gap-4 mb-8 border-b border-[var(--gold)]/30 pb-4">
                <button onclick="renderHome(false)" class="px-6 py-2 font-bold rounded transition ${!mostrarArchivados ? 'bg-[#1a100d] text-[var(--gold)] border border-[var(--gold)] shadow-md' : 'text-stone-500 hover:text-stone-800'}">
                    <i class="fas fa-plane-departure mr-2"></i> Viajes Activos
                </button>
                <button onclick="renderHome(true)" class="px-6 py-2 font-bold rounded transition ${mostrarArchivados ? 'bg-[#1a100d] text-[var(--gold)] border border-[var(--gold)] shadow-md' : 'text-stone-500 hover:text-stone-800'}">
                    <i class="fas fa-archive mr-2"></i> Histórico
                </button>
            </div>

            ${viajesAMostrar.length === 0 ? `
                <div class="text-center py-12 text-stone-400 font-bold magic-font text-xl">
                    No hay viajes en esta sección...
                </div>
            ` : `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${viajesAMostrar.map(v => `
                        <div class="parchment-box p-6 rounded-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between border ${!mostrarArchivados ? 'border-[var(--gold)]' : 'border-stone-400 opacity-80'}" onclick="${mostrarArchivados ? `reactivarDesdeHome(${v.id})` : `entrarAViaje(${v.id})`}">
                            <div>
                                <h3 class="text-2xl font-bold text-[var(--gryffindor-red)] magic-font mb-2">${v.nombre}</h3>
                                <p class="text-sm text-stone-500 mb-4 font-bold"><i class="fas ${mostrarArchivados ? 'fa-book-dead' : 'fa-check-circle text-green-600'} mr-1"></i> ${mostrarArchivados ? 'Archivado' : 'Activo'}</p>
                            </div>
                            <button class="w-full py-2 bg-[#2b1b17] text-[var(--gold)] rounded font-bold shadow-md hover:bg-black transition border border-[var(--gold)]/50">
                                ${mostrarArchivados ? '<i class="fas fa-undo-alt mr-2"></i> Reactivar Viaje' : '<i class="fas fa-magic mr-2"></i> Administrar'}
                            </button>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;
}

// Lógica para entrar a administrar un viaje específico
window.entrarAViaje = function(id) {
    currentAdminViajeId = id;
    
    // Restauramos el menú lateral con Flex
    const sidebar = document.getElementById('admin-sidebar');
    if (sidebar) sidebar.style.display = 'flex'; 
    
    renderSidebar();
    loadTable('configuracion'); 
}

// Reactivar desde la pantalla de inicio
window.reactivarDesdeHome = async function(id) {
    const confirmado = await customConfirm(
        "Reactivar Expedición", 
        "¿Deseas reactivar este viaje y devolverlo a tu lista de viajes activos?", 
        "fa-undo-alt"
    );

    if (confirmado) {
        const { error } = await sb.from('viajes').update({ activo: true }).eq('id', id);
        if (error) {
            customAlert("Maldición detectada", error.message, "fa-skull-crossbones");
        } else {
            const viaje = window.misViajes.find(v => v.id === id);
            if(viaje) viaje.activo = true;
            renderHome(true); 
        }
    }
}

function renderSidebar() {
    const menu = document.getElementById('sidebar-menu');
    const viajeActual = window.misViajes.find(v => v.id == currentAdminViajeId);
    
    let sidebarContent = `
        <div class="px-6 pb-4 border-b border-[var(--gold)]/30 mb-4">
            <button onclick="renderHome()" class="w-full p-2 bg-[#2b1b17] hover:bg-black text-[var(--gold)] border border-[var(--gold)] rounded font-bold shadow-md transition flex justify-center items-center gap-2">
                <i class="fas fa-arrow-left"></i> Volver al Lobby
            </button>
            <div class="mt-4 text-center">
                <span class="text-[var(--gold)] text-xs font-bold uppercase tracking-widest block mb-1">Administrando:</span>
                <span class="text-white font-bold magic-font text-lg truncate block">${viajeActual ? viajeActual.nombre : ''}</span>
            </div>
        </div>
    `;

    sidebarContent += Object.keys(schemaMap).map(key => `
        <button onclick="loadTable('${key}')" id="nav-${key}" class="w-full text-left px-6 py-4 hover:bg-[var(--gryffindor-red)] hover:text-white transition flex items-center gap-3 border-l-4 border-transparent text-lg font-medium">
            <i class="fas ${schemaMap[key].icon} w-6 text-center text-[var(--gold)]"></i>
            ${schemaMap[key].label}
        </button>
    `).join('');

    menu.innerHTML = sidebarContent;
}

// Nueva función para cuando el admin cambie de viaje en el desplegable
window.changeAdminViaje = function() {
    currentAdminViajeId = document.getElementById('admin-viaje-selector').value;
    loadTable(currentTable || 'dias'); // Recarga la tabla actual con los datos del nuevo viaje
}

window.loadTable = async function(tableKey) {
    currentTable = tableKey;
    setActiveMenu(tableKey);
    
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('admin-overlay');
    if (sidebar && !sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.add('-translate-x-full');
        if (overlay) overlay.classList.add('hidden');
    }

    const tableContainer = document.getElementById('data-table').parentElement;
    const dashboardDiv = document.getElementById('dashboard-area');

    document.getElementById('loading').classList.remove('hidden');
    
    if (tableContainer) tableContainer.classList.add('hidden'); 
    if (dashboardDiv) dashboardDiv.classList.add('hidden');

    // MODO DASHBOARD PARA CONFIGURACIÓN
    if (tableKey === 'configuracion') {
        // ACTUALIZAMOS EL TÍTULO DE LA CABECERA EXPRESAMENTE AQUÍ
        document.getElementById('view-title').textContent = schemaMap[tableKey].label;
        document.getElementById('btn-add').classList.add('hidden');
        
        const viajeInfo = window.misViajes.find(v => v.id == currentAdminViajeId);
        const { data: configData, error } = await sb.from(tableKey).select('*').eq('viaje_id', currentAdminViajeId).maybeSingle();
        
        document.getElementById('loading').classList.add('hidden');
        if (error) { alert("Error cargando configuración: " + error.message); return; }
        
        renderDashboardConfig(configData, viajeInfo?.activo !== false);
        return;
    }

    // SI ES UNA TABLA NORMAL
    document.getElementById('view-title').textContent = schemaMap[tableKey] ? schemaMap[tableKey].label : "Panel";
    document.getElementById('btn-add').classList.remove('hidden');
    document.getElementById('btn-add').onclick = () => openForm(); 

    let orderBy = tableKey === 'dias' ? 'fecha' : (tableKey === 'checklist' ? 'item' : (['supermercados','restaurantes_top'].includes(tableKey) ? 'nombre' : 'id'));
    
    const { data, error } = await sb.from(tableKey).select('*').eq('viaje_id', currentAdminViajeId).order(orderBy, { ascending: true });

    document.getElementById('loading').classList.add('hidden');
    if (error) { alert("Error cargando datos: " + error.message); return; }
    
    if (tableContainer) tableContainer.classList.remove('hidden'); 
    renderTable(data, tableKey);
}
// NUEVA FUNCIÓN: Dibuja el Dashboard de Configuración
window.renderDashboardConfig = function(configData, isActivo) {
    let container = document.getElementById('dashboard-area');
    if (!container) {
        container = document.createElement('div');
        container.id = 'dashboard-area';
        document.getElementById('content-area').appendChild(container);
    }
    
    container.classList.remove('hidden');
    
    // Generar campos usando el schemaMap
    const formFields = schemaMap['configuracion'].columns.filter(c => c.key !== 'id').map(col => {
        const value = configData ? (configData[col.key] || '') : '';
        if (col.type === 'textarea') {
            return `<div class="col-span-1 md:col-span-2"><label class="block text-sm font-bold text-[var(--gryffindor-red)] mb-1 magic-font">${col.label}</label>
                    <textarea id="conf-${col.key}" rows="3" class="w-full p-2 border-2 border-[var(--gold)]/50 rounded bg-white/60 focus:outline-none transition">${value}</textarea></div>`;
        }
        return `<div><label class="block text-sm font-bold text-[var(--gryffindor-red)] mb-1 magic-font">${col.label}</label>
                <input type="text" id="conf-${col.key}" value="${value}" class="w-full p-2 border-b-2 border-[var(--gold)] bg-white/50 focus:outline-none transition font-medium"></div>`;
    }).join('');

    container.innerHTML = `
        <div class="parchment-box p-6 rounded-lg shadow-lg relative">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-[var(--gold)] pb-4 gap-4">
                <h3 class="text-2xl font-bold text-[var(--gryffindor-red)] magic-font">
                    <i class="fas fa-cogs text-[var(--gold)] mr-2"></i> Configuración del Viaje
                </h3>
                
                <div class="flex items-center gap-3 bg-white/70 p-3 rounded-lg border border-[var(--gold)] shadow-sm">
                    <label class="font-bold text-[var(--ink)] magic-font text-sm">Estado:</label>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="toggle-activo" class="sr-only peer" ${isActivo ? 'checked' : ''} onchange="confirmarCambioEstado(this.checked)">
                        <div class="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--gryffindor-red)]"></div>
                        <span class="ml-3 text-sm font-bold ${isActivo ? 'text-green-700' : 'text-stone-500'}" id="estado-text">${isActivo ? 'VIAJE ACTIVO' : 'ARCHIVADO'}</span>
                    </label>
                </div>
            </div>
            
            <form id="dashboard-form" class="grid grid-cols-1 md:grid-cols-2 gap-5">
                ${formFields}
            </form>
            
            <div class="mt-8 flex justify-end pt-4 border-t border-[var(--gold)]/30">
                <button type="button" onclick="guardarDashboardConfig(${configData ? configData.id : 'null'})" class="bg-[var(--gryffindor-red)] hover:bg-red-900 text-white px-6 py-3 rounded shadow-md font-bold transition border border-[var(--gold)] magic-font">
                    <i class="fas fa-save mr-2"></i> Guardar Cambios
                </button>
                <button type="button" onclick="openShareModal()" class="bg-[#1a100d] hover:bg-black text-[var(--gold)] px-4 py-2 rounded shadow-md font-bold transition border border-[var(--gold)] magic-font mr-3">
                    <i class="fas fa-share-alt mr-2"></i> Compartir Viaje
                </button>
                <button type="button" onclick="openManageAccessModal()" class="bg-white/80 hover:bg-white text-[var(--ink)] px-4 py-2 rounded shadow-md font-bold transition border border-[var(--gold)] magic-font mr-3">
                    <i class="fas fa-users-cog mr-2"></i> Editar acceso
                </button>
            </div>
        </div>
    `;
}

// Función para guardar directamente del Dashboard
window.guardarDashboardConfig = async function(existingId) {
    // 1. Recopilamos los datos del formulario 
    const payload = { viaje_id: currentAdminViajeId };
    
    schemaMap['configuracion'].columns.filter(c => c.key !== 'id').forEach(col => {
        let val = document.getElementById(`conf-${col.key}`).value.trim();
        
        // Si el campo está vacío, mandamos null a la base de datos para que no pete
        if (val === '') {
            payload[col.key] = null;
        } else {
            // Si tiene contenido y es un número, lo convertimos
            if (col.type === 'float' || col.type === 'number') {
                payload[col.key] = parseFloat(val);
            } else {
                // Si es texto, lo pasamos tal cual
                payload[col.key] = val;
            }
        }
    });

    // 2. Guardamos en Supabase
    let error;
    if (existingId) {
        ({ error } = await sb.from('configuracion').update(payload).eq('id', existingId));
    } else {
        ({ error } = await sb.from('configuracion').insert([payload]));
    }

    // 3. Mostramos las modales personalizadas
    if (error) {
        customAlert("Error al guardar", error.message, "fa-times-circle");
    } else {
        customAlert("¡Hechizo completado!", "La configuración del viaje se ha guardado correctamente.", "fa-check-circle");
        // Borramos caché para que la app principal recargue la nueva config
        localStorage.removeItem('travel_data_cache_' + currentAdminViajeId);
    }
}

function renderTable(data, tableKey) {
    const table = document.getElementById('data-table');
    const thead = document.getElementById('table-head');
    const tbody = document.getElementById('table-body');
    const schema = schemaMap[tableKey];
    table.classList.remove('hidden');

    const visibleCols = schema.columns.filter(c => c.type !== 'textarea' && c.key !== 'id').slice(0, 5);
    
    thead.innerHTML = `<tr>
        ${visibleCols.map((col, index) => `<th class="py-3 px-2 sm:px-4 font-bold uppercase text-left text-sm sm:text-base ${index === 0 ? 'w-full' : 'hidden md:table-cell'}">${col.label}</th>`).join('')}
        <th class="py-3 px-2 sm:px-4 text-right text-sm sm:text-base whitespace-nowrap">Borrar</th>
    </tr>`;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${visibleCols.length + 1}" class="py-8 text-center handwritten text-xl">El pergamino está vacío...</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(row => `
        <tr class="hover:bg-blue-50/30 transition border-b border-[#e2d1aa]/50 group/row">
            ${visibleCols.map((col, index) => `
                <td onclick='openForm(${JSON.stringify(row).replace(/'/g, "&#39;")})' class="py-2 sm:py-3 px-2 sm:px-4 text-sm sm:text-base cursor-pointer ${index === 0 ? '' : 'hidden md:table-cell'}">
                   <div class="whitespace-normal break-words min-w-[120px] text-stone-800 group-hover/row:text-blue-800 transition" title="${row[col.key] || '-'}">
                        ${row[col.key] || '-'}
                    </div>
                </td>
            `).join('')}
            
            <td class="py-2 sm:py-3 px-2 sm:px-4 text-right opacity-100 md:opacity-50 group-hover/row:opacity-100 transition whitespace-nowrap w-[1%]">
                <button onclick='deleteData(${row.id})' class="text-[var(--gryffindor-red)] hover:text-red-800 hover:bg-red-100 p-1.5 sm:p-2 rounded transition" title="Borrar">
                    <i class="fas fa-trash text-lg sm:text-xl"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// --- FORMULARIO PRINCIPAL ---
window.openForm = function(rowData = null) {
    currentEditingId = rowData ? rowData.id : null;
    const schema = schemaMap[currentTable];
    
    document.getElementById('modal-title').innerHTML = rowData ? `<i class="fas fa-feather-alt text-[var(--gold)] mr-2"></i> Editar ${schema.label}` : `<i class="fas fa-plus text-[var(--gold)] mr-2"></i> Nuevo ${schema.label}`;
    const form = document.getElementById('dynamic-form');
    
    form.innerHTML = schema.columns.map(col => {
        const value = rowData ? (rowData[col.key] || '') : '';
        
        if (col.type === 'readonly') {
            if (!rowData) return ''; 
            return `<div><label class="block text-sm font-bold text-[var(--gryffindor-red)] mb-1 magic-font tracking-wide">${col.label}</label>
                    <input type="text" name="${col.key}" value="${value}" readonly class="w-full p-2 border-b-2 border-gray-300 bg-gray-100/50 cursor-not-allowed text-gray-500 font-mono text-center rounded"></div>`;
        }

        const required = col.required ? 'required' : '';
        const helpText = col.help ? `<p class="text-xs text-[var(--gryffindor-red)] mt-1 font-bold italic"><i class="fas fa-info-circle text-[var(--gold)]"></i> ${col.help}</p>` : '';
        
        if (col.type === 'textarea') {
            return `<div><label class="block text-sm font-bold text-[var(--gryffindor-red)] mb-1 magic-font tracking-wide">${col.label}</label>
                    <textarea name="${col.key}" rows="3" class="w-full p-3 border-2 border-[var(--gold)]/50 rounded-lg bg-white/60 focus:outline-none focus:bg-white focus:border-[var(--gold)] transition text-lg leading-relaxed" ${required}>${value}</textarea>${helpText}</div>`;
        }
        
        // Por esto (hemos añadido la variable inputType):
        const inputType = col.type === 'number' ? 'number' : (col.type === 'date' ? 'date' : 'text');
        return `<div><label class="block text-sm font-bold text-[var(--gryffindor-red)] mb-1 magic-font tracking-wide">${col.label}</label>
                <input type="${inputType}" name="${col.key}" value="${value}" class="w-full p-2 border-b-2 border-[var(--gold)] bg-white/50 focus:outline-none focus:bg-white transition text-lg font-medium" ${required}>${helpText}</div>`;
            }).join('');

    const timelineContainer = document.getElementById('timeline-container');
    const restContainer = document.getElementById('restaurants-container'); 
    const passContainer = document.getElementById('pass-activities-container'); // NUEVO
    
    // Resetear todo a oculto
    timelineContainer.classList.add('hidden');
    restContainer.classList.add('hidden'); 
    passContainer.classList.add('hidden');

    if (currentTable === 'dias' && currentEditingId) {
        currentDiaIdForActivity = currentEditingId;
        timelineContainer.classList.remove('hidden');
        restContainer.classList.remove('hidden'); 
        loadTimeline(currentEditingId);
        loadRestaurants(currentEditingId); 
    } else if (currentTable === 'dias') {
        document.getElementById('timeline-content').innerHTML = '<p class="text-lg handwritten text-center p-4">Guarda el día primero en el pergamino para poder añadirle actividades.</p>';
        timelineContainer.classList.remove('hidden');
    }

    // NUEVO BLOQUE PARA PASES TURÍSTICOS
    if (currentTable === 'pases_turisticos' && currentEditingId) {
        currentPaseIdForActivity = currentEditingId;
        passContainer.classList.remove('hidden');
        loadPassActivities(currentEditingId);
    } else if (currentTable === 'pases_turisticos') {
        document.getElementById('pass-activities-content').innerHTML = '<p class="text-lg handwritten text-center p-4">Guarda el pase primero para poder añadirle actividades dentro.</p>';
        passContainer.classList.remove('hidden');
    }

    document.getElementById('form-modal').classList.remove('hidden');
    document.body.classList.add('modal-active');
}

window.closeModal = function() {
    document.getElementById('form-modal').classList.add('hidden');
    document.body.classList.remove('modal-active');
}

window.saveData = async function() {
    const formElement = document.getElementById('dynamic-form');
    if (!formElement.checkValidity()) { formElement.reportValidity(); return; }

    const formData = new FormData(formElement);
    const payload = {};
    
    schemaMap[currentTable].columns.forEach(col => {
        if (formData.has(col.key)) {
            let val = formData.get(col.key);
            if(col.type === 'number' && val === '') val = null; 
            payload[col.key] = val;
        }
    });

    // <--- NUEVO: Inyectamos el ID del viaje seleccionado --->
    payload.viaje_id = currentAdminViajeId;

    let error;
    if (currentEditingId) ({ error } = await sb.from(currentTable).update(payload).eq('id', currentEditingId));
    else ({ error } = await sb.from(currentTable).insert([payload]));

    if (error) alert("Error de hechicería al guardar: " + error.message);
    else {
        closeModal();
        loadTable(currentTable);
        localStorage.removeItem('travel_data_cache');
    }
}

window.deleteData = async function(id) {
    if (!confirm(`¿Borrar este registro definitivamente del mapa?`)) return;
    const { error } = await sb.from(currentTable).delete().eq('id', id);
    
    if (error) {
        if(error.code === '23503') alert("Maldición detectada: No puedes borrar esto porque tiene actividades colgadas. Bórralas primero.");
        else alert("Error al borrar: " + error.message);
    } else {
        loadTable(currentTable);
        localStorage.removeItem('travel_data_cache');
    }
}

// --- GESTIÓN DE LA LÍNEA DEL TIEMPO (DÍA) ---
async function loadTimeline(diaId) {
    const container = document.getElementById('timeline-content');
    container.innerHTML = '<div class="text-center py-6"><i class="fas fa-spinner fa-spin text-3xl text-[var(--gold)]"></i></div>';
    
    const { data: links, error } = await sb.from('dia_actividad')
        .select(`id, hora, actividades (id, nombre, desc_texto, tipo, direccion, precio, contexto, checklist_id)`)
        .eq('dia_id', diaId)
        .order('hora', { ascending: true });

    if (error) { container.innerHTML = `<p class="text-[var(--gryffindor-red)]">Error: ${error.message}</p>`; return; }

    if (!links || links.length === 0) {
        container.innerHTML = '<p class="text-stone-500 text-lg handwritten text-center py-4">No hay magia planeada para hoy. ¡Añade algo!</p>';
        return;
    }

    let html = '<div class="space-y-3 timeline-line pl-4 py-2 ml-2">';
    links.forEach(link => {
        const act = link.actividades;
        if (!act) return;
        
        let icon = 'fa-circle';
        if(act.tipo === 'transporte') icon = 'fa-train-subway';
        if(act.tipo === 'comida') icon = 'fa-utensils';
        if(act.tipo === 'visita') icon = 'fa-eye';
        if(act.tipo === 'museo') icon = 'fa-building-columns';
        if(act.tipo === 'check') icon = 'fa-check-double';
        if(act.tipo === 'caminar') icon = 'fa-walking';
        if(act.tipo === 'relax') icon = 'fa-leaf';

        const actJson = JSON.stringify({
            linkId: link.id, hora: link.hora, actId: act.id, nombre: act.nombre,
            desc: act.desc_texto || '', tipo: act.tipo || 'visita',
            direccion: act.direccion || '', precio: act.precio || '', contexto: act.contexto || '',
            checklist_id: act.checklist_id || '' // <-- AÑADE ESTA LÍNEA
        }).replace(/'/g, "&#39;");

html += `
            <div class="relative group">
                <div class="absolute -left-[30px] top-2 bg-[var(--parchment)] border-2 border-[var(--gryffindor-red)] rounded-full w-7 h-7 flex items-center justify-center text-[var(--gryffindor-red)] text-xs z-10 shadow-sm">
                    <i class="fas ${icon}"></i>
                </div>
                
                <div class="flex flex-col parchment-box p-2 sm:p-3 rounded transform transition duration-200 hover:scale-[1.01] hover:shadow-md border border-[#e2d1aa]">
                    <div class="flex justify-between items-start gap-2">
                        
                        <div onclick='openActivityModal(${actJson})' class="flex items-start gap-2 sm:gap-3 flex-1 min-w-0 cursor-pointer group/edit">
                            <span class="bg-[#2b1b17] text-[var(--gold)] text-[10px] sm:text-xs px-1.5 sm:px-2 py-1 rounded font-mono font-bold mt-1 shadow-sm shrink-0">${link.hora}</span>
                            <div class="min-w-0 flex-1 group-hover/edit:text-blue-800 transition">
                                <div class="font-bold text-[var(--ink)] text-base sm:text-lg magic-font tracking-wide truncate" title="${act.nombre}">${act.nombre}</div>
                                ${act.desc_texto ? `<p class="text-xs sm:text-sm text-stone-600 mt-0.5 sm:mt-1 truncate italic" title="${act.desc_texto}">${act.desc_texto}</p>` : ''}
                            </div>
                        </div>
                        
                        <div class="flex gap-1 sm:gap-2 shrink-0 opacity-100 md:opacity-80 group-hover:opacity-100 transition">
                            <button onclick="deleteActivity(${link.id}, ${act.id})" class="text-[var(--gryffindor-red)] hover:bg-red-100 p-1.5 sm:p-2 rounded transition" title="Borrar Actividad"><i class="fas fa-trash"></i></button>
                        </div>

                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

// --- GESTIÓN DE LA ACTIVIDAD INDIVIDUAL Y SUS ITEMS ---
window.openActivityModal = async function(actData = null) {

    editingItemId = null;
    const btnItem = document.getElementById('btn-save-item');
    if(btnItem) btnItem.innerHTML = '<i class="fas fa-plus"></i> Añadir Elemento';

    const form = document.getElementById('activity-form');
    form.reset(); 

    // NUEVO: Cargar los elementos del checklist dinámicamente
    const { data: checklistItems } = await sb.from('checklist').select('id, item').order('item', { ascending: true });
    const checklistSelect = document.getElementById('act-checklist');
    
    let options = `<option value="">-- Sin vincular --</option>`;
    if (checklistItems) {
        options += checklistItems.map(c => `<option value="${c.id}">${c.item}</option>`).join('');
    }
    checklistSelect.innerHTML = options;
    // FIN NUEVO
    
    if (actData) {
        document.getElementById('activity-modal-title').innerHTML = '<i class="fas fa-magic text-[var(--gold)] mr-2"></i> Editar Actividad';
        editingLinkId = actData.linkId;
        editingActivityId = actData.actId;


        
        document.getElementById('act-hora').value = actData.hora;
        document.getElementById('act-nombre').value = actData.nombre;
        document.getElementById('act-tipo').value = actData.tipo;
        document.getElementById('act-direccion').value = actData.direccion;
        document.getElementById('act-precio').value = actData.precio;
        document.getElementById('act-desc').value = actData.desc;
        document.getElementById('act-contexto').value = actData.contexto;
        document.getElementById('act-checklist').value = actData.checklist_id || ''; // <-- AÑADE ESTA LÍNEA

        // Mostrar sección de items
        document.getElementById('activity-items-wrapper').classList.remove('hidden');
        document.getElementById('activity-items-warning').classList.add('hidden');
        loadActivityItems(actData.actId);

    } else {
        document.getElementById('activity-modal-title').innerHTML = '<i class="fas fa-plus text-[var(--gold)] mr-2"></i> Nueva Actividad';
        editingLinkId = null;
        editingActivityId = null;
        document.getElementById('act-tipo').value = 'visita'; 

        // Ocultar sección de items (no se puede asignar a una actividad que aún no existe)
        document.getElementById('activity-items-wrapper').classList.add('hidden');
        document.getElementById('activity-items-warning').classList.remove('hidden');
    }

    document.getElementById('activity-modal').classList.remove('hidden');
}

window.closeActivityModal = function() {
    document.getElementById('activity-modal').classList.add('hidden');
}

window.saveActivity = async function() {
    const form = document.getElementById('activity-form');
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const hora = document.getElementById('act-hora').value;
    const checklistVal = document.getElementById('act-checklist').value; // <-- AÑADE ESTA LÍNEA

    const actData = {
        nombre: document.getElementById('act-nombre').value,
        tipo: document.getElementById('act-tipo').value,
        direccion: document.getElementById('act-direccion').value || "",
        precio: document.getElementById('act-precio').value || "",
        desc_texto: document.getElementById('act-desc').value || "",
        contexto: document.getElementById('act-contexto').value || null,
        checklist_id: checklistVal ? parseInt(checklistVal) : null, 
        viaje_id: currentAdminViajeId
        
    };

    if (editingActivityId) {
        const { error: err1 } = await sb.from('actividades').update(actData).eq('id', editingActivityId);
        if (err1) { alert("Error actualizando actividad: " + err1.message); return; }
        
        const { error: err2 } = await sb.from('dia_actividad').update({ hora }).eq('id', editingLinkId);
        if (err2) { alert("Error actualizando hora: " + err2.message); return; }

    } else {
        const { data: newAct, error: err1 } = await sb.from('actividades').insert([actData]).select();
        if (err1) { alert("Error creando actividad: " + err1.message); return; }
        
        const newActId = newAct[0].id;
        const { error: err2 } = await sb.from('dia_actividad').insert([{ dia_id: currentDiaIdForActivity, actividad_id: newActId, hora: hora }]);
        if (err2) { alert("Error vinculando al día: " + err2.message); return; }
    }

    closeActivityModal();
    loadTimeline(currentDiaIdForActivity);
    localStorage.removeItem('travel_data_cache');
}

window.deleteActivity = async function(linkId, actId) {
    if (!confirm("¿Desaparecer esta actividad mediante el encantamiento Evanesco?")) return;
    const { error: err1 } = await sb.from('dia_actividad').delete().eq('id', linkId);
    if (err1) { alert("Error quitando del día: " + err1.message); return; }

    const { error: err2 } = await sb.from('actividades').delete().eq('id', actId);
    if (err2) console.warn("La actividad se desvinculó pero no se borró de la base.");

    loadTimeline(currentDiaIdForActivity);
    localStorage.removeItem('travel_data_cache');
}

// --- NUEVO: GESTIÓN DE ITEMS (COSAS QUE VER) ---
window.loadActivityItems = async function(actId) {
    const container = document.getElementById('activity-items-list');
    container.innerHTML = '<div class="text-center py-2"><i class="fas fa-spinner fa-spin text-[var(--gold)]"></i></div>';
    
    const { data: items, error } = await sb.from('actividad_items').select('*').eq('actividad_id', actId).order('id', { ascending: true });
    
    if (error) { container.innerHTML = `<p class="text-red-500 text-sm">${error.message}</p>`; return; }
    
    if (!items || items.length === 0) {
        container.innerHTML = '<p class="text-sm italic text-stone-500">No hay elementos en la lista todavía. Añade el primero abajo.</p>';
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="flex justify-between items-center bg-white/60 p-2.5 rounded border border-[#e2d1aa] shadow-sm">
            <div class="flex flex-col">
                <div class="flex items-start gap-3">
                    <i class="fas fa-check-circle text-[var(--gold)] mt-1 shrink-0"></i>
                    <span class="text-stone-800 text-base font-medium">${item.item_texto}</span>
                </div>
                ${item.descripcion || item.imagen_url ? `<span class="text-xs text-stone-500 ml-7 italic mt-1"><i class="fas fa-info-circle"></i> Tiene detalles guardados</span>` : ''}
            </div>
            <div class="flex items-center shrink-0">
                <button type="button" onclick='editActivityItem(${JSON.stringify(item).replace(/'/g, "&#39;")})' class="text-blue-700 hover:bg-blue-100 p-1.5 rounded transition" title="Editar elemento">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" onclick="deleteActivityItem(${item.id})" class="text-[var(--gryffindor-red)] hover:bg-red-100 p-1.5 rounded ml-1 transition" title="Borrar elemento">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

window.addActivityItem = async function() {
    const inputTxt = document.getElementById('new-item-text');
    const inputDesc = document.getElementById('new-item-desc');
    const inputImg = document.getElementById('new-item-img');

    const text = inputTxt.value.trim();
    const desc = inputDesc.value.trim();
    const img = inputImg.value.trim();

    if (!text || !editingActivityId) return;

    // Preparamos los datos
    const payload = {
        actividad_id: editingActivityId, 
        item_texto: text,
        descripcion: desc || null,
        imagen_url: img || null
    };

    let error;
    
    // ¿Estamos editando o creando uno nuevo?
    if (editingItemId) {
        const res = await sb.from('actividad_items').update(payload).eq('id', editingItemId);
        error = res.error;
    } else {
        const res = await sb.from('actividad_items').insert([payload]);
        error = res.error;
    }
    
    if (error) {
        alert("Error al guardar el elemento: " + error.message);
    } else {
        // Limpiamos los campos
        inputTxt.value = '';
        inputDesc.value = '';
        inputImg.value = '';
        
        // ¡Importante! Reseteamos el modo edición
        editingItemId = null; 
        const btn = document.getElementById('btn-save-item');
        if(btn) btn.innerHTML = '<i class="fas fa-plus"></i> Añadir Elemento';

        loadActivityItems(editingActivityId);
        localStorage.removeItem('travel_data_cache');
    }
}

window.deleteActivityItem = async function(itemId) {
    const { error } = await sb.from('actividad_items').delete().eq('id', itemId);
    
    if (error) {
        alert("Error al borrar el elemento: " + error.message);
    } else {
        loadActivityItems(editingActivityId); // Recargar la lista
        localStorage.removeItem('travel_data_cache'); // Limpiar caché
    }
}

window.logoutAdmin = async function() {
    await sb.auth.signOut();
    window.location.href = 'index.html';
}

window.editActivityItem = function(item) {
    editingItemId = item.id; // Guardamos el ID del ítem que estamos editando
    
    // Rellenamos los campos con los datos actuales
    document.getElementById('new-item-text').value = item.item_texto || '';
    document.getElementById('new-item-desc').value = item.descripcion || '';
    document.getElementById('new-item-img').value = item.imagen_url || '';
    
    // Cambiamos el aspecto del botón
    const btn = document.getElementById('btn-save-item');
    if(btn) btn.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
    
    // Hacemos scroll y focus para que el usuario sepa que puede escribir
    document.getElementById('new-item-text').focus();
}

// ==========================================
// --- GESTIÓN DE RESTAURANTES DEL DÍA ---
// ==========================================

window.loadRestaurants = async function(diaId) {
    const container = document.getElementById('restaurants-content');
    container.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin text-2xl text-[var(--gold)]"></i></div>';
    
    const { data: rests, error } = await sb.from('restaurantes_dia').select('*').eq('dia_id', diaId).order('id', { ascending: true });
    
    if (error) { container.innerHTML = `<p class="text-[var(--gryffindor-red)]">Error: ${error.message}</p>`; return; }
    
    if (!rests || rests.length === 0) {
        container.innerHTML = '<p class="text-stone-500 text-lg handwritten text-center py-4">No hay reservas de mesas para hoy.</p>';
        return;
    }
    
container.innerHTML = rests.map(r => `
        <div class="flex justify-between items-center bg-white/60 hover:bg-white p-2 sm:p-3 rounded border border-[#e2d1aa] shadow-sm mb-2 group gap-2 transition">
            
            <div onclick='openRestaurantModal(${JSON.stringify(r).replace(/'/g, "&#39;")})' class="flex flex-col min-w-0 flex-1 cursor-pointer group/edit">
                <div class="font-bold text-[var(--ink)] group-hover/edit:text-blue-800 text-base sm:text-lg magic-font truncate transition" title="${r.nombre}">${r.nombre}</div>
                <div class="text-xs sm:text-sm text-stone-600 truncate">${r.desc_texto || ''} ${r.precio ? `• <b class="text-green-800">${r.precio}</b>` : ''}</div>
            </div>

            <div class="flex gap-1 sm:gap-2 shrink-0 opacity-100 md:opacity-80 group-hover:opacity-100 transition">
                <button onclick="deleteRestaurant(${r.id})" class="text-[var(--gryffindor-red)] hover:bg-red-100 p-1.5 sm:p-2 rounded transition" title="Borrar Restaurante"><i class="fas fa-trash"></i></button>
            </div>

        </div>
    `).join('');
};

window.openRestaurantModal = function(rData = null) {
    const form = document.getElementById('restaurant-form');
    form.reset();
    
    if (rData) {
        editingRestaurantId = rData.id;
        document.getElementById('restaurant-modal-title').innerHTML = '<i class="fas fa-utensils text-[var(--gold)]"></i> Editar Restaurante';
        document.getElementById('rest-nombre').value = rData.nombre || '';
        document.getElementById('rest-desc').value = rData.desc_texto || '';
        document.getElementById('rest-precio').value = rData.precio || '';
        document.getElementById('rest-loc').value = rData.loc || '';
    } else {
        editingRestaurantId = null;
        document.getElementById('restaurant-modal-title').innerHTML = '<i class="fas fa-utensils text-[var(--gold)]"></i> Nuevo Restaurante';
    }
    document.getElementById('restaurant-modal').classList.remove('hidden');
};

window.closeRestaurantModal = function() {
    document.getElementById('restaurant-modal').classList.add('hidden');
};

window.saveRestaurant = async function() {
    const form = document.getElementById('restaurant-form');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    
    const payload = {
        dia_id: currentDiaIdForActivity, // Usa el ID del día abierto
        nombre: document.getElementById('rest-nombre').value.trim(),
        desc_texto: document.getElementById('rest-desc').value.trim() || null,
        precio: document.getElementById('rest-precio').value.trim() || "",
        loc: document.getElementById('rest-loc').value.trim() || null
    };
    
    let error;
    if (editingRestaurantId) {
        const res = await sb.from('restaurantes_dia').update(payload).eq('id', editingRestaurantId);
        error = res.error;
    } else {
        const res = await sb.from('restaurantes_dia').insert([payload]);
        error = res.error;
    }
    
    if (error) {
        alert("Maldición rebotada al guardar restaurante: " + error.message);
    } else {
        closeRestaurantModal();
        loadRestaurants(currentDiaIdForActivity);
        localStorage.removeItem('travel_data_cache');
    }
};

window.deleteRestaurant = async function(id) {
    if (!confirm("¿Seguro que quieres borrar este restaurante de los planes del día?")) return;
    const { error } = await sb.from('restaurantes_dia').delete().eq('id', id);
    if (error) alert("Error al borrar: " + error.message);
    else {
        loadRestaurants(currentDiaIdForActivity);
        localStorage.removeItem('travel_data_cache');
    }
};

window.goToApp = function() {
    if (currentAdminViajeId) {
        // Mandamos a la app principal el ID del viaje en la URL
        window.location.href = `index.html?viaje=${currentAdminViajeId}`;
    } else {
        // Por si acaso no hubiera ningún viaje seleccionado
        window.location.href = 'index.html';
    }
}

// ==========================================
// --- GESTIÓN DE ACTIVIDADES DEL PASE ---
// ==========================================

window.loadPassActivities = async function(paseId) {
    const container = document.getElementById('pass-activities-content');
    container.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin text-2xl text-[var(--gold)]"></i></div>';
    
    const { data: acts, error } = await sb.from('actividades_pase').select('*').eq('pase_id', paseId).order('id', { ascending: true });
    
    if (error) { container.innerHTML = `<p class="text-[var(--gryffindor-red)]">Error: ${error.message}</p>`; return; }
    
    if (!acts || acts.length === 0) {
        container.innerHTML = '<p class="text-stone-500 text-lg handwritten text-center py-4">No hay actividades vinculadas a este pase.</p>';
        return;
    }
    
container.innerHTML = acts.map(a => `
        <div class="flex justify-between items-center bg-white/60 hover:bg-white p-2 sm:p-3 rounded border border-[#e2d1aa] shadow-sm mb-2 group gap-2 transition">
            
            <div onclick='openPassActivityModal(${JSON.stringify(a).replace(/'/g, "&#39;")})' class="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 cursor-pointer group/edit">
                <div class="bg-[var(--parchment)] w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border border-[var(--gold)] shrink-0">
                    <i class="fas ${a.icono || 'fa-ticket-alt'} text-[var(--gryffindor-red)] text-sm sm:text-base"></i>
                </div>
                <div class="flex flex-col min-w-0 flex-1 group-hover/edit:text-blue-800 transition">
                    <div class="font-bold text-[var(--ink)] text-base sm:text-lg magic-font truncate" title="${a.nombre}">${a.nombre}</div>
                    <div class="text-xs sm:text-sm text-stone-600 truncate">${a.dia_sugerido || ''} ${a.precio_taquilla ? `• <b class="text-stone-800">£${a.precio_taquilla}</b>` : ''}</div>
                </div>
            </div>

            <div class="flex gap-1 sm:gap-2 shrink-0 opacity-100 md:opacity-80 group-hover:opacity-100 transition">
                <button onclick="deletePassActivity(${a.id})" class="text-[var(--gryffindor-red)] hover:bg-red-100 p-1.5 sm:p-2 rounded transition" title="Borrar Actividad"><i class="fas fa-trash"></i></button>
            </div>

        </div>
    `).join('');
};

window.openPassActivityModal = function(aData = null) {
    const form = document.getElementById('pass-activity-form');
    form.reset();
    
    if (aData) {
        editingPassActivityId = aData.id;
        document.getElementById('pass-activity-modal-title').innerHTML = '<i class="fas fa-ticket-alt text-[var(--gold)]"></i> Editar Actividad';
        document.getElementById('pass-act-nombre').value = aData.nombre || '';
        document.getElementById('pass-act-precio').value = aData.precio_taquilla || '';
        document.getElementById('pass-act-dia').value = aData.dia_sugerido || '';
        document.getElementById('pass-act-icono').value = aData.icono || '';
    } else {
        editingPassActivityId = null;
        document.getElementById('pass-activity-modal-title').innerHTML = '<i class="fas fa-ticket-alt text-[var(--gold)]"></i> Nueva Actividad';
    }
    document.getElementById('pass-activity-modal').classList.remove('hidden');
};

window.closePassActivityModal = function() {
    document.getElementById('pass-activity-modal').classList.add('hidden');
};

window.savePassActivity = async function() {
    const form = document.getElementById('pass-activity-form');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    
    const payload = {
        pase_id: currentPaseIdForActivity,  // Referencia al ID del pase padre
        viaje_id: currentAdminViajeId,      // Referencia al ID del viaje global
        nombre: document.getElementById('pass-act-nombre').value.trim(),
        precio_taquilla: document.getElementById('pass-act-precio').value || "",
        dia_sugerido: document.getElementById('pass-act-dia').value.trim() || "Sin día indicado",
        icono: document.getElementById('pass-act-icono').value.trim() || null
    };
    
    let error;
    if (editingPassActivityId) {
        const res = await sb.from('actividades_pase').update(payload).eq('id', editingPassActivityId);
        error = res.error;
    } else {
        const res = await sb.from('actividades_pase').insert([payload]);
        error = res.error;
    }
    
    if (error) {
        alert("Maldición rebotada al guardar actividad: " + error.message);
    } else {
        closePassActivityModal();
        loadPassActivities(currentPaseIdForActivity);
        localStorage.removeItem('travel_data_cache_' + currentAdminViajeId); // Limpia la caché para que la app se actualice
    }
};

window.deletePassActivity = async function(id) {
    if (!confirm("¿Seguro que quieres borrar esta actividad del pase turístico?")) return;
    const { error } = await sb.from('actividades_pase').delete().eq('id', id);
    if (error) alert("Error al borrar: " + error.message);
    else {
        loadPassActivities(currentPaseIdForActivity);
        localStorage.removeItem('travel_data_cache_' + currentAdminViajeId);
    }
};

window.toggleAdminMenu = function() {
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('admin-overlay');
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
}

// Confirmación del checkbox
window.confirmarCambioEstado = async function(isChecking) {
    const accion = isChecking ? "reactivar" : "desactivar";
    const mensaje = isChecking 
        ? "¿Deseas reactivar este viaje y devolverlo al panel principal?"
        : "¿Estás seguro de que deseas archivar este viaje?<br><br><span class='text-sm text-stone-600 block mt-2'><i class='fas fa-info-circle'></i> Pasará al Histórico y dejará de verse en la app principal.</span>";
    
    // Mostramos la modal personalizada
    const confirmado = await customConfirm("Cambio de Estado", mensaje, isChecking ? "fa-magic" : "fa-archive");
    
    if (confirmado) {
        cambiarEstadoViaje(isChecking);
    } else {
        // Si el usuario cancela, revertimos el checkbox visualmente
        document.getElementById('toggle-activo').checked = !isChecking;
    }
}

window.cambiarEstadoViaje = async function(nuevoEstado) {
    const { error } = await sb.from('viajes').update({ activo: nuevoEstado }).eq('id', currentAdminViajeId);
    if (error) {
        alert("Maldición detectada: " + error.message);
        document.getElementById('toggle-activo').checked = !nuevoEstado;
    } else {
        document.getElementById('estado-text').innerText = nuevoEstado ? 'VIAJE ACTIVO' : 'ARCHIVADO';
        document.getElementById('estado-text').className = `ml-3 text-sm font-bold ${nuevoEstado ? 'text-green-700' : 'text-stone-500'}`;
        init(); // Recargamos para actualizar menús
    }
}

// Carga la tabla de viajes archivados
window.loadHistorico = async function() {
    currentTable = 'historico';
    setActiveMenu('historico');
    
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('admin-overlay');
    if (sidebar && !sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.add('-translate-x-full');
        if (overlay) overlay.classList.add('hidden');
    }

    document.getElementById('view-title').textContent = "Histórico de Viajes";
    document.getElementById('btn-add').classList.add('hidden');
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('data-table').classList.add('hidden');
    const dash = document.getElementById('dashboard-area');
    if(dash) dash.classList.add('hidden');

    const { data, error } = await sb.from('viajes').select('*').eq('activo', false);
    
    document.getElementById('loading').classList.add('hidden');
    if (error) { alert("Error: " + error.message); return; }

    const table = document.getElementById('data-table');
    const thead = document.getElementById('table-head');
    const tbody = document.getElementById('table-body');
    table.classList.remove('hidden');

    thead.innerHTML = `<tr>
        <th class="py-3 px-4 font-bold uppercase text-left w-full text-[var(--gryffindor-red)] magic-font">Viajes Archivados</th>
        <th class="py-3 px-4 text-right whitespace-nowrap text-[var(--gryffindor-red)] magic-font">Acción</th>
    </tr>`;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" class="py-8 text-center handwritten text-xl text-stone-500">No hay viajes inactivos en el archivo...</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(row => `
        <tr class="hover:bg-stone-100 transition border-b border-[#e2d1aa]/50 bg-white/50">
            <td class="py-4 px-4 text-lg font-bold text-stone-800 magic-font">
                <i class="fas fa-book-dead text-stone-400 mr-2"></i> ${row.nombre}
            </td>
            <td class="py-4 px-4 text-right">
                <button onclick="reactivarDesdeHistorico(${row.id})" class="bg-[#2b1b17] hover:bg-black text-[var(--gold)] border border-[var(--gold)] px-4 py-2 rounded shadow-md font-bold transition active:scale-95 text-sm">
                    <i class="fas fa-undo-alt mr-1"></i> Reactivar
                </button>
            </td>
        </tr>
    `).join('');
}

window.reactivarDesdeHistorico = async function(id) {
    if (confirm("¿Deseas reactivar este viaje y devolverlo al menú principal de expediciones?")) {
        const { error } = await sb.from('viajes').update({ activo: true }).eq('id', id);
        if (error) alert("Error: " + error.message);
        else {
            init(); 
            loadHistorico(); 
        }
    }
}

function setActiveMenu(tableKey) {
    document.querySelectorAll('#sidebar-menu button').forEach(btn => {
        btn.classList.remove('bg-[#1a100d]', 'border-[var(--gold)]', 'text-white');
    });
    const active = document.getElementById(`nav-${tableKey}`);
    if (active) active.classList.add('bg-[#1a100d]', 'border-[var(--gold)]', 'text-white');
}

document.addEventListener('DOMContentLoaded', init);

// --- SISTEMA DE MODALES MÁGICOS ---
window.initCustomModal = function() {
    if (document.getElementById('custom-modal-overlay')) return;
    const modalHTML = `
        <div id="custom-modal-overlay" class="fixed inset-0 bg-black/80 z-[100] hidden flex items-center justify-center p-4 transition-opacity duration-300 opacity-0">
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
};

window.showModal = function(type, title, message, icon) {
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
            }, 300); // Espera a que termine la transición CSS
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
        // Pequeño timeout para que el navegador aplique el display block antes de cambiar la opacidad (para la animación)
        setTimeout(() => {
            overlay.classList.add('opacity-100');
            box.classList.add('scale-100');
        }, 10);
    });
};

// --- LÓGICA COMPARTIR VIAJE ---
let temporalEmails = []; // Memoria temporal para los correos

window.openShareModal = function() {
    document.getElementById('share-modal').classList.remove('hidden');
    renderEmailsList();
    validateShareEmail();
}

window.closeShareModal = function() {
    document.getElementById('share-modal').classList.add('hidden');
    document.getElementById('share-email-input').value = '';
    // No vaciamos temporalEmails aquí, cumpliendo el requisito 5.1
}

window.validateShareEmail = function() {
    const input = document.getElementById('share-email-input').value.trim();
    const btn = document.getElementById('btn-add-email');
    // Regex básico para validar a@a.*
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    
    if (isValid && !temporalEmails.includes(input)) {
        btn.disabled = false;
        btn.classList.remove('bg-stone-300', 'text-stone-500');
        btn.classList.add('bg-[var(--gold)]', 'text-[var(--ink)]', 'hover:bg-yellow-600');
    } else {
        btn.disabled = true;
        btn.classList.add('bg-stone-300', 'text-stone-500');
        btn.classList.remove('bg-[var(--gold)]', 'text-[var(--ink)]', 'hover:bg-yellow-600');
    }
}

window.addEmailToList = function() {
    const inputEl = document.getElementById('share-email-input');
    const email = inputEl.value.trim().toLowerCase();
    
    if (email && !temporalEmails.includes(email)) {
        temporalEmails.push(email);
        inputEl.value = '';
        validateShareEmail();
        renderEmailsList();
    }
}

window.removeEmailFromList = function(email) {
    temporalEmails = temporalEmails.filter(e => e !== email);
    renderEmailsList();
    validateShareEmail();
}

window.renderEmailsList = function() {
    const container = document.getElementById('emails-list-container');
    if (temporalEmails.length === 0) {
        container.innerHTML = '<p class="text-sm italic text-stone-500 text-center py-2">Ningún mago añadido aún.</p>';
        return;
    }
    
    container.innerHTML = temporalEmails.map(email => `
        <div class="flex justify-between items-center bg-white/60 p-2 rounded border border-[#e2d1aa] shadow-sm">
            <span class="font-medium text-stone-800"><i class="fas fa-envelope text-[var(--gold)] mr-2"></i>${email}</span>
            <button type="button" onclick="removeEmailFromList('${email}')" class="text-red-500 hover:text-red-700 p-1 rounded transition">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

window.sendInvitations = async function() {
    if (temporalEmails.length === 0) {
        customAlert("Atención", "No has añadido ningún correo electrónico.", "fa-exclamation-triangle");
        return;
    }

    // Llamamos a nuestra función segura en el servidor de Supabase
    const { data: resultado, error } = await sb.rpc('enviar_invitaciones', {
        p_viaje_id: currentAdminViajeId, // Asegúrate de que esta variable tenga el ID de tu viaje
        p_emails: temporalEmails
    });

    if (error) {
        customAlert("Error", "No se pudo procesar la petición: " + error.message, "fa-times");
        return;
    }

    const emailsEncontrados = resultado.exitos || [];
    const emailsNoEncontrados = resultado.fallos || [];

    // Evaluamos los resultados devueltos por el servidor
    if (emailsNoEncontrados.length === 0) {
        // 6.1 Todos existen
        customAlert("¡Lechuzas Enviadas!", "Las invitaciones se han enviado correctamente a todos los magos.", "fa-check-circle");
        temporalEmails = [];
        closeShareModal();
    } else if (emailsEncontrados.length > 0) {
        // 6.2 Algunos existen, otros no
        const msg = `Se han enviado invitaciones a los magos registrados.<br><br><b class="text-red-600">Advertencia:</b> No se ha podido invitar a los siguientes usuarios porque no existen en el sistema:<br> ${emailsNoEncontrados.join('<br>')}`;
        customAlert("Envío Parcial", msg, "fa-exclamation-triangle");
        // Dejamos en memoria los que fallaron por si quiere corregirlos
        temporalEmails = emailsNoEncontrados; 
        renderEmailsList();
    } else {
        // 6.3 Ninguno existe
        customAlert("Error de Invocación", "No existe ninguno de los usuarios indicados en los registros del Ministerio.", "fa-skull-crossbones");
    }
}

// ==========================================
// --- LÓGICA DE GESTIÓN DE ACCESOS ---
// ==========================================

window.openManageAccessModal = async function() {
    document.getElementById('manage-access-modal').classList.remove('hidden');
    const container = document.getElementById('access-list-container');
    container.innerHTML = '<p class="text-center italic text-stone-500 py-4"><i class="fas fa-spinner fa-spin mr-2"></i> Consultando el registro del Ministerio...</p>';

    // Llamamos a la función segura que creamos en Supabase
    const { data, error } = await sb.rpc('ver_invitados_viaje', { p_viaje_id: currentAdminViajeId });

    if (error) {
        container.innerHTML = `<p class="text-red-600 font-bold text-center py-4">Error al leer los accesos: ${error.message}</p>`;
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-center text-stone-600 font-bold py-4">Ningún mago tiene acceso a este viaje aún.</p>';
        return;
    }

    // Dibujamos la lista con las "chapas" de colores según su estado
    container.innerHTML = data.map(inv => {
        let badgeClass = inv.estado === 'aceptada' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : (inv.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 'bg-red-100 text-red-800 border border-red-200');
        
        return `
        <div class="flex justify-between items-center bg-white/60 p-3 rounded-lg border border-[#e2d1aa] shadow-sm">
            <div>
                <span class="font-bold text-stone-800 block text-lg">${inv.email}</span>
                <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm inline-block mt-1 ${badgeClass}">${inv.estado}</span>
            </div>
            <button onclick="revokeAccess(${inv.invitacion_id})" title="Expulsar" class="text-red-500 hover:text-white hover:bg-red-600 border border-red-500 w-10 h-10 flex items-center justify-center rounded-lg transition active:scale-95 shadow-sm">
                <i class="fas fa-user-times"></i>
            </button>
        </div>
        `;
    }).join('');
}

window.closeManageAccessModal = function() {
    document.getElementById('manage-access-modal').classList.add('hidden');
}

window.revokeAccess = async function(invitacionId) {
    if(!confirm("¿Estás seguro de que quieres expulsar a este mago de la expedición? Perderá el acceso de inmediato.")) return;

    // Al borrar la fila de la tabla de invitaciones, el RLS de la app bloqueará automáticamente 
    // su lectura al viaje principal la próxima vez que el invitado intente cargar.
    const { error } = await sb.from('invitaciones_viaje').delete().eq('id', invitacionId);
    
    if (error) {
        alert("Maldición rebotada: " + error.message);
    } else {
        // Recargamos la lista del modal para ver cómo desaparece
        openManageAccessModal();
    }
}

// Funciones de uso rápido
window.customConfirm = (title, message, icon = 'fa-question-circle') => showModal('confirm', title, message, icon);
window.customAlert = (title, message, icon = 'fa-exclamation-triangle') => showModal('alert', title, message, icon);