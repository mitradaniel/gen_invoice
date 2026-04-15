import { PDFDocument, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";

/* ===== DATE FORMAT ===== */
const formatDate = (inputDate) => {
  if (!inputDate) return "";

  const d = new Date(inputDate);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
};

/* ===== INR FORMAT (OPTIONAL BUT CLEAN) ===== */
const formatINR = (num) =>
  new Intl.NumberFormat("en-IN").format(Math.round(num || 0));

export const runtime = "nodejs";

export async function POST(req) {
  try {
    /* ===== BODY HANDLING (FIXED) ===== */
    const formData = await req.formData();
    const body = JSON.parse(formData.get("data") || "{}");

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

    const filePath = path.join(process.cwd(), "public", "Invoice_Template.pdf");
    const existingPdfBytes = fs.readFileSync(filePath);

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const page = pdfDoc.getPages()[0];

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { width } = page.getSize();

    /* ===== TEXT WRAP ===== */
    const drawWrappedText = (text, x, y, maxWidth, lineHeight, font, size) => {
      const words = (text || "").split(" ");
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

    /* ===== HEADER RIGHT ===== */
    page.drawText(`Date: ${formatDate(date)}`, {
      x: width - 150,
      y: 670,
      size: 10,
      font: bold
    });

    page.drawText(`Invoice: ${invoice}`, {
      x: width - 150,
      y: 650,
      size: 10,
      font: bold
    });

    /* ===== CENTER TITLE ===== */
    const title = docType || "INVOICE";
    const fontSize = 25;
    const textWidth = bold.widthOfTextAtSize(title, fontSize);
    const xCenter = (width - textWidth) / 2;

    page.drawText(title, {
      x: xCenter,
      y: 650,
      size: fontSize,
      font: bold
    });

    /* ===== SUBJECT ===== */
    page.drawText(`Subject: ${subject}`, {
      x: 50,
      y: 560,
      size: 12,
      font: bold
    });

    /* ===== TO ADDRESS ===== */
    let yTo = 720;

    page.drawText("TO,", { x: 50, y: yTo, size: 11, font: bold });
    yTo -= 18;

    (to || "").split("\n").forEach(line => {
      if (line.trim()) {
        page.drawText(line, { x: 50, y: yTo, size: 10, font });
        yTo -= 14;
      }
    });

    /* ===== TASKS ===== */
    let y = 520;

    tasks.forEach((t, i) => {

      let totalVal = 0;

      if (t.type === "sqft" || t.type === "nos") {
        totalVal = (t.qty || 0) * (t.rate || 0);
      } else if (t.type === "direct") {
        totalVal = t.amount || 0;
      }

      // Task title
      y = drawWrappedText(
        `${i + 1}. ${t.name || ""}`,
        50,
        y,
        400,
        14,
        bold,
        10
      );

      // Task value
      let valueText = "";

      if (t.type === "sqft") {
        valueText = `${t.qty || 0} SQFT × ${formatINR(t.rate)} = INR ${formatINR(totalVal)}`;
      } 
      else if (t.type === "nos") {
        valueText = `${t.qty || 0} Nos × ${formatINR(t.rate)} = INR ${formatINR(totalVal)}`;
      } 
      else {
        valueText = `INR ${formatINR(totalVal)}`;
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

    /* ===== TOTALS ===== */
    let yTotal = 200;

    const drawLeft = (label, value, boldText = false) => {
      page.drawText(`${label} INR ${formatINR(value)}`, {
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

    /* ===== REMARKS ===== */
    if (remarks && remarks.trim()) {

      let remarkY = yTotal - 20;

      page.drawText("Remarks:", {
        x: 50,
        y: remarkY,
        size: 11,
        font: bold
      });

      remarkY -= 15;

      drawWrappedText(
        remarks,
        50,
        remarkY,
        450,
        14,
        font,
        10
      );
    }

    /* ===== SAVE ===== */
    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice}.pdf`
      }
    });

  } catch (err) {
    console.error("🔥 PDF ERROR:", err);
    return new Response("PDF generation failed", { status: 500 });
  }
}
