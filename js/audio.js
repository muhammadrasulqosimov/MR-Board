
import { Store } from './store.js';
import { Events } from './events.js';
import { showToast } from './utils.js';

let audioStream = null;

export const AudioSystem = {
    async init() {
        try {
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
            if (Store.perms.speak) Store.micActive = true;
            this.sync();
            this.visualizer();
            Events.emit('mic');
        } catch (e) { showToast("Mikrofon topilmadi", "warning"); }
    },
    visualizer() {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = ctx.createAnalyser();
        ctx.createMediaStreamSource(audioStream).connect(analyser);
        analyser.fftSize = 128;
        const data = new Uint8Array(analyser.frequencyBinCount);
        const draw = () => {
            requestAnimationFrame(draw);
            const bars = document.querySelectorAll('.viz-bar');
            if (!(Store.perms.speak && Store.micActive)) {
                bars.forEach(b => b.style.height = '4px');
                return;
            }
            analyser.getByteFrequencyData(data);
            let sum = 0;
            for (let i = 0; i < data.length; i++) sum += data[i];
            const avg = sum / data.length;
            const h = Math.min(20, 4 + (avg / 128) * 16);
            bars.forEach((b, i) => {
                b.style.height = `${Math.max(4, h * Math.sin((i / 6) * Math.PI))}px`;
            });
        };
        draw();
    },
    sync() { if (audioStream) audioStream.getAudioTracks()[0].enabled = Store.perms.speak && Store.micActive; },
    async toggle() {
        if (!Store.perms.speak) { showToast("Mikrofon ruxsati yo'q", "error"); return; }
        if (!audioStream) await this.init();
        Store.micActive = !Store.micActive;
        this.sync();
        Events.emit('mic');
        const { Utils } = await import('./utils.js');
        Utils.vibrate(10);
    }
};
