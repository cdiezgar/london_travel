// js/private/features/genericCrud.js
import { adminState } from "../../core/adminState.js";
import { AdminDataService } from "../../api/adminDataService.js";
import { customAlert, customConfirm } from "../../ui/modals.js";

let crudMap = null;
let crudMarker = null;

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

    // Primero buscamos si hemos definido explícitamente qué columnas mostrar
    let visibleCols = schema.columns.filter(c => c.showInTable);
    
    // Si por algún motivo se nos olvidó poner "showInTable" en alguna tabla nueva, 
    // mantenemos el comportamiento por defecto como salvavidas (las 5 primeras no-texto):
    if (visibleCols.length === 0) {
        visibleCols = schema.columns.filter(c => c.type !== 'textarea' && c.key !== 'id').slice(0, 5);
    }    
    
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
    
    form.innerHTML = schema.columns.filter(col => col.key !== 'id').map(col => {
        const value = rowData ? (rowData[col.key] || '') : '';
        
        // 1. CAMPOS OCULTOS (lat y long del mapa)
        if (col.hidden) {
            return `<input type="hidden" id="crud-hidden-${col.key}" name="${col.key}" value="${value}">`;
        }

        // 2. CAMPO MAPA INTERACTIVO
        if (col.type === 'map') {
            return `<div class="col-span-1 md:col-span-2 mt-2">
                <label class="block text-sm font-bold text-[var(--gryffindor-red)] mb-1 magic-font tracking-wide">${col.label}</label>
                <div class="flex gap-2 mb-2">
                    <input type="text" id="map-search-input" placeholder="Ej: King's Cross, London" class="w-full p-2 border-b-2 border-[var(--gold)] bg-white/50 focus:outline-none transition">
                    <button type="button" onclick="searchMapLocation()" class="bg-[#2b1b17] text-[var(--gold)] px-4 rounded hover:bg-black transition shadow-sm"><i class="fas fa-search"></i> Buscar</button>
                </div>
                <div id="crud-map" class="w-full h-64 rounded-lg border-2 border-[var(--gold)]/50 z-10 relative"></div>
                <p class="text-xs text-stone-500 mt-1 italic"><i class="fas fa-info-circle"></i> Haz clic en cualquier parte del mapa para ajustar el pin exacto.</p>
            </div>`;
        }

        // 3. CAMPO IMAGEN (Con Drag & Drop y Papelera)
        if (col.type === 'image') {
            return `<div class="col-span-1 md:col-span-2">
                <label class="block text-sm font-bold text-[var(--gryffindor-red)] mb-1 magic-font tracking-wide">${col.label}</label>
                
                <div class="relative flex flex-col items-center justify-center w-full h-40 border-2 border-[var(--gold)] border-dashed rounded-lg bg-white/50 hover:bg-white transition overflow-hidden group shadow-sm">
                    
                    <div id="crud-img-content-${col.key}" class="flex flex-col items-center justify-center z-10 transition-all ${value ? 'bg-white/80 p-2 rounded mt-12' : ''} pointer-events-none">
                        <i class="fas fa-cloud-upload-alt text-3xl text-[var(--gold)] mb-2 group-hover:scale-110 transition"></i>
                        <p class="text-sm font-bold text-stone-600">Haz clic o arrastra una imagen</p>
                    </div>
                    
                    <input id="crud-img-${col.key}" type="file" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" accept=".jpg, .jpeg, .png, .webp" onchange="previewImage(this, 'crud-preview-${col.key}', 'crud-img-content-${col.key}', 'btn-clear-${col.key}')" />
                    <img id="crud-preview-${col.key}" src="${value || ''}" class="absolute inset-0 w-full h-full object-cover z-0 opacity-80 ${value ? '' : 'hidden'}" />
                    
                    <button type="button" id="btn-clear-${col.key}" onclick="clearImagePreview('crud-img-${col.key}', 'crud-preview-${col.key}', 'crud-img-content-${col.key}', 'crud-hidden-${col.key}', 'btn-clear-${col.key}')" class="absolute top-2 right-2 bg-red-600 text-white rounded-lg w-8 h-8 flex items-center justify-center z-30 hover:bg-red-800 transition shadow-md ${value ? '' : 'hidden'}" title="Quitar imagen">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                
                <input type="hidden" id="crud-hidden-${col.key}" name="${col.key}" value="${value}">
                <input type="hidden" id="crud-original-${col.key}" value="${value}">
            </div>`;
        }

        // 4. RESTO DE CAMPOS NORMALES (Textos, Textareas, Fechas...)
        // (Aquí es donde estaba fallando por faltar la declaración de required)
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

    if (schema.columns.some(c => c.type === 'map')) {
        const lat = rowData ? rowData['lat'] : null;
        const lng = rowData ? rowData['long'] : null;
        setTimeout(() => initMapSelector(lat, lng), 300); // Pequeño delay para que el modal se termine de pintar
    }
}

export function closeModal() {
    document.getElementById('form-modal').classList.add('hidden');
    document.body.classList.remove('modal-active');
}

export async function saveData() {
    const formElement = document.getElementById('dynamic-form');
    if (!formElement.checkValidity()) { formElement.reportValidity(); return; }

    // Activamos un loader para que el usuario sepa que la imagen está subiendo
    document.getElementById('loading').classList.remove('hidden');

    const formData = new FormData(formElement);
    const payload = {};
    
    try {
        // Usamos for...of para poder hacer await al subir la imagen
        for (const col of adminState.schemaMap[adminState.currentTable].columns) {
            
            if (col.type === 'image') {
                const fileInput = document.getElementById(`crud-img-${col.key}`);
                const hiddenInput = document.getElementById(`crud-hidden-${col.key}`);
                const originalUrl = document.getElementById(`crud-original-${col.key}`).value;
                
                let finalUrl = hiddenInput.value; // Puede estar vacío si le dio al botón de borrar
                
                // Si ha metido un archivo NUEVO, lo subimos y destruimos el original
                if (fileInput && fileInput.files.length > 0) {
                    finalUrl = await AdminDataService.uploadImage(fileInput.files[0], `${adminState.currentTable}/${adminState.currentAdminViajeId}`);
                    if (originalUrl) await AdminDataService.deleteImage(originalUrl);
                } 
                // Si no hay archivo nuevo, y la URL final está vacía, pero había original (Significa que borró la foto)
                else if (!finalUrl && originalUrl) {
                    await AdminDataService.deleteImage(originalUrl);
                }
                
                payload[col.key] = finalUrl || null;
            }
            else if (formData.has(col.key)) {
                let val = formData.get(col.key);
                if ((col.type === 'number' || col.type === 'float') && val === '') val = null; 
                payload[col.key] = val;
            }
        }

        payload.viaje_id = adminState.currentAdminViajeId;

        await AdminDataService.saveRecord(adminState.currentTable, payload, adminState.currentEditingId);
        closeModal();
        loadTable(adminState.currentTable);
        localStorage.removeItem('travel_data_cache_' + adminState.currentAdminViajeId);
    } catch(error) {
        customAlert("Maldición rebotada", "Error al guardar: " + error.message, "fa-skull-crossbones");
    } finally {
        document.getElementById('loading').classList.add('hidden');
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

// --- FUNCIONES DEL MAPA ---
export function initMapSelector(lat, lng) {
    const mapContainer = document.getElementById('crud-map');
    if (!mapContainer) return;

    if (crudMap) { crudMap.remove(); crudMap = null; }

    // Centro por defecto: Centro de Londres. Si ya hay datos, centramos en ellos.
    const centerLat = lat ? parseFloat(lat) : 51.5074;
    const centerLng = lng ? parseFloat(lng) : -0.1278;
    const zoom = lat ? 16 : 12;

    crudMap = L.map('crud-map').setView([centerLat, centerLng], zoom);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(crudMap);

    if (lat && lng) {
        crudMarker = L.marker([centerLat, centerLng]).addTo(crudMap);
    }

    // Al hacer clic en el mapa, movemos el pin y guardamos las coordenadas
    crudMap.on('click', function(e) {
        updateMapPin(e.latlng.lat, e.latlng.lng);
    });

    // Truco: Forzar redimensionado porque a veces Leaflet carga "roto" dentro de modales
    setTimeout(() => { crudMap.invalidateSize(); }, 200);
}

export function updateMapPin(lat, lng) {
    if (!crudMarker) {
        crudMarker = L.marker([lat, lng]).addTo(crudMap);
    } else {
        crudMarker.setLatLng([lat, lng]);
    }
    // Guardamos la info en los inputs invisibles para que saveData() lo lea
    document.getElementById('crud-hidden-lat').value = lat;
    document.getElementById('crud-hidden-long').value = lng;
}

export async function searchMapLocation() {
    const query = document.getElementById('map-search-input').value.trim();
    if (!query) return;

    const btn = document.querySelector('button[onclick="searchMapLocation()"]');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        // Usamos la API gratuita de OpenStreetMap
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        const data = await response.json();

        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            crudMap.setView([lat, lng], 16);
            updateMapPin(lat, lng);
        } else {
            // AQUÍ ESTABA EL FALLO: Ahora usamos la modal mágica
            customAlert("Lugar no encontrado", "El Ministerio de Magia no encuentra este lugar en sus mapas. Intenta añadir la ciudad o ser más específico (ej: 'Camden Town, London').", "fa-map-marker-alt");
        }
    } catch (error) {
        console.error("Error buscando lugar:", error);
        customAlert("Error de conexión", "Las lechuzas mensajeras han sido interceptadas. No se pudo buscar el lugar.", "fa-times-circle");
    } finally {
        btn.innerHTML = originalHtml;
    }
}