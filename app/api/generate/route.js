import { PDFDocument, StandardFonts } from "pdf-lib";

export async function POST(req) {
  const body = await req.json();

  const { tasks, subject, invoice, date, subtotal, sgst, cgst, total } = body;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = 760;

  // ===== HEADER =====
  page.drawText("2026 - 2027", { x: 50, y, size: 10, font });

  y -= 20;
  page.drawText("Khemraj M Rasganya", {
    x: 50,
    y,
    size: 16,
    font: bold
  });

  y -= 20;
  page.drawText("It always seems impossible until it's done.", {
    x: 50,
    y,
    size: 10,
    font
  });

  y -= 25;

  // ADDRESS BLOCK
  const addressLines = [
    "B22, Shree Charan Kamal",
    "Plot No. 10, Sector- 14, Koper Khairane",
    "Navi Mumbai - 400709",
    "",
    "GSTIN : 27AFOPM6956J1ZN",
    "Bank : HDFC BANK",
    "A/C. : 50200001207293",
    "IFSC : HDFC0000228",
    "PAN : AFOPM6956J",
    "Krasganya@yahoo.com",
    "9821025032"
  ];

  addressLines.forEach(line => {
    page.drawText(line, { x: 50, y, size: 9, font });
    y -= 14;
  });

  // ===== INVOICE TITLE =====
  page.drawText("INVOICE", {
    x: 250,
    y: 600,
    size: 16,
    font: bold
  });

  // ===== RIGHT HEADER =====
  page.drawText("Date -", { x: 360, y: 580, font: bold, size: 10 });
  page.drawText(date, { x: 420, y: 580, font, size: 10 });

  page.drawText("Invoice Number -", { x: 360, y: 560, font: bold, size: 10 });
  page.drawText(invoice, { x: 500, y: 560, font, size: 10 });

  // ===== SUBJECT =====
  page.drawText("Sub :-", { x: 50, y: 560, font: bold, size: 11 });
  page.drawText(subject, { x: 100, y: 560, font: bold, size: 11 });

  // ===== TASKS =====
  let taskY = 520;

  tasks.forEach((t, i) => {
    const totalVal =
      t.mode === "qty"
        ? (t.qty || 0) * (t.rate || 0)
        : (t.amount || 0);

    // Line 1
    page.drawText(`${i + 1}. ${t.name}`, {
      x: 50,
      y: taskY,
      size: 10,
      font
    });

    taskY -= 14;

    // Line 2
    if (t.mode === "qty") {
      page.drawText(`${t.qty} x ${t.rate} = INR ${totalVal}`, {
        x: 70,
        y: taskY,
        size: 10,
        font
      });
    } else {
      page.drawText(`INR ${totalVal}`, {
        x: 70,
        y: taskY,
        size: 10,
        font
      });
    }

    taskY -= 20;
  });

  // ===== TOTALS =====
  taskY -= 10;

  page.drawText(`Total INR ${Math.round(subtotal)}`, {
    x: 50,
    y: taskY,
    size: 11,
    font: bold
  });

  taskY -= 15;
  page.drawText(`SGST (9%) INR ${Math.round(sgst)}`, {
    x: 50,
    y: taskY,
    size: 11,
    font
  });

  taskY -= 15;
  page.drawText(`CGST (9%) INR ${Math.round(cgst)}`, {
    x: 50,
    y: taskY,
    size: 11,
    font
  });

  taskY -= 20;
  page.drawText(`Grand Total INR ${Math.round(total)}`, {
    x: 50,
    y: taskY,
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
