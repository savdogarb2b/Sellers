'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function AdminLocationPage() {
  const [location, setLocation] = useState({ lat: null, lng: null, radius: 200 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const LRef = useRef(null);

  // Mavjud lokatsiyani yuklash
  useEffect(() => {
    fetch('/api/location')
      .then(r => r.json())
      .then(data => {
        // 0 koordinatalar ham to'g'ri, shuning uchun !== null tekshiramiz
        if (data.locationLat !== null && data.locationLat !== undefined &&
            data.locationLng !== null && data.locationLng !== undefined) {
          setLocation({
            lat: data.locationLat,
            lng: data.locationLng,
            radius: data.locationRadius || 200,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Leaflet'ni dynamic yuklash (SSR muammosini oldini olish)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Allaqachon yuklangan bo'lsa, qayta yuklamaymiz
    if (window.L) {
      LRef.current = window.L;
      setMapReady(true);
      return;
    }

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
    script.onerror = () => {
      setError('Xarita yuklanmadi. Internet aloqasini tekshiring.');
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
      const newLat = Math.round(pos.lat * 1000000) / 1000000;
      const newLng = Math.round(pos.lng * 1000000) / 1000000;
      setLocation(prev => ({ ...prev, lat: newLat, lng: newLng }));
      if (circleRef.current) circleRef.current.setLatLng(pos);
    });
  }, []);

  // Xarita yaratish
  useEffect(() => {
    if (!mapReady || !mapRef.current || mapInstanceRef.current) return;

    const L = LRef.current;
    // lat !== null tekshiruvi — 0 ham to'g'ri koordinata
    const hasLocation = location.lat !== null && location.lng !== null;
    const center = hasLocation ? [location.lat, location.lng] : [41.2995, 69.2401];

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

    if (hasLocation) {
      updateMapMarker(location.lat, location.lng, location.radius);
    }
  }, [mapReady, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Marker yangilash (null tekshiruvi to'g'ri)
  useEffect(() => {
    const hasLocation = location.lat !== null && location.lng !== null;
    if (hasLocation && mapInstanceRef.current) {
      updateMapMarker(location.lat, location.lng, location.radius);
      mapInstanceRef.current.setView([location.lat, location.lng], mapInstanceRef.current.getZoom());
    }
  }, [location.lat, location.lng, location.radius, updateMapMarker]);

  const handleSave = async () => {
    // null tekshiruvi (0 ham to'g'ri)
    if (location.lat === null || location.lng === null) {
      setError('Avval xaritadan joylashuvni belgilang');
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch('/api/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          radius: location.radius,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);
      } else {
        setError(data.error || 'Saqlashda xatolik yuz berdi');
      }
    } catch (err) {
      console.error('Location save error:', err);
      setError('Server bilan bog\'lanishda xatolik. Qayta urinib ko\'ring.');
    } finally {
      setSaving(false);
    }
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Brauzeringiz GPS ni qo\'llab-quvvatlamaydi');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 1000000) / 1000000;
        const lng = Math.round(pos.coords.longitude * 1000000) / 1000000;
        setLocation(prev => ({ ...prev, lat, lng }));
        if (mapInstanceRef.current) mapInstanceRef.current.setView([lat, lng], 17);
        setError(null);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('Joylashuvni aniqlab bo\'lmadi. Brauzer GPS ruxsatini tekshiring.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const hasLocation = location.lat !== null && location.lng !== null;

  if (loading) return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <div className="loading-container"><div className="loading-spinner" /></div>
      </main>
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <div className="animate-in">

          <div style={{ marginBottom: '20px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.5px' }}>Ofis Joylashuvi</h1>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Xodimlar faqat shu hudud ichida davomat qayd qila oladi
            </p>
          </div>

          {/* Muvaffaqiyat xabari */}
          {saved && (
            <div style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '16px',
              color: '#10b981',
              fontWeight: 700,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Joylashuv muvaffaqiyatli saqlandi!
            </div>
          )}

          {/* Xato xabari */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '16px',
              color: '#ef4444',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
              <button
                onClick={() => setError(null)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}
              >×</button>
            </div>
          )}

          <div className="card glass-panel" style={{ padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Xaritada belgilang
              </div>
              <button onClick={handleMyLocation} style={{
                padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-elevated)',
                color: 'var(--primary-400)', fontWeight: 700, fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/>
                </svg>
                Mening joylashuvim
              </button>
            </div>

            <div ref={mapRef} style={{
              width: '100%',
              height: '400px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              background: 'var(--bg-elevated)',
            }} />

            <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
              💡 Xaritaga bosing yoki markerni suring. Binafsha doira — ruxsat etilgan hudud.
            </div>
          </div>

          <div className="card glass-panel" style={{ padding: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
              Sozlamalar
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>
                  Kenglik (Latitude)
                </label>
                <input
                  className="form-input"
                  type="number"
                  step="0.000001"
                  value={location.lat !== null ? location.lat : ''}
                  onChange={e => {
                    const val = e.target.value;
                    setLocation({ ...location, lat: val === '' ? null : parseFloat(val) });
                  }}
                  placeholder="41.299500"
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>
                  Uzunlik (Longitude)
                </label>
                <input
                  className="form-input"
                  type="number"
                  step="0.000001"
                  value={location.lng !== null ? location.lng : ''}
                  onChange={e => {
                    const val = e.target.value;
                    setLocation({ ...location, lng: val === '' ? null : parseFloat(val) });
                  }}
                  placeholder="69.240100"
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>
                  Radius (metr)
                </label>
                <input
                  className="form-input"
                  type="number"
                  min="50"
                  max="5000"
                  value={location.radius}
                  onChange={e => setLocation({ ...location, radius: parseInt(e.target.value) || 200 })}
                />
              </div>
            </div>

            {/* Joriy holat ko'rsatkichi */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px',
              padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: '10px',
            }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: hasLocation ? '#10b981' : '#ef4444',
                flexShrink: 0,
                boxShadow: hasLocation ? '0 0 6px rgba(16,185,129,0.5)' : '0 0 6px rgba(239,68,68,0.5)',
              }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                {hasLocation
                  ? `✅ Belgilangan: ${location.lat}, ${location.lng} — ${location.radius}m radius`
                  : '⚠️ Joylashuv belgilanmagan. Xaritadan tanlang yoki "Mening joylashuvim" bosing.'
                }
              </span>
            </div>

            <button
              id="save-location-btn"
              onClick={handleSave}
              disabled={saving || !hasLocation}
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                marginTop: '16px',
                padding: '14px',
                fontSize: '12px',
                opacity: (!hasLocation || saving) ? 0.5 : 1,
                cursor: (!hasLocation || saving) ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s',
              }}
            >
              {saving ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  SAQLANMOQDA...
                </span>
              ) : 'SAQLASH'}
            </button>

            {!hasLocation && (
              <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Tugma faollashishi uchun xaritadan joylashuvni belgilang
              </p>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
