import { PDFDocument, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";

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

    // TO
    let yTo = 700;
    page.drawText("TO,", { x: 50, y: yTo, size: 11, font });
    yTo -= 16;

    (to || "").split("\n").forEach(line => {
      if (line.trim()) {
        page.drawText(line, { x: 50, y: yTo, size: 11, font });
        yTo -= 14;
      }
    });

    // HEADER
    page.drawText(date, { x: 460, y: 720, size: 10, font });
    page.drawText(invoice, { x: 520, y: 700, size: 10, font });

    // SUBJECT
    page.drawText(subject, { x: 100, y: 650, size: 12, font: bold });

    // TASKS
    let y = 600;

    tasks.forEach((t, i) => {
      let totalVal = 0;

      if (t.type === "direct") totalVal = t.amount || 0;
      else totalVal = (t.qty || 0) * (t.rate || 0);

      page.drawText(`${i + 1}. ${t.name}`, { x: 50, y, size: 10, font });
      y -= 14;

      if (t.type === "direct") {
        page.drawText(`INR ${Math.round(totalVal)}`, { x: 70, y, size: 10, font });
      } else {
        const unitLabel = t.type === "sqft" ? "SQFT/RFT" : "Nos";
        page.drawText(
          `${t.qty || 0} ${unitLabel} x ${t.rate || 0} = INR ${Math.round(totalVal)}`,
          { x: 70, y, size: 10, font }
        );
      }

      y -= 20;
    });

    // TOTALS
    page.drawText(`Total INR ${Math.round(subtotal)}`, { x: 50, y: 200, size: 11, font: bold });
    page.drawText(`SGST INR ${Math.round(sgst)}`, { x: 50, y: 180, size: 11, font });
    page.drawText(`CGST INR ${Math.round(cgst)}`, { x: 50, y: 160, size: 11, font });
    page.drawText(`Grand Total INR ${Math.round(total)}`, { x: 50, y: 140, size: 12, font: bold });

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
