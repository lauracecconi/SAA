import React, { useState } from 'react';

const GRADE_OPTIONS = ['Pre-K', 'K', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
const ORNAMENT_PRICE = 22;
const PHOTO_PRICE = 5;
const VENMO_HANDLE = 'SAAParents';
// Paste the Web App URL you get from deploying the Apps Script here
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxCgVIjCikbiofvIjkrO_pgPVjxqZFqBeYYfUWSqFJdcUMcxkAxwpusGxTYzTMkvtI/exec';

let nextId = 1;
const makeStudent = () => ({
  id: nextId++,
  name: '',
  grade: '',
  teacher: '',
  ornaments: 0,
  photos: 0,
});

export default function FundraiserOrder() {
  const [customerName, setCustomerName] = useState('');
  const [students, setStudents] = useState([makeStudent()]);
  const [paymentMethod, setPaymentMethod] = useState('venmo');
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const updateStudent = (id, field, value) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const adjustCount = (id, field, delta) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, [field]: Math.max(0, s[field] + delta) } : s
      )
    );
  };

  const addStudent = () => {
    setStudents((prev) => [...prev, makeStudent()]);
  };

  const removeStudent = (id) => {
    setStudents((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev));
  };

  const studentTotal = (s) => s.ornaments * ORNAMENT_PRICE + s.photos * PHOTO_PRICE;
  const total = students.reduce((sum, s) => sum + studentTotal(s), 0);

  const note = `Holiday Fundraiser - ${students
    .map((s) => {
      const parts = [];
      if (s.ornaments > 0) parts.push(`${s.ornaments} ornament${s.ornaments > 1 ? 's' : ''}`);
      if (s.photos > 0) parts.push(`${s.photos} photo${s.photos > 1 ? 's' : ''}`);
      const label = [s.name, s.grade, s.teacher].filter(Boolean).join(' / ');
      return `${label}${parts.length ? ` (${parts.join(', ')})` : ''}`;
    })
    .join('; ')}`;

  // Single universal link: works on desktop and mobile browsers alike.
  // If the Venmo app is installed on mobile, the OS hands this off to it automatically.
  // If not, it falls back gracefully to the Venmo web checkout - no dead ends.
  const venmoLink = `https://venmo.com/${VENMO_HANDLE}?txn=pay&amount=${total}&note=${encodeURIComponent(
    note
  )}`;

  const handleSubmit = async () => {
    if (!customerName) {
      setError('Please enter Parent/Guardian name');
      return;
    }
    for (const s of students) {
      if (!s.name || !s.grade || !s.teacher) {
        setError('Please fill in name, grade, and homeroom teacher for every student');
        return;
      }
    }
    if (total === 0) {
      setError('Please select at least one ornament or photo');
      return;
    }
    setError('');
    setSaving(true);

    // Fire-and-forget to the Apps Script web app. mode: 'no-cors' avoids CORS
    // preflight issues but also means we can't read a real success/failure
    // response back - if this URL isn't configured yet, this just silently
    // no-ops and the order still completes for the parent.
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ customerName, paymentMethod, students }),
      });
    } catch (err) {
      // Network error reaching the sheet - don't block the parent's order
    }

    setSaving(false);
    setSubmitted(true);
  };

  const handleReset = () => {
    setCustomerName('');
    setStudents([makeStudent()]);
    setPaymentMethod('venmo');
    setSubmitted(false);
    setCopied(false);
    setError('');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`$${total} - ${note}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Clipboard API unavailable - silently ignore, link is still the primary path
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🎄</div>
            <h2 className="text-3xl font-bold text-green-700 mb-4">Order Confirmed!</h2>

            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-semibold text-lg mb-3">Order Summary:</h3>
              <p className="mb-3"><strong>Parent Name:</strong> {customerName}</p>
              {students.map((s) => (
                <div key={s.id} className="mb-3 pb-3 border-b last:border-b-0">
                  <p className="font-semibold">
                    {s.name} — {s.grade} — {s.teacher}
                  </p>
                  {s.ornaments > 0 && (
                    <p className="text-sm text-gray-700">
                      Ornaments: {s.ornaments} × ${ORNAMENT_PRICE} = ${s.ornaments * ORNAMENT_PRICE}
                    </p>
                  )}
                  {s.photos > 0 && (
                    <p className="text-sm text-gray-700">
                      Photos with Santa: {s.photos} × ${PHOTO_PRICE} = ${s.photos * PHOTO_PRICE}
                    </p>
                  )}
                </div>
              ))}
              <p className="text-xl font-bold mt-4 pt-4 border-t">
                <strong>Total:</strong> ${total}
              </p>
            </div>

            {paymentMethod === 'venmo' ? (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-lg mb-3">Payment Instructions:</h3>
                <p className="mb-3">
                  Please send <strong>${total}</strong> via Venmo to:
                </p>
                <a
                  href={venmoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition mb-3"
                >
                  Pay @{VENMO_HANDLE} on Venmo
                </a>
                <p className="text-sm text-gray-600 mb-3">
                  This opens the Venmo app if you have it installed, or the Venmo site if you don't.
                  The amount and note are already filled in - just review and confirm.
                </p>
                <button
                  onClick={handleCopy}
                  className="text-sm text-blue-700 underline hover:text-blue-900"
                >
                  {copied ? 'Copied!' : 'Copy amount + note instead'}
                </button>
              </div>
            ) : (
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-lg mb-3">Cash Payment:</h3>
                <p>Please bring <strong>${total}</strong> in cash to the school office.</p>
              </div>
            )}

            <button
              onClick={handleReset}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition"
            >
              Place Another Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-700 mb-2">🎄 Holiday Fundraiser 🎄</h1>
          <p className="text-gray-600">Support our school with ornaments and Photos with Santa!</p>
        </div>

        <div>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Parent/Guardian Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Your name"
            />
          </div>

          <div className="space-y-6 mb-6">
            {students.map((s, index) => (
              <div key={s.id} className="border-2 border-green-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-green-700">Student {index + 1}</p>
                  {students.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStudent(s.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Student Name
                    </label>
                    <input
                      type="text"
                      value={s.name}
                      onChange={(e) => updateStudent(s.id, 'name', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Student's name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Grade
                    </label>
                    <select
                      value={s.grade}
                      onChange={(e) => updateStudent(s.id, 'grade', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select</option>
                      {GRADE_OPTIONS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Homeroom Teacher
                    </label>
                    <input
                      type="text"
                      value={s.teacher}
                      onChange={(e) => updateStudent(s.id, 'teacher', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Teacher's name"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">Ornament</p>
                      <p className="text-xs text-gray-500">${ORNAMENT_PRICE} each</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => adjustCount(s.id, 'ornaments', -1)}
                        className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 font-bold"
                      >
                        −
                      </button>
                      <span className="w-6 text-center font-semibold">{s.ornaments}</span>
                      <button
                        type="button"
                        onClick={() => adjustCount(s.id, 'ornaments', 1)}
                        className="w-7 h-7 rounded-full bg-green-600 text-white hover:bg-green-700 font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">Photo with Santa</p>
                      <p className="text-xs text-gray-500">${PHOTO_PRICE} each</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => adjustCount(s.id, 'photos', -1)}
                        className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 font-bold"
                      >
                        −
                      </button>
                      <span className="w-6 text-center font-semibold">{s.photos}</span>
                      <button
                        type="button"
                        onClick={() => adjustCount(s.id, 'photos', 1)}
                        className="w-7 h-7 rounded-full bg-red-600 text-white hover:bg-red-700 font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {studentTotal(s) > 0 && (
                  <p className="text-right text-sm font-semibold text-green-700 mt-2">
                    Subtotal: ${studentTotal(s)}
                  </p>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addStudent}
            className="w-full mb-6 border-2 border-dashed border-green-400 text-green-700 py-2 rounded-lg font-semibold hover:bg-green-50 transition"
          >
            + Add Another Student
          </button>

          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 mb-6">
            <span className="font-semibold text-gray-700">Total</span>
            <span className="text-2xl font-bold text-green-700">${total}</span>
          </div>

          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-2">Payment Method</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'venmo'}
                  onChange={() => setPaymentMethod('venmo')}
                />
                Venmo
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'cash'}
                  onChange={() => setPaymentMethod('cash')}
                />
                Cash
              </label>
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm font-semibold mb-3 text-center">{error}</p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition disabled:opacity-60"
          >
            {saving ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
