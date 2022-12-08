// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import { getDatabase, ref, child, get, set, onValue, update, remove, onChildChanged, query } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-database.js";
let db, app, listLength;
fetch("./config.json")
    .then((e) => e.json())
    .then(async (e) => {
        app = initializeApp(e.config);
        db = getDatabase();
        const dbRef = ref(db);
        onChildChanged(dbRef, (data) => {
            console.log(data.val());
        });
        // onValue(
        //     dbRef,
        //     (snapshot) => {
        //         snapshot.forEach((childSnapshot) => {
        //             const childKey = childSnapshot.key;
        //             const childData = childSnapshot.val();
        //             if (childKey == "list") {
        //                 listLength = childData.length;
        //                 printData(childData);
        //             }
        //             console.log(childData);
        //         });
        //     },
        //     {
        //         onlyOnce: true,
        //     }
        // );
        return;
    });
function writeData(id, title, chapter, url) {
    set(ref(db, "list/" + id), {
        title: title,
        chapter: chapter,
        url: url,
    })
        .then((e) => {
            console.log("setted");
        })
        .catch((e) => {
            console.log(e);
        });
}
window.wd = writeData;
function updateData(id, title, chapter, url) {
    let updates = {};
    updates["/list/" + id] = { title, chapter, url };
    update(ref(db), updates)
        .then((e) => {
            console.log("editted");
        })
        .catch((e) => {
            console.log(e);
        });
}
function deleteData(id) {
    remove(ref(db, "list/" + id));
}
function printData(data = [{ chapter: 0, title: "", url: "" }]) {
    let tbody = ``,
    keys = Object.keys(data);
    keys.forEach((e, x) => {
        let tr = `<tr class="hover:bg-white/5 transition-all">
        <td class="list-title md:w-3/4 p-4 border-b border-slate-500 text-slate-300"><a class="list-url break-word hover:text-slate-100 transition-all w-full" href="${data[e].url}" style="word-break: break-word">${data[e].title}</a></td>
        <td class="list-chapter p-4 border-b border-slate-500 text-slate-300">${data[e].chapter}</td>
        <td class="p-4 border-b border-slate-500 text-slate-300">
            <button id="edit-${x}" role="button" class="action-button px-4 py-2 my-1 rounded font-medium transition-all hover:bg-blue-700 bg-blue-600"><i class="fa-regular fa-pen-to-square"></i></button>
            <button id="delete-${x}" role="button" class="action-button px-4 py-2 my-1 rounded font-medium transition-all hover:bg-red-700 bg-red-600"><i class="fa-regular fa-trash-can"></i></button>
        </td>
    </tr>`;
        tbody += tr;
    });
    document.querySelector("table#data-table>tbody").innerHTML = tbody;
}
function getReq(name) {
    if ((name = new RegExp("[?&]" + encodeURIComponent(name) + "=([^&]*)").exec(location.search))) return decodeURIComponent(name[1]);
}
window.getReq = getReq