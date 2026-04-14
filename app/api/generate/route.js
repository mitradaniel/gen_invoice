import { PDFDocument, StandardFonts } from "pdf-lib";

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      tasks,
      subject,
      invoice,
      date,
      subtotal,
      sgst,
      cgst,
      total
    } = body;

    // 🔥 ALWAYS USE ABSOLUTE URL IN VERCEL
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const templateUrl = `${baseUrl}/Invoice_Template.pdf`;

    console.log("Template URL:", templateUrl);

    const res = await fetch(templateUrl);

    if (!res.ok) {
      throw new Error("Template not found");
    }

    const templateBytes = await res.arrayBuffer();

    const pdfDoc = await PDFDocument.load(templateBytes);
    const page = pdfDoc.getPages()[0];

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // ===== HEADER =====
    page.drawText(date || "", { x: 460, y: 720, size: 10, font });
    page.drawText(invoice || "", { x: 520, y: 700, size: 10, font });

    page.drawText(subject || "", {
      x: 100,
      y: 650,
      size: 12,
      font: bold
    });

    // ===== TASKS =====
    let y = 600;

    tasks.forEach((t, i) => {
      const totalVal =
        t.mode === "qty"
          ? (t.qty || 0) * (t.rate || 0)
          : (t.amount || 0);

      // Line 1 (task)
      page.drawText(`${i + 1}. ${t.name}`, {
        x: 50,
        y,
        size: 10,
        font
      });

      y -= 14;

      // Line 2 (values)
      if (t.mode === "qty") {
        page.drawText(
          `${t.qty} ${t.unit || ""} x ${t.rate} = INR ${totalVal}`,
          { x: 70, y, size: 10, font }
        );
      } else {
        page.drawText(`INR ${totalVal}`, {
          x: 70,
          y,
          size: 10,
          font
        });
      }

      y -= 20;
    });

    // ===== TOTALS =====
    page.drawText(`Total INR ${Math.round(subtotal)}`, {
      x: 50,
      y: 200,
      size: 11,
      font: bold
    });

    page.drawText(`SGST INR ${Math.round(sgst)}`, {
      x: 50,
      y: 180,
      size: 11,
      font
    });

    page.drawText(`CGST INR ${Math.round(cgst)}`, {
      x: 50,
      y: 160,
      size: 11,
      font
    });

    page.drawText(`Grand Total INR ${Math.round(total)}`, {
      x: 50,
      y: 140,
      size: 12,
      font: bold
    });

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=${invoice}_${subject}.pdf`
      }
    });

  } catch (err) {
    console.error("PDF ERROR:", err);
    return new Response("PDF generation failed", { status: 500 });
  }
}
