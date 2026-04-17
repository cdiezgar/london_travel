export const adminState = {
    misViajes: [],
    currentTable: null,
    currentEditingId: null,
    currentDiaIdForActivity: null, 
    editingActivityId: null, 
    editingLinkId: null,     
    editingItemId: null,
    editingRestaurantId: null,
    currentAdminViajeId: null,
    currentPaseIdForActivity: null,
    editingPassActivityId: null,
    
    // Pega aquí todo tu schemaMap original
    schemaMap: {
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
                { key: 'lat', label: 'Latitud', type: 'float', required: true }, // <-- Añadido
                { key: 'long', label: 'Longitud', type: 'float', required: true } // <-- Añadido
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
    }
};