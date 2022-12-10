// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update, remove, onChildChanged } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-database.js";

let db,
    app,
    datafetched = false,
    dpp = 15,
    dataStart = 0,
    onToggleForm = false,
    datas,
    datasLength,
    comicsList;
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
            console.log(data.val());
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
                        datasLength = Object.keys(childData).length;
                        printData(childData);
                        comicsList = new List(document.querySelector(".comics"), {
                            valueNames: ["list-title", "list-type", "list-chapter"],
                        });
                    }
                });
            },
            {
                onlyOnce: true,
            }
        );
        return;
    });
function writeData(id, title, type, chapter, url) {
    set(ref(db, "list/" + id), {
        title: title,
        type: type,
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
function updateData(id, title, type, chapter, url) {
    let updates = {};
    updates["/list/" + id] = { title, type, chapter, url };
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
        <td class="list-titl data-table-td"><a class="list-url break-word hover:text-slate-100 transition-all w-full" href="${data[e].url}" style="word-break: break-word">${data[e].title}</a></td>
        <td class="list-type data-table-td">${data[e].type}</td>
        <td class="list-chapter data-table-td">${data[e].chapter}</td>
        <td class="data-table-td">
            <button data-id ="${e}" id="edit" role="button" class="action-button hover:bg-blue-700 bg-blue-600"><i class="fa-regular fa-pen-to-square"></i></button>
            <button data-id ="${e}" id="delete" role="button" class="action-button hover:bg-red-700 bg-red-600"><i class="fa-regular fa-trash-can"></i></button>
        </td>
    </tr>`;
        tbody += tr;
    });
    document.querySelector("table#data-table>tbody").innerHTML = tbody;
    if (!datafetched) {
        document.querySelector("#loading-screen").classList.add("hidden");
        document.querySelector("#content-wrapper").classList.remove("h-[100vh]");
        document.querySelector("#data-table").classList.remove("hidden");
        document.querySelector(".control-button").classList.remove("hidden");
        document.querySelector(".form-control").classList.remove("hidden");
    }

    document.querySelector("button#create").addEventListener("click", (e) => {
        createForm();
    });
    document.querySelector("button#close").addEventListener("click", (e) => {
        toggleForm("close");
    });
    document.querySelectorAll("button#edit").forEach((e) => {
        e.addEventListener("click", (r) => {
            editForm(e.dataset.id);
        });
    });
    if (comicsList) comicsList.reIndex();
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function getReq(name) {
    if ((name = new RegExp("[?&]" + encodeURIComponent(name) + "=([^&]*)").exec(location.search))) return decodeURIComponent(name[1]);
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
window.toggleForm = toggleForm;
window.createForm = createForm;
window.editForm = editForm;

document.querySelector("#data-form").addEventListener("submit", (e) => {
    let title = document.querySelector("#input-title>input").value;
    let chapter = document.querySelector("#input-chapter>input").value;
    let type = document.querySelector("#input-type>select").value;
    let url = document.querySelector("#input-url>input").value;
    if (e.target.dataset.action == "create") {
        writeData("comic-" + datasLength, title, type, chapter, url);
    } else if (e.target.dataset.action == "edit") {
        updateData(e.target.dataset.target, title, type, chapter, url);
    }
    e.preventDefault();
    return false;
});
