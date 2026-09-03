import { renderCarga } from './views/Carga.js';
import { renderDashboard, loadDashboardData } from './views/Dashboard.js'; 
import { renderHistorial, loadHistorialData } from './views/Historial.js';
import { fetchData } from './api.js';
import { setCategorias } from './config.js';

Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = '#94a3b8';
Chart.defaults.scale.grid.color = '#f1f5f9';

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. OBTENER CATEGORÍAS DESDE GOOGLE SHEETS PRIMERO
    try {
        const data = await fetchData();
        if(data.categorias) setCategorias(data.categorias);
        
        // Ocultar pantalla de carga
        document.getElementById('initial-loader').classList.add('hidden');
    } catch (e) {
        document.getElementById('initial-loader').innerHTML = '<p class="text-rose-600 font-bold px-4 text-center">Error de conexión. Revisá la URL de Apps Script.</p>';
        return;
    }

    // 2. Inyectar HTML ahora que tenemos las categorías reales
    renderCarga();
    renderDashboard();
    renderHistorial();
    
    // 3. Configurar navegación
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab');
            
            navButtons.forEach(b => {
                b.classList.remove('active', 'text-indigo-600');
                b.classList.add('text-slate-400');
            });
            btn.classList.add('active', 'text-indigo-600');
            btn.classList.remove('text-slate-400');
            
            document.querySelectorAll('.tab-content').forEach(view => view.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');

            if (targetId === 'view-dash') loadDashboardData();
            if (targetId === 'view-history') loadHistorialData();
        });
    });
});