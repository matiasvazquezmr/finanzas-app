import { getCategorias, meses } from '../config.js';

export function getFormIngresoHTML() {
    const catIngresos = getCategorias().ingresos;
    return `
        <div class="mb-3">
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mes de Referencia</label>
            <select id="mesRef" required class="block w-full rounded-xl border border-slate-200 shadow-sm py-2 px-3 bg-white focus:ring-indigo-500 font-medium text-slate-700 text-sm outline-none">
                ${meses.map(m => `<option value="${m}">${m}</option>`).join('')}
            </select>
        </div>
        <div class="mb-3">
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Categoría</label>
            <select id="catIngreso" required class="block w-full rounded-xl border border-slate-200 shadow-sm py-2 px-3 bg-white focus:ring-indigo-500 font-medium text-slate-700 text-sm outline-none">
                ${catIngresos.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
            </select>
        </div>
    `;
}

export function initFormIngreso() {
    const mesRef = document.getElementById('mesRef');
    if(mesRef) mesRef.selectedIndex = new Date().getMonth();
}