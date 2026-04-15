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

    /* ================= TEXT WRAP FUNCTION ================= */
    const drawWrappedText = (text, x, y, maxWidth, lineHeight, font, size) => {
      const words = text.split(" ");
      let line = "";
      let lines = [];

      words.forEach(word => {
        const testLine = line + word + " ";
        const textWidth = font.widthOfTextAtSize(testLine, size);

        if (textWidth > maxWidth) {
          lines.push(line);
          line = word + " ";
        } else {
          line = testLine;
        }
      });

      lines.push(line);

      lines.forEach((l, i) => {
        page.drawText(l.trim(), {
          x,
          y: y - i * lineHeight,
          size,
          font
        });
      });

      return y - lines.length * lineHeight;
    };

    /* ================= HEADER RIGHT ================= */
    page.drawText(`Date: ${date}`, {
      x: width - 150,
      y: 670,
      size: 10,
      font
    });

    page.drawText(`Invoice: ${invoice}`, {
      x: width - 150,
      y: 650,
      size: 10,
      font
    });

    /* ================= SUBJECT (ALIGN WITH HEADER) ================= */
    page.drawText(`Subject: ${subject}`, {
      x: 50,
      y: 730,
      size: 12,
      font: bold
    });

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

    /* ================= TASKS ================= */
    let y = 600;

    tasks.forEach((t, i) => {
      let totalVal = 0;

      if (t.mode === "qty") totalVal = (t.qty || 0) * (t.rate || 0);
      else if (t.mode === "rate") totalVal = t.rate || 0;
      else totalVal = t.amount || 0;

      // TASK TITLE (WRAPPED)
      y = drawWrappedText(
        `${i + 1}. ${t.name}`,
        50,
        y,
        400,
        14,
        bold,
        10
      );

      // VALUE BELOW (NOT RIGHT SIDE)
      let valueText = "";

      if (t.mode === "qty") {
        valueText = `${t.qty || 0} ${t.unit || ""} × ${t.rate || 0} = INR ${Math.round(totalVal)}`;
      } else if (t.mode === "rate") {
        valueText = `Rate = INR ${Math.round(totalVal)}`;
      } else {
        valueText = `INR ${Math.round(totalVal)}`;
      }

      y = drawWrappedText(
        valueText,
        60,
        y - 2,
        400,
        14,
        font,
        10
      );

      y -= 10;
    });

    /* ================= TOTALS (LEFT SIDE) ================= */

    let yTotal = 200;

    const drawLeft = (label, value, boldText = false) => {
      page.drawText(`${label} INR ${Math.round(value)}`, {
        x: 50,
        y: yTotal,
        size: boldText ? 12 : 11,
        font: boldText ? bold : font
      });

      yTotal -= 18;
    };

    drawLeft("Subtotal:", subtotal);
    drawLeft("SGST:", sgst);
    drawLeft("CGST:", cgst);
    drawLeft("Grand Total:", total, true);

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
