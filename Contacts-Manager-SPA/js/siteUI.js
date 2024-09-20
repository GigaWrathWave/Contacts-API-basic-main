//<span class="cmdIcon fa-solid fa-ellipsis-vertical"></span>
let contentScrollPosition = 0;
Init_UI();

function Init_UI() {
    renderBookmarks();
    $('#createBookmark').on("click", async function () {
        saveContentScrollPosition();
        renderCreateBookmarkForm();
    });
    $('#abort').on("click", async function () {
        renderBookmarks();
    });
    $('#aboutCmd').on("click", function () {
        renderAbout();
    });
}

function renderAbout() {
    saveContentScrollPosition();
    eraseContent();
    $("#createBookmark").hide();
    $("#abort").show();
    $("#actionTitle").text("À propos...");
    $("#content").append(
        $(`
            <div class="aboutContainer">
                <h2>Gestionnaire de Bookmarks</h2>
                <hr>
                <p>
                    Petite application de gestion de Bookmarks à titre de démonstration
                    d'interface utilisateur monopage réactive.
                </p>
                <p>
                    Auteur: Nicolas Chourot
                </p>
                <p>
                    Collège Lionel-Groulx, automne 2024
                </p>
            </div>
        `))
}
async function renderBookmarks() {
    showWaitingGif();
    $("#actionTitle").text("Liste des Bookmarks");
    $("#createBookmark").show();
    $("#abort").hide();
    let Bookmarks = await API_GetBookmarks();
    eraseContent();
    if (Bookmarks !== null) {
        Bookmarks.forEach(Bookmark => {
            $("#content").append(renderBookmark(Bookmark));
        });
        restoreContentScrollPosition();
        // Attached click events on command icons
        $(".editCmd").on("click", function () {
            saveContentScrollPosition();
            renderEditBookmarkForm(parseInt($(this).attr("editBookmarkId")));
        });
        $(".deleteCmd").on("click", function () {
            saveContentScrollPosition();
            renderDeleteBookmarkForm(parseInt($(this).attr("deleteBookmarkId")));
        });
        $(".BookmarkRow").on("click", function (e) { e.preventDefault(); })
    } else {
        renderError("Service introuvable");
    }
}
function showWaitingGif() {
    $("#content").empty();
    $("#content").append($("<div class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"));
}
function eraseContent() {
    $("#content").empty();
}
function saveContentScrollPosition() {
    contentScrollPosition = $("#content")[0].scrollTop;
}
function restoreContentScrollPosition() {
    $("#content")[0].scrollTop = contentScrollPosition;
}
function renderError(message) {
    eraseContent();
    $("#content").append(
        $(`
            <div class="errorContainer">
                ${message}
            </div>
        `)
    );
}
function renderCreateBookmarkForm() {
    renderBookmarkForm();
}
async function renderEditBookmarkForm(id) {
    showWaitingGif();
    let Bookmark = await API_GetBookmark(id);
    if (Bookmark !== null)
        renderBookmarkForm(Bookmark);
    else
        renderError("Bookmark introuvable!");
}
async function renderDeleteBookmarkForm(id) {
    showWaitingGif();
    $("#createBookmark").hide();
    $("#abort").show();
    $("#actionTitle").text("Retrait");
    let Bookmark = await API_GetBookmark(id);
    eraseContent();
    if (Bookmark !== null) {
        $("#content").append(`
        <div class="ContactdeleteForm">
            <h4>Effacer le Bookmark suivant?</h4>
            <br>
            <div class="ContactRow" Bookmark_id=${Bookmark.Id}">
                <div class="ContactContainer">
                    <div class="ContactLayout">
                        <div class="ContactName">${Bookmark.Title}</div>
                        <div class="ContactPhone">${Bookmark.Url}</div>
                        <div class="ContactEmail">${Bookmark.Category}</div>
                    </div>
                </div>  
            </div>   
            <br>
            <input type="button" value="Effacer" id="deleteBookmark" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </div>    
        `);
        $('#deleteBookmark').on("click", async function () {
            showWaitingGif();
            let result = await API_DeleteBookmark(Bookmark.Id);
            if (result)
                renderBookmarks();
            else
                renderError("Une erreur est survenue!");
        });
        $('#cancel').on("click", function () {
            renderBookmarks();
        });
    } else {
        renderError("Bookmark introuvable!");
    }
}
function newBookmark() {
    Bookmark = {};
    Bookmark.Id = 0;
    Bookmark.Ttile = "";
    Bookmark.Url = "";
    Bookmark.Category = "";
    return Bookmark;
}
function renderBookmarkForm(Bookmark = null) {
    $("#createBookmark").hide();
    $("#abort").show();
    eraseContent();
    let create = Bookmark == null;
    if (create) Bookmark = newBookmark();
    $("#actionTitle").text(create ? "Création" : "Modification");
    $("#content").append(`
        <form class="form" id="BookmarkForm">
            <input type="hidden" name="Id" value="${Bookmark.Id}"/>

            <label for="Title" class="form-label">Title </label>
            <input 
                class="form-control Alpha"
                name="Title" 
                id="Title" 
                placeholder="Title"
                required
                RequireMessage="Veuillez entrer un Title"
                InvalidMessage="Le Title comporte un caractère illégal" 
                value="${Bookmark.Title}"
            />
            <label for="Url" class="form-label">Url </label>
            <input
                class="form-control Url"
                name="Url"
                id="Url"
                placeholder="Url"
                required
                RequireMessage="Veuillez entrer votre Url" 
                InvalidMessage="Veuillez entrer un Url valide"
                value="${Bookmark.Url}" 
            />
            <label for="Category" class="form-label">Category </label>
            <input 
                class="form-control Email"
                name="Category"
                id="Category"
                placeholder="Category"
                required
                RequireMessage="Veuillez entrer votre Category" 
                InvalidMessage="Veuillez entrer un Category valide"
                value="${Bookmark.Category}"
            />
            <hr>
            <input type="submit" value="Enregistrer" id="saveBookmark" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </form>
    `);
    initFormValidation();
    $('#BookmarkForm').on("submit", async function (event) {
        event.preventDefault();
        let Bookmark = getFormData($("#BookmarkForm"));
        Bookmark.Id = parseInt(Bookmark.Id);
        showWaitingGif();
        let result = await API_SaveBookmark(Bookmark, create);
        if (result)
            renderBookmarks();
        else
            renderError("Une erreur est survenue!");
    });
    $('#cancel').on("click", function () {
        renderBookmarks();
    });
}

function getFormData($form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.title] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}

function renderBookmark(Bookmark) {
    return $(`
     <div class="ContactRow" Bookmark_id=${Bookmark.Id}">
        <div class="ContactContainer noselect">
            <div class="ContactLayout">
                <span class="ContactTitle">${Bookmark.Title}</span>
                <span class="ContactUrl">${Bookmark.Url}</span>
                <span class="ContactCategory">${Bookmark.Category}</span>
            </div>
            <div class="ContactCommandPanel">
                <span class="editCmd cmdIcon fa fa-pencil" editBookmarkId="${Bookmark.Id}" title="Modifier ${Bookmark.Title}"></span>
                <span class="deleteCmd cmdIcon fa fa-trash" deleteBookmarkId="${Bookmark.Id}" title="Effacer ${Bookmark.Title}"></span>
            </div>
        </div>
    </div>           
    `);
}