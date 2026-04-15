import { PDFDocument, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";

/* ✅ REQUIRED for fs in Next.js */
export const runtime = "nodejs";

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
    } = body;

    let pdfDoc;

    /* ================= SAFE TEMPLATE LOAD ================= */
    try {
      const filePath = path.join(
        process.cwd(),
        "public",
        "Invoice_Template.pdf"
      );

      if (!fs.existsSync(filePath)) {
        throw new Error("Template not found");
      }

      const existingPdfBytes = fs.readFileSync(filePath);

      pdfDoc = await PDFDocument.load(existingPdfBytes, {
        ignoreEncryption: true,
      });

    } catch (err) {
      console.log("⚠️ Template load failed:", err.message);

      pdfDoc = await PDFDocument.create();
    }

    /* ================= ENSURE PAGE EXISTS ================= */
    let pages = pdfDoc.getPages();

    if (!pages || pages.length === 0) {
      pdfDoc.addPage([595, 842]); // A4
    }

    const page = pdfDoc.getPages()[0];

    /* ================= FONTS ================= */
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { width, height } = page.getSize();

    /* ================= TO ADDRESS ================= */
    let y = height - 120;

    to.split("\n").forEach((line) => {
      page.drawText(line, {
        x: 50,
        y,
        size: 10,
        font,
      });
      y -= 14;
    });

    /* ================= SUBJECT ================= */
    y -= 10;

    page.drawText(`Subject: ${subject}`, {
      x: 50,
      y,
      size: 11,
      font: boldFont,
    });

    /* ================= DATE + INVOICE ================= */
    page.drawText(`Date: ${date}`, {
      x: width - 180,
      y: height - 60,
      size: 10,
      font,
    });

    page.drawText(`Invoice: ${invoice}`, {
      x: width - 180,
      y: height - 75,
      size: 10,
      font,
    });

    /* ================= TASKS ================= */
    let taskY = height - 230;

    tasks.forEach((t, i) => {
      const amount =
        t.type === "direct"
          ? t.amount || 0
          : (t.qty || 0) * (t.rate || 0);

      const text =
        t.type === "direct"
          ? `${i + 1}. ${t.name}`
          : `${i + 1}. ${t.name} (${t.qty} x ${t.rate})`;

      page.drawText(text, {
        x: 60,
        y: taskY,
        size: 10,
        font,
      });

      page.drawText(`₹ ${amount.toFixed(0)}`, {
        x: width - 100,
        y: taskY,
        size: 10,
        font,
      });

      taskY -= 18;
    });

    /* ================= CALCULATIONS ================= */
    let calcY = taskY - 20;

    const rightX = width - 160;

    const drawLine = (label, value, bold = false) => {
      page.drawText(label, {
        x: rightX,
        y: calcY,
        size: 10,
        font: bold ? boldFont : font,
      });

      page.drawText(`₹ ${value.toFixed(0)}`, {
        x: rightX + 80,
        y: calcY,
        size: 10,
        font: bold ? boldFont : font,
      });

      calcY -= 15;
    };

    drawLine("Subtotal:", subtotal);
    drawLine("SGST:", sgst);
    drawLine("CGST:", cgst);
    drawLine("Total:", total, true);

    /* ================= SAVE ================= */
    const pdfBytes = await pdfDoc.save();

    /* 🔥 CRITICAL FIX (prevents corruption) */
    const pdfBuffer = Buffer.from(pdfBytes);

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice || "invoice"}.pdf`,
      },
    });

  } catch (err) {
    console.error("❌ FINAL PDF ERROR:", err);

    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}
