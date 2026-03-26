import { DB } from './firebase.js';
import { AudioSystem } from './audio.js';
import { setTool } from './tools.js';
import { showToast } from './utils.js';

export function initShortcuts(uiInstance) {
    window.addEventListener('keydown', e => {
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
        const k = e.key.toLowerCase();
        if (e.ctrlKey && k === 'z') { e.preventDefault(); DB.undo(); }
        else if (k === 'b') setTool('draw');
        else if (k === 'e') setTool('erase');
        else if (k === 'h') setTool('pan');
        else if (k === 't') setTool('text');
        else if (k === 'l') setTool('laser');
        else if (k === 's') uiInstance.openDrawer('drawer-shapes');
        else if (k === 'm') AudioSystem.toggle();
        else if (k === 'c') uiInstance.openDrawer('drawer-chat');
        else if (k === 'u') uiInstance.openDrawer('drawer-users');
        else if (k === 'f') uiInstance.toggleFullscreen();
    });
}
