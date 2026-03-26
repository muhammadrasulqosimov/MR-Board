import { Store } from './store.js';
import { Events } from './events.js';
import { DB } from './firebase.js';
import { GraphicsEngine } from './graphics.js';
import { AudioSystem } from './audio.js';
import { setTool } from './tools.js';
import { toggleMinimap } from './minimap.js';
import { initTheme, setTheme } from './theme.js';
import { initColorWheel } from './color-wheel.js';
import { initSettings } from './settings.js';
import { initShapes } from './shapes.js';
import { initShortcuts } from './shortcuts.js';
import { createRoom, joinRoom } from './auth.js';
import { updateUsersList } from './users.js';
import { sendChatMessage } from './chat.js';
import { Utils, showToast } from './utils.js';

export class UIController {
    constructor() {
        this.engine = null;
        this.initEvents();
        initTheme();
        initShortcuts(this);
    }

    initEvents() {
        document.getElementById('btn-create-room').onclick = () => createRoom(this);
        document.getElementById('btn-join-room').onclick = () => joinRoom(this);
        document.getElementById('btn-action-exit').onclick = () => { if (confirm("Chiqish?")) location.reload(); };
        document.getElementById('btn-action-undo').onclick = () => DB.undo();
        document.getElementById('btn-action-mic').onclick = () => AudioSystem.toggle();
        document.getElementById('btn-action-fullscreen').onclick = () => this.toggleFullscreen();
        document.getElementById('btn-exit-zen').onclick = () => this.toggleFullscreen();
        document.getElementById('btn-open-settings').onclick = () => this.openDrawer('drawer-settings');
        document.getElementById('btn-open-colors').onclick = () => this.openDrawer('drawer-colors');
        document.getElementById('btn-open-chat').onclick = () => this.openDrawer('drawer-chat');
        document.getElementById('btn-open-users').onclick = () => this.openDrawer('drawer-users');
        document.getElementById('btn-toggle-shapes').onclick = () => this.openDrawer('drawer-shapes');
        document.getElementById('btn-submit-chat').onclick = () => sendChatMessage();
        document.getElementById('inp-chat-text').onkeypress = e => { if (e.key === 'Enter') sendChatMessage(); };
        document.getElementById('btn-cancel-text').onclick = () => this.closeTextModal();
        document.getElementById('btn-add-text').onclick = () => this.addText();

        // Theme buttons
        document.getElementById('act-theme-light').onclick = () => { setTheme('light'); this.closeDrawers(); };
        document.getElementById('act-theme-dark').onclick = () => { setTheme('dark'); this.closeDrawers(); };
        document.getElementById('act-theme-auto').onclick = () => { setTheme('auto'); this.closeDrawers(); };

        // Tool size
        document.getElementById('inp-tool-size').oninput = e => { Store.size = parseInt(e.target.value); document.getElementById('val-tool-size').innerText = Store.size + 'px'; };

        // Tool buttons
        document.querySelectorAll('[data-tool]').forEach(btn => {
            btn.onclick = () => { setTool(btn.dataset.tool); this.closeDrawers(); };
        });

        // Close drawers
        document.querySelectorAll('[data-close]').forEach(btn => btn.onclick = () => this.closeDrawers());
        document.getElementById('drawer-backdrop').onclick = () => this.closeDrawers();

        // Initialize settings handlers
        initSettings(this);
        // Initialize color wheel after DOM ready
        setTimeout(() => initColorWheel(this), 100);
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            document.body.classList.add('zen-mode');
        } else {
            document.exitFullscreen();
            document.body.classList.remove('zen-mode');
        }
    }

    toggleMinimap() {
        toggleMinimap();
    }

    setTool(tool) {
        setTool(tool);
    }

    openDrawer(id) {
        this.closeDrawers();
        document.getElementById(id).classList.add('is-open');
        document.getElementById('drawer-backdrop').classList.add('is-visible');
        if (id === 'drawer-chat') {
            Store.unread = 0;
            document.getElementById('badge-chat-count').style.display = 'none';
            setTimeout(() => document.getElementById('inp-chat-text').focus(), 100);
        }
    }

    closeDrawers() {
        document.querySelectorAll('.drawer').forEach(d => d.classList.remove('is-open'));
        document.getElementById('drawer-backdrop').classList.remove('is-visible');
        this.closeTextModal();
    }

    closeTextModal() {
        document.getElementById('modal-text-input').classList.remove('is-visible');
        document.getElementById('inp-text-area').value = '';
        Store.textPos = null;
    }

    addText() {
        const txt = Utils.sanitize(document.getElementById('inp-text-area').value.trim()).substring(0, 300);
        if (txt && Store.textPos) {
            DB.addElement({ type: 'text', text: txt, x: Store.textPos.x, y: Store.textPos.y, s: Math.min(Store.size * 3 + 16, 48), c: Store.color });
        }
        this.closeTextModal();
    }

    startApp(roomId, teacherSecret) {
        Utils.vibrate([15, 50, 15]);
        document.getElementById('auth-gateway').style.display = 'none';
        document.getElementById('ui-overlay').style.display = 'block';
        document.getElementById('ui-room-code').innerText = roomId;

        if (Store.isTeacher) {
            document.getElementById('panel-host-controls').style.display = 'block';
            document.getElementById('ui-participants-list').classList.add('host-active');
            document.getElementById('ui-user-role').innerHTML = '<i data-lucide="crown"></i> O\'qituvchi';
        }

        DB.init(roomId, teacherSecret);
        this.engine = new GraphicsEngine();
        this.engine.init();
        this.engine.bindEvents();
        AudioSystem.init();

        Events.on('zoom', () => {
            document.getElementById('ui-zoom-level').innerText = Math.round(Store.cam.z * 100) + '%';
        });

        Events.on('role', () => {
            if (!Store.isTeacher) {
                if (Store.perms.draw) document.getElementById('ui-user-role').innerHTML = '<i data-lucide="pencil"></i> Yozuvchi';
                else document.getElementById('ui-user-role').innerHTML = '<i data-lucide="eye"></i> Kuzatuvchi';
                window.lucide.createIcons();
            }
        });

        Events.on('mic', () => {
            const btn = document.getElementById('btn-action-mic');
            btn.className = `action-btn ${!Store.perms.speak ? 'mic-off' : (Store.micActive ? 'mic-on' : 'mic-off')}`;
            btn.innerHTML = `<i data-lucide="${Store.micActive && Store.perms.speak ? 'mic' : 'mic-off'}"></i>`;
            window.lucide.createIcons();
        });

        Events.on('chat', (msg) => {
            const container = document.getElementById('ui-chat-messages');
            const isMine = msg.u === Store.uid;
            const bubble = document.createElement('div');
            bubble.className = `msg-bubble ${isMine ? 'mine' : 'other'}`;
            bubble.innerHTML = `
                <div class="msg-info">
                    ${Utils.sanitize(msg.n)}
                    ${msg.t ? '<i data-lucide="crown" size="12" style="color:var(--state-warning)"></i>' : ''}
                </div>
                <div>${Utils.sanitize(msg.m)}</div>
                <div class="msg-time">${msg.tm}</div>
            `;
            container.appendChild(bubble);
            container.scrollTop = container.scrollHeight;
            window.lucide.createIcons();

            if (!isMine && !document.getElementById('drawer-chat').classList.contains('is-open')) {
                Store.unread++;
                const badge = document.getElementById('badge-chat-count');
                badge.innerText = Store.unread > 9 ? '9+' : Store.unread;
                badge.style.display = 'flex';
                Utils.vibrate([10, 30, 10]);
            }
        });

        Events.on('users', () => {
            updateUsersList();
        });

        Events.emit('zoom');
        window.lucide.createIcons();
    }
}
