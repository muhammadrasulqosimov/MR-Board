import { Store } from './store.js';
import { Events } from './events.js';
import { showToast } from './utils.js';

let audioStream = null;

export const AudioSystem = {
    // Mikrofonni ishga tushirish
    async init() {
        try {
            // Chrome va boshqa brauzerlarda mikrofon so'rash
            audioStream = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                    echoCancellation: true, 
                    noiseSuppression: true 
                } 
            });

            if (Store.perms.speak) {
                Store.micActive = true;
            }

            this.sync();
            this.visualizer();
            Events.emit('mic');
        } catch (e) { 
            console.error("Mikrofon xatosi:", e);
            showToast("Mikrofon topilmadi yoki ruxsat berilmadi", "warning"); 
        }
    },

    // Ovozli vizualizatsiya (o'sha barlar harakati)
    visualizer() {
        if (!audioStream) return;

        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = ctx.createAnalyser();
        const source = ctx.createMediaStreamSource(audioStream);
        source.connect(analyser);

        analyser.fftSize = 128;
        const data = new Uint8Array(analyser.frequencyBinCount);

        const draw = () => {
            // MUHIM: Brauzer ovozni bloklab qo'ygan bo'lsa, uni uyg'otamiz
            if (ctx.state === 'suspended' && Store.micActive) {
                ctx.resume();
            }

            requestAnimationFrame(draw);
            const bars = document.querySelectorAll('.viz-bar');

            // Agar mikrofon o'chiq bo'lsa, barlarni pastga tushirib qo'yamiz
            if (!(Store.perms.speak && Store.micActive)) {
                bars.forEach(b => b.style.height = '4px');
                return;
            }

            analyser.getByteFrequencyData(data);
            let sum = 0;
            for (let i = 0; i < data.length; i++) {
                sum += data[i];
            }
            
            const avg = sum / data.length;
            const h = Math.min(20, 4 + (avg / 128) * 16);

            bars.forEach((b, i) => {
                // To'lqin ko'rinishida harakatlantirish
                b.style.height = `${Math.max(4, h * Math.sin((i / 6) * Math.PI))}px`;
            });
        };

        draw();
    },

    // Mikrofon trekini yoqish yoki o'chirish
    sync() { 
        if (audioStream && audioStream.getAudioTracks().length > 0) {
            audioStream.getAudioTracks()[0].enabled = Store.perms.speak && Store.micActive; 
        }
    },

    // Mikrofon tugmasi bosilganda
    async toggle() {
        if (!Store.perms.speak) { 
            showToast("Mikrofon ruxsati yo'q", "error"); 
            return; 
        }

        if (!audioStream) {
            await this.init();
        } else {
            Store.micActive = !Store.micActive;
            this.sync();
            Events.emit('mic');
        }

        // Tebranish effekti (mobil qurilmalar uchun)
        try {
            const { Utils } = await import('./utils.js');
            if (Utils && Utils.vibrate) Utils.vibrate(10);
        } catch (e) {
            // Vibrate ishlamasa xato bermasligi uchun
        }
    }
};
