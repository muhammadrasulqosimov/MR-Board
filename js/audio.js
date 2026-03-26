import { Store } from './store.js';
import { Events } from './events.js';
import { showToast } from './utils.js';
import { RTC } from './rtc.js'; // RTC modulini ulaymiz

let audioStream = null;
let audioCtx = null;

export const AudioSystem = {
    async init() {
        try {
            // Samsung va mobil brauzerlar uchun maxsus parametrlar
            audioStream = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                    echoCancellation: true, 
                    noiseSuppression: true,
                    autoGainControl: true 
                } 
            });

            // PeerJS ni ishga tushiramiz
            RTC.init(Store.uid);

            if (Store.perms.speak) Store.micActive = true;
            
            this.sync();
            this.visualizer();
            Events.emit('mic');
        } catch (e) { 
            console.error("Mikrofon xatosi:", e);
            showToast("Mikrofonni ulab bo'lmadi", "warning"); 
        }
    },

    visualizer() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(audioStream);
        source.connect(analyser);
        analyser.fftSize = 128;
        const data = new Uint8Array(analyser.frequencyBinCount);

        const draw = () => {
            requestAnimationFrame(draw);
            const bars = document.querySelectorAll('.viz-bar');
            
            if (!(Store.perms.speak && Store.micActive)) {
                bars.forEach(b => b.style.height = '4px');
                return;
            }

            // Samsung AudioContext Resume
            if (audioCtx.state === 'suspended') audioCtx.resume();

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

    sync() { 
        if (audioStream) {
            audioStream.getAudioTracks()[0].enabled = Store.perms.speak && Store.micActive;
        }
    },

    async toggle() {
        if (!Store.perms.speak) { 
            showToast("Sizga ruxsat berilmagan", "error"); 
            return; 
        }

        // Samsungda click orqali AudioContextni uyg'otish shart
        if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume();

        Store.micActive = !Store.micActive;
        this.sync();

        // Agar mikrofon yoqilsa, ovozni tarqatishni boshlaymiz
        if (Store.micActive) {
            RTC.broadcastStream(audioStream);
            showToast("Mikrofon yoqildi", "success");
        }

        Events.emit('mic');
        if (navigator.vibrate) navigator.vibrate(20);
    }
};
