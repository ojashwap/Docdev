import { local } from './translations'
import { useState, type FormEvent } from 'react'
import { Check, CloudUpload, FileText, ShieldCheck } from 'lucide-react'
import {
  departments,
  flows,
  nextNumber,
  people,
  sensitivities,
  type Language,
  type RecordItem,
  type Role,
  type Workspace,
} from './model'
import { Field, Modal, type Translate } from './ui'
import { fingerprint, saveOriginal } from './files'
export function Registration({
  state,
  role,
  lang,
  t,
  existing,
  onClose,
  onSave,
}: {
  state: Workspace
  role: Role
  lang: Language
  t: Translate
  existing?: RecordItem
  onClose: () => void
  onSave: (record: RecordItem) => void
}) {
  const [step, setStep] = useState(existing ? 1 : 0)
  const [file, setFile] = useState<File>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [record, setRecord] = useState<RecordItem>(
    () =>
      existing || {
        id: nextNumber(state),
        title: '',
        titleAr: '',
        kind: '',
        department: state.settings.department,
        sensitivity: 'Internal',
        status: 'Draft',
        owner: people[role],
        summary: '',
        summaryAr: '',
        reference: '',
        fileName: '',
        mime: '',
        size: 0,
        hash: '',
        captured: new Date().toISOString(),
        expiry: new Date(new Date().setFullYear(new Date().getFullYear() + state.settings.retentionYears))
          .toISOString()
          .slice(0, 10),
        flow: 'Single',
        priority: 'Routine',
        scope: 'Department-only',
        approvals: [],
        version: 0,
        indexed: false,
        hold: '',
        declared: false,
        location: 'Staging',
        staging: 'Active',
        note: '',
        due: '',
        delegated: false,
        signature: '',
      },
  )
  const update = <K extends keyof RecordItem>(key: K, value: RecordItem[K]) =>
    setRecord((r) => ({ ...r, [key]: value }))
  const capture = async (selected?: File) => {
    if (!selected) return
    setError('')
    setBusy(true)
    try {
      if (selected.size > 20 * 1024 * 1024)
        throw new Error(
          t(
            'This browser demo accepts files up to 20 MB. The production design targets resumable uploads up to 5 GB.',
            'يقبل العرض ملفات حتى ٢٠ ميغابايت. التصميم الإنتاجي يستهدف رفعاً قابلاً للاستئناف حتى ٥ غيغابايت.',
          ),
        )
      const hash = await fingerprint(selected)
      if (state.documents.some((r) => r.hash === hash && r.id !== record.id))
        throw new Error(
          t(
            'This file is already registered. Open the existing record to create a revision.',
            'هذا الملف مسجل بالفعل. افتح السجل الحالي لإنشاء إصدار.',
          ),
        )
      setFile(selected)
      setRecord((r) => ({
        ...r,
        title: r.title || selected.name.replace(/\.[^.]+$/, ''),
        fileName: selected.name,
        mime: selected.type || 'application/octet-stream',
        size: selected.size,
        hash,
      }))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }
  const save = async (status: RecordItem['status']) => {
    setBusy(true)
    setError('')
    try {
      if (file) await saveOriginal(record.id, file)
      onSave({
        ...record,
        status,
        approvals: [],
        note: '',
        due:
          status === 'PendingApproval'
            ? new Date(Date.now() + state.settings.sla * 3600000).toISOString()
            : '',
      })
    } catch {
      setError(
        t(
          'The browser could not store this file. Free some storage and try again.',
          'تعذر حفظ الملف في المتصفح. وفر مساحة وحاول مجدداً.',
        ),
      )
      setBusy(false)
    }
  }
  const advance = (e: FormEvent) => {
    e.preventDefault()
    if (step === 2) void save('PendingApproval')
    else setStep(step + 1)
  }
  return (
    <Modal
      title={existing ? t('Edit registration', 'تعديل التسجيل') : t('Register a document', 'تسجيل وثيقة')}
      onClose={onClose}
      wide
    >
      <div className="p-stepper">
        {[t('Capture', 'الالتقاط'), t('Classify', 'التصنيف'), t('Review & submit', 'المراجعة والإرسال')].map(
          (label, i) => (
            <div className={step >= i ? 'active' : ''} key={label}>
              <span>{step > i ? <Check size={14} /> : i + 1}</span>
              {label}
            </div>
          ),
        )}
      </div>
      <form onSubmit={advance} className="p-modal-body">
        <div className="p-note">
          <ShieldCheck size={18} />
          <span>
            {t(
              'Manual registration. Your original format is preserved. AI is used only after approval and publication.',
              'تسجيل يدوي مع الاحتفاظ بصيغة الملف الأصلية. يستخدم الذكاء الاصطناعي فقط بعد الاعتماد والنشر.',
            )}
          </span>
        </div>
        {step === 0 && (
          <>
            <div
              className="p-drop"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                void capture(e.dataTransfer.files[0])
              }}
            >
              <CloudUpload size={40} />
              <h3>{t('Give every document a governed beginning', 'امنح كل وثيقة بداية محكومة')}</h3>
              <p>{t('Drop a file here, or browse your computer', 'اسحب ملفاً هنا أو تصفح جهازك')}</p>
              <input
                aria-label={t('Choose file', 'اختيار ملف')}
                type="file"
                accept=".pdf,.docx,.xlsx,.pptx,.png,.jpg,.jpeg,.tif,.tiff,.txt"
                onChange={(e) => void capture(e.target.files?.[0])}
              />
              <small>PDF · DOCX · XLSX · PPTX · PNG · JPEG · TIFF · TXT · 20 MB</small>
            </div>
            <button
              type="button"
              className="p-btn"
              onClick={() =>
                void capture(
                  new File(
                    [
                      'DOCAYA SAMPLE\nClient workshop memorandum\nProposed service improvements for client review.',
                    ],
                    'client-workshop-memo.txt',
                    { type: 'text/plain' },
                  ),
                )
              }
            >
              {t('Use a sample document', 'استخدام وثيقة تجريبية')}
            </button>
            {record.fileName && (
              <div className="p-file-summary">
                <FileText />
                <div>
                  <strong>{record.fileName}</strong>
                  <small>
                    {(record.size / 1024).toFixed(1)} KB ·{' '}
                    {t('Signature checked · SHA-256 calculated', 'تم فحص التوقيع وحساب البصمة')}
                  </small>
                </div>
                <Check size={19} />
              </div>
            )}
            <p className="p-subtle">
              {t(
                'Malware scanning and DLP are simulated in this prototype. Use sample files for the workshop.',
                'فحص البرمجيات الخبيثة ومنع تسرب البيانات محاكاة في هذا النموذج. استخدم ملفات تجريبية للورشة.',
              )}
            </p>
          </>
        )}
        {step === 1 && (
          <div className="p-form-grid">
            <Field label={t('Business title *', 'عنوان الوثيقة *')}>
              <input required value={record.title} onChange={(e) => update('title', e.target.value)} />
            </Field>
            <Field label={t('Arabic title', 'العنوان العربي')}>
              <input dir="rtl" value={record.titleAr} onChange={(e) => update('titleAr', e.target.value)} />
            </Field>
            <Field label={t('Document class *', 'فئة الوثيقة *')}>
              <select required value={record.kind} onChange={(e) => update('kind', e.target.value)}>
                <option value="">{t('Select a class', 'اختر الفئة')}</option>
                {state.settings.classes.map((v) => (
                  <option key={v} value={v}>
                    {local(v, lang)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('Owning department *', 'الإدارة المالكة *')}>
              <select
                value={record.department}
                disabled={role === 'Department Administrator'}
                onChange={(e) => update('department', e.target.value)}
              >
                {departments.map((v) => (
                  <option key={v} value={v}>
                    {local(v, lang)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('Sensitivity *', 'درجة الحساسية *')}>
              <select
                value={record.sensitivity}
                onChange={(e) => update('sensitivity', e.target.value as RecordItem['sensitivity'])}
              >
                {sensitivities.map((v) => (
                  <option key={v} value={v}>
                    {local(v, lang)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('Approval flow *', 'مسار الاعتماد *')}>
              <select
                value={record.flow}
                onChange={(e) => update('flow', e.target.value as RecordItem['flow'])}
              >
                {flows.map((v) => (
                  <option key={v} value={v}>
                    {local(v, lang)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('Priority', 'الأولوية')}>
              <select value={record.priority} onChange={(e) => update('priority', e.target.value)}>
                {['Routine', 'Priority', 'Urgent'].map((v) => (
                  <option key={v} value={v}>
                    {local(v, lang)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('Access scope', 'نطاق الوصول')}>
              <select value={record.scope} onChange={(e) => update('scope', e.target.value)}>
                {['Department-only', 'Clearance level'].map((v) => (
                  <option key={v} value={v}>
                    {local(v, lang)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('Reference / keywords', 'المرجع / الكلمات المفتاحية')}>
              <input value={record.reference} onChange={(e) => update('reference', e.target.value)} />
            </Field>
            <Field label={t('Expiry / review date', 'تاريخ الانتهاء / المراجعة')}>
              <input
                required
                type="date"
                value={record.expiry}
                onChange={(e) => update('expiry', e.target.value)}
              />
            </Field>
            <div className="p-span">
              <Field label={t('Description *', 'الوصف *')}>
                <textarea
                  required
                  rows={3}
                  value={record.summary}
                  onChange={(e) => update('summary', e.target.value)}
                />
              </Field>
            </div>
          </div>
        )}
        {step === 2 && (
          <>
            <div className="p-review-card">
              <p className="p-eyebrow">{record.id}</p>
              <h2>{record.title}</h2>
              <p>{record.summary}</p>
              <dl className="p-facts">
                <dt>{t('Classification', 'التصنيف')}</dt>
                <dd>
                  {local(record.kind, lang)} · {local(record.sensitivity, lang)}
                </dd>
                <dt>{t('Approval', 'الاعتماد')}</dt>
                <dd>
                  {local(record.flow, lang)} · {state.settings.sla} {t('hour SLA', 'ساعة للمعالجة')}
                </dd>
                <dt>{t('Destination after approval', 'الوجهة بعد الاعتماد')}</dt>
                <dd>
                  {state.settings.library}/{record.department}/{record.kind}
                </dd>
                <dt>{t('Original file', 'الملف الأصلي')}</dt>
                <dd>
                  {record.fileName} · {(record.size / 1024).toFixed(1)} KB
                </dd>
                <dt>SHA-256</dt>
                <dd className="p-hash">{record.hash}</dd>
              </dl>
            </div>
            <div className="p-note">
              {t(
                'Submitting sends this document to the approval queue. It will remain in staging until every required approval is complete.',
                'يرسل المستند إلى قائمة الاعتماد ويبقى في منطقة التجهيز حتى اكتمال جميع الموافقات المطلوبة.',
              )}
            </div>
          </>
        )}
        {error && (
          <p className="p-error" role="alert">
            {error}
          </p>
        )}
        <footer className="p-modal-actions">
          <button type="button" className="p-btn" onClick={() => (step ? setStep(step - 1) : onClose())}>
            {step ? t('Back', 'رجوع') : t('Cancel', 'إلغاء')}
          </button>
          <span />
          {record.fileName && (
            <button
              type="button"
              className="p-btn"
              disabled={busy}
              onClick={() => void save(step === 2 ? 'Classified' : 'Draft')}
            >
              {t('Save draft', 'حفظ المسودة')}
            </button>
          )}
          <button className="p-btn primary" disabled={busy || !record.fileName}>
            {busy
              ? t('Processing…', 'جارٍ المعالجة…')
              : step === 2
                ? t('Submit for approval', 'إرسال للاعتماد')
                : t('Continue', 'متابعة')}
          </button>
        </footer>
      </form>
    </Modal>
  )
}
