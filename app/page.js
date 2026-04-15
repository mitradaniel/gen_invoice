"use client";
import { useState } from "react";

export default function Page() {

  const [tasks, setTasks] = useState([]);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [invoice, setInvoice] = useState("");
  const [date, setDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [docType, setDocType] = useState("INVOICE");
  const [loading, setLoading] = useState(false);

  /* ===== ADD TASK ===== */
  const addTask = () => {
    setTasks([
      ...tasks,
      {
        id: Date.now(),
        name: "",
        type: "sqft",
        qty: 0,
        rate: 0,
        amount: 0
      }
    ]);
  };

  /* ===== DELETE TASK ===== */
  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  /* ===== UPDATE TASK ===== */
  const updateTask = (id, field, value) => {
    setTasks(tasks.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  /* ===== CALCULATE ===== */
  const getTotal = (t) => {
    if (t.type === "direct") return t.amount || 0;
    return (t.qty || 0) * (t.rate || 0);
  };

  const subtotal = tasks.reduce((sum, t) => sum + getTotal(t), 0);
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  /* ===== GENERATE PDF ===== */
  const generatePDF = () => {
    try {
      setLoading(true);

      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/api/generate";
      form.target = "_blank";

      const data = {
        to,
        tasks,
        subject,
        invoice,
        date,
        subtotal,
        sgst: gst / 2,
        cgst: gst / 2,
        total,
        docType,
        remarks
      };

      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "data";
      input.value = JSON.stringify(data);

      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
      form.remove();

      setLoading(false);

    } catch {
      alert("PDF failed");
      setLoading(false);
    }
  };

  /* ===== UI ===== */
  return (
    <div style={{ maxWidth: 700, margin: "auto", padding: 20 }}>

      <h2>Invoice Generator</h2>

      {/* DOC TYPE */}
      <select value={docType} onChange={(e)=>setDocType(e.target.value)}>
        <option value="INVOICE">Invoice</option>
        <option value="QUOTATION">Quotation</option>
      </select>

      {/* TO */}
      <textarea
        placeholder="To Address"
        value={to}
        onChange={(e)=>setTo(e.target.value)}
      />

      {/* SUBJECT */}
      <input
        placeholder="Subject"
        value={subject}
        onChange={(e)=>setSubject(e.target.value)}
      />

      {/* REMARKS */}
      <textarea
        placeholder="Remarks"
        value={remarks}
        onChange={(e)=>setRemarks(e.target.value)}
      />

      {/* INVOICE + DATE */}
      <input
        placeholder="Invoice Number"
        value={invoice}
        onChange={(e)=>setInvoice(e.target.value)}
      />

      <input
        type="date"
        value={date}
        onChange={(e)=>setDate(e.target.value)}
      />

      {/* TASKS */}
      {tasks.map((t) => (
        <div key={t.id} style={{ border: "1px solid #ddd", padding: 10, marginTop: 10 }}>

          <input
            placeholder="Task Name"
            value={t.name}
            onChange={(e)=>updateTask(t.id,"name",e.target.value)}
          />

          {/* TYPE */}
          <select
            value={t.type}
            onChange={(e)=>updateTask(t.id,"type",e.target.value)}
          >
            <option value="sqft">SQFT</option>
            <option value="nos">NOs</option>
            <option value="direct">Direct</option>
          </select>

          {/* INPUTS */}
          {t.type !== "direct" ? (
            <>
              <input
                type="number"
                placeholder="Qty"
                onChange={(e)=>updateTask(t.id,"qty",+e.target.value)}
              />
              <input
                type="number"
                placeholder="Rate"
                onChange={(e)=>updateTask(t.id,"rate",+e.target.value)}
              />
            </>
          ) : (
            <input
              type="number"
              placeholder="Amount"
              onChange={(e)=>updateTask(t.id,"amount",+e.target.value)}
            />
          )}

          <div>₹ {getTotal(t)}</div>

          <button onClick={()=>deleteTask(t.id)}>Delete</button>
        </div>
      ))}

      <button onClick={addTask}>Add Task</button>

      {/* TOTAL */}
      <h3>Subtotal: ₹ {subtotal}</h3>
      <h3>GST: ₹ {gst}</h3>
      <h2>Total: ₹ {total}</h2>

      {/* GENERATE */}
      <button onClick={generatePDF} disabled={loading}>
        {loading ? "Generating..." : "Generate PDF"}
      </button>

    </div>
  );
}
