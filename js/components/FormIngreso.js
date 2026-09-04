import { getCategorias, meses } from '../config.js';

export function getFormIngresoHTML() {
    const catIngresos = getCategorias().ingresos;
    return `
        <div class="mb-3">
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mes de Referencia</label>
            <select id="mesRef" required class="glass-input glass-select block w-full rounded-xl border py-2 px-3 font-medium text-sm outline-none">
                ${meses.map(m => `<option value="${m}">${m}</option>`).join('')}
            </select>
        </div>
        <div class="mb-3">
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Categoría</label>
            <select id="catIngreso" required class="glass-input glass-select block w-full rounded-xl border py-2 px-3 font-medium text-sm outline-none">
                ${catIngresos.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
            </select>
        </div>
    `;
}

export function initFormIngreso() {
    const mesRef = document.getElementById('mesRef');
    if(mesRef) mesRef.selectedIndex = new Date().getMonth();
}