import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      to,
      tasks,
      subject,
      invoice,
      date,
      subtotal,
      sgst,
      cgst,
      total
    } = body;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { width, height } = page.getSize();

    let y = height - 50;

    /* ================= HEADER ================= */

    // TO ADDRESS (LEFT)
    page.drawText("To,", {
      x: 50,
      y,
      size: 11,
      font: boldFont
    });

    y -= 15;

    const toLines = to.split("\n");
    toLines.forEach(line => {
      page.drawText(line, {
        x: 50,
        y,
        size: 10,
        font
      });
      y -= 14;
    });

    // RIGHT SIDE (DATE + INVOICE)
    page.drawText(`Date: ${date}`, {
      x: width - 200,
      y: height - 50,
      size: 10,
      font
    });

    page.drawText(`Invoice No: ${invoice}`, {
      x: width - 200,
      y: height - 65,
      size: 10,
      font
    });

    /* ================= SUBJECT ================= */

    y -= 20;

    page.drawText(`Subject: ${subject}`, {
      x: 50,
      y,
      size: 11,
      font: boldFont
    });

    y -= 25;

    /* ================= TASKS ================= */

    tasks.forEach((t, i) => {
      const amount =
        t.type === "direct"
          ? t.amount || 0
          : (t.qty || 0) * (t.rate || 0);

      const description =
        t.type === "direct"
          ? `${i + 1}. ${t.name} — ₹ ${amount}`
          : `${i + 1}. ${t.name} (${t.qty} × ${t.rate}) — ₹ ${amount}`;

      page.drawText(description, {
        x: 60,
        y,
        size: 10,
        font
      });

      y -= 18;
    });

    /* ================= CALCULATIONS ================= */

    y -= 30;

    const rightX = width - 200;

    const drawRight = (label, value, bold = false) => {
      page.drawText(label, {
        x: rightX,
        y,
        size: 10,
        font: bold ? boldFont : font
      });

      page.drawText(`₹ ${value.toFixed(0)}`, {
        x: rightX + 100,
        y,
        size: 10,
        font: bold ? boldFont : font
      });

      y -= 15;
    };

    drawRight("Subtotal:", subtotal);
    drawRight("SGST (9%):", sgst);
    drawRight("CGST (9%):", cgst);
    drawRight("Total:", total, true);

    /* ================= FOOTER ================= */

    page.drawText("Thank you for your business!", {
      x: 50,
      y: 50,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4)
    });

    /* ================= SAVE ================= */

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=invoice.pdf"
      }
    });

  } catch (err) {
    return new Response("Error generating PDF", { status: 500 });
  }
}
