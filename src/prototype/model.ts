export type Language = 'en' | 'ar'
export type Status =
  | 'Draft'
  | 'Classified'
  | 'PendingApproval'
  | 'Returned'
  | 'Approved'
  | 'Published'
  | 'Superseded'
  | 'Archived'
  | 'Disposed'
export type Role =
  | 'System Administrator'
  | 'Department Administrator'
  | 'Contributor'
  | 'Approver'
  | 'Records Officer'
  | 'Viewer'
  | 'Auditor'
export type Flow = 'Single' | 'Sequential' | 'Parallel' | 'Conditional'
export type Sensitivity = 'Public' | 'Internal' | 'Confidential' | 'Secret'
export type RecordItem = {
  id: string
  title: string
  titleAr: string
  kind: string
  department: string
  sensitivity: Sensitivity
  status: Status
  owner: string
  summary: string
  summaryAr: string
  reference: string
  revises?: string
  fileName: string
  mime: string
  size: number
  hash: string
  captured: string
  expiry: string
  flow: Flow
  priority: string
  scope: string
  approvals: string[]
  version: number
  indexed: boolean
  hold: string
  declared: boolean
  location: string
  staging: string
  note: string
  due: string
  delegated: boolean
  signature: string
}
export type Notice = {
  id: string
  title: string
  titleAr: string
  recordId: string
  category: string
  read: boolean
  time: string
}
export type AuditEvent = {
  id: string
  time: string
  actor: string
  role: Role
  action: string
  actionAr: string
  object: string
  detail: string
}
export type Correspondence = {
  id: string
  subject: string
  subjectAr: string
  direction: string
  party: string
  assignee: string
  due: string
  status: string
  thread: string[]
  acknowledged: boolean
}
export type Settings = {
  classes: string[]
  department: string
  library: string
  sla: number
  cleanup: string
  retentionYears: number
  cadence: string
  simulateFailure: boolean
  email: boolean
  teams: boolean
  quietHours: string
  defaultArabic: boolean
}
export type Workspace = {
  schema: 1
  documents: RecordItem[]
  notices: Notice[]
  audit: AuditEvent[]
  correspondence: Correspondence[]
  settings: Settings
  savedSearches: string[]
  feedback: { id: string; module: string; note: string; priority: string }[]
}
export const roles: Role[] = [
  'System Administrator',
  'Department Administrator',
  'Contributor',
  'Approver',
  'Records Officer',
  'Viewer',
  'Auditor',
]
export const departments = ['Operations', 'Finance', 'Human Resources', 'Legal']
export const sensitivities: Sensitivity[] = ['Public', 'Internal', 'Confidential', 'Secret']
export const flows: Flow[] = ['Single', 'Sequential', 'Parallel', 'Conditional']
export const people: Record<Role, string> = {
  'System Administrator': 'Mariam Al Mansoori',
  'Department Administrator': 'Omar Al Ali',
  Contributor: 'Noor Al Shamsi',
  Approver: 'Ahmed Al Nuaimi',
  'Records Officer': 'Fatima Al Kaabi',
  Viewer: 'Khalid Al Ali',
  Auditor: 'Sara Al Mazrouei',
}
export function capabilities(role: Role) {
  return {
    register: !['Viewer', 'Auditor'].includes(role),
    approve: ['System Administrator', 'Approver', 'Records Officer'].includes(role),
    records: ['System Administrator', 'Records Officer'].includes(role),
    admin: ['System Administrator', 'Department Administrator'].includes(role),
    audit: ['System Administrator', 'Department Administrator', 'Records Officer', 'Auditor'].includes(role),
  }
}
export function canSee(record: RecordItem, role: Role, department: string) {
  if (['System Administrator', 'Records Officer', 'Auditor'].includes(role)) return true
  if (record.sensitivity === 'Secret') return false
  if (
    record.department !== department &&
    (record.sensitivity === 'Confidential' || record.scope === 'Department-only')
  )
    return false
  if (role === 'Viewer' && !['Published', 'Archived'].includes(record.status)) return false
  return true
}
export function approvalSteps(record: RecordItem) {
  if (record.flow === 'Single') return ['Department head']
  if (record.flow === 'Conditional')
    return record.sensitivity === 'Secret' ? ['Senior director', 'Compliance officer'] : ['Department head']
  return ['Department head', 'Compliance officer']
}
export function addEvent(
  state: Workspace,
  role: Role,
  action: string,
  actionAr: string,
  object: string,
  detail = '',
): Workspace {
  return {
    ...state,
    audit: [
      {
        id: crypto.randomUUID(),
        time: new Date().toISOString(),
        actor: people[role],
        role,
        action,
        actionAr,
        object,
        detail,
      },
      ...state.audit,
    ],
  }
}
export function changeRecord(
  state: Workspace,
  id: string,
  role: Role,
  department: string,
  action: string,
  reason = '',
  step = '',
): Workspace {
  const record = state.documents.find((r) => r.id === id)
  if (!record || !canSee(record, role, department)) throw new Error('Access denied / الوصول مرفوض')
  const rights = capabilities(role)
  let changed = { ...record }
  let label = action,
    arabic = action
  if (action === 'submit') {
    if (!rights.register || !['Draft', 'Classified', 'Returned'].includes(record.status))
      throw new Error('Submission is unavailable / الإرسال غير متاح')
    if (!record.title.trim() || !record.summary.trim() || !record.kind || !record.fileName)
      throw new Error('Complete the registration fields / أكمل بيانات التسجيل')
    changed = {
      ...changed,
      status: 'PendingApproval',
      approvals: [],
      note: '',
      due: new Date(Date.now() + state.settings.sla * 3600000).toISOString(),
    }
    label = 'Submitted for approval'
    arabic = 'تم الإرسال للاعتماد'
  } else if (action === 'approve') {
    if (!rights.approve || record.status !== 'PendingApproval')
      throw new Error('Approval is unavailable / الاعتماد غير متاح')
    const steps = approvalSteps(record)
    const target = step || steps.find((s) => !record.approvals.includes(s))!
    if (!steps.includes(target) || record.approvals.includes(target))
      throw new Error('This step is already complete / هذه الخطوة مكتملة')
    if (record.flow !== 'Parallel' && target !== steps.find((s) => !record.approvals.includes(s)))
      throw new Error('Approve in sequence / اعتمد بالترتيب')
    changed.approvals = [...record.approvals, target]
    changed.signature = `${people[role]} · ${new Date().toISOString()} · DEMO-${crypto.randomUUID().slice(0, 8)}`
    label = `Approved: ${target}`
    arabic = 'تم اعتماد خطوة المراجعة'
    if (changed.approvals.length === steps.length) {
      changed.status = state.settings.simulateFailure ? 'Approved' : 'Published'
      changed.note = state.settings.simulateFailure
        ? 'Simulated promotion failure; original retained for retry.'
        : ''
      if (changed.status === 'Published') changed = publish(changed, state.settings)
      label = changed.status === 'Published' ? 'Approved and published' : 'Approved; promotion needs retry'
      arabic = changed.status === 'Published' ? 'تم الاعتماد والنشر' : 'تم الاعتماد؛ إعادة النشر مطلوبة'
    }
  } else if (action === 'return') {
    if (!rights.approve || record.status !== 'PendingApproval' || !reason.trim())
      throw new Error('A return reason is required / سبب الإرجاع مطلوب')
    changed = { ...changed, status: 'Returned', note: reason, approvals: [], indexed: false }
    label = 'Returned for changes'
    arabic = 'تم الإرجاع للتعديل'
  } else if (action === 'retry') {
    if (role !== 'System Administrator' || record.status !== 'Approved')
      throw new Error('Retry is unavailable / إعادة المحاولة غير متاحة')
    changed = publish(changed, state.settings)
    label = 'Promotion replay completed'
    arabic = 'تمت إعادة النشر'
  } else if (action === 'hold') {
    if (!rights.records || !reason.trim() || record.status === 'Disposed')
      throw new Error('A legal hold reason is required / سبب الحجز القانوني مطلوب')
    changed.hold = reason
    label = 'Legal hold applied'
    arabic = 'تم تطبيق الحجز القانوني'
  } else if (action === 'release') {
    if (!rights.records || !reason.trim())
      throw new Error('A release reason is required / سبب رفع الحجز مطلوب')
    changed.hold = ''
    label = 'Legal hold released'
    arabic = 'تم رفع الحجز القانوني'
  } else if (action === 'archive' || action === 'dispose') {
    if (
      !rights.records ||
      record.hold ||
      !reason.trim() ||
      (action === 'archive' ? record.status !== 'Published' : record.status !== 'Archived')
    )
      throw new Error(
        'Disposition blocked; check status, hold and reason / التصرف محظور؛ تحقق من الحالة والحجز والسبب',
      )
    changed = {
      ...changed,
      status: action === 'archive' ? 'Archived' : 'Disposed',
      indexed: false,
      location: action === 'archive' ? 'Archive / ' + record.kind : 'Disposed — registry retained',
    }
    label = action === 'archive' ? 'Record archived' : 'Disposition approved (simulation)'
    arabic = action === 'archive' ? 'تمت أرشفة السجل' : 'تم اعتماد الإتلاف التجريبي'
  } else if (action === 'declare') {
    if (!rights.records || record.status !== 'Published')
      throw new Error('Declaration unavailable / إعلان السجل غير متاح')
    changed.declared = true
    label = 'Declared as a record'
    arabic = 'تم إعلان الوثيقة كسجل'
  } else if (action === 'delegate') {
    if (!rights.approve || record.status !== 'PendingApproval' || !reason.trim())
      throw new Error('Enter a delegate / أدخل المفوض')
    changed.delegated = true
    changed.note = reason
    label = 'Approval delegated'
    arabic = 'تم تفويض الاعتماد'
  } else if (action === 'version') {
    if (!rights.register || record.status !== 'Published' || record.declared || record.hold)
      throw new Error('Record is frozen / السجل مجمد')
    const draft = {
      ...record,
      id: nextNumber(state),
      status: 'Draft' as Status,
      version: record.version,
      approvals: [],
      indexed: false,
      staging: 'Active',
      location: 'Staging',
      reference: record.id,
      revises: record.id,
      signature: '',
      captured: new Date().toISOString(),
    }
    return addEvent(
      { ...state, documents: [draft, ...state.documents] },
      role,
      'Revision draft created',
      'تم إنشاء مسودة إصدار',
      draft.id,
      record.id,
    )
  } else throw new Error('Unknown action')
  const previous = state.documents.find((r) => r.id === changed.revises)
  if (changed.status === 'Published' && previous && (previous.hold || previous.declared))
    throw new Error('The previous record is frozen / الإصدار السابق مجمد')
  const next = {
    ...state,
    documents: state.documents.map(
      (r): RecordItem =>
        r.id === id
          ? changed
          : changed.status === 'Published' && r.id === changed.revises
            ? { ...r, status: 'Superseded', indexed: false }
            : r,
    ),
    notices: [
      {
        id: crypto.randomUUID(),
        title: `${label} · ${record.title}`,
        titleAr: `${arabic} · ${record.titleAr || record.title}`,
        recordId: id,
        category: ['hold', 'release'].includes(action) ? 'Security' : 'Workflow',
        read: false,
        time: new Date().toISOString(),
      },
      ...state.notices,
    ],
  }
  return addEvent(next, role, label, arabic, id, reason || changed.note)
}
function publish(record: RecordItem, settings: Settings): RecordItem {
  return {
    ...record,
    status: 'Published',
    version: record.version + 1,
    indexed: false,
    note: '',
    location: `${settings.library}/${record.department}/${record.kind}/${record.fileName}`,
    staging: settings.cleanup === 'Purge' ? 'Purged' : 'Published / Approved',
  }
}
export function nextNumber(state: Workspace) {
  return `DOC-${new Date().getFullYear()}-${String(Math.max(123, ...state.documents.map((r) => Number(r.id.split('-').at(-1)) || 0)) + 1).padStart(6, '0')}`
}
export function seedWorkspace(): Workspace {
  const seeds = [
    [
      'Document governance policy',
      'سياسة حوكمة الوثائق',
      'Policy',
      'Operations',
      'Internal',
      'Published',
      'All official records require manual classification and approval before publication. Retain policy records for seven years. Legal holds override disposition.',
      'تتطلب السجلات الرسمية التصنيف اليدوي والاعتماد قبل النشر. تحفظ السياسات لمدة سبع سنوات ويتجاوز الحجز القانوني قرارات الإتلاف.',
    ],
    [
      'Supplier framework agreement',
      'اتفاقية إطار الموردين',
      'Contract',
      'Finance',
      'Confidential',
      'PendingApproval',
      'Annual supplier framework for facilities services. Finance and compliance review are required before execution.',
      'اتفاقية سنوية لخدمات المرافق تتطلب مراجعة المالية والامتثال قبل التنفيذ.',
    ],
    [
      'Business continuity playbook',
      'دليل استمرارية الأعمال',
      'Report',
      'Operations',
      'Internal',
      'Published',
      'Department coordinators maintain continuity plans, review them quarterly and record annual exercise outcomes.',
      'يحافظ منسقو الإدارات على خطط الاستمرارية مع مراجعة ربع سنوية وتوثيق نتائج التمارين السنوية.',
    ],
    [
      'Annual leave circular',
      'تعميم الإجازات السنوية',
      'Circular',
      'Human Resources',
      'Public',
      'Published',
      'Annual leave requests must be submitted through the employee portal and approved by the line manager before travel.',
      'ترسل طلبات الإجازة عبر بوابة الموظفين وتعتمد من المدير المباشر قبل السفر.',
    ],
    [
      'Service improvement memorandum',
      'مذكرة تحسين الخدمات',
      'Memo',
      'Operations',
      'Internal',
      'Returned',
      'Proposed service improvements for the customer experience programme.',
      'تحسينات مقترحة للخدمات ضمن برنامج تجربة المتعاملين.',
    ],
    [
      'Quarterly budget review',
      'مراجعة الميزانية الفصلية',
      'Report',
      'Finance',
      'Confidential',
      'Draft',
      'Quarterly review of operating expenditure and procurement commitments.',
      'مراجعة فصلية للمصروفات التشغيلية والتزامات المشتريات.',
    ],
    [
      'Restricted case assessment',
      'تقييم قضية سرية',
      'Report',
      'Legal',
      'Secret',
      'PendingApproval',
      'Restricted legal case assessment for senior director and compliance approval.',
      'تقييم قضية سرية لاعتماد المدير والامتثال.',
    ],
    [
      'Records retention schedule',
      'جدول مدد حفظ السجلات',
      'Policy',
      'Legal',
      'Internal',
      'Published',
      'Contracts are retained for seven years after closure. Records under legal hold cannot be deleted. A records officer approves disposition.',
      'تحفظ العقود لسبع سنوات بعد الإغلاق. يمنع إتلاف السجلات المحجوزة قانونياً ويعتمد مسؤول السجلات التصرف النهائي.',
    ],
    [
      'Facilities inspection report',
      'تقرير تفتيش المرافق',
      'Report',
      'Operations',
      'Internal',
      'Approved',
      'Inspection findings and maintenance follow-up actions for operational facilities.',
      'نتائج التفتيش وإجراءات متابعة الصيانة للمرافق التشغيلية.',
    ],
    [
      'Employee onboarding checklist',
      'قائمة إجراءات انضمام الموظف',
      'HR Record',
      'Human Resources',
      'Confidential',
      'Published',
      'Onboarding checklist covering induction, access provisioning and mandatory training.',
      'قائمة تشمل التعريف بالمؤسسة ومنح الصلاحيات والتدريب الإلزامي.',
    ],
    [
      'Archived procurement register',
      'سجل المشتريات المؤرشف',
      'Report',
      'Finance',
      'Internal',
      'Archived',
      'Historical procurement register awaiting disposition review.',
      'سجل مشتريات تاريخي بانتظار مراجعة التصرف النهائي.',
    ],
    [
      'Interdepartmental service charter',
      'ميثاق الخدمات بين الإدارات',
      'Policy',
      'Operations',
      'Internal',
      'PendingApproval',
      'Shared service commitments with parallel department and compliance sign-off.',
      'التزامات الخدمات المشتركة مع اعتماد متواز من الإدارة والامتثال.',
    ],
  ]
  const documents = seeds.map(
    (s, i): RecordItem => ({
      id: `DOC-2026-${String(112 + i).padStart(6, '0')}`,
      title: s[0],
      titleAr: s[1],
      kind: s[2],
      department: s[3],
      sensitivity: s[4] as Sensitivity,
      status: s[5] as Status,
      summary: s[6],
      summaryAr: s[7],
      owner: i % 2 ? 'Noor Al Shamsi' : 'Mariam Al Mansoori',
      reference: '',
      fileName: `${s[0].toLowerCase().replaceAll(' ', '-')}.${i === 1 ? 'docx' : i === 5 ? 'xlsx' : 'pdf'}`,
      mime:
        i === 1
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'application/pdf',
      size: 184320 + i * 25812,
      hash: 'Sample fixture — upload a file to calculate SHA-256',
      captured: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
      expiry: new Date(Date.now() + (i === 7 ? 7 : 90 + i * 25) * 86400000).toISOString().slice(0, 10),
      flow: i === 6 ? 'Conditional' : i === 11 ? 'Parallel' : i === 1 ? 'Sequential' : 'Single',
      priority: i === 6 ? 'Urgent' : 'Routine',
      scope: 'Clearance level',
      approvals: [],
      version: s[5] === 'Published' || s[5] === 'Archived' ? 1 : 0,
      indexed: s[5] === 'Published',
      hold: i === 7 ? 'LH-2026-014 · Records review investigation' : '',
      declared: i === 7,
      location: ['Published', 'Archived'].includes(s[5]) ? `SharePoint / ${s[3]} / ${s[2]}` : 'Staging',
      staging: s[5] === 'Published' ? 'Published / Approved' : 'Active',
      note:
        s[5] === 'Returned'
          ? 'Please add the implementation timeline and accountable owner.'
          : s[5] === 'Approved'
            ? 'Simulated connector timeout; original is retained for replay.'
            : '',
      due: new Date(Date.now() + (i === 1 ? -2 : 24) * 3600000).toISOString(),
      delegated: false,
      signature: '',
    }),
  )
  return {
    schema: 1,
    documents,
    notices: [
      {
        id: 'n1',
        title: 'Supplier agreement approval is overdue',
        titleAr: 'تأخر اعتماد اتفاقية الموردين',
        recordId: documents[1].id,
        category: 'Workflow',
        read: false,
        time: new Date().toISOString(),
      },
      {
        id: 'n2',
        title: 'Retention schedule expires in 7 days',
        titleAr: 'ينتهي جدول الحفظ خلال ٧ أيام',
        recordId: documents[7].id,
        category: 'Lifecycle',
        read: false,
        time: new Date().toISOString(),
      },
      {
        id: 'n3',
        title: 'Facilities report needs promotion replay',
        titleAr: 'تقرير المرافق يحتاج إعادة النشر',
        recordId: documents[8].id,
        category: 'System',
        read: false,
        time: new Date().toISOString(),
      },
    ],
    audit: documents.slice(0, 5).map((r) => ({
      id: crypto.randomUUID(),
      time: r.captured,
      actor: r.owner,
      role: 'System Administrator',
      action: `Sample record: ${r.status}`,
      actionAr: 'سجل تجريبي',
      object: r.id,
      detail: 'Seeded demonstration event',
    })),
    correspondence: [
      {
        id: 'COR-2026-0042',
        subject: 'Request for annual performance report',
        subjectAr: 'طلب تقرير الأداء السنوي',
        direction: 'Incoming',
        party: 'Executive Office',
        assignee: 'Operations',
        due: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
        status: 'Open',
        thread: ['Executive Office → Operations: Please provide the approved annual report.'],
        acknowledged: false,
      },
      {
        id: 'COR-2026-0041',
        subject: 'Updated service hours circular',
        subjectAr: 'تعميم تحديث ساعات الخدمة',
        direction: 'Circular',
        party: 'All departments',
        assignee: 'Operations',
        due: new Date().toISOString().slice(0, 10),
        status: 'Open',
        thread: ['Distribution: All departments'],
        acknowledged: false,
      },
    ],
    settings: {
      classes: ['Correspondence', 'Memo', 'Circular', 'Contract', 'HR Record', 'Report', 'Policy'],
      department: 'Operations',
      library: 'SharePoint / Official Records',
      sla: 48,
      cleanup: 'Retain',
      retentionYears: 7,
      cadence: 'Every 15 minutes',
      simulateFailure: false,
      email: true,
      teams: true,
      quietHours: '20:00–07:00',
      defaultArabic: false,
    },
    savedSearches: [],
    feedback: [],
  }
}
export const STORAGE_KEY = 'docaya-prototype-v1'
export function loadWorkspace(): Workspace {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (value?.schema === 1 && Array.isArray(value.documents) && value.settings && Array.isArray(value.audit))
      return value
  } catch {
    /* Start a clean demo if storage is invalid. */
  }
  return seedWorkspace()
}
export function downloadFile(name: string, content: string, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob(['\uFEFF', content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export function csv(rows: string[][]) {
  return rows
    .map((row) =>
      row
        .map((cell) => `"${(/^[=+@\-\t\r]/.test(cell) ? "'" + cell : cell).replaceAll('"', '""')}"`)
        .join(','),
    )
    .join('\r\n')
}
