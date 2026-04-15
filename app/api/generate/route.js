import { PDFDocument, StandardFonts } from "pdf-lib";

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      to = "",
      tasks = [],
      subject = "",
      invoice = "",
      date = "",
      subtotal = 0,
      sgst = 0,
      cgst = 0,
      total = 0
    } = body || {};

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { width, height } = page.getSize();

    let y = height - 80;

    (to || "").split("\n").forEach(line => {
      page.drawText(line, { x: 50, y, size: 10, font });
      y -= 14;
    });

    y -= 10;

    page.drawText(`Subject: ${subject}`, {
      x: 50,
      y,
      size: 11,
      font: boldFont
    });

    page.drawText(`Date: ${date}`, {
      x: width - 180,
      y: height - 60,
      size: 10,
      font
    });

    page.drawText(`Invoice: ${invoice}`, {
      x: width - 180,
      y: height - 75,
      size: 10,
      font
    });

    let taskY = height - 200;

    (tasks || []).forEach((t, i) => {
      const amount =
        t?.type === "direct"
          ? t?.amount || 0
          : (t?.qty || 0) * (t?.rate || 0);

      const label =
        t?.type === "direct"
          ? `${i + 1}. ${t?.name || ""}`
          : `${i + 1}. ${t?.name || ""} (${t?.qty || 0} x ${t?.rate || 0})`;

      page.drawText(label, { x: 50, y: taskY, size: 10, font });

      page.drawText(`₹ ${amount.toFixed(0)}`, {
        x: width - 100,
        y: taskY,
        size: 10,
        font
      });

      taskY -= 18;
    });

    let calcY = taskY - 20;

    const draw = (label, value, bold = false) => {
      page.drawText(label, {
        x: width - 160,
        y: calcY,
        size: 10,
        font: bold ? boldFont : font
      });

      page.drawText(`₹ ${Number(value || 0).toFixed(0)}`, {
        x: width - 80,
        y: calcY,
        size: 10,
        font: bold ? boldFont : font
      });

      calcY -= 15;
    };

    draw("Subtotal:", subtotal);
    draw("SGST:", sgst);
    draw("CGST:", cgst);
    draw("Total:", total, true);

    const pdfBytes = await pdfDoc.save();

    console.log("PDF generated successfully");

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf"
      }
    });

  } catch (err) {
    console.error("❌ PDF ERROR:", err);

    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}
