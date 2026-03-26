import { Store } from './store.js';
import { Events } from './events.js';
import { showToast } from './utils.js';

let audioStream = null;
let audioCtx = null; // Kontekstni global saqlaymiz

export const AudioSystem = {
    async init() {
        try {
            // Samsung va boshqa brauzerlar uchun ruxsat so'rash
            audioStream = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                    echoCancellation: true, 
                    noiseSuppression: true,
                    autoGainControl: true 
                } 
            });

            if (Store.perms.speak) Store.micActive = true;
            
            this.sync();
            this.visualizer();
            Events.emit('mic');
        } catch (e) { 
            console.error("Audio Init Error:", e);
            showToast("Mikrofon topilmadi yoki ruxsat berilmadi", "warning"); 
        }
    },

    visualizer() {
        // AudioContext faqat bir marta yaratilishi kerak
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(audioStream);
        source.connect(analyser);
        
        analyser.fftSize = 128;
        const data = new Uint8Array(analyser.frequencyBinCount);

        const draw = () => {
            requestAnimationFrame(draw);
            const bars = document.querySelectorAll('.viz-bar');
            
            // Agar mikrofon o'chiq bo'lsa yoki ruxsat bo'lmasa, barlarni pasaytiramiz
            if (!(Store.perms.speak && Store.micActive)) {
                bars.forEach(b => b.style.height = '4px');
                return;
            }

            // Samsungda kontekst "suspended" bo'lib qolgan bo'lsa, uni uyg'otamiz
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            analyser.getByteFrequencyData(data);
            let sum = 0;
            for (let i = 0; i < data.length; i++) sum += data[i];
            const avg = sum / data.length;
            
            // Ovoz balandligiga qarab barlarni chiqarish
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
            showToast("Mikrofon ruxsati yo'q", "error"); 
            return; 
        }

        // Samsung muammosini hal qilish uchun har safar toggleda resume qilamiz
        if (audioCtx && audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }

        Store.micActive = !Store.micActive;
        this.sync();
        Events.emit('mic');
        
        // Tebranish effekti (Samsung va Android qurilmalar uchun)
        if (navigator.vibrate) navigator.vibrate(20);
    }
};
