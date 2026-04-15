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

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 800;

    /* ===== TITLE ===== */
    page.drawText(docType, {
      x: 50,
      y,
      size: 20,
      font: bold
    });

    y -= 30;

    /* ===== HEADER ===== */
    page.drawText(`Invoice: ${invoice}`, { x: 50, y, size: 10, font });
    y -= 15;

    page.drawText(`Date: ${formatDate(date)}`, { x: 50, y, size: 10, font });
    y -= 25;

    /* ===== TO ===== */
    page.drawText("TO:", { x: 50, y, size: 11, font: bold });
    y -= 15;

    (to || "").split("\n").forEach((line) => {
      page.drawText(line || "", { x: 50, y, size: 10, font });
      y -= 14;
    });

    y -= 10;

    /* ===== SUBJECT ===== */
    page.drawText(`Subject: ${subject}`, {
      x: 50,
      y,
      size: 11,
      font: bold
    });

    y -= 25;

    /* ===== TASKS ===== */
    tasks.forEach((t, i) => {
      const val =
        t.type === "direct"
          ? t.amount || 0
          : (t.qty || 0) * (t.rate || 0);

      page.drawText(`${i + 1}. ${t.name}`, {
        x: 50,
        y,
        size: 10,
        font
      });

      y -= 14;

      const line =
        t.type === "direct"
          ? `Rs. ${formatINR(val)}`
          : `${t.qty || 0} × ${formatINR(t.rate)} = Rs. ${formatINR(val)}`;

      page.drawText(line, {
        x: 70,
        y,
        size: 10,
        font
      });

      y -= 20;
    });

    /* ===== REMARKS ===== */
    if (remarks) {
      page.drawText("Remarks:", {
        x: 50,
        y,
        size: 11,
        font: bold
      });

      y -= 15;

      page.drawText(remarks, {
        x: 50,
        y,
        size: 10,
        font
      });

      y -= 20;
    }

    /* ===== TOTALS ===== */
    page.drawText(`Subtotal: Rs. ${formatINR(subtotal)}`, {
      x: 50,
      y,
      size: 11,
      font
    });

    y -= 15;

    page.drawText(`SGST: Rs. ${formatINR(sgst)}`, {
      x: 50,
      y,
      size: 11,
      font
    });

    y -= 15;

    page.drawText(`CGST: Rs. ${formatINR(cgst)}`, {
      x: 50,
      y,
      size: 11,
      font
    });

    y -= 20;

    page.drawText(`Grand Total: Rs. ${formatINR(total)}`, {
      x: 50,
      y,
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

    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}
