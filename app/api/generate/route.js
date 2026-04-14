import { PDFDocument, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";

export async function POST(req) {
  const body = await req.json();

  const {
    tasks,
    subject,
    invoice,
    date,
    subtotal,
    sgst,
    cgst,
    total
  } = body;

  // LOAD TEMPLATE
  const filePath = path.join(process.cwd(), "public", "Invoice_Template.pdf");
  const existingPdfBytes = fs.readFileSync(filePath);

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const page = pdfDoc.getPages()[0];

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // ===== HEADER FIELDS =====
  page.drawText(date, { x: 460, y: 720, size: 10, font });
  page.drawText(invoice, { x: 520, y: 700, size: 10, font });

  // SUBJECT
  page.drawText(subject, { x: 100, y: 650, size: 11, font: bold });

  // ===== TASKS =====
  let y = 600;

  tasks.forEach((t, i) => {
    const totalVal =
      t.mode === "qty"
        ? (t.qty || 0) * (t.rate || 0)
        : (t.amount || 0);

    // WRAP TEXT
    const text = `${i + 1}. ${t.name}`;
    const words = text.split(" ");
    let line = "";

    words.forEach(word => {
      const testLine = line + word + " ";
      if (testLine.length > 70) {
        page.drawText(line, { x: 50, y, size: 10, font });
        y -= 14;
        line = word + " ";
      } else {
        line = testLine;
      }
    });

    page.drawText(line, { x: 50, y, size: 10, font });
    y -= 14;

    // VALUE LINE
    if (t.mode === "qty") {
      page.drawText(
        `${t.qty} x ${t.rate} = INR ${totalVal}`,
        { x: 70, y, size: 10, font }
      );
    } else {
      page.drawText(`INR ${totalVal}`, {
        x: 70,
        y,
        size: 10,
        font
      });
    }

    y -= 20;
  });

  // ===== TOTALS =====
  page.drawText(`Total INR ${Math.round(subtotal)}`, {
    x: 50,
    y: 200,
    size: 11,
    font: bold
  });

  page.drawText(`SGST INR ${Math.round(sgst)}`, {
    x: 50,
    y: 180,
    size: 11,
    font
  });

  page.drawText(`CGST INR ${Math.round(cgst)}`, {
    x: 50,
    y: 160,
    size: 11,
    font
  });

  page.drawText(`Grand Total INR ${Math.round(total)}`, {
    x: 50,
    y: 140,
    size: 12,
    font: bold
  });

  const pdfBytes = await pdfDoc.save();

  return new Response(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=invoice.pdf"
    }
  });
}
