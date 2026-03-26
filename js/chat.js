import { Store } from './store.js';
import { DB } from './firebase.js';
import { Utils, showToast } from './utils.js';
import { Events } from './events.js';

export function initChat(uiInstance) {
    // The chat event handler is already in firebase, but we need to update UI when new message arrives
    // This is handled in UIController's events. We'll keep that part there.
    // However, the sendChat function is part of DB, but we need to bind it to UI.
    // We'll just export sendChat if needed, but it's already in DB.
    // The chat UI update is in UIController's events.
}

export function sendChatMessage() {
    const msg = Utils.sanitize(document.getElementById('inp-chat-text').value.trim());
    if (msg) { DB.sendChat(msg); document.getElementById('inp-chat-text').value = ''; }
}
