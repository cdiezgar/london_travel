import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

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
            { key: 'fecha', label: 'Fecha', type: 'date' },
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

async function init() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { window.location.href = 'index.html'; return; }
    
    // 1. CARGAMOS LOS VIAJES DEL USUARIO
    const { data: viajes, error } = await sb.from('viajes').select('id, nombre').order('created_at', { ascending: true });
    
    if (error || !viajes || viajes.length === 0) {
        alert("Primero debes crear un viaje en la aplicación principal.");
        window.location.href = 'index.html';
        return;
    }

    // 2. ¿VENIMOS DE LA APP CON UN VIAJE ESPECÍFICO?
    const urlParams = new URLSearchParams(window.location.search);
    const viajeDesdeApp = urlParams.get('viaje');

    // Comprobamos si nos han pasado un ID y si ese ID realmente pertenece al usuario
    if (viajeDesdeApp && viajes.some(v => v.id == viajeDesdeApp)) {
        currentAdminViajeId = viajeDesdeApp;
        
        // (Opcional) Limpiamos la URL para que quede bonita
        window.history.replaceState({}, document.title, window.location.pathname);
    } else {
        // Si no venimos de la app, seleccionamos el primero por defecto
        currentAdminViajeId = viajes[0].id; 
    }

    renderSidebar(viajes);
    
    // 3. ACTUALIZAMOS EL SELECTOR VISUALMENTE
    const selector = document.getElementById('admin-viaje-selector');
    if (selector) {
        selector.value = currentAdminViajeId;
    }

    loadTable('dias'); 
}

function renderSidebar(viajes) {
    const menu = document.getElementById('sidebar-menu');
    
    // Inyectamos un selector de viajes al principio del menú lateral
    let sidebarContent = `
        <div class="px-6 pb-4 border-b border-[var(--gold)]/30 mb-4">
            <label class="block text-[var(--gold)] text-xs font-bold mb-1 uppercase tracking-widest">Viaje a Administrar</label>
            <select id="admin-viaje-selector" onchange="changeAdminViaje()" class="w-full p-2 bg-[#1a100d] text-white border border-[var(--gold)] rounded outline-none focus:ring-1 focus:ring-[var(--gold)] truncate">
                ${viajes.map(v => `<option value="${v.id}">${v.nombre}</option>`).join('')}
            </select>
        </div>
    `;

    // Añadimos los botones de las tablas
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
    
    // --- NUEVO: Cerrar el menú en móvil automáticamente al hacer clic ---
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('admin-overlay');
    if (sidebar && !sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.add('-translate-x-full');
        if (overlay) overlay.classList.add('hidden');
    }
    // -------------------------------------------------------------------

    document.getElementById('view-title').textContent = schemaMap[tableKey].label;
    document.getElementById('view-title').textContent = schemaMap[tableKey].label;
    document.getElementById('btn-add').classList.remove('hidden');
    document.getElementById('btn-add').onclick = () => openForm(); 
    
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('data-table').classList.add('hidden');

    // Determinamos la columna de orden según la tabla
    let orderBy = 'id'; // Orden por defecto
    
    if (tableKey === 'dias') {
        orderBy = 'fecha';
    } else if (tableKey === 'checklist') {
        orderBy = 'item';
    } else if (tableKey === 'supermercados' || tableKey === 'restaurantes_top') {
        orderBy = 'nombre';
    }

// Llamada a Supabase con la columna dinámica y el FILTRO DE VIAJE
    const { data, error } = await sb
        .from(tableKey)
        .select('*')
        .eq('viaje_id', currentAdminViajeId) // <--- ESTO ES LO NUEVO E IMPORTANTE
        .order(orderBy, { ascending: true });

    document.getElementById('loading').classList.add('hidden');
    if (error) { alert("Error cargando datos: " + error.message); return; }
    
    renderTable(data, tableKey);
}

function setActiveMenu(tableKey) {
    document.querySelectorAll('#sidebar-menu button').forEach(btn => {
        btn.classList.remove('bg-[#1a100d]', 'border-[var(--gold)]', 'text-white');
    });
    const active = document.getElementById(`nav-${tableKey}`);
    if (active) active.classList.add('bg-[#1a100d]', 'border-[var(--gold)]', 'text-white');
}

function renderTable(data, tableKey) {
    const table = document.getElementById('data-table');
    const thead = document.getElementById('table-head');
    const tbody = document.getElementById('table-body');
    const schema = schemaMap[tableKey];
    table.classList.remove('hidden');

    const visibleCols = schema.columns.filter(c => c.type !== 'textarea').slice(0, 5);
    
    // Cambiamos a index === 1 para que el título/nombre se vea en móvil y el ID se oculte
    thead.innerHTML = `<tr>
        ${visibleCols.map((col, index) => `<th class="py-4 px-4 font-bold uppercase ${index === 1 ? '' : 'hidden md:table-cell'}">${col.label}</th>`).join('')}
        <th class="py-4 px-4 text-right">Acciones</th>
    </tr>`;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${visibleCols.length + 1}" class="py-8 text-center handwritten text-xl">El pergamino está vacío...</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(row => `
        <tr class="hover:bg-[#fffef0] transition border-b border-[#e2d1aa]/50 group">
            ${visibleCols.map((col, index) => `<td class="py-3 px-4 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] text-stone-800 ${index === 1 ? '' : 'hidden md:table-cell'}">${row[col.key] || '-'}</td>`).join('')}
            <td class="py-3 px-4 text-right opacity-100 md:opacity-50 group-hover:opacity-100 transition whitespace-nowrap">
                <button onclick='openForm(${JSON.stringify(row).replace(/'/g, "&#39;")})' class="text-[var(--gold)] hover:text-yellow-600 p-2"><i class="fas fa-edit text-xl"></i></button>
                <button onclick='deleteData(${row.id})' class="text-[var(--gryffindor-red)] hover:text-red-800 p-2 ml-1"><i class="fas fa-trash text-xl"></i></button>
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
                
                <div class="flex flex-col parchment-box p-3 rounded transform transition duration-200 hover:scale-[1.01] hover:shadow-md cursor-pointer border border-[#e2d1aa]">
                    <div class="flex justify-between items-start">
                        <div class="flex items-start gap-3">
                            <span class="bg-[#2b1b17] text-[var(--gold)] text-xs px-2 py-1 rounded font-mono font-bold mt-1 shadow-sm">${link.hora}</span>
                            <div>
                                <span class="font-bold text-[var(--ink)] text-lg magic-font tracking-wide">${act.nombre}</span>
                                ${act.desc_texto ? `<p class="text-sm text-stone-600 mt-1 line-clamp-1 italic">${act.desc_texto}</p>` : ''}
                            </div>
                        </div>
                        <div class="flex gap-2 shrink-0 opacity-80 group-hover:opacity-100 transition">
                            <button onclick='openActivityModal(${actJson})' class="text-blue-700 hover:bg-blue-100 p-2 rounded transition" title="Editar Actividad"><i class="fas fa-edit"></i></button>
                            <button onclick="deleteActivity(${link.id}, ${act.id})" class="text-[var(--gryffindor-red)] hover:bg-red-100 p-2 rounded transition" title="Borrar Actividad"><i class="fas fa-trash"></i></button>
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
        direccion: document.getElementById('act-direccion').value || null,
        precio: document.getElementById('act-precio').value || null,
        desc_texto: document.getElementById('act-desc').value || null,
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
        <div class="flex justify-between items-center bg-white/60 p-3 rounded border border-[#e2d1aa] shadow-sm mb-2 group">
            <div class="flex flex-col">
                <span class="font-bold text-[var(--ink)] text-lg magic-font">${r.nombre}</span>
                <span class="text-sm text-stone-600">${r.desc_texto || ''} ${r.precio ? `• <b class="text-green-800">${r.precio}</b>` : ''}</span>
            </div>
            <div class="flex gap-2 opacity-80 group-hover:opacity-100 transition">
                <button onclick='openRestaurantModal(${JSON.stringify(r).replace(/'/g, "&#39;")})' class="text-blue-700 hover:bg-blue-100 p-2 rounded transition" title="Editar Restaurante"><i class="fas fa-edit"></i></button>
                <button onclick="deleteRestaurant(${r.id})" class="text-[var(--gryffindor-red)] hover:bg-red-100 p-2 rounded transition" title="Borrar Restaurante"><i class="fas fa-trash"></i></button>
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
        precio: document.getElementById('rest-precio').value.trim() || null,
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
        <div class="flex justify-between items-center bg-white/60 p-3 rounded border border-[#e2d1aa] shadow-sm mb-2 group">
            <div class="flex items-center gap-3">
                <div class="bg-[var(--parchment)] w-10 h-10 rounded-full flex items-center justify-center border border-[var(--gold)]">
                    <i class="fas ${a.icono || 'fa-ticket-alt'} text-[var(--gryffindor-red)]"></i>
                </div>
                <div class="flex flex-col">
                    <span class="font-bold text-[var(--ink)] text-lg magic-font">${a.nombre}</span>
                    <span class="text-sm text-stone-600">${a.dia_sugerido || ''} ${a.precio_taquilla ? `• <b class="text-stone-800">£${a.precio_taquilla}</b>` : ''}</span>
                </div>
            </div>
            <div class="flex gap-2 opacity-80 group-hover:opacity-100 transition">
                <button onclick='openPassActivityModal(${JSON.stringify(a).replace(/'/g, "&#39;")})' class="text-blue-700 hover:bg-blue-100 p-2 rounded transition" title="Editar Actividad"><i class="fas fa-edit"></i></button>
                <button onclick="deletePassActivity(${a.id})" class="text-[var(--gryffindor-red)] hover:bg-red-100 p-2 rounded transition" title="Borrar Actividad"><i class="fas fa-trash"></i></button>
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
        precio_taquilla: document.getElementById('pass-act-precio').value || null,
        dia_sugerido: document.getElementById('pass-act-dia').value.trim() || null,
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

document.addEventListener('DOMContentLoaded', init);