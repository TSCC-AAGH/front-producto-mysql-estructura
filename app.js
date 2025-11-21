// app.js

// Cambia esto según dónde esté tu API
// Ejemplos:
// const API_BASE_URL = "http://localhost:3020";
// const API_BASE_URL = "https://so.jquiroz.net";
const API_BASE_URL = "http://jquiroz.net:3022";  // AJUSTAR EN TU SERVIDOR

function buildApiUrl(path) {
    if (API_BASE_URL.endsWith("/")) {
        return API_BASE_URL + path.replace(/^\//, "");
    }
    return API_BASE_URL + path;
}

// Variables para elementos del DOM
let productForm;
let inputName;
let inputPrice;
let inputStock;
let productsBody;
let messageBox;

// Mostrar mensajes en pantalla
function showMessage(text, isError) {
    if (!messageBox) {
        return;
    }
    messageBox.textContent = text || "";

    messageBox.classList.remove("message-ok");
    messageBox.classList.remove("message-error");

    if (!text) {
        return;
    }

    if (isError) {
        messageBox.classList.add("message-error");
    } else {
        messageBox.classList.add("message-ok");
    }
}

// Limpiar tabla de productos
function clearProductsTable() {
    if (!productsBody) {
        return;
    }
    // Eliminar todas las filas
    while (productsBody.firstChild) {
        productsBody.removeChild(productsBody.firstChild);
    }
}

// Crear una fila de producto en la tabla
function addProductRow(product) {
    if (!productsBody) {
        return;
    }

    var tr = document.createElement("tr");

    var tdId = document.createElement("td");
    tdId.textContent = product.id;

    var tdName = document.createElement("td");
    tdName.textContent = product.name;

    var tdPrice = document.createElement("td");
    tdPrice.textContent = product.price;

    var tdStock = document.createElement("td");
    tdStock.textContent = product.stock;

    var tdActions = document.createElement("td");
    var deleteButton = document.createElement("button");
    deleteButton.textContent = "Eliminar";
    deleteButton.className = "btn btn-danger";
    deleteButton.type = "button";

    // Handler para eliminar producto
    deleteButton.addEventListener("click", function () {
        deleteProduct(product.id);
    });

    tdActions.appendChild(deleteButton);

    tr.appendChild(tdId);
    tr.appendChild(tdName);
    tr.appendChild(tdPrice);
    tr.appendChild(tdStock);
    tr.appendChild(tdActions);

    productsBody.appendChild(tr);
}

// Cargar productos desde la API
function loadProducts() {
    showMessage("Cargando productos...", false);

    var url = buildApiUrl("/products");

    fetch(url)
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Error al obtener productos. Código: " + response.status);
            }
            return response.json();
        })
        .then(function (data) {
            clearProductsTable();

            if (!data || data.length === 0) {
                showMessage("No hay productos registrados.", false);
                return;
            }

            var i;
            for (i = 0; i < data.length; i++) {
                addProductRow(data[i]);
            }

            showMessage("Productos cargados correctamente.", false);
        })
        .catch(function (error) {
            console.error(error);
            showMessage("No se pudo cargar la lista de productos.", true);
        });
}

// Enviar nuevo producto a la API
function createProduct(name, price, stock) {
    var url = buildApiUrl("/products");

    var body = {
        name: name,
        price: price,
        stock: stock
    };

    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    })
        .then(function (response) {
            if (!response.ok) {
                return response.json().then(function (err) {
                    var detail = err && err.detail ? err.detail : "Error al crear el producto.";
                    throw new Error(detail);
                }).catch(function () {
                    throw new Error("Error al crear el producto.");
                });
            }
            return response.json();
        })
        .then(function (newProduct) {
            addProductRow(newProduct);
            showMessage("Producto creado correctamente.", false);
            if (productForm) {
                productForm.reset();
            }
        })
        .catch(function (error) {
            console.error(error);
            showMessage(error.message, true);
        });
}

// Eliminar producto por id
function deleteProduct(productId) {
    var url = buildApiUrl("/products/" + productId);

    fetch(url, {
        method: "DELETE"
    })
        .then(function (response) {
            if (response.status === 204) {
                // Recargar lista para simplificar actualización
                loadProducts();
                showMessage("Producto eliminado correctamente.", false);
                return;
            }
            return response.json().then(function (err) {
                var detail = err && err.detail ? err.detail : "No se pudo eliminar el producto.";
                throw new Error(detail);
            });
        })
        .catch(function (error) {
            console.error(error);
            showMessage(error.message, true);
        });
}

// Inicializar eventos y referencias al DOM
function init() {
    productForm = document.getElementById("product-form");
    inputName = document.getElementById("name");
    inputPrice = document.getElementById("price");
    inputStock = document.getElementById("stock");
    productsBody = document.getElementById("products-body");
    messageBox = document.getElementById("message");

    if (!productForm || !productsBody) {
        console.error("No se encontraron elementos principales del DOM.");
        return;
    }

    productForm.addEventListener("submit", function (event) {
        event.preventDefault();

        var nameValue = inputName.value.trim();
        var priceValue = parseFloat(inputPrice.value);
        var stockValue = parseInt(inputStock.value, 10);

        if (!nameValue) {
            showMessage("El nombre es obligatorio.", true);
            return;
        }

        if (isNaN(priceValue)) {
            showMessage("El precio no es válido.", true);
            return;
        }

        if (isNaN(stockValue)) {
            showMessage("El stock no es válido.", true);
            return;
        }

        createProduct(nameValue, priceValue, stockValue);
    });

    loadProducts();
}

// Asegurarnos de que el DOM está listo
window.addEventListener("DOMContentLoaded", init);
