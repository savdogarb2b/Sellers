'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function AdminLocationPage() {
  const [location, setLocation] = useState({ lat: null, lng: null, radius: 200 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const LRef = useRef(null);

  useEffect(() => {
    fetch('/api/location').then(r => r.json()).then(data => {
      if (data.locationLat && data.locationLng) {
        setLocation({ lat: data.locationLat, lng: data.locationLng, radius: data.locationRadius || 200 });
      }
      setLoading(false);
    });
  }, []);

  // Leaflet'ni dynamic yuklash (SSR muammosini oldini olish)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      LRef.current = window.L;
      setMapReady(true);
    };
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const updateMapMarker = useCallback((lat, lng, radius) => {
    const L = LRef.current;
    if (!L || !mapInstanceRef.current) return;

    if (markerRef.current) markerRef.current.remove();
    if (circleRef.current) circleRef.current.remove();

    markerRef.current = L.marker([lat, lng], {
      draggable: true,
      icon: L.divIcon({
        className: '',
        html: '<div style="width:24px;height:24px;background:#7c3aed;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    }).addTo(mapInstanceRef.current);

    circleRef.current = L.circle([lat, lng], {
      radius: radius,
      color: '#7c3aed',
      fillColor: '#7c3aed',
      fillOpacity: 0.12,
      weight: 2,
    }).addTo(mapInstanceRef.current);

    markerRef.current.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      setLocation(prev => ({ ...prev, lat: Math.round(pos.lat * 1000000) / 1000000, lng: Math.round(pos.lng * 1000000) / 1000000 }));
      if (circleRef.current) circleRef.current.setLatLng(pos);
    });
  }, []);

  // Xarita yaratish
  useEffect(() => {
    if (!mapReady || !mapRef.current || mapInstanceRef.current) return;

    const L = LRef.current;
    const center = location.lat && location.lng ? [location.lat, location.lng] : [41.2995, 69.2401]; // Toshkent default

    mapInstanceRef.current = L.map(mapRef.current, {
      center,
      zoom: 16,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    // Xaritaga bosganda marker qo'yish
    mapInstanceRef.current.on('click', (e) => {
      const lat = Math.round(e.latlng.lat * 1000000) / 1000000;
      const lng = Math.round(e.latlng.lng * 1000000) / 1000000;
      setLocation(prev => ({ ...prev, lat, lng }));
    });

    if (location.lat && location.lng) {
      updateMapMarker(location.lat, location.lng, location.radius);
    }
  }, [mapReady, loading]);

  // Marker yangilash
  useEffect(() => {
    if (location.lat && location.lng && mapInstanceRef.current) {
      updateMapMarker(location.lat, location.lng, location.radius);
      mapInstanceRef.current.setView([location.lat, location.lng], mapInstanceRef.current.getZoom());
    }
  }, [location.lat, location.lng, location.radius, updateMapMarker]);

  const handleSave = async () => {
    if (!location.lat || !location.lng) return;
    setSaving(true);
    const res = await fetch('/api/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(location),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) return alert('Brauzeringiz GPS ni qo\'llab-quvvatlamaydi');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 1000000) / 1000000;
        const lng = Math.round(pos.coords.longitude * 1000000) / 1000000;
        setLocation(prev => ({ ...prev, lat, lng }));
        if (mapInstanceRef.current) mapInstanceRef.current.setView([lat, lng], 17);
      },
      () => alert('Joylashuvni aniqlab bo\'lmadi. GPS ruxsatini tekshiring.'),
      { enableHighAccuracy: true }
    );
  };

  if (loading) return <div className="app-layout"><Sidebar /><Navbar /><main className="main-content"><div className="loading-container"><div className="loading-spinner" /></div></main></div>;

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <div className="animate-in">

          <div style={{ marginBottom: '20px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.5px' }}>Ofis Joylashuvi</h1>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Xodimlar faqat shu hudud ichida davomat qayd qila oladi</p>
          </div>

          {saved && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', color: '#10b981', fontWeight: 700, fontSize: '13px' }}>
              Joylashuv muvaffaqiyatli saqlandi!
            </div>
          )}

          <div className="card glass-panel" style={{ padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Xaritada belgilang</div>
              <button onClick={handleMyLocation} style={{
                padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-elevated)',
                color: 'var(--primary-400)', fontWeight: 700, fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg>
                Mening joylashuvim
              </button>
            </div>

            <div ref={mapRef} style={{ width: '100%', height: '400px', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }} />

            <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
              Xaritaga bosing yoki markerni suring. Binafsha doira — ruxsat etilgan hudud.
            </div>
          </div>

          <div className="card glass-panel" style={{ padding: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Sozlamalar</div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Kenglik (Latitude)</label>
                <input className="form-input" type="number" step="0.000001" value={location.lat || ''} onChange={e => setLocation({ ...location, lat: parseFloat(e.target.value) || null })} placeholder="41.299500" />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Uzunlik (Longitude)</label>
                <input className="form-input" type="number" step="0.000001" value={location.lng || ''} onChange={e => setLocation({ ...location, lng: parseFloat(e.target.value) || null })} placeholder="69.240100" />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Radius (metr)</label>
                <input className="form-input" type="number" min="50" max="5000" value={location.radius} onChange={e => setLocation({ ...location, radius: parseInt(e.target.value) || 200 })} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: '10px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: location.lat && location.lng ? '#10b981' : '#ef4444', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                {location.lat && location.lng
                  ? `Belgilangan: ${location.lat}, ${location.lng} — ${location.radius}m radius`
                  : 'Joylashuv belgilanmagan. Xaritadan tanlang yoki "Mening joylashuvim" bosing.'
                }
              </span>
            </div>

            <button onClick={handleSave} disabled={saving || !location.lat || !location.lng} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px', padding: '14px', fontSize: '12px' }}>
              {saving ? 'SAQLANMOQDA...' : 'SAQLASH'}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
