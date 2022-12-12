// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update, remove, onChildChanged } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-database.js";

// Variables
let db, // firebase
    datafetched = false, // loading screen
    onToggleForm = false, // form animation
    datas, // comics
    comicsList; // comics
document.addEventListener(
    "DOMContentLoaded",
    function () {
        document.querySelector("#data-form").addEventListener("submit", (e) => {
            let title = document.querySelector("#input-title>input").value;
            let chapter = document.querySelector("#input-chapter>input").value;
            let type = document.querySelector("#input-type>select").value;
            let url = document.querySelector("#input-url>input").value;
            if (e.target.dataset.action == "create") {
                writeData(uuid("comic"), title, type, chapter, url);
            } else if (e.target.dataset.action == "edit") {
                updateData(e.target.dataset.target, title, type, chapter, url);
            }
            toggleForm("close");
            e.preventDefault();
            return false;
        });
        fetch("./config.json")
            .then((e) => e.json())
            .then(async (e) => {initializeApp(e.config);
                db = getDatabase();
                const dbRef = ref(db);
                onChildChanged(dbRef, (data) => {
                    datas = data.val();
                    printData(data.val());
                });
                onValue(
                    dbRef,
                    (snapshot) => {
                        snapshot.forEach((childSnapshot) => {
                            const childKey = childSnapshot.key;
                            const childData = childSnapshot.val();
                            if (childKey == "list") {
                                datas = childData;
                                printData(childData);
                                comicsList = new List(document.querySelector(".comics"), {
                                    page: 15,
                                    pagination: true,
                                    valueNames: ["list-url", "list-type", "list-chapter"],
                                });
                                window.comic = comicsList;
                            }
                        });
                    },
                    {
                        onlyOnce: true,
                    }
                );
                return;
            });
    },
    false
);

// Helper Functions
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function getReq(name) {
    if ((name = new RegExp("[?&]" + encodeURIComponent(name) + "=([^&]*)").exec(location.search))) return decodeURIComponent(name[1]);
}
function uuid(start = "id") {
    return start + "-" + Math.random().toString(16).slice(2);
}
// Firebase CRUD Functions
function writeData(id, title, type, chapter, url) {
    set(ref(db, "list/" + id), {
        title: title,
        type: type,
        chapter: chapter,
        url: url,
    });
}
function updateData(id, title, type, chapter, url) {
    let updates = {};
    updates["/list/" + id] = { title, type, chapter, url };
    update(ref(db), updates);
}
function deleteData(id) {
    remove(ref(db, "list/" + id));
}
// UI Functions
function printData(data = [{ chapter: 0, title: "", url: "" }]) {
    let tbody = ``,
        keys = Object.keys(data);
    keys.forEach((e, x) => {
        let tr = `<tr class="hover:bg-white/5 transition-all md:border-0 border-b-2 border-slate-500">
        <td class="list-title data-table-td"><a class="list-url break-word hover:text-slate-100 transition-all w-full" target="_blank" href="${data[e].url}" style="word-break: break-word">${data[e].title}</a></td>
        <td class="list-type data-table-td">${data[e].type}</td>
        <td class="list-chapter data-table-td">${data[e].chapter}</td>
        <td class="data-table-td">
            <button data-id ="${e}" id="edit" role="button" class="action-button hover:bg-blue-700 bg-blue-600 text-xs"><i class=" w-[12px] h-[12px] fa-regular fa-pen-to-square"></i></button>
            <button data-id ="${e}" id="delete" role="button" class="action-button hover:bg-red-700 bg-red-600 text-xs"><i class=" w-[12px] h-[12px] fa-regular fa-trash-can"></i></button>
        </td>
    </tr>`;
        tbody += tr;
    });
    document.querySelector("table#data-table>tbody").innerHTML = tbody;
    if (!datafetched) {
        if (document.querySelector("#loading-screen")) document.querySelector("#loading-screen").classList.add("hidden");
        document.querySelector("#content-wrapper").classList.remove("h-[100vh]");
        document.querySelector("#data-table").classList.remove("hidden");
        document.querySelector(".control-button").classList.remove("hidden");
        document.querySelector(".control-button").classList.add("flex");
        document.querySelector(".form-control").classList.remove("hidden");
        if (document.querySelector("#loading-screen")) document.querySelector("#loading-screen").remove();
    }
    document.querySelectorAll("button#delete").forEach((e) => {
        e.addEventListener("dblclick", (e) => {
            deleteData(e.currentTarget.dataset.id);
        });
    });
    document.querySelector("button#create").onclick = (e) => {
        createForm();
    };
    document.querySelector("button#close").onclick = (e) => {
        toggleForm("close");
    };
    document.querySelectorAll("button#edit").forEach((e) => {
        e.addEventListener("click", (r) => {
            editForm(e.dataset.id);
        });
    });
    if (comicsList) comicsList.reIndex();
}
async function toggleForm(action = "create", callback = function (target = document.querySelector(".form-control")) {}) {
    if ((action != "create" && action != "edit" && action != "close") || onToggleForm) return false;
    onToggleForm = true;
    let target = document.querySelector(".form-control");
    if (action == "close") {
        target.dataset.visible = false;
        await sleep(500);
    } else if (target.dataset.visible == "true") {
        target.dataset.visible = false;
        await sleep(500);
        callback(target);
        target.dataset.visible = true;
        await sleep(500);
    } else {
        callback(target);
        target.dataset.visible = true;
        await sleep(500);
    }
    onToggleForm = false;
    return true;
}
function createForm() {
    toggleForm("create", (e) => {
        let inputs = e.children[0];
        inputs.dataset.action = "create";
        inputs.removeAttribute("data-target");
        inputs.querySelector("#input-title").querySelector("input").value = "";
        inputs.querySelector("#input-chapter").querySelector("input").value = "";
        inputs.querySelector("#input-type").querySelector("select").querySelector("option[value='manhwa']").selected = true;
        inputs.querySelector("#input-url").querySelector("input").value = "";
        inputs.querySelector("#input-submit").querySelector("button").textContent = "Create";
    });
}
function editForm(index = "") {
    let data = datas[index];
    if (!data) return false;
    toggleForm("edit", (e) => {
        let inputs = e.children[0],
            type = data["type"].toLowerCase();
        inputs.dataset.action = "edit";
        inputs.setAttribute("data-target", index);
        inputs.querySelector("#input-title").querySelector("input").value = data["title"];
        inputs.querySelector("#input-chapter").querySelector("input").value = data["chapter"];
        inputs.querySelector("#input-type").querySelector("select").querySelector(`option[value='${type}']`).selected = true;
        inputs.querySelector("#input-url").querySelector("input").value = data["url"];
        inputs.querySelector("#input-submit").querySelector("button").textContent = "Edit";
    });
}
