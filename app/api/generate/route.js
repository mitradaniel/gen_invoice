import { PDFDocument, StandardFonts } from "pdf-lib";

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
      docType = "INVOICE",
      remarks = ""
    } = body;

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]); // <-- FIXED (let)

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 800;

    page.drawText(docType, { x: 50, y, size: 20, font: bold });
    y -= 30;

    page.drawText(`Invoice: ${invoice}`, { x: 50, y, size: 10, font });
    y -= 15;

    page.drawText(`Date: ${date}`, { x: 50, y, size: 10, font });
    y -= 25;

    page.drawText("TO:", { x: 50, y, size: 11, font: bold });
    y -= 15;

    (to || "").split("\n").forEach(line => {
      page.drawText(line || "", { x: 50, y, size: 10, font });
      y -= 14;
    });

    y -= 10;

    page.drawText(`Subject: ${subject}`, { x: 50, y, size: 11, font: bold });
    y -= 25;

    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];

      const val =
        t.type === "direct"
          ? Number(t.amount || 0)
          : Number(t.qty || 0) * Number(t.rate || 0);

      page.drawText(`${i + 1}. ${t.name || ""}`, { x: 50, y, size: 10, font });
      y -= 14;

      const line =
        t.type === "direct"
          ? `₹ ${val}`
          : `${t.qty || 0} × ${t.rate || 0} = ₹ ${val}`;

      page.drawText(line, { x: 70, y, size: 10, font });
      y -= 20;
    }

    if (remarks) {
      page.drawText("Remarks:", { x: 50, y, size: 11, font: bold });
      y -= 15;

      page.drawText(remarks, { x: 50, y, size: 10, font });
      y -= 20;
    }

    page.drawText(`Subtotal: ₹ ${subtotal}`, { x: 50, y, size: 11, font });
    y -= 15;

    page.drawText(`SGST: ₹ ${sgst}`, { x: 50, y, size: 11, font });
    y -= 15;

    page.drawText(`CGST: ₹ ${cgst}`, { x: 50, y, size: 11, font });
    y -= 20;

    page.drawText(`Grand Total: ₹ ${total}`, { x: 50, y, size: 12, font: bold });

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf"
      }
    });

  } catch (err) {
    console.error("REAL ERROR:", err);

    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}
