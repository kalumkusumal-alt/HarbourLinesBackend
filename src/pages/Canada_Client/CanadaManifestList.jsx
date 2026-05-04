// frontend/src/pages/Canada_Client/CanadaManifestList.jsx
import { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/layout/Sidebar.jsx';
import Navbar from '../../components/layout/Navbar.jsx';
import toast from 'react-hot-toast';
import { generateCanadaExcel } from '../../helpers/canadaExcelUtils.js';

const API_BASE = 'https://harbourb-production.up.railway.app/api/canada';

const CanadaManifestList = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [manifests, setManifests] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedManifestForDetails, setSelectedManifestForDetails] = useState(null);
    const [editingHBL, setEditingHBL] = useState(null);
    const [editingRefIdx, setEditingRefIdx] = useState(null);
    const [selectedManifestIdForEdit, setSelectedManifestIdForEdit] = useState(null);
    const [saveLoading, setSaveLoading] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [etdFilter, setEtdFilter] = useState('');
    const headerDateRef = useRef(null);
    const editorDateRef = useRef(null);

    // Dynamic Charge Labels (Synced with HL-Manifest)
    const [chargeLabels, setChargeLabels] = useState(() => {
        const saved = localStorage.getItem('canadaChargeLabels');
        return saved ? JSON.parse(saved) : ['Package Charges', 'Service & Maintain', 'Handling Charges', 'Other Charges'];
    });

    useEffect(() => {
        localStorage.setItem('canadaChargeLabels', JSON.stringify(chargeLabels));
    }, [chargeLabels]);


    useEffect(() => {
        fetchManifests();
    }, []);

    const fetchManifests = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/getAllManifests`);
            const data = await res.json();
            if (data.success) {
                setManifests(data.data);
            } else {
                toast.error('Failed to load manifests');
            }
        } catch (err) {
            console.error(err);
            toast.error('Network error');
        } finally {
            setLoading(false);
        }
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const filteredManifests = manifests.filter(m => {
        const q = searchQuery.toLowerCase();
        const dateStr = new Date(m.createdAt).toLocaleDateString().toLowerCase();

        // Text Match Logic
        const masterBLMatch = m.hbls.some(h => (h.jobNum || '').toLowerCase().includes(q));
        const bookingMatch = m.hbls.some(h => (h.bookingNum || '').toLowerCase().includes(q));
        const vesselMatch = m.hbls.some(h => (h.vessel || '').toLowerCase().includes(q));
        const voyageMatch = m.hbls.some(h => (h.voyage || '').toLowerCase().includes(q));
        const hblMatch = m.hbls.some(h => h.references.some(ref => (ref.hblNumber || '').toLowerCase().includes(q)));
        const refMatch = m.hbls.some(h => h.references.some(ref => (ref.refNum || '').toLowerCase().includes(q)));
        const matchesText = dateStr.includes(q) || masterBLMatch || bookingMatch || vesselMatch || voyageMatch || hblMatch || refMatch;

        // ETD Filter Logic
        let matchesEtd = true;
        if (etdFilter) {
            matchesEtd = m.hbls.some(h => h.etd === etdFilter);
        }

        return matchesText && matchesEtd;
    });

    const startEditingRef = (manifestId, hbl, rIdx) => {
        setSelectedManifestIdForEdit(manifestId);
        setEditingRefIdx(rIdx);

        // Deep clone HBL
        const hblClone = JSON.parse(JSON.stringify(hbl));

        // Ensure the specific reference has the correct dynamic charges structure
        const ref = hblClone.references[rIdx];
        if (!ref.charges || !Array.isArray(ref.charges)) {
            ref.charges = chargeLabels.map(label => ({
                label,
                amount: ref[label.charAt(0).toLowerCase() + label.slice(1).replace(/\s+/g, '')] || 0
            }));
        } else {
            // Ensure all current labels exist in the ref.charges
            chargeLabels.forEach(label => {
                if (!ref.charges.some(c => c.label === label)) {
                    ref.charges.push({ label, amount: 0 });
                }
            });
        }

        setEditingHBL(hblClone);
        setSelectedManifestForDetails(null);
        setTimeout(() => {
            const section = document.getElementById('edit-section');
            if (section) section.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const addChargeField = () => {
        if (chargeLabels.length >= 10) {
            toast.error('Maximum 10 fields allowed');
            return;
        }
        if (!newCategoryName.trim()) {
            toast.error('Please enter a category name');
            return;
        }
        if (chargeLabels.includes(newCategoryName.trim())) {
            toast.error('Category exists');
            return;
        }
        const updatedLabels = [...chargeLabels, newCategoryName.trim()];
        setChargeLabels(updatedLabels);
        setNewCategoryName('');

        // Update current editing HBL references
        if (editingHBL) {
            setEditingHBL(prev => ({
                ...prev,
                references: prev.references.map(ref => ({
                    ...ref,
                    charges: [...(ref.charges || []), { label: newCategoryName.trim(), amount: 0 }]
                }))
            }));
        }
        toast.success('Category added');
    };

    const removeChargeField = (labelToRemove) => {
        if (chargeLabels.length <= 1) {
            toast.error('At least one charge category is required');
            return;
        }
        if (window.confirm(`Are you sure you want to remove "${labelToRemove}"?`)) {
            const updatedLabels = chargeLabels.filter(l => l !== labelToRemove);
            setChargeLabels(updatedLabels);

            if (editingHBL) {
                setEditingHBL(prev => ({
                    ...prev,
                    references: prev.references.map(ref => ({
                        ...ref,
                        charges: (ref.charges || []).filter(c => c.label !== labelToRemove)
                    }))
                }));
            }
            toast.success('Category removed');
        }
    };

    const renameChargeField = (oldLabel, newLabel) => {
        if (!newLabel || !newLabel.trim() || newLabel === oldLabel) return;

        setChargeLabels(chargeLabels.map(l => l === oldLabel ? newLabel.trim() : l));

        if (editingHBL) {
            setEditingHBL(prev => ({
                ...prev,
                references: prev.references.map(ref => ({
                    ...ref,
                    charges: (ref.charges || []).map(c => c.label === oldLabel ? { ...c, label: newLabel.trim() } : c)
                }))
            }));
        }
    };

    const handleHBLFieldChange = (field, value) => {
        setEditingHBL(prev => ({ ...prev, [field]: value }));
    };

    const handleRefFieldChange = (refIdx, field, value) => {
        const updatedRefs = [...editingHBL.references];
        if (field === 'refNum') {
            updatedRefs[refIdx] = { ...updatedRefs[refIdx], [field]: value, hblNumber: value };
        } else {
            updatedRefs[refIdx] = { ...updatedRefs[refIdx], [field]: value };
        }
        setEditingHBL(prev => ({ ...prev, references: updatedRefs }));
    };


    const handleChargeValueChange = (refIdx, label, value) => {
        const updatedRefs = [...editingHBL.references];
        const ref = { ...updatedRefs[refIdx] };
        ref.charges = (ref.charges || []).map(c => c.label === label ? { ...c, amount: parseFloat(value) || 0 } : c);
        updatedRefs[refIdx] = ref;
        setEditingHBL(prev => ({ ...prev, references: updatedRefs }));
    };

    const saveUpdatedHBL = async () => {
        if (!selectedManifestIdForEdit || !editingHBL) return;

        setSaveLoading(true);
        try {
            const res = await fetch(`${API_BASE}/updateHBL/${selectedManifestIdForEdit}/${editingHBL._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingHBL)
            });

            const data = await res.json();
            if (data.success) {
                toast.success('HBL Updated Successfully!');
                setManifests(prev => prev.map(m => m._id === data.data._id ? data.data : m));
                setEditingHBL(null);
                setSelectedManifestIdForEdit(null);
            } else {
                toast.error(data.message || 'Update failed');
            }
        } catch (err) {
            console.error(err);
            toast.error('Network error while saving');
        } finally {
            setSaveLoading(false);
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

            <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                <Navbar toggleSidebar={toggleSidebar} />

                <div className="page-content" style={{ background: 'var(--bg-primary)', minHeight: 'calc(100vh - 70px)' }}>
                    <div className="page-wrapper" style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>

                        <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '2.5rem', borderRadius: '32px', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
                            <div>
                                <h1 style={{ fontSize: '2.6rem', fontWeight: '900', background: 'linear-gradient(135deg, #1e40af, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, letterSpacing: '-1px' }}>
                                    Booking Records
                                </h1>
                                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1.1rem', fontWeight: '500', opacity: 0.7 }}>Track and manage your manifests</p>
                            </div>

                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                <div style={{ position: 'relative', width: '350px' }}>
                                    <span className="material-symbols-rounded" style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4, fontSize: '1.5rem' }}>search</span>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Vessel, HBL, Master B/L, Booking..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{ borderRadius: '18px', padding: '1.1rem 1.1rem 1.1rem 55px', background: 'var(--bg-primary)', border: '1.5px solid var(--border-color)', width: '100%', fontSize: '1rem', transition: 'all 0.3s' }}
                                    />
                                </div>

                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '15px', background: 'var(--bg-primary)', padding: '0 20px', borderRadius: '18px', border: '1.5px solid var(--border-color)', height: '62px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                    <div
                                        onClick={() => headerDateRef.current?.showPicker?.()}
                                        style={{ background: '#3b82f620', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                    >
                                        <span className="material-symbols-rounded" style={{ color: '#60a5fa', fontSize: '1.5rem' }}>calendar_today</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <label style={{ fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.8px', opacity: 0.5 }}>Filter ETD Departure</label>
                                        <input
                                            ref={headerDateRef}
                                            type="date"
                                            value={etdFilter}
                                            onChange={(e) => setEtdFilter(e.target.value)}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '0', outline: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '1.05rem' }}
                                        />
                                    </div>
                                    {etdFilter && (
                                        <button
                                            onClick={() => setEtdFilter('')}
                                            style={{ background: '#ef444420', border: 'none', color: '#ef4444', cursor: 'pointer', width: '34px', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <span className="material-symbols-rounded" style={{ fontSize: '1.4rem' }}>close</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </header>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '10rem 0' }}>
                                <div className="animate-spin" style={{ display: 'inline-block', width: '3rem', height: '3rem', border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                                <p style={{ marginTop: '1.5rem', fontWeight: '600', opacity: 0.6 }}>Synchronizing records...</p>
                            </div>
                        ) : filteredManifests.length === 0 ? (
                            <div className="card" style={{ padding: '8rem', textAlign: 'center', borderRadius: '32px', border: '2px dashed var(--border-color)', background: 'transparent' }}>
                                <span className="material-symbols-rounded" style={{ fontSize: '5rem', opacity: 0.1, marginBottom: '1.5rem' }}>folder_off</span>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>No matches found</h3>
                                <p style={{ opacity: 0.5 }}>Try adjusting your search filters or dates.</p>
                            </div>
                        ) : (
                            <div className="card" style={{ padding: '0', borderRadius: '32px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
                                <table className="table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                                    <thead style={{ background: 'var(--bg-primary)' }}>
                                        <tr>
                                            <th style={{ padding: '1.8rem 2rem', textAlign: 'left', borderBottom: '2px solid var(--border-color)', fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1px' }}>Manifest Entry</th>
                                            <th style={{ padding: '1.8rem 2rem', textAlign: 'left', borderBottom: '2px solid var(--border-color)', fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1px' }}>Vessel Logistics</th>
                                            <th style={{ padding: '1.8rem 2rem', textAlign: 'left', borderBottom: '2px solid var(--border-color)', fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1px' }}>Payload</th>
                                            <th style={{ padding: '1.8rem 2rem', textAlign: 'center', borderBottom: '2px solid var(--border-color)', fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1px' }}>Operations</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredManifests.map((m) => (
                                            <tr key={m._id} style={{ transition: 'all 0.2s ease', cursor: 'default' }}>
                                                <td style={{ padding: '1.8rem 2rem', borderBottom: '1px solid var(--border-color)' }}>
                                                    <div style={{ fontWeight: '900', fontSize: '1.15rem', color: 'var(--text-primary)' }}>{new Date(m.createdAt).toLocaleDateString(undefined, { dateStyle: 'full' })}</div>
                                                    <div style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '5px', letterSpacing: '1px', fontFamily: 'monospace' }}>MOD_{m._id.slice(-10).toUpperCase()}</div>
                                                </td>
                                                <td style={{ padding: '1.8rem 2rem', borderBottom: '1px solid var(--border-color)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#3b82f6', fontWeight: '900', fontSize: '1.1rem' }}>
                                                        <div style={{ background: '#3b82f615', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                                                            <span className="material-symbols-rounded" style={{ fontSize: '1.3rem' }}>anchor</span>
                                                        </div>
                                                        {Array.from(new Set(m.hbls.map(h => h.vessel))).filter(Boolean).join(', ') || 'Auto-Vessel'}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: '700', padding: '4px 10px', background: 'var(--bg-primary)', borderRadius: '8px', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>event</span>
                                                            {Array.from(new Set(m.hbls.map(h => h.etd))).filter(Boolean).map(date => new Date(date).toLocaleDateString(undefined, { dateStyle: 'medium' })).join(', ') || 'N/A'}
                                                        </span>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: '700', padding: '4px 10px', background: 'var(--bg-primary)', borderRadius: '8px', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>route</span>
                                                            {m.hbls[0]?.voyage || 'VOY-00'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1.8rem 2rem', borderBottom: '1px solid var(--border-color)' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <div style={{ fontWeight: '800', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                                                            {m.totalWeight.toFixed(2)} KG <span style={{ opacity: 0.4, fontWeight: '500' }}>Gross</span>
                                                        </div>
                                                        <div style={{ fontWeight: '800', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1' }}></div>
                                                            {m.totalCBM.toFixed(3)} CBM <span style={{ opacity: 0.4, fontWeight: '500' }}>Volume</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1.8rem 2rem', borderBottom: '1px solid var(--border-color)', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => setSelectedManifestForDetails(m)}
                                                        className="btn-primary"
                                                        style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', padding: '0.8rem 2rem', borderRadius: '14px', fontSize: '0.9rem', fontWeight: '900', display: 'inline-flex', alignItems: 'center', gap: '10px', border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px rgba(59, 130, 246, 0.25)', transition: 'all 0.3s' }}
                                                    >
                                                        <span className="material-symbols-rounded" style={{ fontSize: '1.3rem' }}>dashboard_customize</span> Manage Booking
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}


                        {selectedManifestForDetails && (
                            <div
                                onClick={() => setSelectedManifestForDetails(null)}
                                style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'flex-end', zIndex: 1000, backdropFilter: 'blur(12px)', cursor: 'pointer', transition: 'all 0.4s ease' }}
                            >
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ width: '600px', height: '100%', background: 'var(--bg-secondary)', padding: '3.5rem', boxShadow: '-25px 0 80px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', cursor: 'default', borderLeft: '1.5px solid var(--border-color)' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '3.5rem' }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: '900' }}>Manifest Payload</h3>
                                            <p style={{ margin: '0.5rem 0 0 0', opacity: 0.5, fontWeight: '600', fontSize: '1rem' }}>Manage individual House Bill of Lading records</p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedManifestForDetails(null)}
                                            style={{ border: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.1)', transition: 'all 0.2s' }}
                                        >
                                            <span className="material-symbols-rounded">close</span>
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => generateCanadaExcel(selectedManifestForDetails, toast)}
                                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', padding: '1.4rem', borderRadius: '20px', cursor: 'pointer', fontWeight: '900', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', boxShadow: '0 12px 30px rgba(16, 185, 129, 0.35)', marginBottom: '3rem', transition: 'all 0.3s' }}
                                    >
                                        <span className="material-symbols-rounded" style={{ fontSize: '1.6rem' }}>table_view</span> Export Manifest to Excel
                                    </button>

                                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingRight: '15px' }}>
                                        {selectedManifestForDetails.hbls.map((h) => (
                                            h.references.map((ref, rIdx) => (
                                                <div key={`${h._id}-${rIdx}`} style={{ padding: '1.8rem', borderRadius: '24px', background: 'var(--bg-primary)', border: '1.5px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 5px 25px rgba(0,0,0,0.03)', transition: 'all 0.3s' }} className="hbl-entry-card">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                                                        <div style={{ background: '#3b82f615', padding: '12px', borderRadius: '14px', display: 'flex' }}>
                                                            <span className="material-symbols-rounded" style={{ color: '#3b82f6', fontSize: '1.5rem' }}>sticky_note_2</span>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '900', color: 'var(--text-primary)', fontSize: '1.15rem', marginBottom: '4px' }}>{ref.hblNumber || ref.refNum}</div>
                                                            <div style={{ fontSize: '0.85rem', opacity: 0.6, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{ color: '#6366f1' }}>{ref.shipperName || 'N/A'}</span>
                                                                <span className="material-symbols-rounded" style={{ fontSize: '14px', opacity: 0.4 }}>arrow_forward</span>
                                                                <span style={{ color: '#10b981' }}>{ref.consigneeName || 'N/A'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => startEditingRef(selectedManifestForDetails._id, h, rIdx)}
                                                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1.5px solid var(--border-color)', padding: '12px 20px', borderRadius: '15px', cursor: 'pointer', fontWeight: '900', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
                                                    >
                                                        <span className="material-symbols-rounded" style={{ fontSize: '1.2rem' }}>edit_note</span> Edit
                                                    </button>
                                                </div>
                                            ))
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {editingHBL && (
                            <div id="edit-section" className="card" style={{ marginTop: '5rem', padding: '4rem', borderRadius: '48px', background: 'var(--bg-secondary)', border: '2.5px solid #3b82f6', boxShadow: '0 40px 120px rgba(59, 130, 246, 0.25)', position: 'relative' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                                        <div style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', padding: '24px', borderRadius: '24px', boxShadow: '0 15px 35px rgba(59, 130, 246, 0.35)', display: 'flex' }}>
                                            <span className="material-symbols-rounded" style={{ color: 'white', fontSize: '3rem' }}>draw_abstract</span>
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                                                <span style={{ background: '#3b82f615', color: '#3b82f6', fontSize: '0.75rem', fontWeight: '900', padding: '5px 12px', borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Operational Editor</span>
                                                <span style={{ fontSize: '1rem', opacity: 0.2 }}>|</span>
                                                <span style={{ fontSize: '0.95rem', opacity: 0.5, fontWeight: '700' }}>{editingHBL.references[editingRefIdx].refNum}</span>
                                            </div>
                                            <h3 style={{ margin: 0, fontSize: '2.8rem', fontWeight: '950', letterSpacing: '-1.5px' }}>Updating HBL: <span style={{ color: '#3b82f6' }}>{editingHBL.references[editingRefIdx].hblNumber || 'No HBL'}</span></h3>
                                        </div>
                                    </div>
                                    <button onClick={() => setEditingHBL(null)} style={{ background: 'var(--bg-primary)', color: '#ef4444', border: '2px solid #ef444433', padding: '14px 28px', borderRadius: '18px', cursor: 'pointer', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.3s' }}>
                                        <span className="material-symbols-rounded" style={{ fontSize: '1.4rem' }}>cancel</span> Discard Editor
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '4rem', marginBottom: '4.5rem' }}>
                                    {/* Section 1: Vessel Details */}
                                    <div style={{ padding: '3rem', background: 'var(--bg-primary)', borderRadius: '35px', border: '1.5px solid var(--border-color)', boxShadow: '0 15px 45px rgba(0,0,0,0.03)' }}>
                                        <h4 style={{ marginTop: 0, color: '#6366f1', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '3rem', fontSize: '1.3rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                                            <span className="material-symbols-rounded" style={{ background: '#6366f115', padding: '10px', borderRadius: '12px' }}>sailing</span> Vessel & Arrival Matrix
                                        </h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
                                            <div className="input-group">
                                                <label style={{ fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase', opacity: 0.6, marginBottom: '12px', display: 'block', letterSpacing: '0.5px' }}>Vessel Name</label>
                                                <input className="input" value={editingHBL.vessel || ''} onChange={(e) => handleHBLFieldChange('vessel', e.target.value)} style={{ borderRadius: '16px', padding: '1.2rem', background: 'var(--bg-secondary)', fontWeight: '800', fontSize: '1.05rem', border: '1.5px solid transparent' }} />
                                            </div>
                                            <div className="input-group">
                                                <label style={{ fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase', opacity: 0.6, marginBottom: '12px', display: 'block', letterSpacing: '0.5px' }}>Voyage Code</label>
                                                <input className="input" value={editingHBL.voyage || ''} onChange={(e) => handleHBLFieldChange('voyage', e.target.value)} style={{ borderRadius: '16px', padding: '1.2rem', background: 'var(--bg-secondary)', fontWeight: '800', fontSize: '1.05rem', border: '1.5px solid transparent' }} />
                                            </div>
                                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                                <label style={{ fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase', opacity: 0.6, marginBottom: '12px', display: 'block', letterSpacing: '0.5px' }}>ETD Scheduled Departure</label>
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        ref={editorDateRef}
                                                        type="date"
                                                        className="input"
                                                        value={editingHBL.etd || ''}
                                                        onChange={(e) => handleHBLFieldChange('etd', e.target.value)}
                                                        style={{ borderRadius: '16px', padding: '1.2rem 1.2rem 1.2rem 60px', background: 'var(--bg-secondary)', fontWeight: '800', fontSize: '1.1rem', border: '1.5px solid var(--border-color)', width: '100%' }}
                                                    />
                                                    <div
                                                        onClick={() => editorDateRef.current?.showPicker?.()}
                                                        style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', background: '#3b82f620', padding: '8px', borderRadius: '10px', display: 'flex', cursor: 'pointer' }}
                                                    >
                                                        <span className="material-symbols-rounded" style={{ color: '#3b82f6', fontSize: '1.8rem' }}>calendar_month</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="input-group">
                                                <label style={{ fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase', opacity: 0.6, marginBottom: '12px', display: 'block', letterSpacing: '0.5px' }}>Port of Loading</label>
                                                <input className="input" value={editingHBL.pol || ''} onChange={(e) => handleHBLFieldChange('pol', e.target.value)} style={{ borderRadius: '16px', padding: '1.2rem', background: 'var(--bg-secondary)', fontWeight: '800', fontSize: '1.05rem', border: '1.5px solid transparent' }} />
                                            </div>
                                            <div className="input-group">
                                                <label style={{ fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase', opacity: 0.6, marginBottom: '12px', display: 'block', letterSpacing: '0.5px' }}>Port of Discharge</label>
                                                <input className="input" value={editingHBL.pod || ''} onChange={(e) => handleHBLFieldChange('pod', e.target.value)} style={{ borderRadius: '16px', padding: '1.2rem', background: 'var(--bg-secondary)', fontWeight: '800', fontSize: '1.05rem', border: '1.5px solid transparent' }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visual Indicators */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                                        <div style={{ flex: 1, padding: '3rem', background: 'linear-gradient(135deg, #3b82f60a, #6366f10a)', borderRadius: '35px', border: '1.5px dashed #3b82f640', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                                            <span className="material-symbols-rounded" style={{ fontSize: '4.5rem', color: '#3b82f6', marginBottom: '1.5rem', opacity: 0.8 }}>verified_user</span>
                                            <h5 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900', color: '#1e40af' }}>Secure Data Entry</h5>
                                            <p style={{ fontSize: '0.95rem', opacity: 0.6, maxWidth: '280px', margin: '1rem 0 0 0', fontWeight: '500', lineHeight: '1.6' }}>All modifications are audited. Ensure all party details match the master shipment documentation.</p>
                                        </div>
                                        <div style={{ padding: '2.5rem', background: 'var(--bg-primary)', borderRadius: '30px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                                            <div style={{ background: '#10b98115', padding: '16px', borderRadius: '18px', display: 'flex' }}>
                                                <span className="material-symbols-rounded" style={{ color: '#10b981', fontSize: '1.8rem' }}>payments</span>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase', opacity: 0.5, letterSpacing: '0.5px' }}>Revenue Center</div>
                                                <div style={{ fontWeight: '900', fontSize: '1.2rem', color: '#059669' }}>Financials Unlocked</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ background: 'var(--bg-primary)', padding: '4rem', borderRadius: '40px', border: '1.5px solid var(--border-color)', boxShadow: '0 20px 60px rgba(0,0,0,0.04)' }}>
                                    <h4 style={{ fontSize: '1.7rem', fontWeight: '950', marginBottom: '4rem', display: 'flex', alignItems: 'center', gap: '20px', letterSpacing: '-0.5px' }}>
                                        <span className="material-symbols-rounded" style={{ color: '#10b981', background: '#10b98115', padding: '12px', borderRadius: '15px', fontSize: '2rem' }}>inventory_2</span> Shipment Specifications & Parties
                                    </h4>

                                    {(() => {
                                        const ref = editingHBL.references[editingRefIdx];
                                        const rIdx = editingRefIdx;
                                        return (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5rem' }}>
                                                {/* Party Logic */}
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3rem' }}>
                                                    <div className="input-group">
                                                        <label style={{ fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase', opacity: 0.6, marginBottom: '12px', display: 'block' }}>Shipper Identity</label>
                                                        <input className="input" value={ref.shipperName || ''} onChange={(e) => handleRefFieldChange(rIdx, 'shipperName', e.target.value)} style={{ borderRadius: '16px', padding: '1.2rem' }} />
                                                    </div>
                                                    <div className="input-group">
                                                        <label style={{ fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase', opacity: 0.6, marginBottom: '12px', display: 'block' }}>Agent Ref #</label>
                                                        <input className="input" value={ref.refNum || ''} onChange={(e) => handleRefFieldChange(rIdx, 'refNum', e.target.value)} style={{ borderRadius: '16px', padding: '1.2rem' }} />
                                                    </div>
                                                    <div className="input-group">
                                                        <label style={{ fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase', opacity: 0.6, marginBottom: '12px', display: 'block' }}>H/BL Identifier</label>
                                                        <input className="input" value={ref.hblNumber || ''} onChange={(e) => handleRefFieldChange(rIdx, 'hblNumber', e.target.value)} style={{ borderRadius: '16px', padding: '1.2rem', border: '2px solid #3b82f650', fontWeight: '900', color: '#1e40af' }} />
                                                    </div>
                                                    <div className="input-group" style={{ gridColumn: 'span 3' }}>
                                                        <label style={{ fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase', opacity: 0.6, marginBottom: '12px', display: 'block' }}>Shipper Complete Address</label>
                                                        <input className="input" value={ref.shipperAddress || ''} onChange={(e) => handleRefFieldChange(rIdx, 'shipperAddress', e.target.value)} style={{ borderRadius: '16px', padding: '1.2rem' }} />
                                                    </div>

                                                    <div style={{ gridColumn: 'span 3', height: '2px', background: 'var(--bg-secondary)', margin: '1rem 0' }}></div>

                                                    <div className="input-group">
                                                        <label style={{ fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase', opacity: 0.6, marginBottom: '12px', display: 'block' }}>Consignee Entity</label>
                                                        <input className="input" value={ref.consigneeName || ''} onChange={(e) => handleRefFieldChange(rIdx, 'consigneeName', e.target.value)} style={{ borderRadius: '16px', padding: '1.2rem' }} />
                                                    </div>
                                                    <div className="input-group">
                                                        <label style={{ fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase', opacity: 0.6, marginBottom: '12px', display: 'block' }}>Tax / NIC ID</label>
                                                        <input className="input" value={ref.consigneeNIC || ''} onChange={(e) => handleRefFieldChange(rIdx, 'consigneeNIC', e.target.value)} style={{ borderRadius: '16px', padding: '1.2rem' }} />
                                                    </div>
                                                    <div className="input-group">
                                                        <label style={{ fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase', opacity: 0.6, marginBottom: '12px', display: 'block' }}>Verified Phone</label>
                                                        <input className="input" value={ref.consigneePhone || ''} onChange={(e) => handleRefFieldChange(rIdx, 'consigneePhone', e.target.value)} style={{ borderRadius: '16px', padding: '1.2rem' }} />
                                                    </div>
                                                    <div className="input-group" style={{ gridColumn: 'span 3' }}>
                                                        <label style={{ fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase', opacity: 0.6, marginBottom: '12px', display: 'block' }}>Final Delivery Destination</label>
                                                        <input className="input" value={ref.consigneeAddress || ''} onChange={(e) => handleRefFieldChange(rIdx, 'consigneeAddress', e.target.value)} style={{ borderRadius: '16px', padding: '1.2rem' }} />
                                                    </div>
                                                </div>

                                                {/* Physical Attributes */}
                                                <div style={{ background: 'var(--bg-secondary)', padding: '3.5rem', borderRadius: '35px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2.5rem', border: '1.5px solid var(--border-color)' }}>
                                                    <div className="input-group">
                                                        <label style={{ fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase', opacity: 0.6, marginBottom: '12px', display: 'block' }}>Package Class</label>
                                                        <select className="input" value={ref.packageType || 'CTN'} onChange={(e) => handleRefFieldChange(rIdx, 'packageType', e.target.value)} style={{ borderRadius: '14px', padding: '1rem', background: 'var(--bg-primary)', fontWeight: '800' }}>
                                                            <option value="CTN">Cartons (CTN)</option>
                                                            <option value="PLT">Pallets (PLT)</option>
                                                            <option value="BX">Box (BX)</option>
                                                            <option value="PKG">Package (PKG)</option>
                                                            <option value="carpet">Textile/Carpet</option>
                                                            <option value="walker">Walker/Special</option>
                                                        </select>
                                                    </div>
                                                    <div className="input-group">
                                                        <label style={{ fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase', opacity: 0.6, marginBottom: '12px', display: 'block' }}>Net Weight</label>
                                                        <div style={{ position: 'relative' }}>
                                                            <input type="number" className="input" value={ref.weight || 0} onChange={(e) => handleRefFieldChange(rIdx, 'weight', e.target.value)} style={{ borderRadius: '14px', padding: '1rem', background: 'var(--bg-primary)', paddingRight: '50px', fontWeight: '900' }} />
                                                            <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4, fontWeight: '900', fontSize: '0.75rem' }}>KG</span>
                                                        </div>
                                                    </div>
                                                    <div className="input-group">
                                                        <label style={{ fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase', opacity: 0.6, marginBottom: '12px', display: 'block' }}>Total Volume</label>
                                                        <div style={{ position: 'relative' }}>
                                                            <input type="number" step="0.001" className="input" value={ref.cbm || 0} onChange={(e) => handleRefFieldChange(rIdx, 'cbm', e.target.value)} style={{ borderRadius: '14px', padding: '1rem', background: 'var(--bg-primary)', paddingRight: '50px', fontWeight: '900' }} />
                                                            <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4, fontWeight: '900', fontSize: '0.75rem' }}>CBM</span>
                                                        </div>
                                                    </div>
                                                    <div className="input-group">
                                                        <label style={{ fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase', opacity: 0.6, marginBottom: '12px', display: 'block' }}>Item Count</label>
                                                        <div style={{ position: 'relative' }}>
                                                            <input type="number" className="input" value={ref.noOfPackages || 0} onChange={(e) => handleRefFieldChange(rIdx, 'noOfPackages', e.target.value)} style={{ borderRadius: '14px', padding: '1rem', background: 'var(--bg-primary)', paddingRight: '50px', fontWeight: '900' }} />
                                                            <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4, fontWeight: '900', fontSize: '0.75rem' }}>PCS</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Financial Matrix */}
                                                <div style={{ padding: '3.5rem', background: 'var(--bg-primary)', borderRadius: '35px', border: '2px solid #10b98125', boxShadow: '0 15px 40px rgba(16, 185, 129, 0.04)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3.5rem' }}>
                                                        <h6 style={{ margin: 0, color: '#059669', fontWeight: '950', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                            <span className="material-symbols-rounded" style={{ background: '#10b98115', padding: '10px', borderRadius: '12px', fontSize: '1.8rem' }}>account_balance_wallet</span> Invoice Line Items
                                                        </h6>
                                                        <button
                                                            onClick={() => setShowCategoryManager(true)}
                                                            style={{ background: 'white', color: '#10b981', border: '1.5px solid #10b981', padding: '10px 24px', borderRadius: '16px', cursor: 'pointer', fontWeight: '900', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)' }}
                                                        >
                                                            <span className="material-symbols-rounded" style={{ fontSize: '1.4rem' }}>settings_accessibility</span> Manage Types
                                                        </button>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2.5rem' }}>
                                                        {chargeLabels.map((label, lIdx) => (
                                                            <div key={lIdx} className="input-group">
                                                                <label style={{ fontSize: '0.75rem', fontWeight: '950', color: '#059669', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textTransform: 'uppercase', letterSpacing: '0.8px', opacity: 0.8 }}>
                                                                    <span>{label}</span>
                                                                </label>
                                                                <div style={{ position: 'relative' }}>
                                                                    <input
                                                                        type="number"
                                                                        className="input"
                                                                        value={ref.charges?.find(c => c.label === label)?.amount || 0}
                                                                        onChange={(e) => handleChargeValueChange(rIdx, label, e.target.value)}
                                                                        style={{ borderRadius: '14px', background: 'var(--bg-secondary)', borderColor: '#10b98130', paddingLeft: '45px', fontWeight: '900', fontSize: '1.1rem' }}
                                                                    />
                                                                    <span style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4, fontWeight: '950', fontSize: '0.9rem', color: '#059669' }}>$</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                <div style={{ marginTop: '6rem', display: 'flex', justifyContent: 'flex-end', gap: '2rem', borderTop: '2.5px solid var(--border-color)', paddingTop: '4rem' }}>
                                    <button onClick={() => setEditingHBL(null)} style={{ padding: '1.5rem 3.5rem', borderRadius: '22px', border: '2px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontWeight: '900', color: 'var(--text-secondary)', fontSize: '1.1rem', transition: 'all 0.2s' }}>Discard Updates</button>
                                    <button
                                        onClick={saveUpdatedHBL}
                                        disabled={saveLoading}
                                        style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', border: 'none', padding: '1.5rem 6.5rem', borderRadius: '22px', fontWeight: '950', fontSize: '1.2rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '20px', boxShadow: '0 20px 45px rgba(59, 130, 246, 0.45)', transition: 'all 0.3s' }}
                                    >
                                        {saveLoading ? <div className="animate-spin" style={{ width: '1.8rem', height: '1.8rem', border: '3px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}></div> : <span className="material-symbols-rounded" style={{ fontSize: '1.8rem' }}>lock_reset</span>}
                                        {saveLoading ? 'Processing...' : 'Securely Save Information'}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div >

            {/* CATEGORY MANAGER MODAL */}
            {showCategoryManager && (
                <div
                    onClick={() => setShowCategoryManager(false)}
                    style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(15px)', transition: 'all 0.3s' }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: '750px', background: 'var(--bg-secondary)', borderRadius: '40px', padding: '3.5rem', boxShadow: '0 30px 80px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ background: '#3b82f615', padding: '12px', borderRadius: '15px', color: '#3b82f6' }}>
                                    <span className="material-symbols-rounded" style={{ fontSize: '2rem' }}>settings_suggest</span>
                                </div>
                                <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-0.5px' }}>Charge Taxonomy</h3>
                            </div>
                            <button
                                onClick={() => setShowCategoryManager(false)}
                                style={{ border: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: 'pointer', width: '45px', height: '45px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                            >
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>

                        <div style={{ marginBottom: '3rem', background: 'var(--bg-primary)', padding: '2rem', borderRadius: '25px', border: '1.5px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <input
                                    className="input"
                                    placeholder="Define new charge label..."
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    style={{ borderRadius: '16px', flex: 1, padding: '1.1rem', fontSize: '1.05rem', background: 'var(--bg-secondary)', fontWeight: '700' }}
                                />
                                <button
                                    onClick={addChargeField}
                                    style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0 30px', borderRadius: '16px', fontWeight: '900', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 8px 20px rgba(59, 130, 246, 0.25)' }}
                                >
                                    Create Type
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '15px' }}>
                            {chargeLabels.map((label, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '1.25rem', background: 'var(--bg-primary)', borderRadius: '20px', border: '1.5px solid var(--border-color)', transition: 'all 0.2s' }}>
                                    <span className="material-symbols-rounded" style={{ fontSize: '1.4rem', opacity: 0.2 }}>drag_indicator</span>
                                    <input
                                        style={{ flex: 1, border: 'none', background: 'transparent', color: 'var(--text-primary)', fontWeight: '800', fontSize: '1.1rem', outline: 'none' }}
                                        value={label}
                                        onChange={(e) => renameChargeField(label, e.target.value)}
                                    />
                                    <button
                                        onClick={() => removeChargeField(label)}
                                        style={{ border: 'none', background: '#ef444415', color: '#ef4444', cursor: 'pointer', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
                                    >
                                        <span className="material-symbols-rounded" style={{ fontSize: '1.3rem' }}>delete_forever</span>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowCategoryManager(false)}
                            style={{ width: '100%', marginTop: '3.5rem', padding: '1.4rem', borderRadius: '20px', background: 'linear-gradient(135deg, #3b82f6, #1e40af)', color: 'white', fontWeight: '950', border: 'none', cursor: 'pointer', fontSize: '1.1rem', boxShadow: '0 10px 30px rgba(59, 130, 246, 0.35)', transition: 'all 0.3s' }}
                        >
                            Complete Configuration
                        </button>
                    </div>
                </div>
            )}
            <style>{`
                .table-row-hover { transition: all 0.2s ease; }
                .table-row-hover:hover { background: rgba(59, 130, 246, 0.03) !important; transform: scale(1.002); }
                .hbl-entry-card:hover { transform: translateX(8px); border-color: #3b82f680 !important; }
                input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important; outline: none; }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                
                /* Hide native date picker icon as we use a custom large one */
                input[type="date"]::-webkit-calendar-picker-indicator {
                    display: none;
                }
            `}</style>
        </div >
    );
};

export default CanadaManifestList;
