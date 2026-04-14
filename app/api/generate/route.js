import { PDFDocument } from "pdf-lib";

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

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);

  let y = 750;

  // TITLE
  page.drawText("INVOICE", { x: 250, y, size: 18 });
  y -= 30;

  // HEADER
  page.drawText(`Date: ${date}`, { x: 50, y, size: 10 });
  page.drawText(`Invoice: ${invoice}`, { x: 350, y, size: 10 });
  y -= 20;

  // SUBJECT
  page.drawText(`Subject: ${subject}`, { x: 50, y, size: 11 });
  y -= 30;

  // TASKS
  tasks.forEach((t, i) => {
    const taskTotal =
      t.mode === "qty"
        ? (t.qty || 0) * (t.rate || 0)
        : (t.amount || 0);

    // Line 1 (description)
    page.drawText(`${i + 1}. ${t.name}`, { x: 50, y, size: 10 });
    y -= 14;

    // Line 2 (calculation)
    if (t.mode === "qty") {
      page.drawText(
        `${t.qty} x ${t.rate} = INR ${taskTotal}`,
        { x: 70, y, size: 10 }
      );
    } else {
      page.drawText(
        `INR ${taskTotal}`,
        { x: 70, y, size: 10 }
      );
    }

    y -= 20;
  });

  // TOTALS (LEFT ALIGNED)
  y -= 10;

  page.drawText(`Total INR ${Math.round(subtotal)}`, { x: 50, y, size: 11 });
  y -= 15;

  page.drawText(`SGST (9%) INR ${Math.round(sgst)}`, { x: 50, y, size: 11 });
  y -= 15;

  page.drawText(`CGST (9%) INR ${Math.round(cgst)}`, { x: 50, y, size: 11 });
  y -= 20;

  page.drawText(`Grand Total INR ${Math.round(total)}`, {
    x: 50,
    y,
    size: 12
  });

  const pdfBytes = await pdfDoc.save();

  return new Response(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=invoice.pdf"
    }
  });
}
