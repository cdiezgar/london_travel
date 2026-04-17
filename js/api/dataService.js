import { sb } from "../core/supabase.js";

// Helper for formatting dates used during data mapping
function formatearFecha(fechaString) {
    if (!fechaString) return '';
    const fecha = new Date(fechaString + 'T00:00:00');
    const opciones = { weekday: 'long', day: 'numeric', month: 'long' };
    let texto = fecha.toLocaleDateString('es-ES', opciones);
    return texto.charAt(0).toUpperCase() + texto.slice(1).replace(' de ', ' ');
}

export const DataService = {
    /**
     * Obtiene todos los datos relacionados con un viaje específico y los formatea 
     * en el objeto organizadorViaje listo para ser consumido por el estado.
     */
    async getTravelData(viajeId) {
        const [
            { data: configData, error: configErr },
            { data: diasData, error: diasErr },
            { data: superData },
            { data: secretosData },
            { data: restTopData },
            { data: checkData },
            { data: gastosData },
            { data: transData },
            { data: pasesData },
            { data: actividadesPaseData }
        ] = await Promise.all([
            sb.from('configuracion').select('*').eq('viaje_id', viajeId).maybeSingle(),
            sb.from('dias').select(`
                *,
                dia_actividad (
                    hora,
                    actividades (
                        nombre, desc_texto, tipo, direccion, precio, contexto, checklist_id,
                        actividad_items ( item_texto, descripcion, imagen_url )
                    )
                ),
                restaurantes_dia (*)
            `).eq('viaje_id', viajeId).order('fecha', { ascending: true }),
            sb.from('supermercados').select('*').eq('viaje_id', viajeId),
            sb.from('secretos').select('*').eq('viaje_id', viajeId),
            sb.from('restaurantes_top').select('*').eq('viaje_id', viajeId),
            sb.from('checklist').select('*').eq('viaje_id', viajeId).order('id', { ascending: true }),
            sb.from('gastos').select('*').eq('viaje_id', viajeId).order('created_at', { ascending: true }),
            sb.from('transportes').select('*').eq('viaje_id', viajeId).maybeSingle(),
            sb.from('pases_turisticos').select('*').eq('viaje_id', viajeId).maybeSingle(),
            sb.from('actividades_pase').select('*').eq('viaje_id', viajeId)
        ]);

        if (configErr || diasErr) {
            console.error("Error reading database:", configErr || diasErr);
            throw new Error("Fallo al leer datos de la base de datos");
        }

        return {
            config: {
                titulo: configData?.titulo || '',
                subtitulo: configData?.subtitulo || '',
                presupuesto: configData?.presupuesto || '',
                base: configData?.base || '',
                tasa_cambio: configData?.tasa_cambio || 1,
                lat_centro: configData?.lat_centro || 51.5074,
                long_centro: configData?.long_centro || -0.1278
            },
            intro: {
                texto: configData?.intro_texto || '',
                alojamiento: configData?.intro_alojamiento || ''
            },
            dias: (diasData || []).map(dia => ({
                id: dia.id,
                fecha: formatearFecha(dia.fecha),
                titulo: dia.titulo || '',
                icono: dia.icono || 'fa-circle',
                resumen: dia.resumen || '',
                curiosidad_hp: dia.curiosidad_hp || null,
                historia_dia: dia.historia_dia || null,
                nota_dia: dia.nota_dia || null,

                timeline: (dia.dia_actividad || []).map(relacion => {
                    const act = relacion.actividades || {};
                    const listaItems = act.actividad_items || [];

                    let finalImgUrl = act.imagen_url || null;
                    if (act.checklist_id && checkData) {
                        const checklistAsociado = checkData.find(c => c.id === act.checklist_id);
                        if (checklistAsociado && checklistAsociado.imagen_url) {
                            finalImgUrl = checklistAsociado.imagen_url;
                        }
                    }

                    let detallesObj = null;
                    if (act.contexto || listaItems.length > 0) {
                        detallesObj = {
                            contexto: act.contexto || "",
                            lista_ver: listaItems.map(item => ({
                                texto: item.item_texto || "",
                                desc: item.descripcion || null,
                                img: item.imagen_url || null
                            }))
                        };
                    }

                    return {
                        hora: relacion.hora || '',
                        actividad: act.nombre || 'Actividad desconocida',
                        desc: act.desc_texto || null,
                        tipo: act.tipo || 'visita',
                        direccion: act.direccion || null,
                        imagen_url: finalImgUrl,
                        precio: act.precio || null,
                        detalles: detallesObj
                    };
                }).sort((a, b) => (a.hora || "").localeCompare(b.hora || "")),

                restaurantes: (dia.restaurantes_dia || []).map(r => ({
                    nombre: r.nombre || '', desc: r.desc_texto || '', precio: r.precio || '', loc: r.loc || null
                }))
            })),
            supermercados: superData || [],
            curiosidades_extra: secretosData || [],
            restaurantes_lista: restTopData || [],
            checklist: checkData || [],
            gastos: gastosData || [],
            transporte: {
                consejo_oro: transData?.consejo_oro || "Regla de oro no configurada.",
                detalle: transData?.detalle || "Detalles de transporte no configurados.",
                apps: transData?.apps ? transData.apps.split(',').map(app => app.trim()) : []
            },
            explorer_pass: {
                titulo: pasesData?.titulo || "Pase Turístico",
                subtitulo: pasesData?.subtitulo || "No configurado",
                precio_total: pasesData?.precio_total || "-",
                precio_pp: pasesData?.precio_pp || "-",
                info: pasesData?.info || "Añade la información del pase en el panel de administración.",
                actividades: actividadesPaseData || []
            }
        };
    },

    /**
     * Obtiene los viajes propios del usuario logueado.
     */
    async getUserTrips(userId) {
        const { data, error } = await sb.from('viajes')
            .select('*')
            .eq('activo', true)
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    /**
     * Obtiene las invitaciones pendientes para un usuario invitado.
     */
    async getPendingInvitations(userId) {
        const { data, error } = await sb.from('invitaciones_viaje')
            .select(`id, viaje_id, viajes(nombre)`)
            .eq('usuario_invitado_id', userId)
            .eq('estado', 'pendiente');

        if (error) throw error;
        return data || [];
    },

    /**
     * Obtiene los viajes compartidos (invitaciones aceptadas) para un usuario.
     */
    async getAcceptedInvitations(userId) {
        const { data, error } = await sb.from('invitaciones_viaje')
            .select(`viajes (*)`)
            .eq('usuario_invitado_id', userId)
            .eq('estado', 'aceptada');

        if (error) throw error;
        return data || [];
    },

    /**
     * Actualiza el estado de una invitación (aceptada o declinada).
     */
    async respondToInvitation(invitationId, response) {
        const { error } = await sb.from('invitaciones_viaje')
            .update({ estado: response })
            .eq('id', invitationId);

        if (error) throw error;
    },

    /**
     * Obtiene el nombre de un viaje específico. Útil para deep-linking.
     */
    async getTripName(viajeId) {
        const { data, error } = await sb.from('viajes')
            .select('nombre')
            .eq('id', viajeId)
            .maybeSingle();

        if (error) throw error;
        return data?.nombre || null;
    },

    /**
     * Crea un nuevo viaje asociado al usuario actual.
     */
    async createNewTrip(nombreViaje, userId) {
        const { data, error } = await sb.from('viajes').insert([
            {
                nombre: nombreViaje,
                user_id: userId
            }
        ]).select();

        if (error) throw error;
        return data || [];
    }
};
