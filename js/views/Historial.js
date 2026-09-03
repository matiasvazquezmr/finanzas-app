import { fetchData } from '../api.js';
import { currencyFormatter } from '../Utils.js';

export function renderHistorial() {
    const container = document.getElementById('view-history');
    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-lg font-bold text-slate-800 tracking-tight">Últimos 15 Movimientos</h2>
            <button id="btn-update-history" class="bg-white border border-slate-200 text-indigo-600 shadow-sm text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 active:scale-95 transition-all hover:bg-slate-50">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                Actualizar
            </button>
        </div>
        <div id="historyList" class="space-y-3 pb-10">
            <div class="animate-pulse flex space-x-4 p-4 border border-slate-100 rounded-xl bg-white">
                <div class="rounded-full bg-slate-200 h-10 w-10"></div>
                <div class="flex-1 space-y-3 py-1">
                    <div class="h-2 bg-slate-200 rounded w-3/4"></div>
                    <div class="h-2 bg-slate-200 rounded w-1/2"></div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('btn-update-history').addEventListener('click', loadHistorialData);
}

export async function loadHistorialData() {
    const listEl = document.getElementById('historyList');
    
    try {
        const data = await fetchData();
        const allMoves = [
            ...data.ingresos.map(i => ({...i, _tipo: 'ingreso', _fecha: new Date(i.Fecha)})),
            ...data.gastos.map(g => ({...g, _tipo: 'gasto', _fecha: new Date(g.Fecha)})),
            ...data.ahorros.map(a => ({...a, _tipo: 'ahorro', _fecha: new Date(a.Fecha)}))
        ].sort((a, b) => b._fecha - a._fecha).slice(0, 15);

        if(allMoves.length === 0) {
            listEl.innerHTML = `<div class="text-center text-slate-400 py-10 bg-white rounded-2xl border border-slate-100 shadow-sm text-sm">No hay registros cargados aún.</div>`;
            return;
        }
        
        listEl.innerHTML = allMoves.map(m => {
            let isIngreso = m._tipo === 'ingreso';
            let isGasto = m._tipo === 'gasto';
            
            let iconSvg = isIngreso ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>' : 
                          isGasto ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>' : 
                          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>';
            
            let bgIconColor = isIngreso ? 'bg-emerald-100 text-emerald-600' : isGasto ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600';

            let title = isIngreso ? m['Categoría'] : isGasto ? m['Categoría Principal'] : m['Ticker/Nombre'];
            let subtitle = isIngreso ? m['Mes de Referencia'] : isGasto ? m['Subcategoría'] : m['Tipo de Activo'];
            let monto = m._tipo === 'ahorro' ? m['Total Invertido'] : m.Monto;
            
            const formatter = currencyFormatter(m['Moneda'] || 'ARS');
            const finalMonto = formatter.format(parseFloat(monto || 0));
            
            return `
            <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center transition-all">
                <div class="flex items-center gap-3.5">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center ${bgIconColor}">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">${iconSvg}</svg>
                    </div>
                    <div>
                        <p class="font-bold text-sm text-slate-800">${title}</p>
                        <p class="text-[11px] text-slate-400 font-medium">${subtitle} • ${m._fecha.toLocaleDateString()}</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="font-extrabold text-base tracking-tight ${isIngreso ? 'text-emerald-600' : 'text-slate-800'}">
                        ${finalMonto}
                    </span>
                    ${m['Moneda'] === 'USD' ? '<p class="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">USD</p>':''}
                </div>
            </div>`;
        }).join('');
    } catch (err) {
        console.error("Error cargando historial:", err);
        listEl.innerHTML = `<div class="text-center text-rose-500 py-6 bg-rose-50 rounded-xl text-sm font-medium border border-rose-100">Error: Configurá la URL de Apps Script.</div>`;
    }
}