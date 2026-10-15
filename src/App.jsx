import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Activity, BusFront, CalendarClock, Clock3, LogOut, MapPinned, Navigation, RefreshCw, ShieldCheck, Users, WalletCards } from 'lucide-react';
import { isSupabaseConfigured, supabase } from './lib/supabase.js';
import { calculatePay, getPayrollPeriod } from './lib/payroll.js';
import 'leaflet/dist/leaflet.css';

const busIcon = new L.DivIcon({ className: 'map-marker bus-marker', html: '<span>BUS</span>', iconSize: [42, 30], iconAnchor: [21, 15] });
const staffIcon = new L.DivIcon({ className: 'map-marker staff-marker', html: '<span>GPS</span>', iconSize: [42, 30], iconAnchor: [21, 15] });
const DIRECTIONS = [
  { value: 'pitx_to_moa', label: 'PITX → MOA South Wing' },
  { value: 'moa_to_pitx', label: 'MOA South Wing → PITX' },
];

function timeLabel(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
function hoursLabel(start, end) {
  if (!start) return '—';
  const mins = Math.max(0, Math.floor(((end ? new Date(end) : new Date()) - new Date(start)) / 60000));
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}
function ErrorNotice({ children }) { return children ? <div className="notice error-notice" role="alert">{children}</div> : null; }

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [shift, setShift] = useState(null);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [busId, setBusId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [direction, setDirection] = useState('pitx_to_moa');
  const [locations, setLocations] = useState([]);
  const [staff, setStaff] = useState([]);
  const [staffProfiles, setStaffProfiles] = useState([]);
  const [history, setHistory] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  const loadProfile = useCallback(async (user) => {
    if (!user || !supabase) { setProfile(null); return; }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) throw error;
    setProfile(data);
  }, []);

  const loadWorkspace = useCallback(async (user, currentProfile) => {
    if (!supabase || !user || !currentProfile) return;
    const isAdmin = currentProfile.role === 'admin';
    const [shiftRes, busRes, routeRes, historyRes, payrollRes] = await Promise.all([
      supabase.from('shifts').select('*, buses(bus_code,plate_number), routes(route_code,name,direction), profiles(full_name,role)').eq('user_id', user.id).is('ended_at', null).order('started_at', { ascending: false }).limit(1),
      supabase.from('buses').select('id,bus_code,plate_number').eq('active', true).order('bus_code'),
      supabase.from('routes').select('id,route_code,name,direction').eq('active', true).order('route_code'),
      supabase.from('shifts').select('*, profiles(full_name,role), buses(bus_code), routes(name,direction)').order('started_at', { ascending: false }).limit(isAdmin ? 100 : 20),
      supabase.from('payroll_records').select('*, profiles(full_name)').order('period_start', { ascending: false }).limit(isAdmin ? 100 : 20),
    ]);
    for (const result of [shiftRes, busRes, routeRes, historyRes, payrollRes]) if (result.error) throw result.error;
    setShift(shiftRes.data?.[0] || null);
    setBuses(busRes.data || []);
    setRoutes(routeRes.data || []);
    setHistory(historyRes.data || []);
    setPayroll(payrollRes.data || []);
    if (isAdmin) {
      const [activeRes, profileRes, latestRes] = await Promise.all([
        supabase.from('shifts').select('*, profiles(full_name,role), buses(bus_code), routes(name,direction)').is('ended_at', null).order('started_at', { ascending: false }),
        supabase.from('profiles').select('id,full_name,role,active').order('full_name'),
        supabase.from('location_pings').select('id,shift_id,user_id,bus_id,route_id,latitude,longitude,accuracy_meters,recorded_at,profiles(full_name,role),buses(bus_code),routes(name,direction)').order('recorded_at', { ascending: false }).limit(250),
      ]);
      for (const result of [activeRes, profileRes, latestRes]) if (result.error) throw result.error;
      setStaff(activeRes.data || []);
      setStaffProfiles(profileRes.data || []);
      const latestByUser = new Map();
      for (const ping of latestRes.data || []) if (!latestByUser.has(ping.user_id)) latestByUser.set(ping.user_id, ping);
      setLocations([...latestByUser.values()]);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!session?.user || !profile) return;
    setRefreshing(true);
    try { await loadWorkspace(session.user, profile); }
    catch (error) { setNotice(error.message || 'Unable to refresh data.'); }
    finally { setRefreshing(false); }
  }, [session, profile, loadWorkspace]);

  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return; }
    let alive = true;
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (error) throw error;
      if (!alive) return;
      setSession(data.session);
      if (data.session?.user) {
        try { await loadProfile(data.session.user); } catch (e) { setAuthError(e.message); }
      }
    }).catch(e => setAuthError(e.message)).finally(() => { if (alive) setAuthLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) { setProfile(null); setShift(null); }
      else setTimeout(() => loadProfile(nextSession.user).catch(e => setAuthError(e.message)), 0);
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, [loadProfile]);

  useEffect(() => {
    if (!session?.user || !profile) return;
    loadWorkspace(session.user, profile).catch(e => setNotice(e.message || 'Unable to load workspace.'));
  }, [session, profile, loadWorkspace]);

  useEffect(() => {
    if (!supabase || !session?.user || !profile || profile.role !== 'admin') return;
    const channel = supabase.channel('admin-live-ops')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'location_pings' }, () => loadWorkspace(session.user, profile).catch(() => {}))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shifts' }, () => loadWorkspace(session.user, profile).catch(() => {}))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session, profile, loadWorkspace]);

  useEffect(() => {
    if (!shift || !session?.user || !supabase || !navigator.geolocation) return;
    let cancelled = false;
    let watchId;
    const sendPosition = async (position) => {
      if (cancelled) return;
      const { latitude, longitude, accuracy } = position.coords;
      const payload = { shift_id: shift.id, user_id: session.user.id, bus_id: shift.bus_id, route_id: shift.route_id, latitude, longitude, accuracy_meters: accuracy, recorded_at: new Date().toISOString() };
      const { error } = await supabase.from('location_pings').insert(payload);
      if (!error) setNotice('');
      else setNotice(`GPS update failed: ${error.message}`);
    };
    watchId = navigator.geolocation.watchPosition(sendPosition, (error) => {
      if (!cancelled) setNotice(`Location unavailable: ${error.message}. Check GPS permission and device location.`);
    }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
    return () => { cancelled = true; if (watchId !== undefined) navigator.geolocation.clearWatch(watchId); };
  }, [shift?.id, session?.user?.id]);

  async function signIn(event) {
    event.preventDefault(); setBusy(true); setAuthError('');
    try {
      if (!supabase) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
    } catch (error) { setAuthError(error.message || 'Unable to sign in.'); }
    finally { setBusy(false); }
  }

  async function signOut() {
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.signOut();
    setBusy(false);
    if (error) setNotice(error.message);
  }

  function getPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('This device/browser does not support GPS.'));
      navigator.geolocation.getCurrentPosition(resolve, (error) => reject(new Error(error.message)), { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
    });
  }

  async function startShift(event) {
    event.preventDefault(); setBusy(true); setNotice('');
    try {
      if (!supabase || !profile || !session?.user) throw new Error('Sign in is required.');
      const position = await getPosition();
      const route = profile.role === 'inspector' ? routes.find(r => r.direction === direction) : routes.find(r => r.id === routeId);
      if (!route) throw new Error('Choose an available route.');
      if (['driver', 'conductor'].includes(profile.role) && !busId) throw new Error('Choose your assigned bus.');
      const { data, error } = await supabase.from('shifts').insert({
        user_id: session.user.id, role_snapshot: profile.role,
        bus_id: ['driver', 'conductor'].includes(profile.role) ? busId : null,
        route_id: route.id, start_latitude: position.coords.latitude, start_longitude: position.coords.longitude,
      }).select('*').single();
      if (error) throw error;
      setShift(data); setNotice('Shift started. GPS tracking is active while this shift remains open.');
      await loadWorkspace(session.user, profile);
    } catch (error) { setNotice(error.message || 'Could not start shift.'); }
    finally { setBusy(false); }
  }

  async function endShift() {
    setBusy(true); setNotice('');
    try {
      const position = await getPosition();
      const { error } = await supabase.from('shifts').update({ ended_at: new Date().toISOString(), end_latitude: position.coords.latitude, end_longitude: position.coords.longitude }).eq('id', shift.id).eq('user_id', session.user.id);
      if (error) throw error;
      setShift(null); setNotice('Shift ended. Your attendance record has been saved.');
      await loadWorkspace(session.user, profile);
    } catch (error) { setNotice(error.message || 'Could not end shift.'); }
    finally { setBusy(false); }
  }

  const currentPeriod = useMemo(() => getPayrollPeriod(new Date()), []);
  const currentPay = shift ? calculatePay(shift.started_at, new Date()) : null;

  if (authLoading) return <div className="center-screen"><div className="loader" />Loading BusTrack HRIS…</div>;
  if (!session) return <main className="login-page">
    <section className="login-visual"><div className="brand-lockup"><span className="brand-symbol"><BusFront /></span><span>BusTrack <b>HRIS</b></span></div><div className="login-message"><p className="eyebrow">TRANSPORT OPERATIONS PLATFORM</p><h1>Every route.<br />Every shift.<br /><em>Accounted for.</em></h1><p>Live fleet visibility, reliable attendance records, and payroll tools for your transport team.</p></div><div className="login-bottom"><span><span className="live-dot" /> Operations workspace</span><span>Secure staff access</span></div></section>
    <section className="login-panel"><div className="login-form-wrap"><div className="mobile-brand"><BusFront /> BusTrack <b>HRIS</b></div><p className="eyebrow">WELCOME BACK</p><h2>Sign in to your workspace</h2><p className="muted">Use your staff account credentials to continue.</p>
      {!isSupabaseConfigured && <div className="notice error-notice">Supabase is not configured. Add your project URL and anon/publishable key in <code>.env.local</code>.</div>}
      <ErrorNotice>{authError}</ErrorNotice>
      <form onSubmit={signIn} className="login-form"><label>Email address<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" /></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" /></label><button className="primary-button full-button" disabled={busy || !isSupabaseConfigured}>{busy ? 'Signing in…' : 'Sign in securely'} <span>→</span></button></form>
      <p className="login-help"><ShieldCheck size={15} /> Access is managed by your system administrator.</p></div><footer className="login-footer">BusTrack HRIS · Staff portal</footer></section>
  </main>;

  if (!profile) return <main className="center-screen"><ShieldCheck size={28} /><h2>Staff profile not found</h2><p>Your account authenticated, but it has no active BusTrack profile. Ask an administrator to provision your role.</p><button className="secondary-button" onClick={signOut}>Sign out</button></main>;

  const isAdmin = profile.role === 'admin';
  const staffName = profile.full_name || session.user.email;
  const tabItems = isAdmin ? [
    ['overview', 'Overview', Activity], ['fleet', 'Live fleet', MapPinned], ['staff', 'Staff', Users], ['records', 'Records', CalendarClock], ['payroll', 'Payroll', WalletCards],
  ] : [['overview', 'My shift', Clock3], ['records', 'My records', CalendarClock], ['payroll', 'My payroll', WalletCards]];
  const visibleLocations = locations.filter(p => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));
  const center = visibleLocations.length ? [visibleLocations[0].latitude, visibleLocations[0].longitude] : [14.5378, 120.9826];

  return <div className="app-layout">
    <aside className="sidebar"><div className="sidebar-brand"><span className="brand-symbol"><BusFront /></span><span>BusTrack <b>HRIS</b></span></div><div className="workspace-label">WORKSPACE</div><nav>{tabItems.map(([id, label, Icon]) => <button key={id} className={activeTab === id ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab(id)}><Icon size={18} />{label}</button>)}</nav><div className="sidebar-bottom"><div className="user-mini"><div className="avatar">{staffName.slice(0,1).toUpperCase()}</div><div><strong>{staffName}</strong><small>{profile.role}</small></div></div><button className="signout-button" onClick={signOut} disabled={busy}><LogOut size={17} /> Sign out</button></div></aside>
    <main className="main-area"><header className="dashboard-header"><div><p className="eyebrow">{isAdmin ? 'OPERATIONS CONTROL' : 'STAFF WORKSPACE'}</p><h1>{activeTab === 'overview' ? `Good day, ${staffName.split(' ')[0]}` : tabItems.find(t => t[0] === activeTab)?.[1]}</h1><p className="muted">{new Intl.DateTimeFormat('en-PH', { dateStyle: 'full' }).format(new Date())}</p></div><div className="header-actions"><span className="role-pill"><ShieldCheck size={14} /> {profile.role}</span><button className="icon-button" title="Refresh" onClick={refresh} disabled={refreshing}><RefreshCw size={17} className={refreshing ? 'spin' : ''} /></button></div></header>
      {notice && <div className={notice.toLowerCase().includes('failed') || notice.toLowerCase().includes('unavailable') || notice.toLowerCase().includes('error') ? 'notice error-notice' : 'notice success-notice'}>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}
      {activeTab === 'overview' && <>{isAdmin ? <><div className="stat-grid"><Stat icon={BusFront} label="On duty" value={staff.length} hint="Active staff shifts" /><Stat icon={MapPinned} label="GPS signals" value={visibleLocations.length} hint="Staff with coordinates" /><Stat icon={Users} label="Staff accounts" value={staffProfiles.length} hint="Seen in recent records" /><Stat icon={WalletCards} label="Payroll periods" value={currentPeriod.label} hint="Current semi-monthly period" /></div><div className="content-grid"><section className="panel map-panel"><PanelHeading title="Live operations map" subtitle="Latest GPS signal per active staff member" action={<button className="text-button" onClick={() => setActiveTab('fleet')}>Open map →</button>} /><OperationsMap locations={visibleLocations} center={center} /></section><section className="panel"><PanelHeading title="On duty now" subtitle="Active shifts" /><ShiftList shifts={staff.slice(0, 6)} /></section></div></> : <><div className="stat-grid"><Stat icon={Clock3} label="Shift status" value={shift ? 'On duty' : 'Off duty'} hint={shift ? `Started ${timeLabel(shift.started_at)}` : 'No active shift'} /><Stat icon={CalendarClock} label="Duration" value={shift ? hoursLabel(shift.started_at) : '—'} hint="Elapsed shift time" /><Stat icon={WalletCards} label="Estimated pay" value={shift ? money(currentPay.total) : '—'} hint={shift ? 'Estimate for this shift' : 'Starts when you clock in'} /><Stat icon={MapPinned} label="GPS tracking" value={shift ? 'Active' : 'Paused'} hint={shift ? 'Location shared during shift' : 'Starts with your shift'} /></div><section className="panel shift-panel"><PanelHeading title={shift ? 'Your active shift' : 'Start your shift'} subtitle={shift ? 'Your location is being recorded while on duty' : 'Allow GPS access to record your start location'} />{shift ? <div className="active-shift"><div className="shift-live"><span className="live-dot" /> SHIFT IN PROGRESS</div><div className="shift-detail-grid"><div><small>Clock-in time</small><strong>{timeLabel(shift.started_at)}</strong></div><div><small>Duration</small><strong>{hoursLabel(shift.started_at)}</strong></div><div><small>Route</small><strong>{shift.routes?.name || routeLabel(shift.routes?.direction)}</strong></div><div><small>Bus</small><strong>{shift.buses?.bus_code || (profile.role === 'inspector' ? 'Inspector route' : 'Not assigned')}</strong></div></div><button className="danger-button" disabled={busy} onClick={endShift}>{busy ? 'Saving…' : 'Clock out and end shift'}</button></div> : <form className="shift-form" onSubmit={startShift}>{['driver','conductor'].includes(profile.role) && <label>Assigned bus<select required value={busId} onChange={e => setBusId(e.target.value)}><option value="">Choose a bus</option>{buses.map(b => <option key={b.id} value={b.id}>{b.bus_code}{b.plate_number ? ` · ${b.plate_number}` : ''}</option>)}</select></label>}<label>Route<select required value={profile.role === 'inspector' ? direction : routeId} onChange={e => profile.role === 'inspector' ? setDirection(e.target.value) : setRouteId(e.target.value)}>{profile.role === 'inspector' ? DIRECTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>) : <><option value="">Choose a route</option>{routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</>}</select></label><div className="gps-hint"><Navigation size={17} /><span><strong>GPS location required</strong><small>Your start coordinates and shift time are saved when you clock in.</small></span></div><button className="primary-button" disabled={busy}>{busy ? 'Getting location…' : 'Clock in and start GPS'} <span>→</span></button></form>}</section></>}</>}
      {activeTab === 'fleet' && isAdmin && <section className="panel map-panel"><PanelHeading title="Live fleet and staff" subtitle="Updates automatically when location pings arrive" action={<span className="live-indicator"><span className="live-dot" /> LIVE FEED</span>} /><OperationsMap locations={visibleLocations} center={center} large /><div className="table-wrap"><table><thead><tr><th>Staff</th><th>Role</th><th>Route</th><th>Last GPS update</th><th>Accuracy</th></tr></thead><tbody>{visibleLocations.map(p => <tr key={p.id}><td>{p.profiles?.full_name || 'Staff member'}</td><td>{p.profiles?.role || '—'}</td><td>{p.routes?.name || routeLabel(p.routes?.direction)}</td><td>{timeLabel(p.recorded_at)}</td><td>{p.accuracy_meters ? `±${Math.round(p.accuracy_meters)} m` : '—'}</td></tr>)}{!visibleLocations.length && <EmptyRow cols={5} text="No GPS locations yet. Locations appear when staff clock in and their device shares GPS." />}</tbody></table></div></section>}
      {activeTab === 'staff' && isAdmin && <section className="panel"><PanelHeading title="Staff accounts" subtitle="Registered profiles and account status" /><div className="table-wrap"><table><thead><tr><th>Name</th><th>Role</th><th>Status</th></tr></thead><tbody>{staffProfiles.length ? staffProfiles.map(s => <tr key={s.id}><td>{s.full_name}</td><td>{s.role}</td><td><span className={s.active ? 'status-tag' : 'status-tag inactive-tag'}>{s.active ? 'Active' : 'Inactive'}</span></td></tr>) : <EmptyRow cols={3} text="No staff profiles found." />}</tbody></table></div><p className="panel-note">Creating auth users must use a secure server-side admin function; the service-role key must never be placed in this browser app.</p></section>}
      {activeTab === 'records' && <section className="panel"><PanelHeading title={isAdmin ? 'Shift records' : 'My shift records'} subtitle="Most recent shifts first" /><div className="table-wrap"><table><thead><tr><th>Staff</th><th>Role</th><th>Route / bus</th><th>Clock in</th><th>Clock out</th><th>Duration</th></tr></thead><tbody>{history.map(row => <tr key={row.id}><td>{row.profiles?.full_name || 'You'}</td><td>{row.role_snapshot}</td><td>{row.routes?.name || routeLabel(row.routes?.direction)}{row.buses?.bus_code ? ` · ${row.buses.bus_code}` : ''}</td><td>{timeLabel(row.started_at)}</td><td>{timeLabel(row.ended_at)}</td><td>{hoursLabel(row.started_at, row.ended_at)}</td></tr>)}{!history.length && <EmptyRow cols={6} text="No shift records found." />}</tbody></table></div></section>}
      {activeTab === 'payroll' && <section className="panel"><PanelHeading title={isAdmin ? 'Payroll records' : 'My payroll'} subtitle="Payroll periods: 1st–15th and 16th–month end" /><div className="table-wrap"><table><thead><tr><th>Staff</th><th>Period</th><th>Regular</th><th>Overtime</th><th>Total pay</th></tr></thead><tbody>{payroll.map(row => <tr key={row.id}><td>{row.profiles?.full_name || 'You'}</td><td>{row.period_start} – {row.period_end}</td><td>{Number(row.regular_hours).toFixed(2)}h</td><td>{row.overtime_minutes} min</td><td className="money-cell">{money(row.total_pay_php)}</td></tr>)}{!payroll.length && <EmptyRow cols={5} text="Payroll records will appear here once shifts are processed by the payroll workflow." />}</tbody></table></div><button className="secondary-button" onClick={() => downloadCsv(payroll, 'bustrack-payroll.csv')}>Export visible records to CSV</button></section>}
      <footer className="dashboard-footer">BusTrack HRIS <span>•</span> {isAdmin ? 'Operations control' : 'Staff portal'} <span>•</span> GPS is collected only during an active shift</footer>
    </main>
  </div>;
}

function routeLabel(direction) { return direction === 'pitx_to_moa' ? 'PITX → MOA South Wing' : direction === 'moa_to_pitx' ? 'MOA South Wing → PITX' : 'Route not assigned'; }
function money(value) { return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value || 0)); }
function downloadCsv(rows, filename) {
  const headers = ['staff','period_start','period_end','regular_hours','overtime_minutes','base_pay_php','overtime_pay_php','total_pay_php'];
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(h === 'staff' ? (r.profiles?.full_name || '') : (r[h] ?? '')).replace(/^"|"$/g, '""')).join(','))].join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}
function Stat({ icon: Icon, label, value, hint }) { return <article className="stat-card"><div className="stat-top"><span>{label}</span><Icon size={18} /></div><strong className="stat-value">{value}</strong><small>{hint}</small></article>; }
function PanelHeading({ title, subtitle, action }) { return <div className="panel-heading"><div><h2>{title}</h2><p>{subtitle}</p></div>{action}</div>; }
function EmptyRow({ cols, text }) { return <tr><td colSpan={cols} className="empty-cell">{text}</td></tr>; }
function ShiftList({ shifts }) { return <div className="shift-list">{shifts.map(s => <div className="shift-list-item" key={s.id}><div className="avatar">{(s.profiles?.full_name || '?').slice(0,1).toUpperCase()}</div><div className="shift-list-main"><strong>{s.profiles?.full_name || 'Staff member'}</strong><small>{s.profiles?.role} · {s.routes?.name || routeLabel(s.routes?.direction)}</small></div><span className="status-tag">On duty</span></div>)}{!shifts.length && <p className="empty-inline">No active shifts right now.</p>}</div>; }
function OperationsMap({ locations, center, large = false }) {
  return <div className={large ? 'operations-map large-map' : 'operations-map'}><MapContainer center={center} zoom={13} scrollWheelZoom style={{ height: '100%', width: '100%' }} key={center.join(',')}><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{locations.map(p => <Marker key={p.id} position={[p.latitude,p.longitude]} icon={p.bus_id ? busIcon : staffIcon}><Popup><strong>{p.profiles?.full_name || 'Staff member'}</strong><br />{p.profiles?.role || 'Staff'}<br />{p.routes?.name || routeLabel(p.routes?.direction)}<br />Updated {timeLabel(p.recorded_at)}</Popup></Marker>)}</MapContainer></div>;
}
