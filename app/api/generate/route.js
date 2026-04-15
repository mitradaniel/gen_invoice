import { PDFDocument, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const formatDate = (inputDate) => {
  if (!inputDate) return "";
  const d = new Date(inputDate);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatINR = (num) => {
  return new Intl.NumberFormat("en-IN").format(Math.round(num || 0));
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

    const filePath = path.join(process.cwd(), "public", "Invoice_Template.pdf");

    if (!fs.existsSync(filePath)) {
      throw new Error("Invoice_Template.pdf missing in public folder");
    }

    const existingPdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const page = pdfDoc.getPages()[0];

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { width } = page.getSize();

    /* ===== TITLE ===== */
    const title = docType || "INVOICE";
    const fontSize = 24;
    const textWidth = bold.widthOfTextAtSize(title, fontSize);

    page.drawText(title, {
      x: (width - textWidth) / 2,
      y: 650,
      size: fontSize,
      font: bold
    });

    /* ===== HEADER ===== */
    page.drawText(`Date: ${formatDate(date)}`, {
      x: width - 160,
      y: 700,
      size: 10,
      font
    });

    page.drawText(`Invoice: ${invoice}`, {
      x: width - 160,
      y: 680,
      size: 10,
      font
    });

    /* ===== TO ===== */
    let y = 620;

    page.drawText("TO,", { x: 50, y, size: 11, font: bold });
    y -= 16;

    to.split("\n").forEach(line => {
      page.drawText(line, { x: 50, y, size: 10, font });
      y -= 14;
    });

    /* ===== SUBJECT ===== */
    page.drawText(`Subject: ${subject}`, {
      x: 50,
      y: y - 10,
      size: 11,
      font: bold
    });

    /* ===== TASKS ===== */
    let taskY = y - 60;

    tasks.forEach((t, i) => {
      const val = t.type === "direct"
        ? t.amount || 0
        : (t.qty || 0) * (t.rate || 0);

      page.drawText(`${i + 1}. ${t.name}`, {
        x: 50,
        y: taskY,
        size: 10,
        font
      });

      taskY -= 14;

      let line = "";

      if (t.type === "direct") {
        line = `₹ ${formatINR(val)}`;
      } else {
        line = `${t.qty || 0} × ${formatINR(t.rate)} = ₹ ${formatINR(val)}`;
      }

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

      taskY -= 15;

      page.drawText(remarks, {
        x: 50,
        y: taskY,
        size: 10,
        font
      });

      taskY -= 20;
    }

    /* ===== TOTALS ===== */
    page.drawText(`Subtotal: ₹ ${formatINR(subtotal)}`, { x: 50, y: taskY, size: 11, font });
    taskY -= 15;

    page.drawText(`SGST: ₹ ${formatINR(sgst)}`, { x: 50, y: taskY, size: 11, font });
    taskY -= 15;

    page.drawText(`CGST: ₹ ${formatINR(cgst)}`, { x: 50, y: taskY, size: 11, font });
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
    return new Response("PDF generation failed", { status: 500 });
  }
}
