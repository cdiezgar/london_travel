// js/private/features/genericCrud.js
import { adminState } from "../../core/adminState.js";
import { AdminDataService } from "../../api/adminDataService.js";
import { customAlert, customConfirm } from "../../ui/modals.js";

export async function loadTable(tableKey) {
    adminState.currentTable = tableKey;
    window.setActiveMenu(tableKey); // Llamada temporal a la función de admin.js
    
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

    try {
        // MODO DASHBOARD PARA CONFIGURACIÓN
        if (tableKey === 'configuracion') {
            document.getElementById('view-title').textContent = adminState.schemaMap[tableKey].label;
            document.getElementById('btn-add').classList.add('hidden');
            
            const viajeInfo = adminState.misViajes.find(v => v.id == adminState.currentAdminViajeId);
            const configData = await AdminDataService.getConfiguracion(adminState.currentAdminViajeId);
            
            document.getElementById('loading').classList.add('hidden');
            window.renderDashboardConfig(configData, viajeInfo?.activo !== false);
            return;
        }

        // MODO TABLAS GENÉRICAS
        document.getElementById('view-title').textContent = adminState.schemaMap[tableKey] ? adminState.schemaMap[tableKey].label : "Panel";
        document.getElementById('btn-add').classList.remove('hidden');
        document.getElementById('btn-add').onclick = () => openForm(); 

        let orderBy = tableKey === 'dias' ? 'fecha' : (tableKey === 'checklist' ? 'item' : (['supermercados','restaurantes_top'].includes(tableKey) ? 'nombre' : 'id'));
        
        const data = await AdminDataService.getTableData(tableKey, adminState.currentAdminViajeId, orderBy);

        document.getElementById('loading').classList.add('hidden');
        if (tableContainer) tableContainer.classList.remove('hidden'); 
        
        renderTable(data, tableKey);
        
    } catch (error) {
        document.getElementById('loading').classList.add('hidden');
        customAlert("Error", "Error cargando datos: " + error.message, "fa-times-circle");
    }
}

export function renderTable(data, tableKey) {
    const table = document.getElementById('data-table');
    const thead = document.getElementById('table-head');
    const tbody = document.getElementById('table-body');
    const schema = adminState.schemaMap[tableKey];
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

export function openForm(rowData = null) {
    adminState.currentEditingId = rowData ? rowData.id : null;
    const schema = adminState.schemaMap[adminState.currentTable];
    
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
        
        const inputType = col.type === 'number' ? 'number' : (col.type === 'date' ? 'date' : 'text');
        return `<div><label class="block text-sm font-bold text-[var(--gryffindor-red)] mb-1 magic-font tracking-wide">${col.label}</label>
                <input type="${inputType}" name="${col.key}" value="${value}" class="w-full p-2 border-b-2 border-[var(--gold)] bg-white/50 focus:outline-none focus:bg-white transition text-lg font-medium" ${required}>${helpText}</div>`;
            }).join('');

    const timelineContainer = document.getElementById('timeline-container');
    const restContainer = document.getElementById('restaurants-container'); 
    const passContainer = document.getElementById('pass-activities-container'); 
    
    // Resetear todo a oculto
    timelineContainer.classList.add('hidden');
    restContainer.classList.add('hidden'); 
    passContainer.classList.add('hidden');

    if (adminState.currentTable === 'dias' && adminState.currentEditingId) {
        adminState.currentDiaIdForActivity = adminState.currentEditingId;
        timelineContainer.classList.remove('hidden');
        restContainer.classList.remove('hidden'); 
        window.loadTimeline(adminState.currentEditingId);
        window.loadRestaurants(adminState.currentEditingId); 
    } else if (adminState.currentTable === 'dias') {
        document.getElementById('timeline-content').innerHTML = '<p class="text-lg handwritten text-center p-4">Guarda el día primero en el pergamino para poder añadirle actividades.</p>';
    }

    if (adminState.currentTable === 'pases_turisticos' && adminState.currentEditingId) {
        adminState.currentPaseIdForActivity = adminState.currentEditingId;
        passContainer.classList.remove('hidden');
        window.loadPassActivities(adminState.currentEditingId);
    } else if (adminState.currentTable === 'pases_turisticos') {
        document.getElementById('pass-activities-content').innerHTML = '<p class="text-lg handwritten text-center p-4">Guarda el pase primero para poder añadirle actividades dentro.</p>';
        passContainer.classList.remove('hidden');
    }

    document.getElementById('form-modal').classList.remove('hidden');
    document.body.classList.add('modal-active');
}

export function closeModal() {
    document.getElementById('form-modal').classList.add('hidden');
    document.body.classList.remove('modal-active');
}

export async function saveData() {
    const formElement = document.getElementById('dynamic-form');
    if (!formElement.checkValidity()) { formElement.reportValidity(); return; }

    const formData = new FormData(formElement);
    const payload = {};
    
    adminState.schemaMap[adminState.currentTable].columns.forEach(col => {
        if (formData.has(col.key)) {
            let val = formData.get(col.key);
            
            if ((col.type === 'number' || col.type === 'float') && val === '') {
                val = null; 
            }
            
            payload[col.key] = val;
        }
    });

    payload.viaje_id = adminState.currentAdminViajeId;

    try {
        await AdminDataService.saveRecord(adminState.currentTable, payload, adminState.currentEditingId);
        closeModal();
        loadTable(adminState.currentTable);
        localStorage.removeItem('travel_data_cache_' + adminState.currentAdminViajeId);
    } catch(error) {
        customAlert("Maldición rebotada", "Error al guardar: " + error.message, "fa-skull-crossbones");
    }
}

export async function deleteData(id) {
    if (!(await customConfirm("Borrar Registro", "¿Borrar este registro definitivamente del mapa?", "fa-trash"))) return;
    
    try {
        await AdminDataService.deleteRecord(adminState.currentTable, id);
        loadTable(adminState.currentTable);
        localStorage.removeItem('travel_data_cache_' + adminState.currentAdminViajeId);
    } catch(error) {
        if(error.code === '23503') customAlert("Maldición detectada", "No puedes borrar esto porque tiene actividades colgadas. Bórralas primero.", "fa-link");
        else customAlert("Error", "Error al borrar: " + error.message, "fa-times-circle");
    }
}