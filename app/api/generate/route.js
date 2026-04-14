import { PDFDocument, rgb } from "pdf-lib";

export async function POST(req) {
  const body = await req.json();
  const { tasks, subject, invoice, date, subtotal, gst, total } = body;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);

  const { width, height } = page.getSize();

  let y = height - 50;

  page.drawText("INVOICE", { x: 250, y, size: 18 });
  y -= 30;

  page.drawText(`Date: ${date}`, { x: 50, y });
  page.drawText(`Invoice: ${invoice}`, { x: 350, y });
  y -= 20;

  page.drawText(`Subject: ${subject}`, { x: 50, y });
  y -= 30;

  tasks.forEach((t, i) => {
    page.drawText(`${i + 1}. ${t.name}`, { x: 50, y });
    y -= 15;
    page.drawText(`${t.qty} x ${t.rate} = ₹${t.qty * t.rate}`, { x: 70, y });
    y -= 20;
  });

  page.drawText(`Subtotal: ₹${subtotal}`, { x: 50, y });
  y -= 15;
  page.drawText(`GST: ₹${gst}`, { x: 50, y });
  y -= 15;
  page.drawText(`Total: ₹${total}`, { x: 50, y });

  const pdfBytes = await pdfDoc.save();

  return new Response(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
    },
  });
}