import { useEffect, useState, type FormEvent } from 'react'
import {
  Activity,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Moon,
  Package,
  Plus,
  Search,
  Settings,
  Sun,
  Users,
  X,
} from 'lucide-react'
import './App.css'
import { calculateInvoiceTotal, formatCurrency, formatProjectStatus } from './lib/formatters'
import { isSupabaseConfigured, supabase } from './lib/supabase'

type NavItem = {
  label: string
  icon: typeof LayoutDashboard
}

type ClientRecord = {
  id: string
  name: string
  company_name?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  notes?: string | null
  status?: 'active' | 'inactive'
  created_at?: string
}

type ProjectRecord = {
  id: string
  title: string
  description?: string | null
  status?: string | null
  deadline?: string | null
  budget?: number | string | null
  priority?: string | null
  client_id?: string | null
  location?: string | null
  created_at?: string
}

type ShootRecord = {
  id: string
  project_id: string
  title: string
  start_at: string
  end_at?: string | null
  location?: string | null
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  notes?: string | null
}

type TaskRecord = {
  id: string
  project_id: string
  title: string
  description?: string | null
  status?: 'backlog' | 'todo' | 'in_progress' | 'blocked' | 'done'
  priority?: 'low' | 'normal' | 'high'
  due_at?: string | null
}

type DeliverableRecord = {
  id: string
  project_id: string
  name: string
  description?: string | null
  status?: 'not_started' | 'in_progress' | 'internal_review' | 'client_review' | 'revision' | 'approved' | 'delivered'
  client_due_at?: string | null
  version?: number
  file_url?: string | null
}

type InvoiceRecord = {
  id: string
  client_id: string
  project_id?: string | null
  invoice_no: string
  doc_type?: 'quotation' | 'invoice'
  issue_date?: string
  due_date?: string | null
  subtotal?: number | string
  discount?: number | string
  gst_rate?: number | string
  gst_amount?: number | string
  total?: number | string
  status?: 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled'
}

type InvoiceLineItem = {
  description: string
  quantity: string
  rate: string
}

type PaymentRecord = {
  id: string
  invoice_id: string
  amount: number | string
  method: 'upi' | 'bank_transfer' | 'cash' | 'other'
  paid_at?: string
}

type ExpenseRecord = {
  id: string
  project_id?: string | null
  category: string
  description: string
  amount: number | string
  expense_date?: string
  status?: 'recorded' | 'reimbursed' | 'ignored'
}

type ProjectEventRecord = {
  id: string
  project_id: string
  event_type: 'milestone' | 'deadline' | 'meeting' | 'delivery' | 'note'
  title: string
  starts_at?: string | null
  ends_at?: string | null
  all_day?: boolean
  notes?: string | null
}

type CrewRecord = {
  id: string
  name: string
  role?: string | null
  phone?: string | null
  email?: string | null
  status?: 'active' | 'inactive'
  notes?: string | null
}

type EquipmentRecord = {
  id: string
  name: string
  category: string
  identifier?: string | null
  status?: 'available' | 'maintenance' | 'retired'
  notes?: string | null
}

type ActivityRecord = {
  id: string
  entity_type: string
  entity_id: string
  action: string
  metadata_json?: Record<string, unknown>
  created_at: string
}

const navigation: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Calendar', icon: CalendarDays },
  { label: 'Projects', icon: FolderKanban },
  { label: 'Clients', icon: Users },
  { label: 'Tasks', icon: ClipboardList },
  { label: 'Deliverables', icon: Package },
  { label: 'Payments', icon: CircleDollarSign },
  { label: 'Expenses', icon: CircleDollarSign },
  { label: 'Crew', icon: Users },
  { label: 'Equipment', icon: Package },
  { label: 'Invoices', icon: CircleDollarSign },
  { label: 'Activity', icon: Activity },
]

const schedule = [
  { time: '09:30', title: 'Shoot · Northstar launch film', detail: 'Docklands Studio · 3 crew', tone: 'coral' },
  { time: '13:00', title: 'Client review · Reel 03', detail: 'Northstar launch campaign', tone: 'blue' },
  { time: '16:30', title: 'Deadline · Product stills', detail: 'Due today · assigned to Aditya', tone: 'yellow' },
]

const previewProjects = [
  { name: 'Northstar launch campaign', client: 'Northstar Coffee Co.', status: 'In progress', progress: 72, due: 'Oct 10', color: 'coral' },
  { name: 'Studio portraits · Q4', client: 'Maya Rao', status: 'Client review', progress: 88, due: 'Oct 04', color: 'blue' },
  { name: 'Monsoon product series', client: 'Aster Home', status: 'Planning', progress: 24, due: 'Oct 22', color: 'green' },
]

const emptyClientForm = {
  name: '',
  company_name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
}

const emptyProjectForm = {
  title: '',
  client_id: '',
  description: '',
  status: 'lead',
  priority: 'normal',
  budget: '',
  deadline: '',
  location: '',
}

const emptyShootForm = {
  project_id: '',
  title: '',
  start_at: '',
  end_at: '',
  location: '',
  notes: '',
  crew_ids: [] as string[],
  equipment_ids: [] as string[],
}

const emptyTaskForm = {
  project_id: '',
  title: '',
  description: '',
  priority: 'normal',
  due_at: '',
}

const emptyDeliverableForm = {
  project_id: '',
  name: '',
  description: '',
  client_due_at: '',
  version: '1',
  file_url: '',
}

const emptyInvoiceForm = {
  client_id: '',
  project_id: '',
  invoice_no: '',
  due_date: '',
  subtotal: '',
  discount: '0',
  gst_rate: '0',
}

const emptyInvoiceLineItem: InvoiceLineItem = { description: '', quantity: '1', rate: '' }

const emptyPaymentForm = {
  invoice_id: '',
  amount: '',
  method: 'upi',
}

const emptyExpenseForm = {
  project_id: '',
  category: 'production',
  description: '',
  amount: '',
  expense_date: '',
}

const emptyProjectEventForm = {
  project_id: '',
  event_type: 'milestone',
  title: '',
  starts_at: '',
  ends_at: '',
  all_day: false,
  notes: '',
}

const emptyCrewForm = { name: '', role: '', phone: '', email: '' }
const emptyEquipmentForm = { name: '', category: '', identifier: '' }

const calendarWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getCalendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = new Date(firstDay)
  start.setDate(firstDay.getDate() - firstDay.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return day
  })
}

function dateKey(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function rangesOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && startB < endA
}

function App() {
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('sched-u-theme') === 'dark')
  const [notice, setNotice] = useState('')
  const [liveProjects, setLiveProjects] = useState(previewProjects)
  const [liveClientCount, setLiveClientCount] = useState<number | null>(null)
  const [dataState, setDataState] = useState<'preview' | 'live' | 'error'>(() => (isSupabaseConfigured ? 'preview' : 'error'))
  const [sessionState, setSessionState] = useState<'loading' | 'guest' | 'authed'>('guest')
  const [sessionUser, setSessionUser] = useState<{ email?: string | null; name?: string | null } | null>(null)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' })
  const [clientForm, setClientForm] = useState(emptyClientForm)
  const [projectForm, setProjectForm] = useState(emptyProjectForm)
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [shoots, setShoots] = useState<ShootRecord[]>([])
  const [shootForm, setShootForm] = useState(emptyShootForm)
  const [shootsAvailable, setShootsAvailable] = useState(true)
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [taskForm, setTaskForm] = useState(emptyTaskForm)
  const [tasksAvailable, setTasksAvailable] = useState(true)
  const [deliverables, setDeliverables] = useState<DeliverableRecord[]>([])
  const [deliverableForm, setDeliverableForm] = useState(emptyDeliverableForm)
  const [deliverablesAvailable, setDeliverablesAvailable] = useState(true)
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoiceForm)
  const [invoiceLineItems, setInvoiceLineItems] = useState<InvoiceLineItem[]>([{ ...emptyInvoiceLineItem }])
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm)
  const [invoicesAvailable, setInvoicesAvailable] = useState(true)
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([])
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm)
  const [expensesAvailable, setExpensesAvailable] = useState(true)
  const [projectEvents, setProjectEvents] = useState<ProjectEventRecord[]>([])
  const [projectEventsAvailable, setProjectEventsAvailable] = useState(true)
  const [projectEventForm, setProjectEventForm] = useState(emptyProjectEventForm)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => dateKey(new Date()))
  const [todayCalendarKey] = useState(() => dateKey(new Date()))
  const [todayLabel] = useState(() => new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }))
  const [crew, setCrew] = useState<CrewRecord[]>([])
  const [crewAvailable, setCrewAvailable] = useState(true)
  const [crewForm, setCrewForm] = useState(emptyCrewForm)
  const [equipment, setEquipment] = useState<EquipmentRecord[]>([])
  const [equipmentAvailable, setEquipmentAvailable] = useState(true)
  const [equipmentForm, setEquipmentForm] = useState(emptyEquipmentForm)
  const [shootAssignments, setShootAssignments] = useState<Record<string, { crewIds: string[]; equipmentIds: string[] }>>({})
  const [selectedShootId, setSelectedShootId] = useState<string | null>(null)
  const [assignmentDraft, setAssignmentDraft] = useState<{ crewIds: string[]; equipmentIds: string[] }>({ crewIds: [], equipmentIds: [] })
  const [activity, setActivity] = useState<ActivityRecord[]>([])
  const [activityAvailable, setActivityAvailable] = useState(true)
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)
  const [projectSearch, setProjectSearch] = useState('')
  const [projectStatusFilter, setProjectStatusFilter] = useState('all')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  const notify = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3000)
  }

  const ensureProfile = async (user: { id?: string; email?: string | null; user_metadata?: { full_name?: string | null } } | null) => {
    if (!supabase || !user?.id) return

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!existingProfile) {
      await supabase.from('profiles').upsert(
        {
          id: user.id,
          email: user.email ?? '',
          name: user.user_metadata?.full_name ?? user.email ?? 'Studio user',
          role: 'staff',
        },
        { onConflict: 'id' },
      )
    }
  }

  const loadDashboardData = async (client: typeof supabase) => {
    if (!client) {
      setDataState('error')
      setLoadingRecords(false)
      return
    }

    setLoadingRecords(true)

    const [clientsResult, projectsResult] = await Promise.all([
      client.from('clients').select('*').order('created_at', { ascending: false }),
      client.from('projects').select('*').order('created_at', { ascending: false }).limit(5),
    ])

    if (clientsResult.error || projectsResult.error) {
      setDataState('error')
      setLoadingRecords(false)
      notify('Could not load the studio records. Please check the Supabase connection.')
      return
    }

    const nextClients = clientsResult.data ?? []
    const nextProjects = projectsResult.data ?? []

    setClients(nextClients)
    setProjects(nextProjects)
    setLiveClientCount(nextClients.length)

    if (nextProjects.length > 0) {
      const clientNames = new Map(nextClients.map((record) => [record.id, record.name]))
      setLiveProjects(
        nextProjects.slice(0, 3).map((project) => ({
          name: project.title,
          client: clientNames.get(project.client_id ?? '') ?? 'Unassigned client',
          status: formatProjectStatus(project.status ?? 'lead'),
          progress: project.status === 'completed' ? 100 : project.status === 'review' ? 88 : project.status === 'active' ? 72 : 32,
          due: project.deadline ? new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : 'No deadline',
          color: project.status === 'completed' ? 'green' : project.status === 'review' ? 'blue' : project.status === 'active' ? 'coral' : 'yellow',
        })),
      )
    }

    setDataState('live')
    setLoadingRecords(false)
  }

  const loadShoots = async (client: typeof supabase) => {
    if (!client) return

    const { data, error } = await client
      .from('shoot_sessions')
      .select('*')
      .order('start_at', { ascending: true })

    if (error) {
      setShootsAvailable(false)
      return
    }

    setShoots(data ?? [])
    setShootsAvailable(true)
  }

  const loadTasks = async (client: typeof supabase) => {
    if (!client) return

    const { data, error } = await client
      .from('tasks')
      .select('*')
      .order('due_at', { ascending: true, nullsFirst: false })

    if (error) {
      setTasksAvailable(false)
      return
    }

    setTasks(data ?? [])
    setTasksAvailable(true)
  }

  const loadDeliverables = async (client: typeof supabase) => {
    if (!client) return

    const { data, error } = await client
      .from('deliverables')
      .select('*')
      .order('client_due_at', { ascending: true, nullsFirst: false })

    if (error) {
      setDeliverablesAvailable(false)
      return
    }

    setDeliverables(data ?? [])
    setDeliverablesAvailable(true)
  }

  const loadInvoices = async (client: typeof supabase) => {
    if (!client) return

    const [{ data: invoiceData, error: invoiceError }, { data: paymentData, error: paymentError }] = await Promise.all([
      client.from('invoices').select('*').order('created_at', { ascending: false }),
      client.from('payments').select('*').order('paid_at', { ascending: false }),
    ])

    if (invoiceError || paymentError) {
      setInvoicesAvailable(false)
      return
    }

    setInvoices(invoiceData ?? [])
    setPayments(paymentData ?? [])
    setInvoicesAvailable(true)
  }

  const loadExpenses = async (client: typeof supabase) => {
    if (!client) return

    const { data, error } = await client.from('expenses').select('*').order('expense_date', { ascending: false })

    if (error) {
      setExpensesAvailable(false)
      return
    }

    setExpenses(data ?? [])
    setExpensesAvailable(true)
  }

  const loadProjectEvents = async (client: typeof supabase) => {
    if (!client) return

    const { data, error } = await client
      .from('project_events')
      .select('*')
      .order('starts_at', { ascending: true })

    if (error) {
      setProjectEventsAvailable(false)
      return
    }

    setProjectEvents(data ?? [])
    setProjectEventsAvailable(true)
  }

  const loadCrewAndEquipment = async (client: typeof supabase) => {
    if (!client) return
    const [{ data: crewData, error: crewError }, { data: equipmentData, error: equipmentError }] = await Promise.all([
      client.from('crew').select('*').order('name'),
      client.from('equipment').select('*').order('name'),
    ])
    setCrewAvailable(!crewError)
    setEquipmentAvailable(!equipmentError)
    if (!crewError) setCrew(crewData ?? [])
    if (!equipmentError) setEquipment(equipmentData ?? [])
  }

  const loadShootAssignments = async (client: typeof supabase) => {
    if (!client) return
    const [{ data: crewAssignments, error: crewError }, { data: equipmentAssignments, error: equipmentError }] = await Promise.all([
      client.from('shoot_crew').select('shoot_id, crew_id'),
      client.from('shoot_equipment').select('shoot_id, equipment_id'),
    ])
    if (crewError || equipmentError) return
    const assignments: Record<string, { crewIds: string[]; equipmentIds: string[] }> = {}
    ;(crewAssignments ?? []).forEach((assignment) => {
      assignments[assignment.shoot_id] ??= { crewIds: [], equipmentIds: [] }
      assignments[assignment.shoot_id].crewIds.push(assignment.crew_id)
    })
    ;(equipmentAssignments ?? []).forEach((assignment) => {
      assignments[assignment.shoot_id] ??= { crewIds: [], equipmentIds: [] }
      assignments[assignment.shoot_id].equipmentIds.push(assignment.equipment_id)
    })
    setShootAssignments(assignments)
  }

  const loadActivity = async (client: typeof supabase) => {
    if (!client) return
    const { data, error } = await client.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100)
    if (error) {
      setActivityAvailable(false)
      return
    }
    setActivity(data ?? [])
    setActivityAvailable(true)
  }

  const recordActivity = async (entityType: string, entityId: string, action: string, metadata: Record<string, unknown> = {}) => {
    if (!supabase) return
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return
    const { data, error } = await supabase.from('activity_logs').insert({
      actor_id: user.id,
      entity_type: entityType,
      entity_id: entityId,
      action,
      metadata_json: metadata,
    }).select().single()
    if (!error && data) setActivity((current) => [data, ...current].slice(0, 100))
  }

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return
    }

    const client = supabase

    const initializeSession = async () => {
      const {
        data: { session },
      } = await client.auth.getSession()

      if (session?.user) {
        setSessionUser({
          email: session.user.email,
          name: session.user.user_metadata?.full_name as string | undefined,
        })
        setSessionState('authed')
        await ensureProfile(session.user)
        await loadDashboardData(client)
        await loadShoots(client)
        await loadTasks(client)
        await loadDeliverables(client)
        await loadInvoices(client)
        await loadExpenses(client)
        await loadProjectEvents(client)
        await loadCrewAndEquipment(client)
        await loadShootAssignments(client)
        await loadActivity(client)
      } else {
        setSessionState('guest')
        setSessionUser(null)
        setLoadingRecords(false)
      }
    }

    void initializeSession()

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (_event, nextSession) => {
      if (nextSession?.user) {
        setSessionUser({
          email: nextSession.user.email,
          name: nextSession.user.user_metadata?.full_name as string | undefined,
        })
        setSessionState('authed')
        await ensureProfile(nextSession.user)
        await loadDashboardData(client)
        await loadShoots(client)
        await loadTasks(client)
        await loadDeliverables(client)
        await loadInvoices(client)
        await loadExpenses(client)
        await loadProjectEvents(client)
        await loadCrewAndEquipment(client)
        await loadShootAssignments(client)
        await loadActivity(client)
      } else {
        setSessionUser(null)
        setSessionState('guest')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!supabase) {
      notify('Supabase is not configured yet.')
      return
    }
    setActionBusy(true)

    try {
      if (authMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authForm.email,
          password: authForm.password,
        })

        if (error) throw error
        notify('Welcome back. You are signed in.')
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: authForm.email,
          password: authForm.password,
          options: {
            data: {
              full_name: authForm.name,
            },
          },
        })

        if (error) throw error

        await ensureProfile(
          data.user
            ? {
                id: data.user.id,
                email: data.user.email,
                user_metadata: { full_name: authForm.name },
              }
            : null,
        )

        notify('Account created. Please confirm your email if required.')
      }

      setAuthForm({ email: '', password: '', name: '' })
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Authentication failed.')
    } finally {
      setActionBusy(false)
    }
  }

  const handleClientSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!supabase) {
      notify('Supabase is not configured yet.')
      return
    }

    setActionBusy(true)

    try {
      const payload = {
        name: clientForm.name.trim(),
        company_name: clientForm.company_name.trim() || null,
        phone: clientForm.phone.trim() || null,
        email: clientForm.email.trim() || null,
        address: clientForm.address.trim() || null,
        notes: clientForm.notes.trim() || null,
        status: 'active',
      }

      const { data, error } = await supabase.from('clients').insert(payload).select().single()

      if (error) throw error

      setClients((current) => [data, ...current])
      setLiveClientCount((count) => (count ?? 0) + 1)
      setClientForm(emptyClientForm)
      void recordActivity('client', data.id, 'created', { name: data.name })
      notify('Client created successfully.')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Client could not be created.')
    } finally {
      setActionBusy(false)
    }
  }

  const handleProjectSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!supabase) {
      notify('Supabase is not configured yet.')
      return
    }

    if (!projectForm.client_id) {
      notify('Choose a client before creating a project.')
      return
    }

    setActionBusy(true)

    try {
      const payload = {
        title: projectForm.title.trim(),
        client_id: projectForm.client_id,
        description: projectForm.description.trim() || null,
        status: projectForm.status,
        priority: projectForm.priority,
        budget: projectForm.budget ? Number(projectForm.budget) : null,
        deadline: projectForm.deadline || null,
        location: projectForm.location.trim() || null,
      }

      const { data, error } = await supabase.from('projects').insert(payload).select().single()

      if (error) throw error

      setProjects((current) => [data, ...current])
      setProjectForm(emptyProjectForm)
      void recordActivity('project', data.id, 'created', { title: data.title })
      notify('Project created successfully.')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Project could not be created.')
    } finally {
      setActionBusy(false)
    }
  }

  const handleProjectStatusUpdate = async (status: string) => {
    if (!supabase || !selectedProjectId) {
      notify('Select a project from a live Supabase session before changing its status.')
      return
    }

    setActionBusy(true)

    try {
      const { data, error } = await supabase
        .from('projects')
        .update({ status })
        .eq('id', selectedProjectId)
        .select()
        .single()

      if (error) throw error

      setProjects((current) => current.map((project) => (project.id === data.id ? data : project)))
      void recordActivity('project', data.id, 'status_updated', { status })
      notify('Project status updated.')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Project status could not be updated.')
    } finally {
      setActionBusy(false)
    }
  }

  const handleShootSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!supabase) {
      notify('Supabase is not configured yet.')
      return
    }

    const client = supabase

    if (!shootForm.project_id) {
      notify('Choose a project before scheduling a shoot.')
      return
    }

    const startAt = new Date(shootForm.start_at)
    const endAt = shootForm.end_at ? new Date(shootForm.end_at) : new Date(startAt.getTime() + 60 * 60 * 1000)
    if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime()) || endAt <= startAt) {
      notify('Shoot end time must be after the start time.')
      return
    }

    const selectedCrew = new Set(shootForm.crew_ids)
    const selectedEquipment = new Set(shootForm.equipment_ids)
    const conflictingShoot = shoots.find((shoot) => {
      const existingStart = new Date(shoot.start_at)
      const existingEnd = shoot.end_at ? new Date(shoot.end_at) : new Date(existingStart.getTime() + 60 * 60 * 1000)
      const assignment = shootAssignments[shoot.id]
      const crewConflict = assignment?.crewIds.some((crewId) => selectedCrew.has(crewId))
      const equipmentConflict = assignment?.equipmentIds.some((equipmentId) => selectedEquipment.has(equipmentId))
      return rangesOverlap(startAt, endAt, existingStart, existingEnd) && (crewConflict || equipmentConflict)
    })
    if (conflictingShoot) {
      notify(`Schedule conflict with "${conflictingShoot.title}". Check assigned crew or equipment.`)
      return
    }

    setActionBusy(true)

    try {
      const payload = {
        project_id: shootForm.project_id,
        title: shootForm.title.trim(),
        start_at: startAt.toISOString(),
        end_at: shootForm.end_at ? endAt.toISOString() : null,
        location: shootForm.location.trim() || null,
        notes: shootForm.notes.trim() || null,
        status: 'scheduled',
      }

      const { data, error } = await client.from('shoot_sessions').insert(payload).select().single()

      if (error) throw error

      const assignmentRequests = [
        ...shootForm.crew_ids.map((crewId) => client.from('shoot_crew').insert({ shoot_id: data.id, crew_id: crewId })),
        ...shootForm.equipment_ids.map((equipmentId) => client.from('shoot_equipment').insert({ shoot_id: data.id, equipment_id: equipmentId })),
      ]
      const assignmentResults = await Promise.all(assignmentRequests)
      const assignmentError = assignmentResults.find((result) => result.error)?.error
      if (assignmentError) {
        await client.from('shoot_sessions').delete().eq('id', data.id)
        throw assignmentError
      }

      setShoots((current) => [...current, data].sort((left, right) => left.start_at.localeCompare(right.start_at)))
      setShootAssignments((current) => ({
        ...current,
        [data.id]: { crewIds: shootForm.crew_ids, equipmentIds: shootForm.equipment_ids },
      }))
      setShootForm(emptyShootForm)
      void recordActivity('shoot', data.id, 'scheduled', { crew_count: shootForm.crew_ids.length, equipment_count: shootForm.equipment_ids.length })
      notify('Shoot scheduled successfully.')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Shoot could not be scheduled.')
    } finally {
      setActionBusy(false)
    }
  }

  const selectShootForAssignment = (shootId: string) => {
    const assignment = shootAssignments[shootId] ?? { crewIds: [], equipmentIds: [] }
    setSelectedShootId(shootId)
    setAssignmentDraft({ crewIds: [...assignment.crewIds], equipmentIds: [...assignment.equipmentIds] })
  }

  const handleShootAssignmentsUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase || !selectedShootId) return

    const shoot = shoots.find((item) => item.id === selectedShootId)
    if (!shoot) return

    const startAt = new Date(shoot.start_at)
    const endAt = shoot.end_at ? new Date(shoot.end_at) : new Date(startAt.getTime() + 60 * 60 * 1000)
    const conflictingShoot = shoots.find((otherShoot) => {
      if (otherShoot.id === shoot.id) return false
      const otherStart = new Date(otherShoot.start_at)
      const otherEnd = otherShoot.end_at ? new Date(otherShoot.end_at) : new Date(otherStart.getTime() + 60 * 60 * 1000)
      const otherAssignment = shootAssignments[otherShoot.id]
      const crewConflict = otherAssignment?.crewIds.some((crewId) => assignmentDraft.crewIds.includes(crewId))
      const equipmentConflict = otherAssignment?.equipmentIds.some((equipmentId) => assignmentDraft.equipmentIds.includes(equipmentId))
      return rangesOverlap(startAt, endAt, otherStart, otherEnd) && (crewConflict || equipmentConflict)
    })
    if (conflictingShoot) {
      notify(`Schedule conflict with "${conflictingShoot.title}". Check assigned crew or equipment.`)
      return
    }

    setActionBusy(true)
    try {
      const client = supabase
      const { error: crewDeleteError } = await client.from('shoot_crew').delete().eq('shoot_id', selectedShootId)
      if (crewDeleteError) throw crewDeleteError
      const { error: equipmentDeleteError } = await client.from('shoot_equipment').delete().eq('shoot_id', selectedShootId)
      if (equipmentDeleteError) throw equipmentDeleteError
      if (assignmentDraft.crewIds.length > 0) {
        const { error } = await client.from('shoot_crew').insert(assignmentDraft.crewIds.map((crewId) => ({ shoot_id: selectedShootId, crew_id: crewId })))
        if (error) throw error
      }
      if (assignmentDraft.equipmentIds.length > 0) {
        const { error } = await client.from('shoot_equipment').insert(assignmentDraft.equipmentIds.map((equipmentId) => ({ shoot_id: selectedShootId, equipment_id: equipmentId })))
        if (error) throw error
      }
      setShootAssignments((current) => ({ ...current, [selectedShootId]: { ...assignmentDraft } }))
      void recordActivity('shoot', selectedShootId, 'assignments_updated', {
        crew_count: assignmentDraft.crewIds.length,
        equipment_count: assignmentDraft.equipmentIds.length,
      })
      notify('Shoot assignments updated.')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Shoot assignments could not be updated.')
    } finally {
      setActionBusy(false)
    }
  }

  const handleShootDelete = async (shootId: string) => {
    if (!supabase || !window.confirm('Delete this shoot session and its assignments?')) return
    setActionBusy(true)
    try {
      const { error } = await supabase.from('shoot_sessions').delete().eq('id', shootId)
      if (error) throw error
      setShoots((current) => current.filter((shoot) => shoot.id !== shootId))
      setShootAssignments((current) => {
        const next = { ...current }
        delete next[shootId]
        return next
      })
      if (selectedShootId === shootId) setSelectedShootId(null)
      void recordActivity('shoot', shootId, 'deleted')
      notify('Shoot deleted.')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Shoot could not be deleted.')
    } finally {
      setActionBusy(false)
    }
  }

  const handleTaskSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!supabase) {
      notify('Supabase is not configured yet.')
      return
    }

    if (!taskForm.project_id) {
      notify('Choose a project before creating a task.')
      return
    }

    setActionBusy(true)

    try {
      const payload = {
        project_id: taskForm.project_id,
        title: taskForm.title.trim(),
        description: taskForm.description.trim() || null,
        priority: taskForm.priority,
        due_at: taskForm.due_at ? new Date(taskForm.due_at).toISOString() : null,
        status: 'todo',
      }

      const { data, error } = await supabase.from('tasks').insert(payload).select().single()

      if (error) throw error

      setTasks((current) => [...current, data].sort((left, right) => (left.due_at ?? '9999').localeCompare(right.due_at ?? '9999')))
      setTaskForm(emptyTaskForm)
      void recordActivity('task', data.id, 'created', { title: data.title })
      notify('Task created successfully.')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Task could not be created.')
    } finally {
      setActionBusy(false)
    }
  }

  const handleTaskStatusUpdate = async (taskId: string, status: string) => {
    if (!supabase) {
      notify('Supabase is not configured yet.')
      return
    }

    try {
      const { data, error } = await supabase.from('tasks').update({ status }).eq('id', taskId).select().single()

      if (error) throw error

      setTasks((current) => current.map((task) => (task.id === taskId ? data : task)))
      void recordActivity('task', data.id, 'status_updated', { status })
      notify('Task status updated.')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Task status could not be updated.')
    }
  }

  const handleDeliverableSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!supabase) {
      notify('Supabase is not configured yet.')
      return
    }

    if (!deliverableForm.project_id) {
      notify('Choose a project before creating a deliverable.')
      return
    }

    setActionBusy(true)

    try {
      const payload = {
        project_id: deliverableForm.project_id,
        name: deliverableForm.name.trim(),
        description: deliverableForm.description.trim() || null,
        client_due_at: deliverableForm.client_due_at ? new Date(deliverableForm.client_due_at).toISOString() : null,
        version: Math.max(1, Number(deliverableForm.version) || 1),
        file_url: deliverableForm.file_url.trim() || null,
        status: 'not_started',
      }

      const { data, error } = await supabase.from('deliverables').insert(payload).select().single()

      if (error) throw error

      setDeliverables((current) => [...current, data].sort((left, right) => (left.client_due_at ?? '9999').localeCompare(right.client_due_at ?? '9999')))
      setDeliverableForm(emptyDeliverableForm)
      void recordActivity('deliverable', data.id, 'created', { name: data.name })
      notify('Deliverable created successfully.')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Deliverable could not be created.')
    } finally {
      setActionBusy(false)
    }
  }

  const handleDeliverableStatusUpdate = async (deliverableId: string, status: string) => {
    if (!supabase) {
      notify('Supabase is not configured yet.')
      return
    }

    try {
      const { data, error } = await supabase.from('deliverables').update({ status }).eq('id', deliverableId).select().single()

      if (error) throw error

      setDeliverables((current) => current.map((deliverable) => (deliverable.id === deliverableId ? data : deliverable)))
      void recordActivity('deliverable', data.id, 'status_updated', { status })
      notify('Deliverable status updated.')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Deliverable status could not be updated.')
    }
  }

  const handleInvoiceSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!supabase) {
      notify('Supabase is not configured yet.')
      return
    }

    if (!invoiceForm.client_id || !invoiceForm.invoice_no.trim()) {
      notify('Choose a client and enter an invoice number.')
      return
    }

    setActionBusy(true)

    try {
      const validLineItems = invoiceLineItems
        .map((item) => ({
          description: item.description.trim(),
          quantity: Math.max(0, Number(item.quantity) || 0),
          rate: Math.max(0, Number(item.rate) || 0),
        }))
        .filter((item) => item.description && item.quantity > 0)
      if (validLineItems.length === 0) {
        notify('Add at least one invoice line item with a description and quantity.')
        setActionBusy(false)
        return
      }
      const subtotal = Math.round(validLineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0) * 100) / 100
      const discount = Math.min(subtotal, Math.max(0, Number(invoiceForm.discount) || 0))
      const gstRate = Math.min(100, Math.max(0, Number(invoiceForm.gst_rate) || 0))
      const taxableAmount = Math.max(0, subtotal - discount)
      const gstAmount = Math.round(taxableAmount * (gstRate / 100) * 100) / 100
      const payload = {
        client_id: invoiceForm.client_id,
        project_id: invoiceForm.project_id || null,
        invoice_no: invoiceForm.invoice_no.trim(),
        due_date: invoiceForm.due_date || null,
        subtotal,
        discount,
        gst_rate: gstRate,
        gst_amount: gstAmount,
        total: calculateInvoiceTotal(subtotal, discount, gstRate),
        status: 'draft',
      }

      const { data, error } = await supabase.from('invoices').insert(payload).select().single()

      if (error) throw error
      const { error: lineItemError } = await supabase.from('invoice_items').insert(
        validLineItems.map((item) => ({ invoice_id: data.id, ...item })),
      )
      if (lineItemError) {
        await supabase.from('invoices').delete().eq('id', data.id)
        throw lineItemError
      }

      setInvoices((current) => [data, ...current])
      setInvoiceForm(emptyInvoiceForm)
      setInvoiceLineItems([{ ...emptyInvoiceLineItem }])
      void recordActivity('invoice', data.id, 'created', { invoice_no: data.invoice_no, total: data.total })
      notify('Invoice created successfully.')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Invoice could not be created.')
    } finally {
      setActionBusy(false)
    }
  }

  const handlePaymentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!supabase || !paymentForm.invoice_id) {
      notify('Choose an invoice before recording a payment.')
      return
    }

    const invoice = invoices.find((item) => item.id === paymentForm.invoice_id)
    const amount = Math.max(0, Number(paymentForm.amount) || 0)
    const paidSoFar = payments.filter((payment) => payment.invoice_id === paymentForm.invoice_id).reduce((sum, payment) => sum + Number(payment.amount), 0)
    const balance = Number(invoice?.total ?? 0) - paidSoFar

    if (!invoice || amount <= 0 || amount > balance) {
      notify(`Enter a payment between ₹0.01 and ${formatCurrency(Math.max(0, balance))}.`)
      return
    }

    setActionBusy(true)

    try {
      const { data, error } = await supabase.from('payments').insert({
        invoice_id: paymentForm.invoice_id,
        amount,
        method: paymentForm.method,
      }).select().single()

      if (error) throw error

      const nextPaid = paidSoFar + amount
      const nextStatus = nextPaid >= Number(invoice.total) ? 'paid' : 'partially_paid'
      const { data: updatedInvoice, error: invoiceError } = await supabase.from('invoices').update({ status: nextStatus }).eq('id', invoice.id).select().single()

      if (invoiceError) throw invoiceError

      setPayments((current) => [data, ...current])
      setInvoices((current) => current.map((item) => (item.id === updatedInvoice.id ? updatedInvoice : item)))
      setPaymentForm(emptyPaymentForm)
      void recordActivity('payment', data.id, 'recorded', { invoice_id: invoice.id, amount })
      notify('Payment recorded successfully.')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Payment could not be recorded.')
    } finally {
      setActionBusy(false)
    }
  }

  const handleExpenseSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!supabase) {
      notify('Supabase is not configured yet.')
      return
    }

    const amount = Number(expenseForm.amount)
    if (!expenseForm.description.trim() || !Number.isFinite(amount) || amount <= 0) {
      notify('Enter an expense description and an amount greater than zero.')
      return
    }

    setActionBusy(true)

    try {
      const { data, error } = await supabase.from('expenses').insert({
        project_id: expenseForm.project_id || null,
        category: expenseForm.category,
        description: expenseForm.description.trim(),
        amount,
        expense_date: expenseForm.expense_date || null,
        status: 'recorded',
      }).select().single()

      if (error) throw error

      setExpenses((current) => [data, ...current])
      setExpenseForm(emptyExpenseForm)
      void recordActivity('expense', data.id, 'recorded', { amount: data.amount, category: data.category })
      notify('Expense recorded successfully.')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Expense could not be recorded.')
    } finally {
      setActionBusy(false)
    }
  }

  const handleSignOut = async () => {
    if (!supabase) return

    await supabase.auth.signOut()
    setSessionState('guest')
    setSessionUser(null)
    notify('Signed out of the Studio workspace.')
  }

  const handleProjectEventSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!supabase) {
      notify('Supabase is not configured yet.')
      return
    }

    if (!projectEventForm.project_id) {
      notify('Choose a project before creating an event.')
      return
    }

    setActionBusy(true)

    try {
      const startsAt = projectEventForm.all_day
        ? new Date(`${projectEventForm.starts_at}T12:00:00`).toISOString()
        : new Date(projectEventForm.starts_at).toISOString()
      const endsAt = projectEventForm.ends_at
        ? new Date(projectEventForm.ends_at).toISOString()
        : null
      const payload = {
        project_id: projectEventForm.project_id,
        event_type: projectEventForm.event_type,
        title: projectEventForm.title.trim(),
        starts_at: startsAt,
        ends_at: endsAt,
        all_day: projectEventForm.all_day,
        notes: projectEventForm.notes.trim() || null,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      }

      const { data, error } = await supabase.from('project_events').insert(payload).select().single()
      if (error) throw error

      setProjectEvents((current) => [...current, data].sort((left, right) => (left.starts_at ?? '').localeCompare(right.starts_at ?? '')))
      setProjectEventForm(emptyProjectEventForm)
      void recordActivity('project_event', data.id, 'created', { title: data.title, event_type: data.event_type })
      notify('Calendar event created successfully.')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Calendar event could not be created.')
    } finally {
      setActionBusy(false)
    }
  }

  const handleCrewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) return notify('Supabase is not configured yet.')
    setActionBusy(true)
    try {
      const { data, error } = await supabase.from('crew').insert({
        name: crewForm.name.trim(),
        role: crewForm.role.trim() || null,
        phone: crewForm.phone.trim() || null,
        email: crewForm.email.trim() || null,
        status: 'active',
      }).select().single()
      if (error) throw error
      setCrew((current) => [...current, data].sort((left, right) => left.name.localeCompare(right.name)))
      setCrewForm(emptyCrewForm)
      void recordActivity('crew', data.id, 'created', { name: data.name })
      notify('Crew member added.')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Crew member could not be added.')
    } finally {
      setActionBusy(false)
    }
  }

  const handleEquipmentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) return notify('Supabase is not configured yet.')
    setActionBusy(true)
    try {
      const { data, error } = await supabase.from('equipment').insert({
        name: equipmentForm.name.trim(),
        category: equipmentForm.category.trim(),
        identifier: equipmentForm.identifier.trim() || null,
        status: 'available',
      }).select().single()
      if (error) throw error
      setEquipment((current) => [...current, data].sort((left, right) => left.name.localeCompare(right.name)))
      setEquipmentForm(emptyEquipmentForm)
      void recordActivity('equipment', data.id, 'created', { name: data.name })
      notify('Equipment added.')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Equipment could not be added.')
    } finally {
      setActionBusy(false)
    }
  }

  const filteredProjects = projects.filter((project) => {
    const search = projectSearch.trim().toLowerCase()
    const matchesSearch = !search || [project.title, project.description, project.location].some((value) => value?.toLowerCase().includes(search))
    const matchesStatus = projectStatusFilter === 'all' || project.status === projectStatusFilter
    return matchesSearch && matchesStatus
  })
  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null
  const selectedClient = selectedProject ? clients.find((client) => client.id === selectedProject.client_id) : null
  const invoicedTotal = invoices.reduce((sum, invoice) => sum + Number(invoice.total ?? 0), 0)
  const receivedTotal = payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
  const pendingTotal = Math.max(0, invoicedTotal - receivedTotal)
  const expensesTotal = expenses.filter((expense) => expense.status !== 'ignored').reduce((sum, expense) => sum + Number(expense.amount), 0)
  const selectedProjectRevenue = selectedProject ? invoices.filter((invoice) => invoice.project_id === selectedProject.id).reduce((sum, invoice) => sum + Number(invoice.total ?? 0), 0) : 0
  const selectedProjectCost = selectedProject ? expenses.filter((expense) => expense.project_id === selectedProject.id && expense.status !== 'ignored').reduce((sum, expense) => sum + Number(expense.amount), 0) : 0
  const calendarDays = getCalendarDays(calendarMonth)
  const calendarEvents = calendarDays.reduce<Record<string, Array<{ id: string; title: string; type: string; time?: string; detail: string }>>>((events, day) => {
    const key = dateKey(day)
    const dayEvents = [
      ...shoots.filter((shoot) => dateKey(shoot.start_at) === key).map((shoot) => ({
        id: `shoot-${shoot.id}`,
        title: shoot.title,
        type: 'shoot',
        time: new Date(shoot.start_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        detail: `${projects.find((project) => project.id === shoot.project_id)?.title ?? 'Shoot session'} · ${shootAssignments[shoot.id]?.crewIds.length ?? 0} crew · ${shootAssignments[shoot.id]?.equipmentIds.length ?? 0} gear`,
      })),
      ...tasks.filter((task) => task.due_at && dateKey(task.due_at) === key).map((task) => ({
        id: `task-${task.id}`,
        title: task.title,
        type: 'task',
        detail: projects.find((project) => project.id === task.project_id)?.title ?? 'Task deadline',
      })),
      ...deliverables.filter((deliverable) => deliverable.client_due_at && dateKey(deliverable.client_due_at) === key).map((deliverable) => ({
        id: `deliverable-${deliverable.id}`,
        title: deliverable.name,
        type: 'delivery',
        detail: projects.find((project) => project.id === deliverable.project_id)?.title ?? 'Deliverable due',
      })),
      ...projects.filter((project) => project.deadline && dateKey(project.deadline) === key).map((project) => ({
        id: `project-${project.id}`,
        title: project.title,
        type: 'deadline',
        detail: 'Project deadline',
      })),
      ...projectEvents.filter((projectEvent) => projectEvent.starts_at && dateKey(projectEvent.starts_at) === key).map((projectEvent) => ({
        id: `event-${projectEvent.id}`,
        title: projectEvent.title,
        type: projectEvent.event_type,
        time: projectEvent.all_day ? undefined : new Date(projectEvent.starts_at ?? '').toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        detail: projects.find((project) => project.id === projectEvent.project_id)?.title ?? 'Project event',
      })),
    ]
    if (dayEvents.length > 0) events[key] = dayEvents
    return events
  }, {})
  const selectedDayEvents = calendarEvents[selectedCalendarDate] ?? []
  const dashboardSchedule = dataState === 'live'
    ? (calendarEvents[todayCalendarKey] ?? []).map((item) => ({
        time: item.time ?? 'All day',
        title: item.title,
        detail: item.detail,
        tone: item.type === 'shoot' ? 'coral' : item.type === 'delivery' ? 'blue' : 'yellow',
      }))
    : schedule

  return (
    <div className={`app-shell ${darkMode ? 'dark-mode' : ''}`}>
      <aside className={`sidebar ${mobileNavOpen ? 'is-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark">S</div>
          <div>
            <strong>Sched U</strong>
            <span>651 Studio OS</span>
          </div>
          <button className="icon-button mobile-close" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <div className="workspace-switcher">
          <span className="workspace-avatar">6</span>
          <span>
            <strong>651 Studio</strong>
            <small>Internal workspace</small>
          </span>
          <ChevronDown size={15} />
        </div>
        <nav className="primary-nav" aria-label="Primary navigation">
          <span className="nav-label">Workspace</span>
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${activeNav === label ? 'active' : ''}`}
              onClick={() => {
                setActiveNav(label)
                setMobileNavOpen(false)
              }}
            >
              <Icon size={17} strokeWidth={activeNav === label ? 2.4 : 1.8} />
              <span>{label}</span>
              {label === 'Tasks' && <em>4</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="nav-item" onClick={() => notify('Settings will be connected in Phase 1.')}>
            <Settings size={17} />
            <span>Settings</span>
          </button>
          <div className="user-chip">
            <span className="user-avatar">AS</span>
            <span>
              <strong>{sessionUser?.name ?? 'Ashish S.'}</strong>
              <small>{sessionUser?.email ?? 'Owner'}</small>
            </span>
            <ChevronDown size={15} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="breadcrumbs">
            <span>Workspace</span>
            <span>/</span>
            <strong>{activeNav}</strong>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Search" onClick={() => notify('Global search is coming with the client and project records.')}>
              <Search size={18} />
            </button>
            <button
              className="icon-button"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => {
                const nextMode = !darkMode
                setDarkMode(nextMode)
                localStorage.setItem('sched-u-theme', nextMode ? 'dark' : 'light')
              }}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => notify('You have 4 items needing attention.')}>
              <Bell size={18} />
              <i />
            </button>
            <button className="avatar-button" aria-label="Open account menu">AS</button>
          </div>
        </header>

        <div className="page-content">
          {activeNav === 'Dashboard' && (
            <>
          <section className="page-heading reveal">
            <div>
              <p className="eyebrow">{todayLabel}</p>
              <h1>
                Good morning, {sessionUser?.name?.split(' ')[0] ?? 'Ashish'}
                <span>.</span>
              </h1>
              <p className="heading-copy">Here is what needs your attention today.</p>
            </div>
            <div className="heading-actions">
              <button className="secondary-button" onClick={() => setActiveNav('Calendar')}>
                <CalendarDays size={16} /> View calendar
              </button>
              <div className="quick-action-wrap">
                <button className="primary-button" onClick={() => setShowQuickActions(!showQuickActions)}>
                  <Plus size={17} /> New <ChevronDown size={14} />
                </button>
                {showQuickActions && (
                  <div className="quick-menu">
                    <button onClick={() => { setShowQuickActions(false); setActiveNav('Dashboard') }}>New project</button>
                    <button onClick={() => { setShowQuickActions(false); setActiveNav('Dashboard') }}>New client</button>
                    <button onClick={() => { setShowQuickActions(false); setActiveNav('Calendar') }}>New shoot</button>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="metric-grid reveal delay-1" aria-label="Studio overview">
            <Metric
              label="Active projects"
              value={String(liveProjects.length).padStart(2, '0')}
              change={dataState === 'live' ? 'Live from Supabase' : '+2 this month'}
              tone="coral"
              icon={<FolderKanban size={17} />}
            />
            <Metric label="Due this week" value="12" change="4 need attention" tone="yellow" icon={<Clock3 size={17} />} />
            <Metric label="Awaiting payment" value={invoices.length > 0 ? formatCurrency(pendingTotal) : '₹72.5k'} change={invoices.length > 0 ? `${invoices.length} invoices tracked` : 'Connect database'} tone="blue" icon={<CircleDollarSign size={17} />} />
            <Metric
              label="Clients"
              value={liveClientCount === null ? '--' : String(liveClientCount).padStart(2, '0')}
              change={dataState === 'live' ? 'Live from Supabase' : 'Connect database'}
              tone="green"
              icon={<Users size={17} />}
            />
          </section>

          <section className="finance-strip reveal delay-1" aria-label="Financial summary">
            <div><span>Invoiced</span><strong>{invoices.length > 0 ? formatCurrency(invoicedTotal) : 'Connect database'}</strong></div>
            <div><span>Received</span><strong>{payments.length > 0 ? formatCurrency(receivedTotal) : 'No payments yet'}</strong></div>
            <div><span>Pending</span><strong>{invoices.length > 0 ? formatCurrency(pendingTotal) : 'No invoices yet'}</strong></div>
            <div><span>Expenses</span><strong>{expenses.length > 0 ? formatCurrency(expensesTotal) : 'No expenses yet'}</strong></div>
          </section>

          <div className="dashboard-grid reveal delay-2">
            <section className="panel schedule-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">On the clock</p>
                  <h2>Today’s schedule</h2>
                </div>
                <button className="text-button" onClick={() => setActiveNav('Calendar')}>Full calendar <ArrowUpRight size={15} /></button>
              </div>
              <div className="schedule-list">
                {dashboardSchedule.length === 0 ? <p className="empty-state">No scheduled items today.</p> : dashboardSchedule.slice(0, 5).map((item) => (
                  <button className="schedule-row" key={item.time} onClick={() => notify(`${item.title} selected.`)}>
                    <time>{item.time}</time>
                    <span className={`schedule-dot ${item.tone}`} />
                    <span className="schedule-info">
                      <strong>{item.title}</strong>
                      <small>{item.detail}</small>
                    </span>
                    <ArrowUpRight size={15} />
                  </button>
                ))}
              </div>
              <div className="panel-footer">
                <span>
                <span className="live-dot" /> {dashboardSchedule.length} events today
                </span>
                <button className="icon-button" aria-label="Add event" onClick={() => notify('Event creation is planned for the calendar milestone.')}>
                  <Plus size={17} />
                </button>
              </div>
            </section>

            <section className="panel attention-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Triage</p>
                  <h2>Needs attention</h2>
                </div>
                <span className="count-badge">4</span>
              </div>
              <Attention icon={<Clock3 size={17} />} title="2 overdue tasks" detail="Northstar campaign" tone="coral" action="Review" onClick={() => notify('Task triage will be connected to Supabase.')} />
              <Attention icon={<Users size={17} />} title="Client review pending" detail="Studio portraits · Reel 03" tone="blue" action="Open" onClick={() => notify('Deliverable details are planned for Phase 4.')} />
              <Attention icon={<CircleDollarSign size={17} />} title="₹25,000 payment due" detail="INV-024 · Due Oct 4" tone="yellow" action="View" onClick={() => notify('Invoice details are planned for Phase 6.')} />
              <div className="panel-footer">
                <span className="muted">Updated just now</span>
                <button className="text-button" onClick={() => notify('All notifications marked as read.')}>Mark all read <Check size={14} /></button>
              </div>
            </section>
          </div>

          <section className="panel projects-panel reveal delay-3">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Work in motion</p>
                <h2>Active projects</h2>
              </div>
              <button className="text-button" onClick={() => setActiveNav('Projects')}>View all projects <ArrowUpRight size={15} /></button>
            </div>
            <div className="project-table">
              <div className="table-head">
                <span>Project</span>
                <span>Status</span>
                <span>Progress</span>
                <span>Due</span>
              </div>
              {liveProjects.map((project) => (
                <button className="project-row" key={project.name} onClick={() => notify(`${project.name} selected.`)}>
                  <span className="project-name">
                    <i className={`project-mark ${project.color}`} />
                    <strong>{project.name}</strong>
                    <small>{project.client}</small>
                  </span>
                  <span>
                    <em className={`status-pill ${project.color}`}>{project.status}</em>
                  </span>
                  <span className="progress-cell">
                    <span className="progress-track">
                      <i className={project.color} style={{ width: `${project.progress}%` }} />
                    </span>
                    <small>{project.progress}%</small>
                  </span>
                  <span className="due-date">
                    {project.due}
                    <ArrowUpRight size={14} />
                  </span>
                </button>
              ))}
            </div>
          </section>
            </>
          )}

          {activeNav === 'Projects' && (
            <section className="panel project-workspace reveal delay-3">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Project control</p>
                  <h2>Project workspace</h2>
                </div>
                <span className="tool-badge">{filteredProjects.length} visible</span>
              </div>
              <div className="project-workspace-toolbar">
                <div className="field-group project-search-field">
                  <label htmlFor="project-search">Search projects</label>
                  <input id="project-search" value={projectSearch} onChange={(event) => setProjectSearch(event.target.value)} placeholder="Search title, location or notes" />
                </div>
                <div className="field-group">
                  <label htmlFor="project-filter">Status</label>
                  <select id="project-filter" value={projectStatusFilter} onChange={(event) => setProjectStatusFilter(event.target.value)}>
                    <option value="all">All statuses</option>
                    <option value="lead">Lead</option>
                    <option value="planned">Planned</option>
                    <option value="active">Active</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="project-workspace-grid">
                <div className="workspace-project-list">
                  {filteredProjects.length === 0 ? (
                    <p className="empty-state">No matching projects. Create one in Studio ops or adjust the filters.</p>
                  ) : (
                    filteredProjects.map((project) => (
                      <button className={`workspace-project ${selectedProjectId === project.id ? 'selected' : ''}`} key={project.id} onClick={() => setSelectedProjectId(project.id)}>
                        <span>
                          <strong>{project.title}</strong>
                          <small>{clients.find((client) => client.id === project.client_id)?.name ?? 'Unassigned client'}</small>
                        </span>
                        <em>{formatProjectStatus(project.status ?? 'lead')}</em>
                      </button>
                    ))
                  )}
                </div>
                <div className="project-detail-card">
                  {selectedProject ? (
                    <>
                      <div className="mini-header">
                        <div>
                          <h3>{selectedProject.title}</h3>
                          <span>{selectedClient?.name ?? 'Unassigned client'}</span>
                        </div>
                        <span className="project-detail-priority">{formatProjectStatus(selectedProject.priority ?? 'normal')} priority</span>
                      </div>
                      <p className="project-description">{selectedProject.description || 'No project description has been added yet.'}</p>
                      <div className="project-detail-meta">
                        <span><strong>Deadline</strong>{selectedProject.deadline ? new Date(selectedProject.deadline).toLocaleDateString('en-IN') : 'Not set'}</span>
                        <span><strong>Budget</strong>{selectedProject.budget ? formatCurrency(selectedProject.budget) : 'Not set'}</span>
                        <span><strong>Location</strong>{selectedProject.location || 'Not set'}</span>
                        <span><strong>Margin</strong>{selectedProjectRevenue > 0 ? formatCurrency(selectedProjectRevenue - selectedProjectCost) : 'No invoice yet'}</span>
                      </div>
                      <div className="field-group">
                        <label htmlFor="selected-project-status">Update status</label>
                        <select id="selected-project-status" value={selectedProject.status ?? 'lead'} disabled={actionBusy} onChange={(event) => void handleProjectStatusUpdate(event.target.value)}>
                          <option value="lead">Lead</option>
                          <option value="planned">Planned</option>
                          <option value="active">Active</option>
                          <option value="review">Review</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <p className="empty-state">Select a project to inspect its current status, deadline and budget.</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {activeNav === 'Calendar' && (
            <section className="panel calendar-workspace reveal delay-3">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Operations calendar</p>
                  <h2>{calendarMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h2>
                </div>
                <div className="calendar-toolbar">
                  <button className="icon-button" aria-label="Previous month" onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}><ChevronLeft size={17} /></button>
                  <button className="secondary-button calendar-today" onClick={() => { const today = new Date(); setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedCalendarDate(dateKey(today)) }}>Today</button>
                  <button className="icon-button" aria-label="Next month" onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}><ChevronRight size={17} /></button>
                </div>
              </div>
              {!shootsAvailable || !projectEventsAvailable ? (
                <div className="migration-note">Apply <strong>002_shoot_sessions.sql</strong> and the latest migrations in Supabase to enable the live calendar.</div>
              ) : (
                <>
                  <div className="calendar-layout">
                    <div className="calendar-main">
                      <div className="calendar-weekdays">{calendarWeekdays.map((weekday) => <span key={weekday}>{weekday}</span>)}</div>
                      <div className="calendar-grid" role="grid" aria-label="Monthly calendar">
                        {calendarDays.map((day) => {
                          const key = dateKey(day)
                          const dayEvents = calendarEvents[key] ?? []
                          return (
                            <button className={`calendar-day ${day.getMonth() === calendarMonth.getMonth() ? '' : 'is-muted'} ${key === todayCalendarKey ? 'is-today' : ''} ${selectedCalendarDate === key ? 'is-selected' : ''}`} key={key} onClick={() => setSelectedCalendarDate(key)} role="gridcell">
                              <span className="calendar-day-number">{day.getDate()}</span>
                              <span className="calendar-day-events">
                                {dayEvents.slice(0, 3).map((calendarEvent) => <span className={`calendar-event ${calendarEvent.type}`} key={calendarEvent.id}>{calendarEvent.time ? `${calendarEvent.time} ` : ''}{calendarEvent.title}</span>)}
                                {dayEvents.length > 3 && <span className="calendar-more">+{dayEvents.length - 3} more</span>}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                      <div className="calendar-legend"><span><i className="shoot" /> Shoots</span><span><i className="task" /> Tasks</span><span><i className="delivery" /> Deliverables</span><span><i className="deadline" /> Deadlines</span></div>
                    </div>
                    <aside className="calendar-detail">
                      <div className="mini-header">
                        <h3>{new Date(`${selectedCalendarDate}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</h3>
                        <span>{selectedDayEvents.length} items</span>
                      </div>
                      {selectedDayEvents.length === 0 ? <p className="empty-state">No scheduled items for this day.</p> : <div className="calendar-detail-list">{selectedDayEvents.map((calendarEvent) => {
                        const shootId = calendarEvent.id.startsWith('shoot-') ? calendarEvent.id.slice(6) : null
                        const shootAssignment = shootId ? shootAssignments[shootId] : null
                        return (
                          <article className={`calendar-detail-item ${calendarEvent.type}`} key={calendarEvent.id}>
                            <button className="calendar-detail-trigger" onClick={() => shootId && selectShootForAssignment(shootId)}>
                              <strong>{calendarEvent.title}</strong>
                              <small>{calendarEvent.time ?? 'All day'} · {calendarEvent.detail}</small>
                            </button>
                            {shootId && selectedShootId === shootId && shootAssignment && (
                              <form className="assignment-editor" onSubmit={handleShootAssignmentsUpdate}>
                                <div className="field-group">
                                  <label htmlFor={`edit-crew-${shootId}`}>Crew</label>
                                  <select id={`edit-crew-${shootId}`} multiple value={assignmentDraft.crewIds} onChange={(event) => setAssignmentDraft((current) => ({ ...current, crewIds: Array.from(event.target.selectedOptions, (option) => option.value) }))}>
                                    {crew.filter((member) => member.status !== 'inactive').map((member) => <option key={member.id} value={member.id}>{member.name}{member.role ? ` · ${member.role}` : ''}</option>)}
                                  </select>
                                </div>
                                <div className="field-group">
                                  <label htmlFor={`edit-equipment-${shootId}`}>Equipment</label>
                                  <select id={`edit-equipment-${shootId}`} multiple value={assignmentDraft.equipmentIds} onChange={(event) => setAssignmentDraft((current) => ({ ...current, equipmentIds: Array.from(event.target.selectedOptions, (option) => option.value) }))}>
                                    {equipment.filter((item) => item.status === 'available').map((item) => <option key={item.id} value={item.id}>{item.name} · {item.category}</option>)}
                                  </select>
                                </div>
                                <div className="assignment-actions">
                                  <button className="primary-button compact-button" type="submit" disabled={actionBusy}>{actionBusy ? 'Saving...' : 'Save assignments'}</button>
                                  <button className="text-button danger-button" type="button" onClick={() => void handleShootDelete(shootId)} disabled={actionBusy}>Delete shoot</button>
                                </div>
                              </form>
                            )}
                          </article>
                        )
                      })}</div>}
                    </aside>
                  </div>
                  <div className="calendar-bottom-grid">
                    <form className="record-form" onSubmit={handleShootSubmit}>
                      <div className="form-header"><h3>Schedule a shoot</h3><span>Studio ops</span></div>
                      <div className="field-group"><label htmlFor="shoot-project">Project</label><select id="shoot-project" value={shootForm.project_id} onChange={(event) => setShootForm((current) => ({ ...current, project_id: event.target.value }))} required><option value="">Select project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></div>
                      <div className="field-group"><label htmlFor="shoot-title">Shoot title</label><input id="shoot-title" value={shootForm.title} onChange={(event) => setShootForm((current) => ({ ...current, title: event.target.value }))} placeholder="Product film shoot" required /></div>
                      <div className="field-row"><div className="field-group"><label htmlFor="shoot-start">Start</label><input id="shoot-start" type="datetime-local" value={shootForm.start_at} onChange={(event) => setShootForm((current) => ({ ...current, start_at: event.target.value }))} required /></div><div className="field-group"><label htmlFor="shoot-end">End</label><input id="shoot-end" type="datetime-local" value={shootForm.end_at} onChange={(event) => setShootForm((current) => ({ ...current, end_at: event.target.value }))} /></div></div>
                      <div className="field-group"><label htmlFor="shoot-location">Location</label><input id="shoot-location" value={shootForm.location} onChange={(event) => setShootForm((current) => ({ ...current, location: event.target.value }))} placeholder="Studio or client location" /></div>
                      <div className="field-row">
                        <div className="field-group"><label htmlFor="shoot-crew">Crew</label><select id="shoot-crew" multiple value={shootForm.crew_ids} onChange={(event) => setShootForm((current) => ({ ...current, crew_ids: Array.from(event.target.selectedOptions, (option) => option.value) }))}>{crew.filter((member) => member.status !== 'inactive').map((member) => <option key={member.id} value={member.id}>{member.name}{member.role ? ` · ${member.role}` : ''}</option>)}</select></div>
                        <div className="field-group"><label htmlFor="shoot-equipment">Equipment</label><select id="shoot-equipment" multiple value={shootForm.equipment_ids} onChange={(event) => setShootForm((current) => ({ ...current, equipment_ids: Array.from(event.target.selectedOptions, (option) => option.value) }))}>{equipment.filter((item) => item.status === 'available').map((item) => <option key={item.id} value={item.id}>{item.name} · {item.category}</option>)}</select></div>
                      </div>
                      <p className="form-help">Hold Ctrl/Cmd to select multiple crew members or equipment items.</p>
                      <button className="primary-button" type="submit" disabled={actionBusy}>{actionBusy ? 'Saving...' : 'Schedule shoot'}</button>
                    </form>
                    <form className="record-form" onSubmit={handleProjectEventSubmit}>
                      <div className="form-header"><h3>Add calendar event</h3><span>Internal only</span></div>
                      <div className="field-group"><label htmlFor="event-project">Project</label><select id="event-project" value={projectEventForm.project_id} onChange={(event) => setProjectEventForm((current) => ({ ...current, project_id: event.target.value }))} required><option value="">Select project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></div>
                      <div className="field-group"><label htmlFor="event-title">Title</label><input id="event-title" value={projectEventForm.title} onChange={(event) => setProjectEventForm((current) => ({ ...current, title: event.target.value }))} placeholder="Client review or milestone" required /></div>
                      <div className="field-row"><div className="field-group"><label htmlFor="event-type">Type</label><select id="event-type" value={projectEventForm.event_type} onChange={(event) => setProjectEventForm((current) => ({ ...current, event_type: event.target.value as ProjectEventRecord['event_type'] }))}><option value="milestone">Milestone</option><option value="meeting">Meeting</option><option value="delivery">Delivery</option><option value="deadline">Deadline</option><option value="note">Note</option></select></div><label className="checkbox-field"><input type="checkbox" checked={projectEventForm.all_day} onChange={(event) => setProjectEventForm((current) => ({ ...current, all_day: event.target.checked }))} /> All day</label></div>
                      <div className="field-row"><div className="field-group"><label htmlFor="event-start">Start</label><input id="event-start" type={projectEventForm.all_day ? 'date' : 'datetime-local'} value={projectEventForm.starts_at} onChange={(event) => setProjectEventForm((current) => ({ ...current, starts_at: event.target.value }))} required /></div><div className="field-group"><label htmlFor="event-end">End</label><input id="event-end" type={projectEventForm.all_day ? 'date' : 'datetime-local'} value={projectEventForm.ends_at} onChange={(event) => setProjectEventForm((current) => ({ ...current, ends_at: event.target.value }))} /></div></div>
                      <button className="primary-button" type="submit" disabled={actionBusy}>{actionBusy ? 'Saving...' : 'Add event'}</button>
                    </form>
                  </div>
                </>
              )}
            </section>
          )}

          {activeNav === 'Tasks' && (
            <section className="panel task-workspace reveal delay-3">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Phase 4</p>
                  <h2>Task board</h2>
                </div>
                <span className="tool-badge">{tasks.length} tasks</span>
              </div>
              {!tasksAvailable ? (
                <div className="migration-note">Tasks are ready in the codebase. Apply <strong>003_tasks.sql</strong> in Supabase to enable the board.</div>
              ) : (
                <div className="task-workspace-grid">
                  <form className="record-form" onSubmit={handleTaskSubmit}>
                    <div className="form-header">
                      <h3>New task</h3>
                      <span>Project work</span>
                    </div>
                    <div className="field-group">
                      <label htmlFor="task-project">Project</label>
                      <select id="task-project" value={taskForm.project_id} onChange={(event) => setTaskForm((current) => ({ ...current, project_id: event.target.value }))} required>
                        <option value="">Select project</option>
                        {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
                      </select>
                    </div>
                    <div className="field-group">
                      <label htmlFor="task-title">Task title</label>
                      <input id="task-title" value={taskForm.title} onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))} placeholder="Prepare first cut for review" required />
                    </div>
                    <div className="field-row">
                      <div className="field-group">
                        <label htmlFor="task-priority">Priority</label>
                        <select id="task-priority" value={taskForm.priority} onChange={(event) => setTaskForm((current) => ({ ...current, priority: event.target.value }))}>
                          <option value="low">Low</option>
                          <option value="normal">Normal</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div className="field-group">
                        <label htmlFor="task-due">Due date</label>
                        <input id="task-due" type="datetime-local" value={taskForm.due_at} onChange={(event) => setTaskForm((current) => ({ ...current, due_at: event.target.value }))} />
                      </div>
                    </div>
                    <div className="field-group">
                      <label htmlFor="task-description">Description</label>
                      <textarea id="task-description" value={taskForm.description} onChange={(event) => setTaskForm((current) => ({ ...current, description: event.target.value }))} placeholder="What needs to be done?" rows={3} />
                    </div>
                    <button className="primary-button" type="submit" disabled={actionBusy}>{actionBusy ? 'Saving...' : 'Create task'}</button>
                  </form>
                  <div className="task-list-card">
                    {tasks.length === 0 ? <p className="empty-state">No tasks yet. Create the first task for a project.</p> : tasks.map((task) => (
                      <article className="task-row" key={task.id}>
                        <div className="task-copy"><strong>{task.title}</strong><small>{projects.find((project) => project.id === task.project_id)?.title ?? 'Unknown project'}{task.due_at ? ` · Due ${new Date(task.due_at).toLocaleDateString('en-IN')}` : ''}</small></div>
                        <span className={`task-priority ${task.priority ?? 'normal'}`}>{formatProjectStatus(task.priority ?? 'normal')}</span>
                        <select aria-label={`Update status for ${task.title}`} value={task.status ?? 'todo'} onChange={(event) => void handleTaskStatusUpdate(task.id, event.target.value)}>
                          <option value="backlog">Backlog</option>
                          <option value="todo">To do</option>
                          <option value="in_progress">In progress</option>
                          <option value="blocked">Blocked</option>
                          <option value="done">Done</option>
                        </select>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {activeNav === 'Deliverables' && (
            <section className="panel deliverable-workspace reveal delay-3">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Phase 4</p>
                  <h2>Deliverables</h2>
                </div>
                <span className="tool-badge">{deliverables.length} items</span>
              </div>
              {!deliverablesAvailable ? (
                <div className="migration-note">Deliverables are ready in the codebase. Apply <strong>004_deliverables.sql</strong> in Supabase to enable revision tracking.</div>
              ) : (
                <div className="deliverable-workspace-grid">
                  <form className="record-form" onSubmit={handleDeliverableSubmit}>
                    <div className="form-header">
                      <h3>New deliverable</h3>
                      <span>Client handoff</span>
                    </div>
                    <div className="field-group">
                      <label htmlFor="deliverable-project">Project</label>
                      <select id="deliverable-project" value={deliverableForm.project_id} onChange={(event) => setDeliverableForm((current) => ({ ...current, project_id: event.target.value }))} required>
                        <option value="">Select project</option>
                        {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
                      </select>
                    </div>
                    <div className="field-group">
                      <label htmlFor="deliverable-name">Deliverable name</label>
                      <input id="deliverable-name" value={deliverableForm.name} onChange={(event) => setDeliverableForm((current) => ({ ...current, name: event.target.value }))} placeholder="Reel 01 · final export" required />
                    </div>
                    <div className="field-row">
                      <div className="field-group">
                        <label htmlFor="deliverable-version">Version</label>
                        <input id="deliverable-version" type="number" min="1" step="1" value={deliverableForm.version} onChange={(event) => setDeliverableForm((current) => ({ ...current, version: event.target.value }))} />
                      </div>
                      <div className="field-group">
                        <label htmlFor="deliverable-client-due">Client due</label>
                        <input id="deliverable-client-due" type="datetime-local" value={deliverableForm.client_due_at} onChange={(event) => setDeliverableForm((current) => ({ ...current, client_due_at: event.target.value }))} />
                      </div>
                    </div>
                    <div className="field-group">
                      <label htmlFor="deliverable-file">File or Drive link</label>
                      <input id="deliverable-file" type="url" value={deliverableForm.file_url} onChange={(event) => setDeliverableForm((current) => ({ ...current, file_url: event.target.value }))} placeholder="https://drive.google.com/..." />
                    </div>
                    <button className="primary-button" type="submit" disabled={actionBusy}>{actionBusy ? 'Saving...' : 'Create deliverable'}</button>
                  </form>
                  <div className="deliverable-list-card">
                    {deliverables.length === 0 ? <p className="empty-state">No deliverables yet. Add the first client handoff for a project.</p> : deliverables.map((deliverable) => (
                      <article className="deliverable-row" key={deliverable.id}>
                        <div className="deliverable-copy"><strong>{deliverable.name}</strong><small>{projects.find((project) => project.id === deliverable.project_id)?.title ?? 'Unknown project'} · v{deliverable.version ?? 1}</small></div>
                        <span className="deliverable-due">{deliverable.client_due_at ? new Date(deliverable.client_due_at).toLocaleDateString('en-IN') : 'No due date'}</span>
                        <select aria-label={`Update status for ${deliverable.name}`} value={deliverable.status ?? 'not_started'} onChange={(event) => void handleDeliverableStatusUpdate(deliverable.id, event.target.value)}>
                          <option value="not_started">Not started</option>
                          <option value="in_progress">In progress</option>
                          <option value="internal_review">Internal review</option>
                          <option value="client_review">Client review</option>
                          <option value="revision">Revision</option>
                          <option value="approved">Approved</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {(activeNav === 'Payments' || activeNav === 'Invoices') && (
            <section className="panel invoice-workspace reveal delay-3">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Phase 5</p>
                  <h2>Invoices and payments</h2>
                </div>
                <span className="tool-badge">{invoices.length} invoices</span>
              </div>
              {!invoicesAvailable ? (
                <div className="migration-note">Invoice tracking is ready in the codebase. Apply <strong>005_invoices_payments.sql</strong> in Supabase to enable it.</div>
              ) : (
                <>
                  <div className="invoice-workspace-grid">
                    <form className="record-form" onSubmit={handleInvoiceSubmit}>
                      <div className="form-header">
                        <h3>New invoice</h3>
                        <span>INR billing</span>
                      </div>
                      <div className="field-row">
                        <div className="field-group">
                          <label htmlFor="invoice-client">Client</label>
                          <select id="invoice-client" value={invoiceForm.client_id} onChange={(event) => setInvoiceForm((current) => ({ ...current, client_id: event.target.value }))} required>
                            <option value="">Select client</option>
                            {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                          </select>
                        </div>
                        <div className="field-group">
                          <label htmlFor="invoice-project">Project</label>
                          <select id="invoice-project" value={invoiceForm.project_id} onChange={(event) => setInvoiceForm((current) => ({ ...current, project_id: event.target.value }))}>
                            <option value="">Optional project</option>
                            {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="field-row">
                        <div className="field-group">
                          <label htmlFor="invoice-number">Invoice number</label>
                          <input id="invoice-number" value={invoiceForm.invoice_no} onChange={(event) => setInvoiceForm((current) => ({ ...current, invoice_no: event.target.value }))} placeholder="INV-001" required />
                        </div>
                        <div className="field-group">
                          <label htmlFor="invoice-due">Due date</label>
                          <input id="invoice-due" type="date" value={invoiceForm.due_date} onChange={(event) => setInvoiceForm((current) => ({ ...current, due_date: event.target.value }))} />
                        </div>
                      </div>
                      <div className="invoice-line-items">
                        <div className="mini-header"><h3>Line items</h3><button className="text-button" type="button" onClick={() => setInvoiceLineItems((current) => [...current, { ...emptyInvoiceLineItem }])}>+ Add item</button></div>
                        {invoiceLineItems.map((item, index) => <div className="invoice-line-item" key={`invoice-item-${index}`}>
                          <input aria-label={`Item ${index + 1} description`} value={item.description} onChange={(event) => setInvoiceLineItems((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, description: event.target.value } : line))} placeholder="Description" required />
                          <input aria-label={`Item ${index + 1} quantity`} type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => setInvoiceLineItems((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, quantity: event.target.value } : line))} placeholder="Qty" required />
                          <input aria-label={`Item ${index + 1} rate`} type="number" min="0" step="0.01" value={item.rate} onChange={(event) => setInvoiceLineItems((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, rate: event.target.value } : line))} placeholder="Rate" required />
                          <strong>{formatCurrency((Number(item.quantity) || 0) * (Number(item.rate) || 0))}</strong>
                          {invoiceLineItems.length > 1 && <button className="icon-button" type="button" aria-label={`Remove item ${index + 1}`} onClick={() => setInvoiceLineItems((current) => current.filter((_, lineIndex) => lineIndex !== index))}><X size={14} /></button>}
                        </div>)}
                      </div>
                      <div className="field-group"><label htmlFor="invoice-discount">Discount</label><input id="invoice-discount" type="number" min="0" step="0.01" value={invoiceForm.discount} onChange={(event) => setInvoiceForm((current) => ({ ...current, discount: event.target.value }))} /></div>
                      <div className="field-group"><label htmlFor="invoice-gst">GST rate (%)</label><input id="invoice-gst" type="number" min="0" max="100" step="0.01" value={invoiceForm.gst_rate} onChange={(event) => setInvoiceForm((current) => ({ ...current, gst_rate: event.target.value }))} /></div>
                      <div className="invoice-total-preview">Total <strong>{formatCurrency(calculateInvoiceTotal(invoiceLineItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0), 0), Number(invoiceForm.discount) || 0, Number(invoiceForm.gst_rate) || 0))}</strong></div>
                      <button className="primary-button" type="submit" disabled={actionBusy}>{actionBusy ? 'Saving...' : 'Create invoice'}</button>
                    </form>
                    <div className="invoice-list-card">
                      {invoices.length === 0 ? <p className="empty-state">No invoices yet. Create the first invoice for a client.</p> : invoices.map((invoice) => {
                        const paid = payments.filter((payment) => payment.invoice_id === invoice.id).reduce((sum, payment) => sum + Number(payment.amount), 0)
                        return <article className="invoice-row" key={invoice.id}><div><strong>{invoice.invoice_no}</strong><small>{clients.find((client) => client.id === invoice.client_id)?.name ?? 'Unknown client'} · {formatProjectStatus(invoice.status ?? 'draft')}</small></div><span><strong>{formatCurrency(invoice.total)}</strong><small>Balance {formatCurrency(Math.max(0, Number(invoice.total ?? 0) - paid))}</small></span></article>
                      })}
                    </div>
                  </div>
                  <form className="payment-form" onSubmit={handlePaymentSubmit}>
                    <div className="form-header"><h3>Record payment</h3><span>Manual confirmation</span></div>
                    <div className="field-row">
                      <div className="field-group"><label htmlFor="payment-invoice">Invoice</label><select id="payment-invoice" value={paymentForm.invoice_id} onChange={(event) => setPaymentForm((current) => ({ ...current, invoice_id: event.target.value }))} required><option value="">Select invoice</option>{invoices.filter((invoice) => invoice.status !== 'paid' && invoice.status !== 'cancelled').map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoice_no} · {formatCurrency(invoice.total)}</option>)}</select></div>
                      <div className="field-group"><label htmlFor="payment-amount">Amount</label><input id="payment-amount" type="number" min="0.01" step="0.01" value={paymentForm.amount} onChange={(event) => setPaymentForm((current) => ({ ...current, amount: event.target.value }))} required /></div>
                      <div className="field-group"><label htmlFor="payment-method">Method</label><select id="payment-method" value={paymentForm.method} onChange={(event) => setPaymentForm((current) => ({ ...current, method: event.target.value }))}><option value="upi">UPI</option><option value="bank_transfer">Bank transfer</option><option value="cash">Cash</option><option value="other">Other</option></select></div>
                    </div>
                    <button className="secondary-button" type="submit" disabled={actionBusy}>Record payment</button>
                  </form>
                </>
              )}
            </section>
          )}

          {activeNav === 'Expenses' && (
            <section className="panel expense-workspace reveal delay-3">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Phase 6</p>
                  <h2>Expenses</h2>
                </div>
                <span className="tool-badge">{expenses.length} recorded</span>
              </div>
              {!expensesAvailable ? (
                <div className="migration-note">Expense tracking is ready in the codebase. Apply <strong>006_expenses.sql</strong> in Supabase to enable it.</div>
              ) : (
                <div className="expense-workspace-grid">
                  <form className="record-form" onSubmit={handleExpenseSubmit}>
                    <div className="form-header"><h3>Record expense</h3><span>Studio cost</span></div>
                    <div className="field-group"><label htmlFor="expense-project">Project</label><select id="expense-project" value={expenseForm.project_id} onChange={(event) => setExpenseForm((current) => ({ ...current, project_id: event.target.value }))}><option value="">General studio expense</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></div>
                    <div className="field-group"><label htmlFor="expense-category">Category</label><select id="expense-category" value={expenseForm.category} onChange={(event) => setExpenseForm((current) => ({ ...current, category: event.target.value }))}><option value="production">Production</option><option value="travel">Travel</option><option value="equipment">Equipment</option><option value="crew">Crew</option><option value="software">Software</option><option value="other">Other</option></select></div>
                    <div className="field-row"><div className="field-group"><label htmlFor="expense-description">Description</label><input id="expense-description" value={expenseForm.description} onChange={(event) => setExpenseForm((current) => ({ ...current, description: event.target.value }))} placeholder="Location rental" required /></div><div className="field-group"><label htmlFor="expense-amount">Amount</label><input id="expense-amount" type="number" min="0.01" step="0.01" value={expenseForm.amount} onChange={(event) => setExpenseForm((current) => ({ ...current, amount: event.target.value }))} placeholder="2500" required /></div></div>
                    <div className="field-group"><label htmlFor="expense-date">Expense date</label><input id="expense-date" type="date" value={expenseForm.expense_date} onChange={(event) => setExpenseForm((current) => ({ ...current, expense_date: event.target.value }))} /></div>
                    <button className="primary-button" type="submit" disabled={actionBusy}>{actionBusy ? 'Saving...' : 'Record expense'}</button>
                  </form>
                  <div className="expense-list-card">
                    {expenses.length === 0 ? <p className="empty-state">No expenses recorded yet.</p> : expenses.map((expense) => <article className="expense-row" key={expense.id}><div><strong>{expense.description}</strong><small>{formatProjectStatus(expense.category)} · {projects.find((project) => project.id === expense.project_id)?.title ?? 'General studio'}</small></div><span><strong>{formatCurrency(expense.amount)}</strong><small>{expense.expense_date ?? 'No date'}</small></span></article>)}
                  </div>
                </div>
              )}
            </section>
          )}

          {activeNav === 'Dashboard' && (
            <section className="panel operations-panel reveal delay-3">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Studio ops</p>
                <h2>Access + client records</h2>
              </div>
              {sessionState === 'authed' && (
                <button className="secondary-button" type="button" onClick={handleSignOut}>
                  Sign out
                </button>
              )}
            </div>

            {loadingRecords && sessionState === 'authed' && <div className="loading-signal">Loading studio records…</div>}

            {sessionState !== 'authed' ? (
              <div className="auth-grid">
                <form className="record-form auth-form" onSubmit={handleAuthSubmit}>
                  <div className="form-header">
                    <h3>{authMode === 'signin' ? 'Sign in' : 'Create account'}</h3>
                    <button type="button" className="text-button" onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}>
                      {authMode === 'signin' ? 'Need an account?' : 'Already have one?'}
                    </button>
                  </div>

                  {authMode === 'signup' && (
                    <div className="field-group">
                      <label htmlFor="auth-name">Full name</label>
                      <input id="auth-name" value={authForm.name} onChange={(event) => setAuthForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ashish S." />
                    </div>
                  )}

                  <div className="field-group">
                    <label htmlFor="auth-email">Email</label>
                    <input id="auth-email" type="email" value={authForm.email} onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))} placeholder="owner@651studio.com" required />
                  </div>

                  <div className="field-group">
                    <label htmlFor="auth-password">Password</label>
                    <input id="auth-password" type="password" value={authForm.password} onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))} placeholder="••••••••" minLength={6} required />
                  </div>

                  <button className="primary-button" type="submit" disabled={actionBusy}>
                    {actionBusy ? 'Working...' : authMode === 'signin' ? 'Sign in to workspace' : 'Create studio account'}
                  </button>
                </form>

                <div className="info-card">
                  <h3>Workspace access</h3>
                  <ul>
                    <li>Secure Supabase Auth session with profile creation</li>
                    <li>Role-based client and project access</li>
                    <li>Live record tracking for the 651 team</li>
                  </ul>
                  <div className="tool-badge">{isSupabaseConfigured ? 'Supabase connected' : 'Supabase missing'}</div>
                </div>
              </div>
            ) : (
              <>
                <div className="ops-grid">
                  <form className="record-form" onSubmit={handleClientSubmit}>
                    <div className="form-header">
                      <h3>New client</h3>
                      <span>Phase 1</span>
                    </div>
                    <div className="field-group">
                      <label htmlFor="client-name">Client name</label>
                      <input id="client-name" value={clientForm.name} onChange={(event) => setClientForm((current) => ({ ...current, name: event.target.value }))} placeholder="Northstar Coffee Co." required />
                    </div>
                    <div className="field-row">
                      <div className="field-group">
                        <label htmlFor="company-name">Company</label>
                        <input id="company-name" value={clientForm.company_name} onChange={(event) => setClientForm((current) => ({ ...current, company_name: event.target.value }))} placeholder="Northstar Coffee" />
                      </div>
                      <div className="field-group">
                        <label htmlFor="client-phone">Phone</label>
                        <input id="client-phone" value={clientForm.phone} onChange={(event) => setClientForm((current) => ({ ...current, phone: event.target.value }))} placeholder="+91 98..." />
                      </div>
                    </div>
                    <div className="field-row">
                      <div className="field-group">
                        <label htmlFor="client-email">Email</label>
                        <input id="client-email" type="email" value={clientForm.email} onChange={(event) => setClientForm((current) => ({ ...current, email: event.target.value }))} placeholder="hello@brand.com" />
                      </div>
                      <div className="field-group">
                        <label htmlFor="client-status">Status</label>
                        <select id="client-status" value="active" disabled>
                          <option value="active">Active</option>
                        </select>
                      </div>
                    </div>
                    <div className="field-group">
                      <label htmlFor="client-address">Address</label>
                      <textarea id="client-address" value={clientForm.address} onChange={(event) => setClientForm((current) => ({ ...current, address: event.target.value }))} placeholder="Studio / client location" rows={3} />
                    </div>
                    <div className="field-group">
                      <label htmlFor="client-notes">Notes</label>
                      <textarea id="client-notes" value={clientForm.notes} onChange={(event) => setClientForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Project notes, key contacts, delivery preferences" rows={3} />
                    </div>
                    <button className="primary-button" type="submit" disabled={actionBusy}>{actionBusy ? 'Saving...' : 'Save client'}</button>
                  </form>

                  <form className="record-form" onSubmit={handleProjectSubmit}>
                    <div className="form-header">
                      <h3>New project</h3>
                      <span>Phase 1</span>
                    </div>
                    <div className="field-group">
                      <label htmlFor="project-title">Project title</label>
                      <input id="project-title" value={projectForm.title} onChange={(event) => setProjectForm((current) => ({ ...current, title: event.target.value }))} placeholder="Northstar launch campaign" required />
                    </div>
                    <div className="field-row">
                      <div className="field-group">
                        <label htmlFor="project-client">Client</label>
                        <select id="project-client" value={projectForm.client_id} onChange={(event) => setProjectForm((current) => ({ ...current, client_id: event.target.value }))} required>
                          <option value="">Select client</option>
                          {clients.map((client) => (
                            <option key={client.id} value={client.id}>{client.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="field-group">
                        <label htmlFor="project-priority">Priority</label>
                        <select id="project-priority" value={projectForm.priority} onChange={(event) => setProjectForm((current) => ({ ...current, priority: event.target.value }))}>
                          <option value="low">Low</option>
                          <option value="normal">Normal</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>
                    <div className="field-row">
                      <div className="field-group">
                        <label htmlFor="project-status">Status</label>
                        <select id="project-status" value={projectForm.status} onChange={(event) => setProjectForm((current) => ({ ...current, status: event.target.value }))}>
                          <option value="lead">Lead</option>
                          <option value="planned">Planned</option>
                          <option value="active">Active</option>
                          <option value="review">Review</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div className="field-group">
                        <label htmlFor="project-budget">Budget</label>
                        <input id="project-budget" type="number" min="0" step="1000" value={projectForm.budget} onChange={(event) => setProjectForm((current) => ({ ...current, budget: event.target.value }))} placeholder="250000" />
                      </div>
                    </div>
                    <div className="field-row">
                      <div className="field-group">
                        <label htmlFor="project-deadline">Deadline</label>
                        <input id="project-deadline" type="date" value={projectForm.deadline} onChange={(event) => setProjectForm((current) => ({ ...current, deadline: event.target.value }))} />
                      </div>
                      <div className="field-group">
                        <label htmlFor="project-location">Location</label>
                        <input id="project-location" value={projectForm.location} onChange={(event) => setProjectForm((current) => ({ ...current, location: event.target.value }))} placeholder="Studio or city" />
                      </div>
                    </div>
                    <div className="field-group">
                      <label htmlFor="project-description">Description</label>
                      <textarea id="project-description" value={projectForm.description} onChange={(event) => setProjectForm((current) => ({ ...current, description: event.target.value }))} placeholder="Scope, deliverables and key notes" rows={3} />
                    </div>
                    <button className="primary-button" type="submit" disabled={actionBusy}>{actionBusy ? 'Saving...' : 'Save project'}</button>
                  </form>
                </div>

                <div className="records-grid">
                  <div className="list-card">
                    <div className="mini-header">
                      <h3>Recent clients</h3>
                      <span>{clients.length} total</span>
                    </div>
                    {clients.length === 0 ? (
                      <p className="empty-state">No clients yet. Create the first one from the form.</p>
                    ) : (
                      <ul className="record-list">
                        {clients.slice(0, 5).map((client) => (
                          <li key={client.id}>
                            <div>
                              <strong>{client.name}</strong>
                              <small>{client.company_name ?? 'Independent client'}</small>
                            </div>
                            <span>{client.email ?? 'No email'}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="list-card">
                    <div className="mini-header">
                      <h3>Recent projects</h3>
                      <span>{projects.length} total</span>
                    </div>
                    {projects.length === 0 ? (
                      <p className="empty-state">No projects yet. Create the first studio project.</p>
                    ) : (
                      <ul className="record-list">
                        {projects.slice(0, 5).map((project) => (
                          <li key={project.id}>
                            <div>
                              <strong>{project.title}</strong>
                              <small>{formatProjectStatus(project.status ?? 'lead')}</small>
                            </div>
                            <span>{project.budget ? formatCurrency(project.budget) : 'No budget'}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            )}
            </section>
          )}

          {activeNav === 'Crew' && (
            <section className="panel people-workspace reveal delay-3">
              <div className="panel-heading"><div><p className="eyebrow">Production team</p><h2>Crew directory</h2></div><span className="tool-badge">{crew.length} members</span></div>
              {!crewAvailable ? <div className="migration-note">Apply <strong>007_operations_foundation.sql</strong> in Supabase to enable crew management.</div> : <div className="ops-workspace-grid">
                <form className="record-form" onSubmit={handleCrewSubmit}>
                  <div className="form-header"><h3>Add crew member</h3><span>Internal ops</span></div>
                  <div className="field-group"><label htmlFor="crew-name">Name</label><input id="crew-name" value={crewForm.name} onChange={(event) => setCrewForm((current) => ({ ...current, name: event.target.value }))} required /></div>
                  <div className="field-group"><label htmlFor="crew-role">Role</label><input id="crew-role" value={crewForm.role} onChange={(event) => setCrewForm((current) => ({ ...current, role: event.target.value }))} placeholder="Editor, camera, sound" /></div>
                  <div className="field-row"><div className="field-group"><label htmlFor="crew-phone">Phone</label><input id="crew-phone" value={crewForm.phone} onChange={(event) => setCrewForm((current) => ({ ...current, phone: event.target.value }))} /></div><div className="field-group"><label htmlFor="crew-email">Email</label><input id="crew-email" type="email" value={crewForm.email} onChange={(event) => setCrewForm((current) => ({ ...current, email: event.target.value }))} /></div></div>
                  <button className="primary-button" type="submit" disabled={actionBusy}>{actionBusy ? 'Saving...' : 'Add crew member'}</button>
                </form>
                <div className="list-card"><div className="mini-header"><h3>Team members</h3><span>Available for shoot assignment</span></div>{crew.length === 0 ? <p className="empty-state">No crew members yet.</p> : <ul className="record-list">{crew.map((member) => <li key={member.id}><div><strong>{member.name}</strong><small>{member.role ?? 'Role not set'}</small></div><span>{member.status ?? 'active'}</span></li>)}</ul>}</div>
              </div>}
            </section>
          )}

          {activeNav === 'Equipment' && (
            <section className="panel people-workspace reveal delay-3">
              <div className="panel-heading"><div><p className="eyebrow">Production inventory</p><h2>Equipment register</h2></div><span className="tool-badge">{equipment.length} items</span></div>
              {!equipmentAvailable ? <div className="migration-note">Apply <strong>007_operations_foundation.sql</strong> in Supabase to enable equipment management.</div> : <div className="ops-workspace-grid">
                <form className="record-form" onSubmit={handleEquipmentSubmit}>
                  <div className="form-header"><h3>Add equipment</h3><span>Internal ops</span></div>
                  <div className="field-group"><label htmlFor="equipment-name">Name</label><input id="equipment-name" value={equipmentForm.name} onChange={(event) => setEquipmentForm((current) => ({ ...current, name: event.target.value }))} placeholder="Sony FX3" required /></div>
                  <div className="field-group"><label htmlFor="equipment-category">Category</label><input id="equipment-category" value={equipmentForm.category} onChange={(event) => setEquipmentForm((current) => ({ ...current, category: event.target.value }))} placeholder="Camera, light, audio" required /></div>
                  <div className="field-group"><label htmlFor="equipment-identifier">Identifier</label><input id="equipment-identifier" value={equipmentForm.identifier} onChange={(event) => setEquipmentForm((current) => ({ ...current, identifier: event.target.value }))} placeholder="Asset tag or serial" /></div>
                  <button className="primary-button" type="submit" disabled={actionBusy}>{actionBusy ? 'Saving...' : 'Add equipment'}</button>
                </form>
                <div className="list-card"><div className="mini-header"><h3>Available inventory</h3><span>Reserve from the calendar</span></div>{equipment.length === 0 ? <p className="empty-state">No equipment yet.</p> : <ul className="record-list">{equipment.map((item) => <li key={item.id}><div><strong>{item.name}</strong><small>{item.category} · {item.identifier ?? 'No identifier'}</small></div><span>{item.status ?? 'available'}</span></li>)}</ul>}</div>
              </div>}
            </section>
          )}

          {activeNav === 'Activity' && (
            <section className="panel activity-workspace reveal delay-3">
              <div className="panel-heading"><div><p className="eyebrow">Traceable operations</p><h2>Activity timeline</h2></div><span className="tool-badge">{activity.length} events</span></div>
              {!activityAvailable ? <div className="migration-note">Activity logs are unavailable. Check the initial Supabase migration and RLS policies.</div> : activity.length === 0 ? <p className="empty-state activity-empty">No activity recorded yet. Create or update a studio record to begin the timeline.</p> : <div className="activity-list">{activity.map((item) => <article className="activity-item" key={item.id}><span className="activity-dot" /><div><strong>{item.action.replaceAll('_', ' ')}</strong><small>{item.entity_type} · {new Date(item.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</small></div></article>)}</div>}
            </section>
          )}

          {activeNav === 'Clients' && (
            <section className="panel clients-workspace reveal delay-3">
              <div className="panel-heading">
                <div><p className="eyebrow">Relationship directory</p><h2>Clients</h2></div>
                <span className="tool-badge">{clients.length} records</span>
              </div>
              <div className="client-directory">
                {clients.length === 0 ? (
                  <div className="empty-state">No clients yet. Add the first client from the Dashboard operations panel.</div>
                ) : clients.map((client) => {
                  const clientProjects = projects.filter((project) => project.client_id === client.id)
                  const clientInvoices = invoices.filter((invoice) => invoice.client_id === client.id)
                  return (
                    <article className="client-card" key={client.id}>
                      <div className="mini-header">
                        <div><h3>{client.name}</h3><span>{client.company_name ?? 'Independent client'}</span></div>
                        <span className="status-pill green">{client.status ?? 'active'}</span>
                      </div>
                      <div className="client-card-meta">
                        <span>{client.email ?? 'No email'}</span>
                        <span>{client.phone ?? 'No phone'}</span>
                        <span>{clientProjects.length} project{clientProjects.length === 1 ? '' : 's'}</span>
                        <span>{clientInvoices.length} invoice{clientInvoices.length === 1 ? '' : 's'}</span>
                      </div>
                      {client.notes && <p className="project-description">{client.notes}</p>}
                      {clientProjects.length > 0 && <div className="client-project-links">{clientProjects.slice(0, 3).map((project) => <button className="text-button" key={project.id} onClick={() => { setSelectedProjectId(project.id); setActiveNav('Projects') }}>{project.title} <ArrowUpRight size={13} /></button>)}</div>}
                    </article>
                  )
                })}
              </div>
            </section>
          )}

          <p className="build-note">
            <span className={`status-pulse ${dataState === 'error' ? 'error' : ''}`} />
            {dataState === 'live' ? 'Connected to Supabase · Live records' : dataState === 'error' ? 'Supabase connection error · Showing preview data' : 'Phase 1 foundation · Local preview data'}
            <button onClick={() => notify(dataState === 'live' ? 'Dashboard data is connected to Supabase.' : 'Supabase is configured locally and ready for the next data slice.')}>
              {dataState === 'live' ? 'Connected' : 'Connection details'} <ArrowUpRight size={13} />
            </button>
          </p>
        </div>
      </main>

      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, change, tone, icon }: { label: string; value: string; change: string; tone: string; icon: React.ReactNode }) {
  return (
    <article className="metric-card">
      <span className={`metric-icon ${tone}`}>{icon}</span>
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
      <small className={tone === 'yellow' ? 'attention' : ''}>{change}</small>
    </article>
  )
}

function Attention({ icon, title, detail, tone, action, onClick }: { icon: React.ReactNode; title: string; detail: string; tone: string; action: string; onClick: () => void }) {
  return (
    <button className="attention-row" onClick={onClick}>
      <span className={`attention-icon ${tone}`}>{icon}</span>
      <span className="attention-copy">
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      <span className="attention-action">
        {action} <ArrowUpRight size={14} />
      </span>
    </button>
  )
}

export default App
