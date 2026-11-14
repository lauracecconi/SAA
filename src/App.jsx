import React, { useState } from 'react';

// ---------- Settings ----------
// Homerooms and their teachers (from the 2026 student list).
// Picking a homeroom fills in the teacher, but parents can still type any name.
const TEACHERS_BY_GRADE = {
  M1: 'Sister Amedeo',
  M2: 'Ms. Ani',
  K: 'Mrs. Lawley',
  '1B': 'Mrs. Kurhan',
  '2A': 'Mrs. Snyder',
  '3A': 'Mrs. McManus',
  '4A': 'Mrs. Wagenborg',
  '5A': 'Ms. Pickard',
  '5B': 'Mrs. Richard',
  '6A': "Mrs. O'Connell",
  '6B': 'Mrs. McNeill',
  '7A': 'Mr. Hoffman',
  '7B': 'Mr. Jeffries',
  '8A': 'Ms. Goode',
  '8B': 'Ms. Taylor',
};
const GRADE_OPTIONS = Object.keys(TEACHERS_BY_GRADE);
const ALL_TEACHERS = Object.values(TEACHERS_BY_GRADE);
const ORNAMENT_PRICE = 25;
const PHOTO_PRICE = 5;
const VENMO_HANDLE = 'SAAParents';
const CHECK_PAYABLE_TO = 'St Aloysius Academy';
const EVENT_DATE = ''; // e.g. 'Friday, December 12' (shown on the confirmation screen when filled in)
const CONTACT_NAME = 'Laura Cecconi';
const CONTACT_EMAIL = 'laurateta@gmail.com';
const ORNAMENT_IMAGE = '/ornament.jpg'; // lives in the /public folder

// Google Form submission endpoint (unchanged from your live setup)
const FORM_URL =
  'https://docs.google.com/forms/u/0/d/e/1FAIpQLSfzcI6Fzqf783z7JrfaymSE72HGgLFBVqQm5jRoGukkt-D7lQ/formResponse';
const FORM_ENTRIES = {
  parentName: 'entry.1076604933',
  studentName: 'entry.2043352946',
  grade: 'entry.183521426',
  teacher: 'entry.378218379',
  ornaments: 'entry.685638574',
  photos: 'entry.1945115209',
  subtotal: 'entry.1094226619',
  paymentMethod: 'entry.1767818373',
  personalization: 'entry.1833685702',
};

// SAA palette, pulled from the ornament itself
const NAVY = '#1F2A7A';
const LIME = '#8DC63F';
const RED = '#D22F2F';

let nextId = 1;
const makeStudent = () => ({ id: nextId++, name: '', grade: '', teacher: '', ornaments: 0, photos: 0, personalizations: [] });

const Paw = ({ className = '', style }) => (
  <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden="true">
    <ellipse cx="32" cy="42" rx="14" ry="11" fill="currentColor" />
    <ellipse cx="16" cy="26" rx="6" ry="7.5" fill="currentColor" />
    <ellipse cx="26" cy="16" rx="6" ry="7.5" fill="currentColor" />
    <ellipse cx="38" cy="16" rx="6" ry="7.5" fill="currentColor" />
    <ellipse cx="48" cy="26" rx="6" ry="7.5" fill="currentColor" />
  </svg>
);

function Stepper({ value, onMinus, onPlus, label }) {
  return (
    <div className="flex items-center rounded-full border-2 bg-white" style={{ borderColor: NAVY }}>
      <button
        type="button"
        onClick={onMinus}
        aria-label={`Fewer ${label}`}
        className="w-10 h-10 text-xl font-bold rounded-full disabled:opacity-30"
        style={{ color: NAVY }}
        disabled={value === 0}
      >
        −
      </button>
      <span className="w-8 text-center font-bold text-lg tabular-nums" style={{ color: NAVY }}>
        {value}
      </span>
      <button
        type="button"
        onClick={onPlus}
        aria-label={`More ${label}`}
        className="w-10 h-10 text-xl font-bold rounded-full text-white"
        style={{ background: NAVY }}
      >
        +
      </button>
    </div>
  );
}

export default function App() {
  const [customerName, setCustomerName] = useState('');
  const [students, setStudents] = useState(() => [makeStudent()]);
  const [paymentMethod, setPaymentMethod] = useState('venmo');
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(false);

  const updateStudent = (id, field, value) =>
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

  const adjustCount = (id, field, delta) =>
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const count = Math.max(0, s[field] + delta);
        const next = { ...s, [field]: count };
        if (field === 'ornaments') {
          next.personalizations = Array.from({ length: count }, (_, i) => s.personalizations[i] || '');
        }
        return next;
      })
    );

  const updatePersonalization = (id, index, value) =>
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, personalizations: s.personalizations.map((p, i) => (i === index ? value : p)) }
          : s
      )
    );

  // Picking a homeroom fills in its teacher, unless the parent typed their own name
  const pickGrade = (id, grade) =>
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const typedOwn = s.teacher.trim() && !ALL_TEACHERS.includes(s.teacher.trim());
        return { ...s, grade, teacher: typedOwn ? s.teacher : TEACHERS_BY_GRADE[grade] || '' };
      })
    );

  const addStudent = () => setStudents((prev) => [...prev, makeStudent()]);
  const removeStudent = (id) =>
    setStudents((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev));

  const studentTotal = (s) => s.ornaments * ORNAMENT_PRICE + s.photos * PHOTO_PRICE;
  const total = students.reduce((sum, s) => sum + studentTotal(s), 0);
  const itemCount = students.reduce((n, s) => n + s.ornaments + s.photos, 0);

  const note = `SAA Santa Shop ornament order - ${students
    .map((s) => {
      const parts = [];
      if (s.ornaments > 0) parts.push(`${s.ornaments} ornament${s.ornaments > 1 ? 's' : ''}`);
      if (s.photos > 0) parts.push(`${s.photos} photo${s.photos > 1 ? 's' : ''}`);
      const label = [s.name, s.grade, s.teacher].filter(Boolean).join(' / ');
      return `${label}${parts.length ? ` (${parts.join(', ')})` : ''}`;
    })
    .join('; ')}`;

  // One universal link: opens the Venmo app on phones, Venmo web on desktop.
  const venmoLink = `https://venmo.com/${VENMO_HANDLE}?txn=pay&amount=${total}&note=${encodeURIComponent(note)}`;

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      setError('Please enter the parent/guardian name.');
      return;
    }
    for (const s of students) {
      if (!s.name.trim() || !s.grade || !s.teacher.trim()) {
        setError('Please fill in name, grade, and homeroom teacher for every student.');
        return;
      }
    }
    if (total === 0) {
      setError('Please add at least one ornament or photo.');
      return;
    }
    const empty = students.find((s) => s.ornaments + s.photos === 0);
    if (empty) {
      setError(`${empty.name.trim()} has no items yet. Add an ornament or photo, or remove that student.`);
      return;
    }
    // Tidy stray spaces before anything is saved
    setCustomerName(customerName.trim());
    students.forEach((s) => {
      s.name = s.name.trim();
      s.teacher = s.teacher.trim();
    });
    setError('');
    setSaving(true);

    // One Form response per student; no-cors means we can't read the reply,
    // but the submission goes through and never blocks the parent's order.
    try {
      for (const s of students) {
        const body = new URLSearchParams({
          [FORM_ENTRIES.parentName]: customerName,
          [FORM_ENTRIES.studentName]: s.name,
          [FORM_ENTRIES.grade]: s.grade,
          [FORM_ENTRIES.teacher]: s.teacher,
          [FORM_ENTRIES.ornaments]: String(s.ornaments),
          [FORM_ENTRIES.photos]: String(s.photos),
          [FORM_ENTRIES.subtotal]: String(studentTotal(s)),
          [FORM_ENTRIES.paymentMethod]: paymentMethod,
          [FORM_ENTRIES.personalization]: s.personalizations
            .map((p, i) => `#${i + 1}: ${p.trim() || '(none)'}`)
            .join(' | '),
        });
        await fetch(FORM_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        });
      }
    } catch (err) {
      // Don't block the parent's order on a network hiccup
    }

    setSaving(false);
    setSubmitted(true);
    window.scrollTo(0, 0);
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
      // Clipboard unavailable; the Venmo button is still the main path
    }
  };

  const inputClass =
    'w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-base focus:outline-none focus:border-[#1F2A7A]';

  const Styles = () => (
    <style>{`
      .saa-body { font-family: 'Nunito', system-ui, sans-serif; }
      .saa-display { font-family: 'DM Serif Display', Georgia, serif; }
      .saa-stripe { background: repeating-linear-gradient(135deg, ${RED} 0 14px, #fff 14px 28px); }
    `}</style>
  );

  const Contact = () => (
    <p className="text-center text-sm text-slate-500 mt-8">
      Questions? Contact {CONTACT_NAME} at{' '}
      <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold underline" style={{ color: NAVY }}>
        {CONTACT_EMAIL}
      </a>
    </p>
  );

  const Header = () => (
    <header className="relative overflow-hidden text-white" style={{ background: NAVY }}>
      <Paw className="absolute -right-6 -top-4 w-40 h-40 opacity-10 rotate-12" />
      <Paw className="absolute left-4 bottom-2 w-16 h-16 opacity-10 -rotate-12" />
      <div className="relative max-w-2xl mx-auto px-5 pt-8 pb-10 text-center">
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-sm font-extrabold tracking-widest"
          style={{ background: LIME, color: NAVY }}
        >
          <Paw className="w-4 h-4" /> SAA
        </div>
        <h1 className="saa-display text-4xl sm:text-5xl mt-4 leading-tight">St. Aloysius Santa Shop</h1>
        <p className="mt-2 text-white/85 text-lg">Ornaments &amp; Photos with Santa</p>
      </div>
      <div className="saa-stripe h-3" />
    </header>
  );

  // ---------- Confirmation ----------
  if (submitted) {
    return (
      <div className="saa-body min-h-screen bg-[#FBF8F1] text-slate-800">
        <Styles />
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center mb-6">
            <div
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center text-white"
              style={{ background: LIME }}
            >
              <Paw className="w-9 h-9" style={{ color: NAVY }} />
            </div>
            <h2 className="saa-display text-3xl mt-4" style={{ color: NAVY }}>
              Thank you, {customerName.split(' ')[0]}!
            </h2>
            <p className="text-slate-600 mt-1">Your order is in. Here's your summary.</p>
          </div>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-5">
            {students.map((s) => (
              <div key={s.id} className="py-3 border-b border-slate-100 last:border-b-0">
                <p className="font-bold" style={{ color: NAVY }}>
                  {s.name} · {s.grade} · {s.teacher}
                </p>
                {s.ornaments > 0 && (
                  <p className="text-sm text-slate-600">
                    Ornaments: {s.ornaments} × ${ORNAMENT_PRICE} = ${s.ornaments * ORNAMENT_PRICE}
                  </p>
                )}
                {s.personalizations.some((p) => p.trim()) && (
                  <p className="text-sm text-slate-600">
                    Personalization: {s.personalizations.map((p) => p.trim() || '(blank)').join(', ')}
                  </p>
                )}
                {s.photos > 0 && (
                  <p className="text-sm text-slate-600">
                    Photos with Santa: {s.photos} × ${PHOTO_PRICE} = ${s.photos * PHOTO_PRICE}
                  </p>
                )}
              </div>
            ))}
            <div className="flex justify-between items-baseline pt-4 mt-1 border-t-2" style={{ borderColor: NAVY }}>
              <span className="font-bold">Total</span>
              <span className="saa-display text-3xl" style={{ color: NAVY }}>${total}</span>
            </div>
          </section>

          {paymentMethod === 'venmo' ? (
            <section className="rounded-2xl p-5 mb-5 text-white" style={{ background: NAVY }}>
              <h3 className="font-extrabold text-lg">Finish with Venmo</h3>
              <p className="text-white/85 mt-1 mb-4">
                Send <strong>${total}</strong> to @{VENMO_HANDLE}. The amount and note are filled in for you.
              </p>
              <a
                href={venmoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center rounded-xl py-4 font-extrabold text-lg"
                style={{ background: LIME, color: NAVY }}
              >
                Pay ${total} on Venmo
              </a>
              <button type="button" onClick={handleCopy} className="w-full mt-3 text-sm underline text-white/80">
                {copied ? 'Copied!' : 'Copy amount + note instead'}
              </button>
            </section>
          ) : (
            <section className="rounded-2xl p-5 mb-5 border-2" style={{ borderColor: LIME, background: '#F3F9E8' }}>
              <h3 className="font-extrabold text-lg" style={{ color: NAVY }}>Paying with cash or check</h3>
              <p className="mt-1">
                Please bring <strong>${total}</strong> in cash or a check on the day of the Santa Shop
                {EVENT_DATE ? ` (${EVENT_DATE})` : ''}. You can include it with your son's Santa Shop spending money.
              </p>
              <p className="text-sm text-slate-600 mt-1">Checks payable to {CHECK_PAYABLE_TO}.</p>
              <p className="text-sm text-slate-600 mt-1">Reference: {students.map((s) => s.name).join(', ')}</p>
            </section>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="w-full rounded-xl py-3 font-bold border-2 bg-white"
            style={{ borderColor: NAVY, color: NAVY }}
          >
            Place another order
          </button>
          <Contact />
        </main>
      </div>
    );
  }

  // ---------- Order form ----------
  return (
    <div className="saa-body min-h-screen bg-[#FBF8F1] text-slate-800 pb-28">
      <Styles />
      <Header />

      <main className="max-w-2xl mx-auto px-4">
        {/* Ornament showcase */}
        <section className="-mt-6 relative bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden sm:flex">
          <button
            type="button"
            onClick={() => setZoom(true)}
            className="sm:w-1/2 bg-white block"
            aria-label="See the ornament up close"
          >
            <img src={ORNAMENT_IMAGE} alt="SAA holiday ornament" className="w-full h-64 sm:h-full object-contain p-2" />
          </button>
          <div className="sm:w-1/2 p-5 flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-slate-100">
            <p className="text-xs font-extrabold tracking-widest" style={{ color: RED }}>THIS YEAR'S ORNAMENT</p>
            <h2 className="saa-display text-2xl mt-1" style={{ color: NAVY }}>Hand-painted SAA keepsake</h2>
            <p className="text-slate-600 mt-2">
              A ceramic ornament made just for our school, ready to hang on the tree. Free personalization!
            </p>
            <p className="text-sm font-bold mt-2" style={{ color: RED }}>
              Quantities are limited and may sell out, so please order soon.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full px-3 py-1 text-sm font-bold text-white" style={{ background: NAVY }}>
                Ornament ${ORNAMENT_PRICE}
              </span>
              <span className="rounded-full px-3 py-1 text-sm font-bold" style={{ background: LIME, color: NAVY }}>
                Photo with Santa ${PHOTO_PRICE}
              </span>
            </div>
          </div>
        </section>

        {/* Parent */}
        <section className="mt-8">
          <h3 className="saa-display text-2xl mb-3" style={{ color: NAVY }}>1. Your name</h3>
          <input
            type="text"
            placeholder="Parent / guardian name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className={inputClass}
          />
        </section>

        {/* Students */}
        <section className="mt-8">
          <h3 className="saa-display text-2xl mb-3" style={{ color: NAVY }}>2. Your students &amp; items</h3>
          <div className="space-y-4">
            {students.map((s, i) => (
              <div key={s.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2" style={{ background: '#EEF0FA' }}>
                  <span className="font-extrabold flex items-center gap-2" style={{ color: NAVY }}>
                    <Paw className="w-4 h-4" /> Student {i + 1}
                  </span>
                  {students.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStudent(s.id)}
                      className="text-sm font-bold"
                      style={{ color: RED }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Student name"
                    value={s.name}
                    onChange={(e) => updateStudent(s.id, 'name', e.target.value)}
                    className={inputClass}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={s.grade}
                      onChange={(e) => pickGrade(s.id, e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Grade</option>
                      {GRADE_OPTIONS.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Homeroom teacher"
                      value={s.teacher}
                      onChange={(e) => updateStudent(s.id, 'teacher', e.target.value)}
                      className={inputClass}
                      list={`teachers-${s.id}`}
                      autoComplete="off"
                    />
                    {/* Suggestions only: parents can still type any name */}
                    <datalist id={`teachers-${s.id}`}>
                      {ALL_TEACHERS.map((t) => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3">
                      <img src={ORNAMENT_IMAGE} alt="" className="w-11 h-11 rounded-full border border-slate-200 object-cover" />
                      <div>
                        <p className="font-bold">Ornaments</p>
                        <p className="text-sm text-slate-500">${ORNAMENT_PRICE} each</p>
                      </div>
                    </div>
                    <Stepper
                      label="ornaments"
                      value={s.ornaments}
                      onMinus={() => adjustCount(s.id, 'ornaments', -1)}
                      onPlus={() => adjustCount(s.id, 'ornaments', 1)}
                    />
                  </div>

                  {s.ornaments > 0 && (
                    <div className="space-y-2 rounded-xl p-3" style={{ background: '#F3F9E8' }}>
                      <p className="text-sm font-bold" style={{ color: NAVY }}>
                        Personalization (free, optional)
                      </p>
                      <p className="text-xs text-slate-600 -mt-1">
                        Handwritten on the back of each ornament.
                      </p>
                      {s.personalizations.map((p, idx) => (
                        <input
                          key={idx}
                          type="text"
                          placeholder="e.g. James 6th Grade or James 2026"
                          value={p}
                          onChange={(e) => updatePersonalization(s.id, idx, e.target.value)}
                          className={inputClass}
                          aria-label={`Ornament ${idx + 1} personalization`}
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl" style={{ background: '#FDECEC' }}>
                        📸
                      </div>
                      <div>
                        <p className="font-bold">Photos with Santa</p>
                        <p className="text-sm text-slate-500">${PHOTO_PRICE} each</p>
                      </div>
                    </div>
                    <Stepper
                      label="photos"
                      value={s.photos}
                      onMinus={() => adjustCount(s.id, 'photos', -1)}
                      onPlus={() => adjustCount(s.id, 'photos', 1)}
                    />
                  </div>
                  {studentTotal(s) > 0 && (
                    <p className="text-right text-sm font-bold" style={{ color: NAVY }}>
                      Subtotal ${studentTotal(s)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addStudent}
            className="mt-4 w-full rounded-2xl border-2 border-dashed py-3 font-bold"
            style={{ borderColor: NAVY, color: NAVY }}
          >
            + Add another student
          </button>
        </section>

        {/* Payment */}
        <section className="mt-8">
          <h3 className="saa-display text-2xl mb-3" style={{ color: NAVY }}>3. How you'll pay</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'venmo', title: 'Venmo', sub: `@${VENMO_HANDLE}` },
              { key: 'cash or check', title: 'Cash or check', sub: 'Pay at the Santa Shop' },
            ].map((opt) => {
              const on = paymentMethod === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setPaymentMethod(opt.key)}
                  className="rounded-2xl border-2 p-4 text-left transition"
                  style={{
                    borderColor: on ? NAVY : '#E2E8F0',
                    background: on ? NAVY : '#fff',
                    color: on ? '#fff' : NAVY,
                  }}
                  aria-pressed={on}
                >
                  <p className="font-extrabold text-lg">{opt.title}</p>
                  <p className={`text-sm ${on ? 'text-white/80' : 'text-slate-500'}`}>{opt.sub}</p>
                </button>
              );
            })}
          </div>
        </section>

        {error && (
          <p className="mt-6 rounded-xl px-4 py-3 font-semibold" style={{ background: '#FDECEC', color: RED }}>
            {error}
          </p>
        )}
        <Contact />
      </main>

      {/* Sticky total + submit */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="shrink-0">
            <p className="text-xs text-slate-500">{itemCount} item{itemCount === 1 ? '' : 's'}</p>
            <p className="saa-display text-2xl leading-none" style={{ color: NAVY }}>${total}</p>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 rounded-xl py-3 font-extrabold text-white disabled:opacity-60"
            style={{ background: RED }}
          >
            {saving ? 'Placing order…' : 'Place order'}
          </button>
        </div>
      </div>

      {/* Photo zoom */}
      {zoom && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setZoom(false)}
        >
          <img src={ORNAMENT_IMAGE} alt="SAA holiday ornament" className="max-h-full max-w-full rounded-2xl bg-white" />
        </div>
      )}
    </div>
  );
}
