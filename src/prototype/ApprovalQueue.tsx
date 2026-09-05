import { useState } from 'react'
import { ArrowRight, CheckCheck, Clock3, FileText, Search, Workflow } from 'lucide-react'
import type { Language, RecordItem } from './model'
import { Badge, Empty, type Translate } from './ui'
import { local } from './translations'

export function ApprovalQueue({
  rows,
  selectedId,
  onOpen,
  lang,
  t,
}: {
  rows: RecordItem[]
  selectedId: string
  onOpen: (record: RecordItem) => void
  lang: Language
  t: Translate
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const pending = rows.filter((r) => r.status === 'PendingApproval')
  const relevant = rows.filter(
    (r) => ['PendingApproval', 'Returned', 'Approved'].includes(r.status) || r.id === selectedId,
  )
  const filtered = relevant.filter(
    (r) =>
      (filter === 'all' ||
        (filter === 'overdue'
          ? r.status === 'PendingApproval' && new Date(r.due).getTime() < Date.now()
          : r.status === filter)) &&
      `${r.title} ${r.titleAr} ${r.id} ${r.department}`.toLowerCase().includes(query.toLowerCase()),
  )
  return (
    <section
      className={`d-approval-workspace ${selectedId ? 'reviewing' : ''}`}
      aria-label={t('Approval workspace', 'مساحة الاعتماد')}
    >
      <div className="d-queue-panel">
        <header>
          <span className="d-queue-heading-icon">
            <Workflow size={19} />
          </span>
          <div>
            <h2>{t('Your review queue', 'قائمة مراجعتك')}</h2>
            <small>
              {pending.length} {t('awaiting a decision', 'بانتظار القرار')}
            </small>
          </div>
          <span className="p-count">{pending.length}</span>
        </header>
        <div className="d-queue-search">
          <Search size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t('Search approval queue', 'بحث قائمة الاعتماد')}
            placeholder={t('Find a document…', 'ابحث عن وثيقة…')}
          />
        </div>
        <div className="d-queue-filters">
          {[
            ['all', 'All', 'الكل'],
            ['overdue', 'Overdue', 'متأخر'],
            ['Returned', 'Returned', 'معاد'],
          ].map(([id, en, ar]) => (
            <button key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>
              {t(en, ar)}
            </button>
          ))}
        </div>
        <div className="d-queue-list">
          {filtered.map((record) => (
            <button
              className={`d-review-item ${selectedId === record.id ? 'selected' : ''}`}
              aria-current={selectedId === record.id ? 'true' : undefined}
              key={record.id}
              onClick={() => onOpen(record)}
            >
              <div className="d-review-item-top">
                <span className="p-file">
                  <FileText size={17} />
                  <small>{record.fileName.split('.').at(-1)}</small>
                </span>
                <span>
                  <strong>{lang === 'ar' ? record.titleAr || record.title : record.title}</strong>
                  <small>{record.id}</small>
                </span>
                <ArrowRight size={14} />
              </div>
              <div className="d-review-item-meta">
                <span>{local(record.department, lang)}</span>
                <Badge value={record.status} lang={lang} />
              </div>
              <div className="d-review-item-bottom">
                <span>
                  <Clock3 size={12} />
                  {record.status === 'PendingApproval' && new Date(record.due).getTime() < Date.now()
                    ? t('Overdue', 'متأخر')
                    : local(record.flow, lang)}
                </span>
                <span>
                  {record.approvals.length} {t('steps completed', 'خطوات مكتملة')}
                </span>
              </div>
            </button>
          ))}
          {!filtered.length && <Empty t={t} />}
        </div>
        <footer>
          <CheckCheck size={15} />
          {t('Every decision leaves a trace.', 'كل قرار موثق.')}
        </footer>
      </div>
      {!selectedId && (
        <div className="d-review-welcome">
          <div className="d-review-illustration">
            <FileText size={60} />
            <span>
              <CheckCheck size={21} />
            </span>
          </div>
          <p className="p-eyebrow">{t('A CALMER WAY TO REVIEW', 'طريقة أهدأ للمراجعة')}</p>
          <h2>{t('The document. The context. The decision.', 'الوثيقة. السياق. القرار.')}</h2>
          <p>
            {t(
              'Select a document to see its preview beside the details. Your queue stays in view as you approve, return or move to the next item.',
              'اختر وثيقة لمعاينتها بجانب تفاصيلها. تبقى قائمتك ظاهرة أثناء الاعتماد أو الإرجاع أو الانتقال للوثيقة التالية.',
            )}
          </p>
          {pending[0] && (
            <button className="p-btn primary" onClick={() => onOpen(pending[0])}>
              {t('Start reviewing', 'ابدأ المراجعة')}
              <ArrowRight size={16} />
            </button>
          )}
          <div className="d-review-benefits">
            <span>{t('Side-by-side preview', 'معاينة جنباً إلى جنب')}</span>
            <span>{t('No blurred background', 'خلفية واضحة')}</span>
            <span>{t('One continuous queue', 'قائمة مستمرة')}</span>
          </div>
        </div>
      )}
    </section>
  )
}
