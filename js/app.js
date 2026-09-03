import { renderCarga } from './views/Carga.js';
import { renderDashboard, loadDashboardData } from './views/Dashboard.js'; 
import { renderHistorial, loadHistorialData } from './views/Historial.js';
import { fetchData } from './api.js';
import { setCategorias } from './config.js';

Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = '#94a3b8';
Chart.defaults.scale.grid.color = '#f1f5f9';

document.addEventListener('DOMContentLoaded', async () => {
    
    try {
        const data = await fetchData();
        if(data.categorias) setCategorias(data.categorias);
        document.getElementById('initial-loader').classList.add('hidden');
    } catch (e) {
        document.getElementById('initial-loader').innerHTML = '<p class="text-rose-600 font-bold px-4 text-center">Error de conexión.</p>';
        return;
    }

    renderCarga();
    renderDashboard();
    renderHistorial();
    
    // --- NAVEGACIÓN Y SWIPE ESTILO GLASS ---
    const navButtons = document.querySelectorAll('.nav-btn');
    
    // El orden lineal lógico de las pantallas para el deslizamiento
    const screens = [
        { tab: 'view-home', type: 'gasto' },
        { tab: 'view-home', type: 'ingreso' },
        { tab: 'view-home', type: 'ahorro' },
        { tab: 'view-dash' },
        { tab: 'view-history' }
    ];

    const changeTab = (targetId, animationClass = 'slide-next') => {
        navButtons.forEach(b => {
            b.classList.remove('active', 'text-indigo-600');
            b.classList.add('text-slate-400');
        });
        const btn = document.querySelector(`.nav-btn[data-tab="${targetId}"]`);
        if(btn) {
            btn.classList.add('active', 'text-indigo-600');
            btn.classList.remove('text-slate-400');
        }
        
        document.querySelectorAll('.tab-content').forEach(view => {
            view.classList.remove('active', 'slide-next', 'slide-prev');
        });
        
        const activeView = document.getElementById(targetId);
        activeView.classList.add('active', animationClass);

        if (targetId === 'view-dash') loadDashboardData(false);
        if (targetId === 'view-history') loadHistorialData();
    };

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => changeTab(btn.getAttribute('data-tab')));
    });

    // Lógica táctil (Deslizar el dedo)
    let touchstartX = 0, touchendX = 0;
    
    document.getElementById('scroll-area').addEventListener('touchstart', e => {
        touchstartX = e.changedTouches[0].screenX;
    }, {passive: true});

    document.getElementById('scroll-area').addEventListener('touchend', e => {
        touchendX = e.changedTouches[0].screenX;
        const swipeDist = touchstartX - touchendX;
        
        if (Math.abs(swipeDist) > 50) {
            const direction = swipeDist > 0 ? 'next' : 'prev';
            const activeTab = document.querySelector('.tab-content.active').id;
            let activeType = document.getElementById('tipoRegistro')?.value;

            let currentIndex = screens.findIndex(s => s.tab === activeTab && (s.tab !== 'view-home' || s.type === activeType));
            if (currentIndex === -1) currentIndex = 0;

            let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
            
            if (newIndex >= 0 && newIndex < screens.length) {
                const nextScreen = screens[newIndex];
                
                if (nextScreen.tab === 'view-home') {
                    if (activeTab !== 'view-home') changeTab('view-home', direction === 'next' ? 'slide-next' : 'slide-prev');
                    document.getElementById(`btn-tipo-${nextScreen.type}`).click();
                    
                    // Aplicar animación al form
                    const formArea = document.getElementById('mainForm');
                    formArea.classList.remove('slide-next', 'slide-prev');
                    void formArea.offsetWidth;
                    formArea.classList.add(direction === 'next' ? 'slide-next' : 'slide-prev');
                } else {
                    changeTab(nextScreen.tab, direction === 'next' ? 'slide-next' : 'slide-prev');
                }
            }
        }
    }, {passive: true});
});