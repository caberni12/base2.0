let baseDeDatos = {};  
let etiquetasPreAgregadas = [];

function cargarArchivo(event) {
    const archivo = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = e.target.result;
        const wb = XLSX.read(data, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
        baseDeDatos = {};
        json.forEach(row => {
            const codigo = row[0];
            const descripcion = row[1];
            if (codigo && descripcion) {
                baseDeDatos[codigo] = descripcion;
            }
        });
        mostrarModalGestionCodigos();
    };
    reader.readAsBinaryString(archivo);
}

function mostrarModalGestionCodigos() {
    const listCodigos = document.getElementById("listCodigos");
    listCodigos.innerHTML = '';
    Object.keys(baseDeDatos).forEach(codigo => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${codigo}</td>
            <td>${baseDeDatos[codigo]}</td>
            <td><button onclick="eliminarCodigo('${codigo}')">Eliminar</button></td>
        `;
        listCodigos.appendChild(tr);
    });
    document.getElementById("modalGestionCodigos").style.display = "flex";
}

function cerrarModalGestionCodigos() {
    document.getElementById("modalGestionCodigos").style.display = "none";
}

function eliminarCodigo(codigo) {
    delete baseDeDatos[codigo];
    mostrarModalGestionCodigos();
}

function filtrarTabla() {
    const filtro = document.getElementById("busqueda").value.toLowerCase();
    const filas = document.getElementById("listCodigos").getElementsByTagName("tr");
    Array.from(filas).forEach(fila => {
        const celdas = fila.getElementsByTagName("td");
        const codigo = celdas[0].innerText.toLowerCase();
        const descripcion = celdas[1].innerText.toLowerCase();
        if (codigo.indexOf(filtro) > -1 || descripcion.indexOf(filtro) > -1) {
            fila.style.display = "";
        } else {
            fila.style.display = "none";
        }
    });
}

function buscarDescripcion() {
    let codigo = document.getElementById("codigo").value;
    let descripcion = baseDeDatos[codigo] || "";
    document.getElementById("descripcion").value = descripcion;
}

function preAgregarEtiquetas() {
    let codigo = document.getElementById("codigo").value;
    let descripcion = document.getElementById("descripcion").value;
    let unidades = document.getElementById("unidades").value;
    let cantidad = parseInt(document.getElementById("cantidad").value);
    let anchoEtiqueta = parseFloat(document.getElementById("ancho").value);
    let altoEtiqueta = parseFloat(document.getElementById("alto").value);
    let anchoCodigo = parseFloat(document.getElementById("anchoCodigo").value);
    let altoCodigo = parseFloat(document.getElementById("altoCodigo").value);
    let zoom = parseFloat(document.getElementById("zoom").value);

    // Validación de campos
    if (!codigo || !descripcion || !unidades || isNaN(cantidad) || cantidad <= 0 || isNaN(anchoEtiqueta) || isNaN(altoEtiqueta) || isNaN(anchoCodigo) || isNaN(altoCodigo) || isNaN(zoom)) {
        alert("Por favor completa todos los campos correctamente.");
        return;
    }

    // Agregar las etiquetas al array etiquetasPreAgregadas
    for (let i = 0; i < cantidad; i++) {
        etiquetasPreAgregadas.push({
            codigo,
            descripcion,
            unidades,
            anchoEtiqueta,
            altoEtiqueta,
            anchoCodigo,
            altoCodigo,
            zoom
        });
    }

    alert("Etiquetas pre-agregadas, ahora puedes generarlas o imprimirlas.");
}

function generarEtiquetas() {
    let etiquetasDiv = document.getElementById("etiquetas");
    etiquetasDiv.innerHTML = "";  // Limpiamos cualquier etiqueta previa

    if (etiquetasPreAgregadas.length === 0) {
        alert("No hay etiquetas pre-agregadas. Por favor agrega etiquetas primero.");
        return;
    }

    etiquetasPreAgregadas.forEach((etiqueta) => {
        let div = document.createElement("div");
        div.classList.add("etiqueta");
        div.style.width = etiqueta.anchoEtiqueta + "cm";
        div.style.height = etiqueta.altoEtiqueta + "cm";
        div.style.boxSizing = "border-box";  // Aseguramos que el borde esté dentro de las dimensiones

        // Aquí agregamos el contenido de la etiqueta (codigo, descripcion, unidades)
        div.innerHTML = `
            <p style="text-align:center; font-size: 18px; font-weight: bold;">${etiqueta.codigo}</p> <!-- Código en tamaño 18px y en negrita -->
            <svg class="barcode" style="display: block; margin: 0 auto;"></svg>
            <p style="text-align:center;">${etiqueta.descripcion}</p>
            <p style="text-align:center;">Unidades: ${etiqueta.unidades}</p> <!-- Agregamos "Unidades:" antes del valor -->
        `;
        etiquetasDiv.appendChild(div);
    });

    actualizarCodigosDeBarras();
}

function actualizarCodigosDeBarras() {
    document.querySelectorAll(".barcode").forEach((svg, index) => {
        const etiqueta = etiquetasPreAgregadas[index];
        JsBarcode(svg, etiqueta.codigo, { 
            format: "CODE128", 
            displayValue: false, 
            width: etiqueta.anchoCodigo,  
            height: etiqueta.altoCodigo,  
            margin: 0
        });
    });
}

function imprimirEtiquetas() {
    const printWindow = window.open('', '', 'height=600,width=800');
    const etiquetasDiv = document.getElementById("etiquetas").cloneNode(true);

    printWindow.document.write('<html><head><title>Imprimir Etiquetas</title>');
    
    printWindow.document.write(`
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                display: flex;
                flex-wrap: wrap;
            }
            .etiqueta {
                display: inline-block;
                margin: 0;
                page-break-inside: avoid;
                page-break-before: auto;
                width: 9cm;
                height: 5cm;
                text-align: center;
                zoom: 96%;
            }
            .etiqueta svg {
                width: 80%;
                height: auto;
            }
            /* Estilo para imprimir el código en negrita */
            .etiqueta p {
                font-size: 18px;
                font-weight: bold; /* Asegura que el código se vea en negrita al imprimir */
            }
            @page {
                margin: 0;
            }
        </style>
    `);
    
    printWindow.document.write('</head><body>');
    
    printWindow.document.body.appendChild(etiquetasDiv);
    
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    
    setTimeout(function() {
        printWindow.print();
    }, 500);
}