import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://zephobibrftatzmagjta.supabase.co";
const supabaseKey = "sb_publishable_WFqb8AOLj0GAUq3UJ364kA_vU9tIAXL";
const sb = createClient(supabaseUrl, supabaseKey);

// Diccionario de configuración (dia_actividad eliminado del menú)
const schemaMap = {
    dias: {
        label: "Días (Itinerario)", icon: "fa-calendar-day",
        columns: [
            { key: 'id', label: 'ID Día', type: 'number', required: true, help: "Importante: El ID es manual (ej. 1, 2, 3...)" },
            { key: 'titulo', label: 'Título', type: 'text', required: true },
            { key: 'fecha', label: 'Fecha', type: 'text' },
            { key: 'icono', label: 'Icono (FontAwesome)', type: 'text' },
            { key: 'resumen', label: 'Resumen Corto', type: 'textarea' },
            { key: 'historia_dia', label: 'Historia Completa', type: 'textarea' },
            { key: 'curiosidad_hp', label: 'Curiosidad HP', type: 'textarea' },
            { key: 'nota_dia', label: 'Nota en rojo', type: 'text' }
        ]
    },
    actividades: {
        label: "Actividades Base", icon: "fa-camera",
        columns: [
            { key: 'id', label: 'ID', type: 'readonly' },
            { key: 'nombre', label: 'Nombre', type: 'text', required: true },
            { key: 'desc_texto', label: 'Descripción', type: 'textarea' },
            { key: 'tipo', label: 'Tipo (visita, comida, transporte...)', type: 'text' },
            { key: 'direccion', label: 'Dirección Google Maps', type: 'text' },
            { key: 'precio', label: 'Precio', type: 'text' },
            { key: 'contexto', label: 'Contexto (Secretos)', type: 'textarea' }
        ]
    },
    checklist: {
        label: "Checklist", icon: "fa-check-square",
        columns: [
            { key: 'id', label: 'ID', type: 'readonly' },
            { key: 'item', label: 'Elemento', type: 'text', required: true }
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
let allActivitiesCache = []; // Para el dropdown

async function init() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { window.location.href = 'index.html'; return; }
    
    renderSidebar();
    // Pre-cargamos la lista de actividades para el dropdown del Timeline
    const { data } = await sb.from('actividades').select('id, nombre').order('nombre');
    if (data) allActivitiesCache = data;
}

function renderSidebar() {
    const menu = document.getElementById('sidebar-menu');
    menu.innerHTML = Object.keys(schemaMap).map(key => `
        <button onclick="loadTable('${key}')" id="nav-${key}" class="w-full text-left px-6 py-3 hover:bg-gray-800 transition flex items-center gap-3 border-l-4 border-transparent">
            <i class="fas ${schemaMap[key].icon} w-5 text-center"></i>
            ${schemaMap[key].label}
        </button>
    `).join('');
}

function setActiveMenu(tableKey) {
    document.querySelectorAll('#sidebar-menu button').forEach(btn => btn.classList.remove('bg-gray-800', 'border-yellow-500', 'text-yellow-400'));
    const active = document.getElementById(`nav-${tableKey}`);
    if (active) active.classList.add('bg-gray-800', 'border-yellow-500', 'text-yellow-400');
}

window.loadTable = async function(tableKey) {
    currentTable = tableKey;
    setActiveMenu(tableKey);
    document.getElementById('view-title').textContent = schemaMap[tableKey].label;
    document.getElementById('btn-add').classList.remove('hidden');
    document.getElementById('btn-add').onclick = () => openForm(); 
    
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('data-table').classList.add('hidden');

    const { data, error } = await sb.from(tableKey).select('*').order('id', { ascending: true });
    document.getElementById('loading').classList.add('hidden');
    if (error) { alert("Error cargando datos: " + error.message); return; }
    
    renderTable(data, tableKey);
}

function renderTable(data, tableKey) {
    const table = document.getElementById('data-table');
    const thead = document.getElementById('table-head');
    const tbody = document.getElementById('table-body');
    const schema = schemaMap[tableKey];
    table.classList.remove('hidden');

    const visibleCols = schema.columns.filter(c => c.type !== 'textarea').slice(0, 5);
    thead.innerHTML = `<tr>
        ${visibleCols.map(col => `<th class="py-3 px-4 font-bold uppercase text-xs tracking-wider">${col.label}</th>`).join('')}
        <th class="py-3 px-4 text-right">Acciones</th>
    </tr>`;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${visibleCols.length + 1}" class="py-8 text-center text-gray-500">No hay registros todavía.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(row => `
        <tr class="hover:bg-gray-50 transition border-b">
            ${visibleCols.map(col => `<td class="py-3 px-4 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">${row[col.key] || '-'}</td>`).join('')}
            <td class="py-3 px-4 text-right">
                <button onclick='openForm(${JSON.stringify(row).replace(/'/g, "&#39;")})' class="text-blue-600 hover:text-blue-800 p-2"><i class="fas fa-edit"></i></button>
                <button onclick='deleteData(${row.id})' class="text-red-600 hover:text-red-800 p-2"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

window.openForm = function(rowData = null) {
    currentEditingId = rowData ? rowData.id : null;
    const schema = schemaMap[currentTable];
    
    document.getElementById('modal-title').textContent = rowData ? `Editar ${schema.label}` : `Nuevo ${schema.label}`;
    const form = document.getElementById('dynamic-form');
    
    form.innerHTML = schema.columns.map(col => {
        const value = rowData ? (rowData[col.key] || '') : '';
        if (col.type === 'readonly') {
            if (!rowData) return ''; 
            return `<div><label class="block text-sm font-bold text-gray-700 mb-1">${col.label}</label>
                    <input type="text" name="${col.key}" value="${value}" readonly class="w-full p-2 border rounded bg-gray-100 cursor-not-allowed"></div>`;
        }
        const required = col.required ? 'required' : '';
        const helpText = col.help ? `<p class="text-xs text-red-600 mt-1 font-bold">${col.help}</p>` : '';
        if (col.type === 'textarea') {
            return `<div><label class="block text-sm font-bold text-gray-700 mb-1">${col.label}</label>
                    <textarea name="${col.key}" rows="3" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500" ${required}>${value}</textarea>${helpText}</div>`;
        }
        return `<div><label class="block text-sm font-bold text-gray-700 mb-1">${col.label}</label>
                <input type="${col.type === 'number' ? 'number' : 'text'}" name="${col.key}" value="${value}" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500" ${required}>${helpText}</div>`;
    }).join('');

    // --- LÓGICA DEL TIMELINE PARA DÍAS ---
    const timelineContainer = document.getElementById('timeline-container');
    if (currentTable === 'dias' && currentEditingId) {
        timelineContainer.classList.remove('hidden');
        loadTimeline(currentEditingId);
    } else {
        timelineContainer.classList.add('hidden');
        if (currentTable === 'dias') {
            document.getElementById('timeline-content').innerHTML = '<p class="text-sm italic text-gray-600">Guarda el día primero para poder añadirle actividades.</p>';
            timelineContainer.classList.remove('hidden');
        }
    }

    document.getElementById('form-modal').classList.remove('hidden');
    document.body.classList.add('modal-active');
}

// --- GESTIÓN DEL TIMELINE (DIA_ACTIVIDAD) ---
async function loadTimeline(diaId) {
    const container = document.getElementById('timeline-content');
    container.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin text-gray-400"></i></div>';
    
    const { data: links, error } = await sb.from('dia_actividad')
        .select('id, hora, actividades(id, nombre)')
        .eq('dia_id', diaId)
        .order('hora', { ascending: true });

    if (error) { container.innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`; return; }

    let html = '<ul class="space-y-2 mb-4">';
    if (links && links.length > 0) {
        links.forEach(link => {
            const actName = link.actividades ? link.actividades.nombre : 'Actividad Eliminada';
            html += `
                <li class="flex justify-between items-center bg-white p-3 border rounded shadow-sm">
                    <div class="flex items-center gap-3">
                        <span class="bg-gray-800 text-white text-xs px-2 py-1 rounded font-mono">${link.hora}</span>
                        <span class="font-medium text-gray-800">${actName}</span>
                    </div>
                    <button onclick="removeTimelineItem(${link.id}, ${diaId})" class="text-red-500 hover:text-red-700 p-1" title="Quitar del día"><i class="fas fa-trash"></i></button>
                </li>
            `;
        });
    } else {
        html += '<li class="text-gray-500 text-sm italic">No hay actividades asignadas a este día.</li>';
    }
    html += '</ul>';

    html += `
        <div class="border-t pt-3 mt-3">
            <p class="text-xs font-bold text-gray-600 mb-2">AÑADIR ACTIVIDAD AL DÍA:</p>
            <div class="flex gap-2">
                <input type="time" id="new-tl-time" class="border p-2 rounded w-1/4" required>
                <select id="new-tl-act" class="border p-2 rounded flex-1">
                    <option value="">-- Selecciona una Actividad Base --</option>
                    ${allActivitiesCache.map(a => `<option value="${a.id}">${a.nombre}</option>`).join('')}
                </select>
                <button onclick="addTimelineItem(${diaId})" type="button" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-bold shadow-sm transition">
                    <i class="fas fa-plus"></i> Añadir
                </button>
            </div>
        </div>
    `;
    container.innerHTML = html;
}

window.addTimelineItem = async function(diaId) {
    const timeInput = document.getElementById('new-tl-time').value;
    const actInput = document.getElementById('new-tl-act').value;
    if (!timeInput || !actInput) { alert("Debes seleccionar una hora y una actividad."); return; }

    const { error } = await sb.from('dia_actividad').insert([
        { dia_id: diaId, actividad_id: actInput, hora: timeInput }
    ]);

    if (error) alert("Error al asignar: " + error.message);
    else {
        loadTimeline(diaId); // Recargar la lista
        localStorage.removeItem('travel_data_cache'); // Limpiar caché de la app
    }
}

window.removeTimelineItem = async function(linkId, diaId) {
    if (!confirm("¿Quitar esta actividad del día? (La actividad base no se borrará)")) return;
    const { error } = await sb.from('dia_actividad').delete().eq('id', linkId);
    if (error) alert("Error al quitar: " + error.message);
    else {
        loadTimeline(diaId);
        localStorage.removeItem('travel_data_cache');
    }
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

    let error;
    if (currentEditingId) ({ error } = await sb.from(currentTable).update(payload).eq('id', currentEditingId));
    else ({ error } = await sb.from(currentTable).insert([payload]));

    if (error) alert("Error al guardar: " + error.message);
    else {
        closeModal();
        loadTable(currentTable);
        localStorage.removeItem('travel_data_cache');
    }
}

window.deleteData = async function(id) {
    if (!confirm(`¿Estás seguro de que deseas eliminar este registro (ID: ${id})?`)) return;
    const { error } = await sb.from(currentTable).delete().eq('id', id);
    
    if (error) {
        if(error.code === '23503') alert("No puedes borrar esto porque tiene dependencias. (Ej: Borra primero sus actividades asignadas)");
        else alert("Error al borrar: " + error.message);
    } else {
        loadTable(currentTable);
        localStorage.removeItem('travel_data_cache');
    }
}

window.logoutAdmin = async function() {
    await sb.auth.signOut();
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', init);