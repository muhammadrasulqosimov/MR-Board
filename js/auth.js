import { Store } from './store.js';
import { Utils, showToast } from './utils.js';
import { UIController } from './ui.js';

export async function createRoom(uiInstance) {
    const name = Utils.sanitize(document.getElementById('auth-name-inp').value.trim());
    if (!name) { showToast("Ism kiriting", "error"); return; }

    const teacherCode = Utils.generateTeacherCode();
    const studentCode = Utils.generateStudentCode();
    const baseUrl = window.location.href.split('#')[0];
    const teacherLink = `${baseUrl}#t-${teacherCode}`;
    const studentLink = `${baseUrl}#s-${studentCode}`;

    Store.name = name;
    Store.isTeacher = true;
    Store.teacherSecret = teacherCode;
    Store.roomId = studentCode;
    Store.perms.draw = true;
    Store.perms.speak = true;

    uiInstance.startApp(studentCode, teacherCode);

    setTimeout(() => {
        document.getElementById('teacher-link-text').innerText = teacherLink;
        document.getElementById('student-link-text').innerText = studentLink;
        document.getElementById('teacher-link-box').style.display = 'flex';
        document.getElementById('student-link-box').style.display = 'flex';
        showToast(`O'qituvchi link yaratildi`, "success");
    }, 500);
}

export async function joinRoom(uiInstance) {
    const name = Utils.sanitize(document.getElementById('auth-name-inp').value.trim());
    const code = document.getElementById('auth-room-inp').value.trim().toUpperCase();
    if (!name) { showToast("Ism kiriting", "error"); return; }
    if (!code) { showToast("Xona kodini kiriting", "error"); return; }

    Store.name = name;
    Store.isTeacher = false;
    Store.roomId = code;
    Store.perms.draw = false;
    Store.perms.speak = false;

    uiInstance.startApp(code, null);
}
