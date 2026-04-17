// js/api/adminDataService.js
import { sb } from "../core/supabase.js";

export const AdminDataService = {

    async getSession() {
        const { data, error } = await sb.auth.getSession();
        if (error) throw error;
        return data.session;
    },

    // --- 1. LOBBY Y VIAJES ---
    async getMisViajes(userId) {
        const { data, error } = await sb.from('viajes')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data;
    },

    async updateEstadoViaje(viajeId, activo) {
        const { error } = await sb.from('viajes')
            .update({ activo })
            .eq('id', viajeId);
        if (error) throw error;
    },

    async getViajesArchivados() {
        const { data, error } = await sb.from('viajes')
            .select('*')
            .eq('activo', false);
        if (error) throw error;
        return data;
    },

    // --- 2. CONFIGURACIÓN ---
    async getConfiguracion(viajeId) {
        const { data, error } = await sb.from('configuracion')
            .select('*')
            .eq('viaje_id', viajeId)
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    async saveConfiguracion(payload, existingId) {
        let result;
        if (existingId) {
            result = await sb.from('configuracion').update(payload).eq('id', existingId);
        } else {
            result = await sb.from('configuracion').insert([payload]);
        }
        if (result.error) throw result.error;
        return result.data;
    },

    // --- 3. CRUD GENÉRICO (Días, Transportes, Restaurantes, etc) ---
    async getTableData(tableKey, viajeId, orderByField) {
        const { data, error } = await sb.from(tableKey)
            .select('*')
            .eq('viaje_id', viajeId)
            .order(orderByField, { ascending: true });
        if (error) throw error;
        return data;
    },

    async saveRecord(table, payload, existingId) {
        let result;
        if (existingId) {
            result = await sb.from(table).update(payload).eq('id', existingId);
        } else {
            result = await sb.from(table).insert([payload]);
        }
        if (result.error) throw result.error;
        return result.data;
    },

    async deleteRecord(table, id) {
        const { error } = await sb.from(table).delete().eq('id', id);
        if (error) throw error;
    },

    // --- 4. ACTIVIDADES Y TIMELINE ---
    async getTimeline(diaId) {
        const { data, error } = await sb.from('dia_actividad')
            .select(`id, hora, actividades (id, nombre, desc_texto, tipo, direccion, precio, contexto, checklist_id)`)
            .eq('dia_id', diaId)
            .order('hora', { ascending: true });
        if (error) throw error;
        return data;
    },
    async getChecklistOptions(viajeId) {
        const { data, error } = await sb.from('checklist')
            .select('id, item')
            .eq('viaje_id', viajeId)
            .order('item', { ascending: true });
        if (error) throw error;
        return data;
    },
    async updateActivity(actId, linkId, actData, hora) {
        const { error: err1 } = await sb.from('actividades').update(actData).eq('id', actId);
        if (err1) throw err1;
        const { error: err2 } = await sb.from('dia_actividad').update({ hora }).eq('id', linkId);
        if (err2) throw err2;
    },
    async insertActivity(diaId, actData, hora) {
        const { data: newAct, error: err1 } = await sb.from('actividades').insert([actData]).select();
        if (err1) throw err1;
        const newActId = newAct[0].id;
        const { error: err2 } = await sb.from('dia_actividad').insert([{ dia_id: diaId, actividad_id: newActId, hora: hora }]);
        if (err2) throw err2;
    },
    async deleteActivity(linkId, actId) {
        const { error: err1 } = await sb.from('dia_actividad').delete().eq('id', linkId);
        if (err1) throw err1;
        const { error: err2 } = await sb.from('actividades').delete().eq('id', actId);
        if (err2) console.warn("La actividad se desvinculó pero no se borró de la base.");
    },
    
    // --- 5. ÍTEMS DE ACTIVIDAD (Cosas que ver) ---
    async getActivityItems(actId) {
        const { data, error } = await sb.from('actividad_items').select('*').eq('actividad_id', actId).order('id', { ascending: true });
        if (error) throw error;
        return data;
    },
    async saveActivityItem(payload, existingId) {
        let result;
        if (existingId) result = await sb.from('actividad_items').update(payload).eq('id', existingId);
        else result = await sb.from('actividad_items').insert([payload]);
        if (result.error) throw result.error;
    },
    async deleteActivityItem(itemId) {
        const { error } = await sb.from('actividad_items').delete().eq('id', itemId);
        if (error) throw error;
    },
    // --- 6. RESTAURANTES DEL DÍA ---
    async getRestaurantesDia(diaId) {
        const { data, error } = await sb.from('restaurantes_dia').select('*').eq('dia_id', diaId).order('id', { ascending: true });
        if (error) throw error;
        return data;
    },
    async saveRestauranteDia(payload, existingId) {
        let result;
        if (existingId) result = await sb.from('restaurantes_dia').update(payload).eq('id', existingId);
        else result = await sb.from('restaurantes_dia').insert([payload]);
        if (result.error) throw result.error;
    },
    async deleteRestauranteDia(id) {
        const { error } = await sb.from('restaurantes_dia').delete().eq('id', id);
        if (error) throw error;
    },

    // --- 7. ACTIVIDADES DEL PASE TURÍSTICO ---
    async getActividadesPase(paseId) {
        const { data, error } = await sb.from('actividades_pase').select('*').eq('pase_id', paseId).order('id', { ascending: true });
        if (error) throw error;
        return data;
    },
    async saveActividadPase(payload, existingId) {
        let result;
        if (existingId) result = await sb.from('actividades_pase').update(payload).eq('id', existingId);
        else result = await sb.from('actividades_pase').insert([payload]);
        if (result.error) throw result.error;
    },
    async deleteActividadPase(id) {
        const { error } = await sb.from('actividades_pase').delete().eq('id', id);
        if (error) throw error;
    },
    // --- 8. ACCESOS E INVITACIONES ---
    async sendInvitations(viajeId, emails) {
        const { data, error } = await sb.rpc('enviar_invitaciones', {
            p_viaje_id: viajeId, 
            p_emails: emails
        });
        if (error) throw error;
        return data;
    },
    async getAccessList(viajeId) {
        const { data, error } = await sb.rpc('ver_invitados_viaje', { 
            p_viaje_id: viajeId 
        });
        if (error) throw error;
        return data;
    },
    async revokeAccess(invitacionId) {
        const { error } = await sb.from('invitaciones_viaje').delete().eq('id', invitacionId);
        if (error) throw error;
    },

};