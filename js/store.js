import { fetchData } from './api.js';

const LS_KEY = 'finanzas_cache_v1';

let cache = null;
let inflight = null;

// Lee lo último sincronizado sin pegarle a la red (para pintar algo al instante).
export function getCachedData() {
    if (cache) return cache;
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) cache = JSON.parse(raw);
    } catch (e) { /* localStorage no disponible o corrupto, se ignora */ }
    return cache;
}

// Trae los datos compartidos entre todas las vistas. Si ya hay una request
// en curso, todos los llamadores esperan esa misma promesa en vez de disparar
// otra al Apps Script (que es lo que hacía lenta la sincronización).
export async function loadData({ force = false } = {}) {
    if (!force && cache) return cache;
    if (inflight) return inflight;

    inflight = fetchData()
        .then(data => {
            cache = data;
            try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch (e) { /* storage lleno o bloqueado */ }
            return data;
        })
        .finally(() => { inflight = null; });

    return inflight;
}
