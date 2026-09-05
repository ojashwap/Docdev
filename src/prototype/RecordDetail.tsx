import { local } from './translations'
import { useState } from 'react'
import { Check, Download, FileText, LockKeyhole, ShieldCheck } from 'lucide-react'
import {
  approvalSteps,
  capabilities,
  downloadFile,
  type Language,
  type RecordItem,
  type Role,
  type Workspace,
} from './model'
import { Badge, Field, Modal, type Translate } from './ui'
import { readOriginal } from './files'
export function RecordDetail({
  record,
  state,
  role,
  lang,
  t,
  onClose,
  onAction,
  onEdit,
  onLog,
}: {
  record: RecordItem
  state: Workspace
  role: Role
  lang: Language
  t: Translate
  onClose: () => void
  onAction: (action: string, reason?: string, step?: string) => void
  onEdit: () => void
  onLog: (action: string, ar: string) => void
}) {
  const [tab, setTab] = useState('overview')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [confirmDispose, setConfirmDispose] = useState(false)
  const rights = capabilities(role)
  const steps = approvalSteps(record)
  const title = lang === 'ar' ? record.titleAr || record.title : record.title
  const act = (action: string, needsReason = false, step = '') => {
    if (needsReason && !reason.trim()) {
      setError(t('Please enter a reason or delegate name first.', 'يرجى إدخال السبب أو اسم المفوض أولاً.'))
      return
    }
    setError('')
    onAction(action, reason, step)
  }
  const download = async () => {
    try {
      let original = await readOriginal(record.id)
      let ancestor = record.revises || ''
      const visited = new Set<string>([record.id])
      while (!original && ancestor.startsWith('DOC-') && !visited.has(ancestor)) {
        visited.add(ancestor)
        original = await readOriginal(ancestor)
        ancestor = state.documents.find((r) => r.id === ancestor)?.revises || ''
      }
      if (original) {
        const url = URL.createObjectURL(original)
        const a = document.createElement('a')
        a.href = url
        a.download = record.fileName
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      } else
        downloadFile(
          `${record.id}-sample.txt`,
          `DOCAYA · SAMPLE DOCUMENT\n${title}\n${record.id} · v${record.version}.0\n\n${record.summary}\n\n${record.summaryAr}`,
          'text/plain;charset=utf-8',
        )
      onLog('Original / sample downloaded', 'تم تنزيل الملف الأصلي / العينة')
    } catch {
      setError(t('File download failed. Please try again.', 'تعذر تنزيل الملف. حاول مجدداً.'))
    }
  }
  return (
    <Modal title={title} onClose={onClose} wide>
      <div className="p-modal-body">
        <div className="p-detail-meta">
          <span dir="ltr">{record.id}</span>
          <Badge value={record.status} lang={lang} />
          <Badge value={record.sensitivity} lang={lang} />
          {record.hold && (
            <span className="p-badge secret">
              <LockKeyhole size={12} />
              {t('Legal hold', 'حجز قانوني')}
            </span>
          )}
          <span>{record.version ? `v${record.version}.0` : t('Unpublished', 'غير منشور')}</span>
        </div>
        <div className="p-tabs">
          {[
            ['overview', 'Overview', 'نظرة عامة'],
            ['workflow', 'Approval & publishing', 'الاعتماد والنشر'],
            ['governance', 'Governance', 'الحوكمة'],
            ['history', 'Activity', 'النشاط'],
          ].map(([id, en, ar]) => (
            <button className={tab === id ? 'active' : ''} key={id} onClick={() => setTab(id)}>
              {t(en, ar)}
            </button>
          ))}
        </div>
        {tab === 'overview' && (
          <div className="p-detail-grid">
            <div className="p-paper">
              <div className="p-paper-brand">
                D / DOCAYA <span>دوكايا</span>
              </div>
              <p className="p-eyebrow">
                {t('Document content preview · sample', 'معاينة محتوى الوثيقة · عينة')}
              </p>
              <h2>{title}</h2>
              <p>{lang === 'ar' ? record.summaryAr || record.summary : record.summary}</p>
              <div className="p-paper-lines">
                <i />
                <i />
                <i />
              </div>
              <p className="p-subtle">
                {t(
                  'The preview shows registered metadata and sample text. Uploaded originals are available through Download.',
                  'تعرض المعاينة البيانات المسجلة والنص التجريبي. تتوفر الملفات الأصلية عبر التنزيل.',
                )}
              </p>
            </div>
            <div>
              <dl className="p-facts vertical">
                <dt>{t('Owner', 'المالك')}</dt>
                <dd>{record.owner}</dd>
                <dt>{t('Department / class', 'الإدارة / الفئة')}</dt>
                <dd>
                  {local(record.department, lang)} / {local(record.kind, lang)}
                </dd>
                <dt>{t('Original file', 'الملف الأصلي')}</dt>
                <dd>
                  {record.fileName}
                  <small>
                    {(record.size / 1024).toFixed(1)} KB · {record.mime}
                  </small>
                </dd>
                <dt>{t('Captured', 'تاريخ التسجيل')}</dt>
                <dd>{new Date(record.captured).toLocaleString(lang)}</dd>
                <dt>{t('Expiry / review', 'الانتهاء / المراجعة')}</dt>
                <dd>{record.expiry}</dd>
                <dt>SHA-256</dt>
                <dd className="p-hash">{record.hash}</dd>
              </dl>
              {record.status !== 'Disposed' && (
                <button className="p-btn" onClick={() => void download()}>
                  <Download size={15} />
                  {t('Download original / sample', 'تنزيل الأصل / العينة')}
                </button>
              )}
            </div>
          </div>
        )}
        {tab === 'workflow' && (
          <>
            <div className="p-note">
              <ShieldCheck size={20} />
              {t(
                'Demonstration approvals and signatures. SharePoint promotion is simulated; the original file stays unchanged in this browser.',
                'موافقات وتوقيعات تجريبية. النشر إلى شيربوينت محاكاة ويظل الملف الأصلي دون تغيير في المتصفح.',
              )}
            </div>
            <div className="p-approval-list">
              {steps.map((step, i) => (
                <div key={step}>
                  <span
                    className={
                      record.approvals.includes(step) ||
                      ['Published', 'Superseded', 'Archived'].includes(record.status)
                        ? 'p-check done'
                        : 'p-check'
                    }
                  >
                    {record.approvals.includes(step) ||
                    ['Published', 'Superseded', 'Archived'].includes(record.status) ? (
                      <Check size={17} />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <div>
                    <strong>{local(step, lang)}</strong>
                    <small>
                      {local(record.flow, lang)} ·{' '}
                      {record.delegated
                        ? `${t('Delegate', 'المفوض')}: ${record.note}`
                        : local(record.department, lang)}
                    </small>
                  </div>
                  {record.status === 'PendingApproval' &&
                    rights.approve &&
                    !record.approvals.includes(step) &&
                    (record.flow === 'Parallel' ||
                      step === steps.find((s) => !record.approvals.includes(s))) && (
                      <button className="p-btn primary" onClick={() => act('approve', false, step)}>
                        {t('Approve & sign', 'اعتماد وتوقيع')}
                      </button>
                    )}
                </div>
              ))}
            </div>
            <dl className="p-facts">
              <dt>{t('Destination', 'الوجهة')}</dt>
              <dd>{record.location}</dd>
              <dt>{t('Staging copy', 'نسخة التجهيز')}</dt>
              <dd>{local(record.staging, lang)}</dd>
              <dt>{t('Index', 'الفهرس')}</dt>
              <dd>
                {record.indexed
                  ? t('Indexed · available to Ask Docaya', 'مفهرس · متاح لاسأل دوكايا')
                  : t('Not indexed · published content only', 'غير مفهرس · للمحتوى المنشور فقط')}
              </dd>
              <dt>{t('Due', 'الموعد')}</dt>
              <dd>{record.due ? new Date(record.due).toLocaleString(lang) : '—'}</dd>
            </dl>
            {record.signature && (
              <div className="p-note">
                <FileText size={18} />
                <span>
                  {t('Demo signature certificate', 'شهادة توقيع تجريبية')}
                  <small>{record.signature}</small>
                  <button
                    className="p-link"
                    onClick={() =>
                      downloadFile(
                        `${record.id}-demo-certificate.txt`,
                        `DOCAYA — DEMONSTRATION ONLY\nNot a legal electronic signature\n${record.id}\n${record.signature}`,
                        'text/plain',
                      )
                    }
                  >
                    {t('Download certificate', 'تنزيل الشهادة')}
                  </button>
                </span>
              </div>
            )}
            {record.note && <p className="p-warning">{record.note}</p>}
            {record.status === 'PendingApproval' && rights.approve && (
              <>
                <Field label={t('Return reason / delegate name', 'سبب الإرجاع / اسم المفوض')}>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t(
                      'Explain the changes needed, or enter a delegate',
                      'وضح التعديلات المطلوبة أو أدخل اسم المفوض',
                    )}
                  />
                </Field>
                <div className="p-actions">
                  <button className="p-btn danger" onClick={() => act('return', true)}>
                    {t('Return for changes', 'إرجاع للتعديل')}
                  </button>
                  <button className="p-btn" onClick={() => act('delegate', true)}>
                    {t('Delegate approval', 'تفويض الاعتماد')}
                  </button>
                </div>
              </>
            )}
            {record.status === 'Approved' && role === 'System Administrator' && (
              <button className="p-btn primary" onClick={() => act('retry')}>
                {t('Retry publication', 'إعادة محاولة النشر')}
              </button>
            )}
          </>
        )}
        {tab === 'governance' && (
          <>
            <dl className="p-facts">
              <dt>{t('Retention policy', 'سياسة الحفظ')}</dt>
              <dd>
                {state.settings.retentionYears}{' '}
                {t('years · review before disposition', 'سنوات · مراجعة قبل الإتلاف')}
              </dd>
              <dt>{t('Access scope', 'نطاق الوصول')}</dt>
              <dd>{local(record.scope, lang)}</dd>
              <dt>{t('Record declaration', 'إعلان السجل')}</dt>
              <dd>
                {record.declared
                  ? t('Declared · metadata frozen', 'معلن · البيانات مجمدة')
                  : t('Not declared', 'غير معلن')}
              </dd>
              <dt>{t('Legal hold', 'الحجز القانوني')}</dt>
              <dd>{record.hold || t('No active hold', 'لا يوجد حجز نشط')}</dd>
            </dl>
            {rights.records && record.status !== 'Disposed' && (
              <>
                <Field label={t('Governance reason / case reference', 'سبب الإجراء / مرجع القضية')}>
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} />
                </Field>
                <div className="p-actions">
                  <button className="p-btn" onClick={() => act(record.hold ? 'release' : 'hold', true)}>
                    <LockKeyhole size={15} />
                    {record.hold ? t('Release hold', 'رفع الحجز') : t('Apply legal hold', 'تطبيق حجز قانوني')}
                  </button>
                  {record.status === 'Published' && !record.declared && (
                    <button className="p-btn" onClick={() => act('declare')}>
                      {t('Declare record', 'إعلان سجل')}
                    </button>
                  )}
                  {record.status === 'Published' && (
                    <button className="p-btn" disabled={!!record.hold} onClick={() => act('archive', true)}>
                      {t('Archive record', 'أرشفة السجل')}
                    </button>
                  )}
                  {record.status === 'Archived' && (
                    <button
                      className="p-btn danger"
                      disabled={!!record.hold}
                      onClick={() => {
                        if (!reason.trim())
                          setError(t('Enter a disposition reason first.', 'أدخل سبب الإتلاف أولاً.'))
                        else setConfirmDispose(true)
                      }}
                    >
                      {t('Review disposition', 'مراجعة الإتلاف')}
                    </button>
                  )}
                </div>
                {record.hold && (
                  <p className="p-warning">
                    {t(
                      'Legal hold blocks archiving, deletion and revisions.',
                      'يمنع الحجز القانوني الأرشفة والحذف والإصدارات الجديدة.',
                    )}
                  </p>
                )}
                {confirmDispose && (
                  <div className="p-warning">
                    <p>
                      {t(
                        'Approve simulated disposition? The record remains in the registry and audit log.',
                        'هل تعتمد الإتلاف التجريبي؟ يبقى السجل في الفهرس وسجل التدقيق.',
                      )}
                    </p>
                    <button
                      className="p-btn danger"
                      onClick={() => {
                        act('dispose', true)
                        setConfirmDispose(false)
                      }}
                    >
                      {t('Approve disposition', 'اعتماد الإتلاف')}
                    </button>
                    <button className="p-btn" onClick={() => setConfirmDispose(false)}>
                      {t('Cancel', 'إلغاء')}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
        {tab === 'history' && (
          <div className="p-timeline">
            {state.audit
              .filter((a) => a.object === record.id)
              .map((a) => (
                <div key={a.id}>
                  <i />
                  <div>
                    <strong>{lang === 'ar' ? a.actionAr : a.action}</strong>
                    <p>
                      {a.actor} · {new Date(a.time).toLocaleString(lang)}
                    </p>
                    {a.detail && <small>{a.detail}</small>}
                  </div>
                </div>
              ))}
          </div>
        )}
        {error && (
          <p className="p-error" role="alert">
            {error}
          </p>
        )}
        <footer className="p-modal-actions">
          <button className="p-btn" onClick={onClose}>
            {t('Close', 'إغلاق')}
          </button>
          <span />
          {rights.register && ['Draft', 'Classified', 'Returned'].includes(record.status) && (
            <>
              <button className="p-btn" onClick={onEdit}>
                {t('Edit registration', 'تعديل التسجيل')}
              </button>
              <button className="p-btn primary" onClick={() => act('submit')}>
                {t('Submit for approval', 'إرسال للاعتماد')}
              </button>
            </>
          )}
          {rights.register && record.status === 'Published' && !record.hold && !record.declared && (
            <button
              className="p-btn"
              onClick={() => {
                act('version')
                onClose()
              }}
            >
              {t('Create revision draft', 'إنشاء مسودة إصدار')}
            </button>
          )}
        </footer>
      </div>
    </Modal>
  )
}
