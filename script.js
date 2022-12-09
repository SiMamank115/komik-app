// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update, remove, onChildChanged } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-database.js";
let db,
    app,
    datafetched = false,
    dpp = 15,
    dataStart = 0;
if (getReq("pages") > 0) {
    dataStart = (getReq("pages") - 1) * dpp;
}
let dataEnd = dataStart + dpp;
fetch("./config.json")
    .then((e) => e.json())
    .then(async (e) => {
        app = initializeApp(e.config);
        db = getDatabase();
        const dbRef = ref(db);
        onChildChanged(dbRef, (data) => {
            printData(data.val());
        });
        onValue(
            dbRef,
            (snapshot) => {
                snapshot.forEach((childSnapshot) => {
                    const childKey = childSnapshot.key;
                    const childData = childSnapshot.val();
                    if (childKey == "list") {
                        printData(childData);
                    }
                });
            },
            {
                onlyOnce: true,
            }
        );
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
    keys = keys.slice(dataStart, dataEnd);
    keys.forEach((e, x) => {
        let tr = `<tr class="hover:bg-white/5 transition-all">
        <td class="list-title md:w-3/4 data-table-td"><a class="list-url break-word hover:text-slate-100 transition-all w-full" href="${data[e].url}" style="word-break: break-word">${data[e].title}</a></td>
        <td class="list-type data-table-td">${data[e].type}</td>
        <td class="list-chapter data-table-td">${data[e].chapter}</td>
        <td class="data-table-td">
            <button id="edit-${data[e]._id}" role="button" class="action-button hover:bg-blue-700 bg-blue-600"><i class="fa-regular fa-pen-to-square"></i></button>
            <button id="delete-${data[e]._id}" role="button" class="action-button hover:bg-red-700 bg-red-600"><i class="fa-regular fa-trash-can"></i></button>
        </td>
    </tr>`;
        tbody += tr;
    });
    document.querySelector("table#data-table>tbody").innerHTML = tbody;
    if (!datafetched) {
        document.querySelector("#loading-screen").classList.add("hidden");
        document.querySelector("#content-wrapper").classList.remove("h-[100vh]");
        document.querySelector("#data-table").classList.remove("hidden");
        document.querySelector(".create-button").classList.remove("hidden");
        document.querySelector(".form-control").classList.remove("hidden");
    }
}
function getReq(name) {
    if ((name = new RegExp("[?&]" + encodeURIComponent(name) + "=([^&]*)").exec(location.search))) return decodeURIComponent(name[1]);
}
window.getReq = getReq;

document.querySelector("#data-form").addEventListener("submit", (e) => {
    console.log(1);
    e.preventDefault();
});
