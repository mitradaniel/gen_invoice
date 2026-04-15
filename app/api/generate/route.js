import { PDFDocument, StandardFonts } from "pdf-lib";

export const runtime = "nodejs";

const formatINR = (num) =>
  new Intl.NumberFormat("en-IN").format(Math.round(num || 0));

const formatDate = (d) => {
  if (!d) return "";
  const x = new Date(d);
  return `${String(x.getDate()).padStart(2, "0")}-${String(
    x.getMonth() + 1
  ).padStart(2, "0")}-${x.getFullYear()}`;
};

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      tasks = [],
      subject = "",
      invoice = "",
      date = "",
      to = "",
      subtotal = 0,
      sgst = 0,
      cgst = 0,
      total = 0,
      docType = "INVOICE",
      remarks = ""
    } = body;

    /* ===== CREATE NEW PDF ===== */
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { width } = page.getSize();

    /* ===== TITLE ===== */
    const titleWidth = bold.widthOfTextAtSize(docType, 24);

    page.drawText(docType, {
      x: (width - titleWidth) / 2,
      y: 780,
      size: 24,
      font: bold
    });

    /* ===== HEADER ===== */
    page.drawText(`Date: ${formatDate(date)}`, {
      x: width - 200,
      y: 760,
      size: 10,
      font
    });

    page.drawText(`Invoice: ${invoice}`, {
      x: width - 200,
      y: 745,
      size: 10,
      font
    });

    /* ===== TO ===== */
    let y = 700;

    page.drawText("TO,", { x: 50, y, size: 11, font: bold });
    y -= 16;

    to.split("\n").forEach((line) => {
      page.drawText(line, { x: 50, y, size: 10, font });
      y -= 14;
    });

    /* ===== SUBJECT ===== */
    y -= 10;
    page.drawText(`Subject: ${subject}`, {
      x: 50,
      y,
      size: 11,
      font: bold
    });

    /* ===== TASKS ===== */
    let taskY = y - 40;

    tasks.forEach((t, i) => {
      const val =
        t.type === "direct"
          ? t.amount || 0
          : (t.qty || 0) * (t.rate || 0);

      page.drawText(`${i + 1}. ${t.name}`, {
        x: 50,
        y: taskY,
        size: 10,
        font
      });

      taskY -= 14;

      const line =
        t.type === "direct"
          ? `₹ ${formatINR(val)}`
          : `${t.qty || 0} × ${formatINR(t.rate)} = ₹ ${formatINR(val)}`;

      page.drawText(line, {
        x: 70,
        y: taskY,
        size: 10,
        font
      });

      taskY -= 20;
    });

    /* ===== REMARKS ===== */
    if (remarks) {
      page.drawText("Remarks:", {
        x: 50,
        y: taskY,
        size: 11,
        font: bold
      });

      taskY -= 14;

      page.drawText(remarks, {
        x: 50,
        y: taskY,
        size: 10,
        font
      });

      taskY -= 20;
    }

    /* ===== TOTALS ===== */
    page.drawText(`Subtotal: ₹ ${formatINR(subtotal)}`, {
      x: 50,
      y: taskY,
      size: 11,
      font
    });

    taskY -= 15;

    page.drawText(`SGST: ₹ ${formatINR(sgst)}`, {
      x: 50,
      y: taskY,
      size: 11,
      font
    });

    taskY -= 15;

    page.drawText(`CGST: ₹ ${formatINR(cgst)}`, {
      x: 50,
      y: taskY,
      size: 11,
      font
    });

    taskY -= 20;

    page.drawText(`Grand Total: ₹ ${formatINR(total)}`, {
      x: 50,
      y: taskY,
      size: 12,
      font: bold
    });

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf"
      }
    });

  } catch (err) {
    console.error("PDF ERROR:", err);
    return new Response("PDF failed", { status: 500 });
  }
}
