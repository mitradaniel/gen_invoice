import { PDFDocument, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

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
      total = 0
    } = body;

    const filePath = path.join(process.cwd(), "public", "Invoice_Template.pdf");
    const existingPdfBytes = fs.readFileSync(filePath);

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const page = pdfDoc.getPages()[0];

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { width } = page.getSize();

    /* ================= TO ADDRESS ================= */
    let yTo = 700;

    page.drawText("TO,", { x: 50, y: yTo, size: 11, font: bold });
    yTo -= 18;

    (to || "").split("\n").forEach(line => {
      if (line.trim()) {
        page.drawText(line, { x: 50, y: yTo, size: 10, font });
        yTo -= 14;
      }
    });

    /* ================= HEADER (RIGHT SIDE) ================= */
    page.drawText(`Date: ${date}`, {
      x: width - 180,
      y: 720,
      size: 10,
      font
    });

    page.drawText(`Invoice No: ${invoice}`, {
      x: width - 180,
      y: 700,
      size: 10,
      font
    });

    /* ================= SUBJECT ================= */
    page.drawText(`Subject: ${subject}`, {
      x: 50,
      y: 650,
      size: 12,
      font: bold
    });

    /* ================= TASKS ================= */
    let y = 600;

    tasks.forEach((t, i) => {
      let totalVal = 0;

      if (t.mode === "qty") totalVal = (t.qty || 0) * (t.rate || 0);
      else if (t.mode === "rate") totalVal = t.rate || 0;
      else totalVal = t.amount || 0;

      // Title
      page.drawText(`${i + 1}. ${t.name}`, {
        x: 50,
        y,
        size: 10,
        font: bold
      });

      y -= 14;

      // Details
      if (t.mode === "qty") {
        page.drawText(
          `${t.qty || 0} ${t.unit || ""} × ${t.rate || 0}`,
          { x: 60, y, size: 10, font }
        );
      } else if (t.mode === "rate") {
        page.drawText(`Rate`, { x: 60, y, size: 10, font });
      } else {
        page.drawText(`Direct Amount`, { x: 60, y, size: 10, font });
      }

      // Amount RIGHT ALIGNED
      page.drawText(`INR ${Math.round(totalVal)}`, {
        x: width - 120,
        y,
        size: 10,
        font
      });

      y -= 20;
    });

    /* ================= TOTALS (RIGHT SIDE) ================= */

    let yTotal = 200;

    const drawRight = (label, value, boldText = false) => {
      page.drawText(label, {
        x: width - 220,
        y: yTotal,
        size: 11,
        font: boldText ? bold : font
      });

      page.drawText(`INR ${Math.round(value)}`, {
        x: width - 100,
        y: yTotal,
        size: 11,
        font: boldText ? bold : font
      });

      yTotal -= 18;
    };

    drawRight("Subtotal:", subtotal);
    drawRight("SGST (9%):", sgst);
    drawRight("CGST (9%):", cgst);
    drawRight("Grand Total:", total, true);

    /* ================= SAVE ================= */

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=${invoice}_${subject}.pdf`
      }
    });

  } catch (err) {
    console.error("🔥 PDF ERROR:", err);
    return new Response("PDF generation failed", { status: 500 });
  }
}
