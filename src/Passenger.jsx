import React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { BusFront, MessageSquareWarning, MapPin, RefreshCw, ShieldCheck, Send, Clock3, CheckCircle2, Navigation } from 'lucide-react';
import { isSupabaseConfigured, supabase } from './lib/supabase.js';
import 'leaflet/dist/leaflet.css';

const busIcon = new L.DivIcon({
  className: 'passenger-bus-marker',
  html: '<span>BUS</span>',
  iconSize: [48, 36],
  iconAnchor: [24, 18]
});

function formatTime(value) {
  if (!value) return 'Waiting for first GPS signal';
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function publicDirection(bus) {
  if (bus.direction === 'moa_to_pitx') return 'MOA → Ternate';
  if (bus.direction === 'pitx_to_moa') return 'Ternate → MOA';
  return bus.route_name || 'Route not assigned';
}

function FitBuses({ buses }) {
  const map = useMap();
  const signature = buses.map(bus => `${bus.bus_id}:${bus.latitude}:${bus.longitude}`).join('|');
  useEffect(() => {
    if (buses.length === 1) map.flyTo([buses[0].latitude, buses[0].longitude], 14, { duration: 0.6 });
    else if (buses.length > 1) map.fitBounds(buses.map(bus => [bus.latitude, bus.longitude]), { padding: [45, 45], maxZoom: 14 });
  }, [signature, map]);
  return null;
}

export default function Passenger() {
  const [buses, setBuses] = useState([]);
  const [loadingMap, setLoadingMap] = useState(true);
  const [mapError, setMapError] = useState('');
  const [form, setForm] = useState({ passenger_name: '', contact_info: '', category: 'Other', message: '' });
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadBuses = useCallback(async (quiet = false) => {
    if (!supabase || !isSupabaseConfigured) {
      setMapError('Live tracking is not configured yet. Please try again later.');
      setLoadingMap(false);
      return;
    }
    if (!quiet) setLoadingMap(true);
    const { data, error } = await supabase
      .from('passenger_bus_locations')
      .select('bus_id,bus_code,route_name,direction,latitude,longitude,recorded_at,trip_started_at')
      .order('recorded_at', { ascending: false });
    if (error) setMapError('Unable to load bus locations right now. Please refresh in a moment.');
    else {
      setMapError('');
      setBuses((data || []).filter(bus => Number.isFinite(Number(bus.latitude)) && Number.isFinite(Number(bus.longitude))));
      setLastUpdated(new Date().toISOString());
    }
    setLoadingMap(false);
  }, []);

  useEffect(() => {
    loadBuses();
    const timer = window.setInterval(() => loadBuses(true), 30000);
    return () => window.clearInterval(timer);
  }, [loadBuses]);

  const mapCenter = useMemo(() => buses.length ? [Number(buses[0].latitude), Number(buses[0].longitude)] : [14.535, 120.982], [buses]);

  async function submitComplaint(event) {
    event.preventDefault();
    setNotice(null);
    if (!supabase) {
      setNotice({ type: 'error', text: 'The complaint service is not configured. Please contact the operator directly.' });
      return;
    }
    if (form.message.trim().length < 10) {
      setNotice({ type: 'error', text: 'Please describe your concern in at least 10 characters.' });
      return;
    }
    setSending(true);
    const { error } = await supabase.from('passenger_complaints').insert({
      passenger_name: form.passenger_name.trim() || null,
      contact_info: form.contact_info.trim() || null,
      category: form.category,
      message: form.message.trim()
    });
    setSending(false);
    if (error) {
      setNotice({ type: 'error', text: 'Your complaint could not be sent. Please try again later.' });
      return;
    }
    setForm({ passenger_name: '', contact_info: '', category: 'Other', message: '' });
    setNotice({ type: 'success', text: 'Your complaint has been sent to the admin team for review. Thank you for letting us know.' });
  }

  return <div className="passenger-page">
    <header className="passenger-header">
      <a className="passenger-brand" href="/passenger" aria-label="BusTrack passenger home">
        <span className="passenger-brand-icon"><BusFront size={23}/></span>
        <span>BusTrack <b>Passenger</b><small>Live bus information</small></span>
      </a>
      <a className="passenger-staff-link" href="/"><ShieldCheck size={15}/> Staff sign in</a>
    </header>

    <main className="passenger-main">
      <section className="passenger-hero">
        <div>
          <p className="eyebrow">YOUR JOURNEY, IN VIEW</p>
          <h1>Find your bus.<br/><em>Travel with confidence.</em></h1>
          <p>Check the latest bus GPS location and direction, or send a service complaint directly to our admin team. No account needed.</p>
          <div className="passenger-hero-pills"><span><span className="live-dot"/> GPS refreshes every 30 seconds</span><span><ShieldCheck size={15}/> No login required</span></div>
        </div>
        <div className="passenger-hero-art"><div className="hero-route-line"/><div className="hero-pin hero-pin-one"><MapPin size={20}/></div><div className="hero-bus"><BusFront size={48}/></div><div className="hero-pin hero-pin-two"><MapPin size={20}/></div><span className="hero-stop-label label-moa">MOA</span><span className="hero-stop-label label-ternate">TERNATE</span></div>
      </section>

      <section className="passenger-map-section">
        <div className="passenger-section-heading">
          <div><p className="eyebrow">LIVE FLEET</p><h2>Bus locations</h2><p>Locations appear when a bus crew is on an active shift and GPS is available.</p></div>
          <button className="passenger-refresh" onClick={() => loadBuses()} disabled={loadingMap}><RefreshCw size={16} className={loadingMap ? 'spin' : ''}/>{loadingMap ? 'Refreshing…' : 'Refresh map'}</button>
        </div>
        {mapError && <div className="passenger-alert error">{mapError}</div>}
        <div className="passenger-map-layout">
          <div className="passenger-map-wrap">
            <MapContainer center={mapCenter} zoom={12} scrollWheelZoom className="passenger-leaflet-map">
              <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
              <FitBuses buses={buses}/>
              {buses.map(bus => <Marker key={bus.bus_id} position={[Number(bus.latitude), Number(bus.longitude)]} icon={busIcon}>
                <Popup><strong>{bus.bus_code}</strong><br/>{publicDirection(bus)}<br/>GPS: {formatTime(bus.recorded_at)}</Popup>
              </Marker>)}
            </MapContainer>
            {!buses.length && !loadingMap && <div className="passenger-map-empty"><MapPin size={23}/><strong>No live bus location yet</strong><span>When a bus starts its shift and sends GPS, it will appear here.</span></div>}
          </div>
          <aside className="passenger-bus-list">
            <div className="passenger-bus-list-title"><span className="live-dot"/> LIVE STATUS <small>{buses.length} {buses.length === 1 ? 'bus' : 'buses'}</small></div>
            {buses.map(bus => <article className="passenger-bus-card" key={bus.bus_id}>
              <div className="passenger-bus-card-icon"><BusFront size={21}/></div>
              <div className="passenger-bus-card-body"><strong>{bus.bus_code}</strong><span>{publicDirection(bus)}</span><small><Clock3 size={12}/> Updated {formatTime(bus.recorded_at)}</small></div>
              <span className="bus-live-tag">Live</span>
            </article>)}
            {!buses.length && <p className="passenger-empty-list">No buses are reporting a live location at the moment.</p>}
            <div className="passenger-map-footnote"><Navigation size={15}/><span>Map updates automatically every 30 seconds. GPS availability depends on the bus crew's device and connection.</span></div>
          </aside>
        </div>
        <p className="passenger-last-updated">Last checked: {lastUpdated ? formatTime(lastUpdated) : '—'}</p>
      </section>

      <section className="passenger-complaint-section" id="complaints">
        <div className="passenger-complaint-intro"><span className="complaint-icon"><MessageSquareWarning size={24}/></span><p className="eyebrow">WE'RE LISTENING</p><h2>Tell us what happened.</h2><p>Report a concern about the bus, schedule, safety, or service. Your message goes to the admin team for review. You can submit anonymously.</p>
          <div className="complaint-promise"><CheckCircle2 size={17}/><span>Every submission is recorded for the admin team to review.</span></div>
        </div>
        <form className="passenger-complaint-form" onSubmit={submitComplaint}>
          <h3>Submit a complaint</h3>
          <p className="muted">Fields marked required must be completed.</p>
          {notice && <div className={'passenger-alert ' + notice.type} role="status">{notice.text}</div>}
          <div className="passenger-form-grid">
            <label>Your name <span>Optional</span><input maxLength={120} value={form.passenger_name} onChange={e => setForm({ ...form, passenger_name: e.target.value })} placeholder="You may leave this blank"/></label>
            <label>Contact information <span>Optional</span><input maxLength={180} value={form.contact_info} onChange={e => setForm({ ...form, contact_info: e.target.value })} placeholder="Email or phone (optional)"/></label>
            <label className="passenger-full-field">Concern type<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}><option>Other</option><option>Service</option><option>Driver conduct</option><option>Conductor conduct</option><option>Schedule</option><option>Bus condition</option><option>Safety</option></select></label>
            <label className="passenger-full-field">Complaint details <span>Required · 10–3000 characters</span><textarea required minLength={10} maxLength={3000} rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Please describe your concern, including when and where it happened…"/></label>
          </div>
          <button className="passenger-submit" disabled={sending}>{sending ? 'Sending complaint…' : 'Send complaint'} <Send size={16}/></button>
          <p className="passenger-privacy-note">Please avoid including passwords or sensitive personal information.</p>
        </form>
      </section>
    </main>
    <footer className="passenger-footer"><span>BusTrack Passenger</span><span>Live tracking · Passenger feedback</span><a href="/">Staff portal</a></footer>
  </div>;
}
