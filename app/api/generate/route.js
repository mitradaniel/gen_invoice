import { PDFDocument, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";

const formatDate = (inputDate) => {
  if (!inputDate) return "";

  const d = new Date(inputDate);
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`;
};

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
      total = 0,
      docType = "INVOICE" // ✅ ADDED
    } = body;

    const filePath = path.join(process.cwd(), "public", "Invoice_Template.pdf");
    const existingPdfBytes = fs.readFileSync(filePath);

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const page = pdfDoc.getPages()[0];

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { width } = page.getSize();

    /* ===== TITLE ===== */
    const text = docType || "INVOICE"; // ✅ UPDATED
    const fontSize = 25;
    const textWidth = bold.widthOfTextAtSize(text, fontSize);
    const xCenter = (width - textWidth) / 2;

    page.drawText(text, {
      x: xCenter,
      y: 650,
      size: fontSize,
      font: bold
    });

    /* ===== REST SAME ===== */

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      headers: { "Content-Type": "application/pdf" }
    });

  } catch (err) {
    console.error("PDF ERROR:", err);
    return new Response("PDF generation failed", { status: 500 });
  }
}
