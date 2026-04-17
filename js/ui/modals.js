// js/private/ui/modals.js

export function initCustomModal() {
    if (document.getElementById('custom-modal-overlay')) return;
    const modalHTML = `
        <div id="custom-modal-overlay" class="fixed inset-0 bg-black/80 z-[100] hidden flex items-center justify-center p-4 transition-opacity duration-300 opacity-0">
            <div class="parchment-box border-2 border-[var(--gold)] p-8 rounded-lg shadow-2xl max-w-md w-full transform transition-transform duration-300 scale-95" id="custom-modal-box">
                <h3 class="text-3xl font-bold text-[var(--gryffindor-red)] magic-font mb-4 flex items-center gap-3">
                    <i id="custom-modal-icon" class="fas fa-question-circle text-[var(--gold)]"></i> 
                    <span id="custom-modal-title">Atención</span>
                </h3>
                <p id="custom-modal-message" class="text-stone-800 text-lg mb-8 font-medium"></p>
                <div class="flex justify-end gap-4 mt-6 pt-4 border-t border-[var(--gold)]/30" id="custom-modal-buttons"></div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

export function showModal(type, title, message, icon) {
    return new Promise((resolve) => {
        initCustomModal();
        const overlay = document.getElementById('custom-modal-overlay');
        const box = document.getElementById('custom-modal-box');
        
        document.getElementById('custom-modal-title').textContent = title;
        document.getElementById('custom-modal-message').innerHTML = message;
        document.getElementById('custom-modal-icon').className = `fas ${icon} text-[var(--gold)]`;

        const close = (result) => {
            overlay.classList.remove('opacity-100');
            box.classList.remove('scale-100');
            setTimeout(() => {
                overlay.classList.add('hidden');
                resolve(result);
            }, 300); // Espera a que termine la transición CSS
        };

        const buttonsEl = document.getElementById('custom-modal-buttons');
        if (type === 'confirm') {
            buttonsEl.innerHTML = `
                <button id="modal-btn-cancel" class="px-5 py-2 bg-[#1a100d] text-[var(--gold)] border border-[var(--gold)] rounded font-bold hover:bg-black transition">Cancelar</button>
                <button id="modal-btn-confirm" class="px-5 py-2 bg-[var(--gryffindor-red)] text-white border border-[var(--gold)] rounded font-bold hover:bg-red-900 transition shadow-md">Confirmar</button>
            `;
            document.getElementById('modal-btn-cancel').onclick = () => close(false);
            document.getElementById('modal-btn-confirm').onclick = () => close(true);
        } else {
            buttonsEl.innerHTML = `
                <button id="modal-btn-ok" class="px-5 py-2 bg-[var(--gryffindor-red)] text-white border border-[var(--gold)] rounded font-bold hover:bg-red-900 transition shadow-md">Aceptar</button>
            `;
            document.getElementById('modal-btn-ok').onclick = () => close(true);
        }

        overlay.classList.remove('hidden');
        setTimeout(() => {
            overlay.classList.add('opacity-100');
            box.classList.add('scale-100');
        }, 10);
    });
}

export const customConfirm = (title, message, icon = 'fa-question-circle') => showModal('confirm', title, message, icon);
export const customAlert = (title, message, icon = 'fa-exclamation-triangle') => showModal('alert', title, message, icon);