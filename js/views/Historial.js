import { loadData } from '../store.js';
import { currencyFormatter } from '../utils.js';

export function renderHistorial() {
    const container = document.getElementById('view-history');
    container.innerHTML = `
        <div class="flex justify-between items-center mb-5">
            <h2 class="text-sm font-semibold text-slate-100 tracking-tight">Últimos Movimientos</h2>
            <button id="btn-update-history" class="glass-pill text-slate-300 hover:text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 active:scale-95 transition-all">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                Actualizar
            </button>
        </div>
        <div id="historyList" class="space-y-2.5 pb-10">
            <div class="glass-card animate-pulse flex space-x-4 p-4 rounded-xl">
                <div class="rounded-full bg-white/10 h-10 w-10"></div>
                <div class="flex-1 space-y-3 py-1">
                    <div class="h-2 bg-white/10 rounded w-3/4"></div>
                    <div class="h-2 bg-white/10 rounded w-1/2"></div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('btn-update-history').addEventListener('click', () => loadHistorialData(true));
}

export async function loadHistorialData(forceRefresh = false) {
    const listEl = document.getElementById('historyList');

    try {
        const data = await loadData({ force: forceRefresh });
        const allMoves = [
            ...data.ingresos.map(i => ({...i, _tipo: 'ingreso', _fecha: new Date(i.Fecha)})),
            ...data.gastos.map(g => ({...g, _tipo: 'gasto', _fecha: new Date(g.Fecha)})),
            ...data.ahorros.map(a => ({...a, _tipo: 'ahorro', _fecha: new Date(a.Fecha)}))
        ].sort((a, b) => b._fecha - a._fecha).slice(0, 15);

        if(allMoves.length === 0) {
            listEl.innerHTML = `<div class="glass-card text-center text-slate-400 py-10 rounded-xl text-sm">No hay registros cargados aún.</div>`;
            return;
        }
        
        listEl.innerHTML = allMoves.map(m => {
            let isIngreso = m._tipo === 'ingreso';
            let isGasto = m._tipo === 'gasto';
            
            let iconSvg = isIngreso ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>' : 
                          isGasto ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>' : 
                          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>';
            
            let bgIconColor = isIngreso ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : isGasto ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-sky-500/10 text-sky-400 border border-sky-500/20';

            let title = isIngreso ? m['Categoría'] : isGasto ? m['Categoría Principal'] : m['Ticker/Nombre'];
            let subtitle = isIngreso ? m['Mes de Referencia'] : isGasto ? m['Subcategoría'] : m['Tipo de Activo'];
            let monto = m._tipo === 'ahorro' ? m['Total Invertido'] : m.Monto;
            
            const formatter = currencyFormatter(m['Moneda'] || 'ARS');
            const finalMonto = formatter.format(parseFloat(monto || 0));
            
            return `
            <div class="glass-card p-3.5 rounded-xl flex justify-between items-center transition-all">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg flex items-center justify-center ${bgIconColor}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">${iconSvg}</svg>
                    </div>
                    <div>
                        <p class="font-semibold text-xs text-slate-100">${title}</p>
                        <p class="text-[10px] text-slate-400 font-medium">${subtitle} • ${m._fecha.toLocaleDateString()}</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="font-bold text-sm tracking-tight ${isIngreso ? 'text-emerald-400' : 'text-slate-100'}">
                        ${finalMonto}
                    </span>
                    ${m['Moneda'] === 'USD' ? '<div class="mt-0.5"><span class="px-1 py-0.2 text-[8px] font-bold text-slate-300 bg-white/10 rounded uppercase tracking-wider">USD</span></div>':''}
                </div>
            </div>`;
        }).join('');
    } catch (err) {
        console.error("Error cargando historial:", err);
        listEl.innerHTML = `<div class="text-center text-rose-300 py-6 bg-rose-500/10 rounded-xl text-sm font-medium border border-rose-400/20">Error: Configurá la URL de Apps Script.</div>`;
    }
}