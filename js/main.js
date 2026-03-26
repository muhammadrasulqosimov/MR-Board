import { Store } from './store.js';
import { UIController } from './ui.js';
import { Utils } from './utils.js';

// Initialize UI controller
const ui = new UIController();

// Handle URL hash
const hash = window.location.hash.slice(1);
if (hash.startsWith('t-')) {
    const teacherSecret = hash.slice(2);
    const name = prompt("O'qituvchi ismingiz:") || "Teacher";
    if (name) {
        Store.name = Utils.sanitize(name);
        Store.isTeacher = true;
        Store.teacherSecret = teacherSecret;
        Store.roomId = teacherSecret.substring(0, 6);
        Store.perms.draw = true;
        Store.perms.speak = true;
        ui.startApp(Store.roomId, teacherSecret);

        const baseUrl = window.location.href.split('#')[0];
        setTimeout(() => {
            document.getElementById('teacher-link-text').innerText = `${baseUrl}#t-${teacherSecret}`;
            document.getElementById('student-link-text').innerText = `${baseUrl}#s-${Store.roomId}`;
            document.getElementById('teacher-link-box').style.display = 'flex';
            document.getElementById('student-link-box').style.display = 'flex';
        }, 500);
    }
} else if (hash.startsWith('s-')) {
    const studentCode = hash.slice(2);
    const name = prompt("Ismingiz:") || "Student";
    if (name) {
        Store.name = Utils.sanitize(name);
        Store.isTeacher = false;
        Store.roomId = studentCode;
        Store.perms.draw = false;
        Store.perms.speak = false;
        ui.startApp(studentCode, null);
    }
}
