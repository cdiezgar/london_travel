export function generarGuiaPDF(organizadorViaje) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const data = organizadorViaje; // Basado en data.json

    const red = [116, 0, 1];
    const gold = [211, 166, 37];
    const darkInk = [40, 40, 40];
    const textWidth = 175;

    // Función para renderizar texto justificado manualmente
    const renderJustified = (text, x, y, maxWidth, fontSize, fontStyle = "normal") => {
        doc.setFont("times", fontStyle);
        doc.setFontSize(fontSize);
        const paragraphs = text.split('\n');
        let currentY = y;

        paragraphs.forEach(para => {
            const words = para.split(/\s+/);
            let line = [];
            for (let word of words) {
                let testLine = [...line, word].join(' ');
                if (doc.getTextWidth(testLine) > maxWidth && line.length > 0) {
                    if (currentY > 280) { doc.addPage(); currentY = 20; doc.setFont("times", fontStyle); doc.setFontSize(fontSize); }
                    doc.text(line.join(' '), x, currentY, { align: 'justify', maxWidth: maxWidth });
                    line = [word];
                    currentY += (fontSize * 0.5);
                } else {
                    line.push(word);
                }
            }
            if (currentY > 280) { doc.addPage(); currentY = 20; doc.setFont("times", fontStyle); doc.setFontSize(fontSize); }
            doc.text(line.join(' '), x, currentY);
            currentY += (fontSize * 0.6);
        });
        return currentY;
    };

    // --- 1. PORTADA ---
    doc.setFillColor(252, 245, 229);
    doc.rect(0, 0, 210, 297, 'F');
    doc.setFont("times", "bold");
    doc.setFontSize(32);
    doc.setTextColor(red[0], red[1], red[2]);
    doc.text(data.config.titulo.toUpperCase(), 105, 90, { align: "center" });
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.line(40, 95, 170, 95);
    doc.setFontSize(18);
    doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
    doc.text(data.config.subtitulo, 105, 110, { align: "center" });

    // --- 2. RESUMEN DE ITINERARIO (Sustituye al Índice) ---
    doc.addPage();
    doc.setFontSize(22);
    doc.setTextColor(red[0], red[1], red[2]);
    doc.text("RESUMEN DEL VIAJE", 20, 30);

    let resumenY = 50;
    data.dias.forEach((dia) => {
        if (resumenY > 270) { doc.addPage(); resumenY = 30; }

        doc.setFont("times", "bold");
        doc.setFontSize(12);
        doc.setTextColor(red[0], red[1], red[2]);
        doc.text(`${dia.fecha}: ${dia.titulo}`, 25, resumenY);

        resumenY += 6;
        doc.setFont("times", "normal");
        doc.setFontSize(10);
        doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
        // Solo el resumen corto
        const resumenCorto = doc.splitTextToSize(dia.resumen || "Sin resumen disponible.", 160);
        doc.text(resumenCorto, 30, resumenY);

        resumenY += (resumenCorto.length * 5) + 8;
    });

    // --- 3. CONTENIDO (Un Salto de Página por Día) ---
    data.dias.forEach((dia) => {
        doc.addPage();
        let currentY = 20;

        // Título del Día
        doc.setFillColor(252, 245, 229);
        doc.rect(10, currentY, 190, 15, 'F');
        doc.setFont("times", "bold");
        doc.setFontSize(16);
        doc.setTextColor(red[0], red[1], red[2]);
        doc.text(`${dia.fecha.toUpperCase()}: ${dia.titulo}`, 15, currentY + 10);
        currentY += 20;

        // Historia (Justificada)
        currentY = renderJustified(dia.historia_dia || "", 15, currentY, textWidth, 10, "italic") + 5;

        // Tabla Itinerario
        doc.autoTable({
            startY: currentY,
            head: [['Hora', 'Actividad', 'Resumen']],
            body: dia.timeline.map(item => [item.hora, item.actividad, item.desc || ""]),
            headStyles: { fillColor: red },
            styles: { font: "times" },
            margin: { left: 15, right: 15 },
            didDrawPage: (d) => { currentY = d.cursor.y + 10; }
        });

        // SECCIÓN DE DETALLES (Continuo, sin saltar página)
        doc.setFont("times", "bold");
        doc.setFontSize(13);
        doc.setTextColor(red[0], red[1], red[2]);
        doc.text("GUÍA DE EXPLORACIÓN Y PUNTOS CLAVE", 15, currentY);
        currentY += 8;

        dia.timeline.forEach(item => {
            if (item.detalles) {
                if (currentY > 280) { doc.addPage(); currentY = 20; }
                doc.setFont("times", "bold");
                doc.setFontSize(11);
                doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
                doc.text(`> ${item.actividad}`, 15, currentY);
                currentY += 6;

                if (item.detalles.contexto) {
                    currentY = renderJustified(item.detalles.contexto, 15, currentY, textWidth, 10) + 2;
                }

                if (item.detalles.lista_ver && item.detalles.lista_ver.length > 0) {
                    if (currentY > 280) { doc.addPage(); currentY = 20; }
                    doc.setFont("times", "bolditalic");
                    doc.setTextColor(gold[0], gold[1], gold[2]);
                    doc.text("Indispensable ver:", 18, currentY);
                    currentY += 5;

                    item.detalles.lista_ver.forEach(punto => {
                        const nombrePunto = typeof punto === 'object' ? punto.texto : punto;
                        if (currentY > 280) { doc.addPage(); currentY = 20; }
                        doc.setFont("times", "bold");
                        doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
                        doc.text(`- ${nombrePunto}`, 22, currentY);
                        currentY += 5;

                        if (punto.desc) {
                            currentY = renderJustified(punto.desc, 27, currentY, textWidth - 12, 9) + 2;
                        }
                    });
                    currentY += 2;
                }
            }
        });
    });

    // --- 4. CHECKLIST FINAL ---
    doc.addPage();
    doc.setFont("times", "bold");
    doc.setFontSize(22);
    doc.setTextColor(red[0], red[1], red[2]);
    doc.text("MISIONES DEL MINISTERIO", 20, 30);
    let checkY = 50;
    const itemsCheck = [...data.checklist].sort((a, b) => a.item.localeCompare(b.item));
    itemsCheck.forEach(obj => {
        if (checkY > 280) { doc.addPage(); checkY = 20; }
        doc.setDrawColor(gold[0], gold[1], gold[2]);
        doc.rect(20, checkY - 4, 5, 5);
        doc.setFont("times", "normal");
        doc.setFontSize(11);
        doc.text(obj.item, 30, checkY);
        checkY += 8;
    });

    // --- 5. PAGINACIÓN FINAL ---
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${totalPages}`, 105, 290, { align: "center" });
    }

    const nombreArchivo = data.config.titulo ? data.config.titulo.replace(/\s+/g, '_') : 'Viaje';
    doc.save(`Guia_${nombreArchivo}.pdf`);
}
