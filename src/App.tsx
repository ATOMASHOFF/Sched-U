import { useEffect, useState } from 'react'
import {
  Activity,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
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
import { isSupabaseConfigured, supabase } from './lib/supabase'

type NavItem = {
  label: string
  icon: typeof LayoutDashboard
}

const navigation: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Calendar', icon: CalendarDays },
  { label: 'Projects', icon: FolderKanban },
  { label: 'Clients', icon: Users },
  { label: 'Tasks', icon: ClipboardList },
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

function App() {
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('sched-u-theme') === 'dark')
  const [notice, setNotice] = useState('')
  const [liveProjects, setLiveProjects] = useState(previewProjects)
  const [liveClientCount, setLiveClientCount] = useState<number | null>(null)
  const [dataState, setDataState] = useState<'preview' | 'live' | 'error'>('preview')

  const notify = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2800)
  }

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    let active = true
    const client = supabase
    const loadDashboardData = async () => {
      const [projectsResult, clientsResult] = await Promise.all([
        client.from('projects').select('id, title, status, deadline, client_id').order('deadline', { ascending: true }).limit(3),
        client.from('clients').select('id, name', { count: 'exact' }),
      ])

      if (!active) return
      if (projectsResult.error || clientsResult.error) {
        setDataState('error')
        return
      }

      if (projectsResult.data?.length) {
        const clientNames = new Map((clientsResult.data ?? []).map((record) => [record.id, record.name]))
        setLiveProjects(projectsResult.data.map((project) => ({
          name: project.title,
          client: clientNames.get(project.client_id) ?? 'Unassigned client',
          status: project.status.replace('_', ' '),
          progress: 0,
          due: project.deadline ? new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : 'No deadline',
          color: project.status === 'active' ? 'coral' : project.status === 'review' ? 'blue' : 'green',
        })))
      }
      setLiveClientCount(clientsResult.count ?? 0)
      setDataState('live')
    }

    void loadDashboardData()
    return () => { active = false }
  }, [])

  return (
    <div className={`app-shell ${darkMode ? 'dark-mode' : ''}`}>
      <aside className={`sidebar ${mobileNavOpen ? 'is-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark">S</div>
          <div><strong>Sched U</strong><span>651 Studio OS</span></div>
          <button className="icon-button mobile-close" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}><X size={18} /></button>
        </div>
        <div className="workspace-switcher"><span className="workspace-avatar">6</span><span><strong>651 Studio</strong><small>Internal workspace</small></span><ChevronDown size={15} /></div>
        <nav className="primary-nav" aria-label="Primary navigation"><span className="nav-label">Workspace</span>{navigation.map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${activeNav === label ? 'active' : ''}`} onClick={() => { setActiveNav(label); setMobileNavOpen(false) }}><Icon size={17} strokeWidth={activeNav === label ? 2.4 : 1.8} /><span>{label}</span>{label === 'Tasks' && <em>4</em>}</button>)}</nav>
        <div className="sidebar-footer"><button className="nav-item" onClick={() => notify('Settings will be connected in Phase 1.')}><Settings size={17} /><span>Settings</span></button><div className="user-chip"><span className="user-avatar">AS</span><span><strong>Ashish S.</strong><small>Owner</small></span><ChevronDown size={15} /></div></div>
      </aside>
      <main className="main-content">
        <header className="topbar"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={20} /></button><div className="breadcrumbs"><span>Workspace</span><span>/</span><strong>{activeNav}</strong></div><div className="topbar-actions"><button className="icon-button" aria-label="Search" onClick={() => notify('Global search is coming with the client and project records.')}><Search size={18} /></button><button className="icon-button" aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => { const nextMode = !darkMode; setDarkMode(nextMode); localStorage.setItem('sched-u-theme', nextMode ? 'dark' : 'light') }}>{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button><button className="icon-button notification-button" aria-label="Notifications" onClick={() => notify('You have 4 items needing attention.')}><Bell size={18} /><i /></button><button className="avatar-button" aria-label="Open account menu">AS</button></div></header>
        <div className="page-content">
          <section className="page-heading reveal"><div><p className="eyebrow">Thursday, October 2, 2026</p><h1>Good morning, Ashish<span>.</span></h1><p className="heading-copy">Here is what needs your attention today.</p></div><div className="heading-actions"><button className="secondary-button" onClick={() => notify('Calendar view will open when events are connected.')}><CalendarDays size={16} /> View calendar</button><div className="quick-action-wrap"><button className="primary-button" onClick={() => setShowQuickActions(!showQuickActions)}><Plus size={17} /> New <ChevronDown size={14} /></button>{showQuickActions && <div className="quick-menu"><button onClick={() => notify('Project creation is the next build task.')}>New project</button><button onClick={() => notify('Client creation is the next build task.')}>New client</button><button onClick={() => notify('Shoot creation is planned for Phase 3.')}>New shoot</button></div>}</div></div></section>
          <section className="metric-grid reveal delay-1" aria-label="Studio overview"><Metric label="Active projects" value={String(liveProjects.length).padStart(2, '0')} change={dataState === 'live' ? 'Live from Supabase' : '+2 this month'} tone="coral" icon={<FolderKanban size={17} />} /><Metric label="Due this week" value="12" change="4 need attention" tone="yellow" icon={<Clock3 size={17} />} /><Metric label="Awaiting payment" value="₹72.5k" change="3 invoices open" tone="blue" icon={<CircleDollarSign size={17} />} /><Metric label="Clients" value={liveClientCount === null ? '--' : String(liveClientCount).padStart(2, '0')} change={dataState === 'live' ? 'Live from Supabase' : 'Connect database'} tone="green" icon={<Users size={17} />} /></section>
          <div className="dashboard-grid reveal delay-2"><section className="panel schedule-panel"><div className="panel-heading"><div><p className="eyebrow">On the clock</p><h2>Today’s schedule</h2></div><button className="text-button" onClick={() => notify('Calendar view is planned for Phase 5.')}>Full calendar <ArrowUpRight size={15} /></button></div><div className="schedule-list">{schedule.map((item) => <button className="schedule-row" key={item.time} onClick={() => notify(`${item.title} selected.`)}><time>{item.time}</time><span className={`schedule-dot ${item.tone}`} /><span className="schedule-info"><strong>{item.title}</strong><small>{item.detail}</small></span><ArrowUpRight size={15} /></button>)}</div><div className="panel-footer"><span><span className="live-dot" /> 3 events today</span><button className="icon-button" aria-label="Add event" onClick={() => notify('Event creation is planned for the calendar milestone.')}><Plus size={17} /></button></div></section><section className="panel attention-panel"><div className="panel-heading"><div><p className="eyebrow">Triage</p><h2>Needs attention</h2></div><span className="count-badge">4</span></div><Attention icon={<Clock3 size={17} />} title="2 overdue tasks" detail="Northstar campaign" tone="coral" action="Review" onClick={() => notify('Task triage will be connected to Supabase.')} /><Attention icon={<Users size={17} />} title="Client review pending" detail="Studio portraits · Reel 03" tone="blue" action="Open" onClick={() => notify('Deliverable details are planned for Phase 4.')} /><Attention icon={<CircleDollarSign size={17} />} title="₹25,000 payment due" detail="INV-024 · Due Oct 4" tone="yellow" action="View" onClick={() => notify('Invoice details are planned for Phase 6.')} /><div className="panel-footer"><span className="muted">Updated just now</span><button className="text-button" onClick={() => notify('All notifications marked as read.')}>Mark all read <Check size={14} /></button></div></section></div>
          <section className="panel projects-panel reveal delay-3"><div className="panel-heading"><div><p className="eyebrow">Work in motion</p><h2>Active projects</h2></div><button className="text-button" onClick={() => notify('Project list is the next CRUD slice.')}>View all projects <ArrowUpRight size={15} /></button></div><div className="project-table"><div className="table-head"><span>Project</span><span>Status</span><span>Progress</span><span>Due</span></div>{liveProjects.map((project) => <button className="project-row" key={project.name} onClick={() => notify(`${project.name} selected.`)}><span className="project-name"><i className={`project-mark ${project.color}`} /><strong>{project.name}</strong><small>{project.client}</small></span><span><em className={`status-pill ${project.color}`}>{project.status}</em></span><span className="progress-cell"><span className="progress-track"><i className={project.color} style={{ width: `${project.progress}%` }} /></span><small>{project.progress}%</small></span><span className="due-date">{project.due}<ArrowUpRight size={14} /></span></button>)}</div></section>
          <p className="build-note"><span className="status-pulse" /> Phase 1 foundation · Local preview data <button onClick={() => notify('Supabase connection will be configured after you provide project credentials.')}>Connect Supabase <ArrowUpRight size={13} /></button></p>
            <section className="panel projects-panel reveal delay-3"><div className="panel-heading"><div><p className="eyebrow">Work in motion</p><h2>Active projects</h2></div><button className="text-button" onClick={() => notify('Project list is the next CRUD slice.')}>View all projects <ArrowUpRight size={15} /></button></div><div className="project-table"><div className="table-head"><span>Project</span><span>Status</span><span>Progress</span><span>Due</span></div>{liveProjects.map((project) => <button className="project-row" key={project.name} onClick={() => notify(`${project.name} selected.`)}><span className="project-name"><i className={`project-mark ${project.color}`} /><strong>{project.name}</strong><small>{project.client}</small></span><span><em className={`status-pill ${project.color}`}>{project.status}</em></span><span className="progress-cell"><span className="progress-track"><i className={project.color} style={{ width: `${project.progress}%` }} /></span><small>{project.progress}%</small></span><span className="due-date">{project.due}<ArrowUpRight size={14} /></span></button>)}</div></section>
            <p className="build-note"><span className={`status-pulse ${dataState === 'error' ? 'error' : ''}`} /> {dataState === 'live' ? 'Connected to Supabase · Live records' : dataState === 'error' ? 'Supabase connection error · Showing preview data' : 'Phase 1 foundation · Local preview data'} <button onClick={() => notify(dataState === 'live' ? 'Dashboard data is connected to Supabase.' : 'Supabase is configured locally and ready for the next data slice.')}>{dataState === 'live' ? 'Connected' : 'Connection details'} <ArrowUpRight size={13} /></button></p>
        </div>
      </main>
      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  )
}

function Metric({ label, value, change, tone, icon }: { label: string; value: string; change: string; tone: string; icon: React.ReactNode }) { return <article className="metric-card"><span className={`metric-icon ${tone}`}>{icon}</span><span className="metric-label">{label}</span><strong>{value}</strong><small className={tone === 'yellow' ? 'attention' : ''}>{change}</small></article> }
function Attention({ icon, title, detail, tone, action, onClick }: { icon: React.ReactNode; title: string; detail: string; tone: string; action: string; onClick: () => void }) { return <button className="attention-row" onClick={onClick}><span className={`attention-icon ${tone}`}>{icon}</span><span className="attention-copy"><strong>{title}</strong><small>{detail}</small></span><span className="attention-action">{action} <ArrowUpRight size={14} /></span></button> }

export default App
