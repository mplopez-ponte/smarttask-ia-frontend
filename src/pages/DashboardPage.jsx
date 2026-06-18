import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, Title, Filler
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { statsService, iaService } from '../services/api.service';
import { useAuth } from '../context/AuthContext';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale,
  BarElement, PointElement, LineElement, Title, Filler);

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const baseOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, boxWidth: 12 } }
  }
};

export default function DashboardPage() {
  const { usuario } = useAuth();
  const [stats, setStats] = useState(null);
  const [prodData, setProdData] = useState(null);
  const [analisisIA, setAnalisisIA] = useState('');
  const [cargandoStats, setCargandoStats] = useState(true);
  const [cargandoIA, setCargandoIA] = useState(false);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      const [statsRes, prodRes] = await Promise.all([
        statsService.dashboard(),
        statsService.productividad(30)
      ]);
      setStats(statsRes.data);
      setProdData(prodRes.data);
    } catch {
      toast.error('Error al cargar las estadísticas');
    } finally {
      setCargandoStats(false);
    }
  };

  const handleAnalizarIA = async () => {
    setCargandoIA(true);
    try {
      const { data } = await iaService.analizarCarga();
      setAnalisisIA(data.analisis);
    } catch {
      toast.error('Error al obtener el análisis de IA');
    } finally {
      setCargandoIA(false);
    }
  };

  if (cargandoStats) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
      <div className="spinner-border text-primary" style={{ width: '2.5rem', height: '2.5rem' }} />
    </div>
  );

  const estadoLabels = { pendiente: 'Pendiente', en_progreso: 'En Progreso', completada: 'Completada', cancelada: 'Cancelada' };
  const estadoColors = ['#64748b','#6366f1','#10b981','#ef4444'];

  const doughnutData = {
    labels: stats?.porEstado?.map(e => estadoLabels[e._id] || e._id) || [],
    datasets: [{
      data: stats?.porEstado?.map(e => e.total) || [],
      backgroundColor: estadoColors.map(c => c + '99'),
      borderColor: estadoColors,
      borderWidth: 2,
      hoverOffset: 6
    }]
  };

  const prioColors = { baja: '#10b981', media: '#3b82f6', alta: '#f59e0b', urgente: '#ef4444' };
  const barData = {
    labels: stats?.porPrioridad?.map(p => p._id?.charAt(0).toUpperCase() + p._id?.slice(1)) || [],
    datasets: [{
      label: 'Tareas',
      data: stats?.porPrioridad?.map(p => p.total) || [],
      backgroundColor: stats?.porPrioridad?.map(p => (prioColors[p._id] || '#6366f1') + '88') || [],
      borderColor: stats?.porPrioridad?.map(p => prioColors[p._id] || '#6366f1') || [],
      borderWidth: 2,
      borderRadius: 8,
    }]
  };

  const mesesLabels = stats?.completadasPorMes?.map(m => `${MESES[m._id.mes - 1]} ${m._id.año}`) || [];
  const lineData = {
    labels: mesesLabels,
    datasets: [{
      label: 'Completadas',
      data: stats?.completadasPorMes?.map(m => m.total) || [],
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.12)',
      fill: true, tension: 0.4,
      pointBackgroundColor: '#6366f1', pointRadius: 4, pointHoverRadius: 6
    }]
  };

  const allDays = [...new Set([
    ...(prodData?.creadasPorDia?.map(d => d._id) || []),
    ...(prodData?.completadasPorDia?.map(d => d._id) || [])
  ])].sort();

  const prodChartData = {
    labels: allDays.map(d => d.slice(5)),
    datasets: [
      {
        label: 'Creadas',
        data: allDays.map(d => prodData?.creadasPorDia?.find(x => x._id === d)?.creadas || 0),
        borderColor: '#22d3ee', backgroundColor: 'rgba(34,211,238,0.1)', fill: true, tension: 0.4
      },
      {
        label: 'Completadas',
        data: allDays.map(d => prodData?.completadasPorDia?.find(x => x._id === d)?.completadas || 0),
        borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.4
      }
    ]
  };

  const r = stats?.resumen || {};
  const kpis = [
    { label: 'Total de tareas',   value: r.total || 0,           icon: 'bi-list-task',         color: '#6366f1' },
    { label: 'Completadas',       value: r.completadas || 0,     icon: 'bi-check-circle-fill',  color: '#10b981' },
    { label: 'Vencidas',          value: r.vencidas || 0,        icon: 'bi-exclamation-circle', color: '#ef4444' },
    { label: 'Vencen en 7 días',  value: r.proximasAVencer || 0, icon: 'bi-clock-history',      color: '#f59e0b' },
  ];

  return (
    <div className="fade-in-up">
      {/* ── Header ── */}
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h4 className="mb-1 fw-bold">
            ¡Hola, {usuario?.nombre?.split(' ')[0]}! 👋
          </h4>
          <p style={{ color: 'var(--st-muted)', fontSize: '0.9rem', margin: 0 }}>
            Aquí tienes el resumen de tu productividad
          </p>
        </div>
        <Link to="/tareas" className="btn btn-primary d-flex align-items-center gap-2">
          <i className="bi bi-plus-lg" /> Nueva Tarea
        </Link>
      </div>

      {/* ── KPIs ── */}
      <div className="row g-3 mb-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="col-6 col-xl-3">
            <div className="st-card p-3 h-100">
              <div className="d-flex justify-content-between align-items-start">
                <div style={{ minWidth: 0 }}>
                  <p className="mb-1 text-truncate" style={{ color: 'var(--st-muted)', fontSize: '0.78rem', fontWeight: 500 }}>
                    {kpi.label}
                  </p>
                  <h3 className="mb-0 fw-bold">{kpi.value}</h3>
                </div>
                <div className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 38, height: 38, background: kpi.color + '20', marginLeft: '0.5rem' }}>
                  <i className={`bi ${kpi.icon}`} style={{ color: kpi.color, fontSize: '1rem' }} />
                </div>
              </div>
              {kpi.label === 'Completadas' && (
                <div className="mt-2">
                  <div className="d-flex justify-content-between mb-1">
                    <small style={{ color: 'var(--st-muted)', fontSize: '0.72rem' }}>Tasa de éxito</small>
                    <small style={{ color: '#10b981', fontSize: '0.72rem', fontWeight: 600 }}>{r.tasaCompletado}%</small>
                  </div>
                  <div className="progress">
                    <div className="progress-bar" style={{ width: `${r.tasaCompletado}%`, background: '#10b981' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Gráficos fila 1 ── */}
      <div className="row g-3 mb-3">
        {/* Doughnut */}
        <div className="col-12 col-sm-6 col-lg-4">
          <div className="st-card p-3 h-100">
            <h6 className="mb-3 fw-semibold">Por Estado</h6>
            <div className="chart-container-sm" style={{ height: 210 }}>
              <Doughnut data={doughnutData} options={{
                ...baseOpts,
                plugins: { ...baseOpts.plugins, legend: { ...baseOpts.plugins.legend, position: 'bottom' } },
                cutout: '65%'
              }} />
            </div>
          </div>
        </div>

        {/* Bar */}
        <div className="col-12 col-sm-6 col-lg-4">
          <div className="st-card p-3 h-100">
            <h6 className="mb-3 fw-semibold">Por Prioridad</h6>
            <div style={{ height: 210 }}>
              <Bar data={barData} options={{
                ...baseOpts,
                plugins: { ...baseOpts.plugins, legend: { display: false } },
                scales: {
                  x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { color: '#1c2030' } },
                  y: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { color: '#1c2030' } }
                }
              }} />
            </div>
          </div>
        </div>

        {/* Por categoría */}
        <div className="col-12 col-lg-4">
          <div className="st-card p-3 h-100">
            <h6 className="mb-3 fw-semibold">Por Categoría</h6>
            <div style={{ overflowY: 'auto', maxHeight: 210 }}>
              {stats?.porCategoria?.length > 0 ? stats.porCategoria.map((cat, i) => (
                <div key={i} className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-2 overflow-hidden">
                    <div className="rounded-circle flex-shrink-0" style={{ width: 8, height: 8, background: '#6366f1' }} />
                    <span className="text-truncate" style={{ fontSize: '0.83rem' }}>{cat._id}</span>
                  </div>
                  <span className="badge rounded-pill ms-2 flex-shrink-0"
                    style={{ background: 'rgba(99,102,241,0.2)', color: 'var(--st-primary)', fontSize: '0.72rem' }}>
                    {cat.total}
                  </span>
                </div>
              )) : <p style={{ color: 'var(--st-muted)', fontSize: '0.85rem' }}>Sin datos todavía</p>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Gráficos fila 2 ── */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-md-6">
          <div className="st-card p-3 h-100">
            <h6 className="mb-3 fw-semibold">Completadas por mes</h6>
            <div style={{ height: 200 }}>
              <Line data={lineData} options={{
                ...baseOpts,
                plugins: { ...baseOpts.plugins, legend: { display: false } },
                scales: {
                  x: { ticks: { color: '#94a3b8', maxTicksLimit: 6, font: { size: 10 } }, grid: { color: '#1c2030' } },
                  y: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: '#1c2030' }, beginAtZero: true }
                }
              }} />
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="st-card p-3 h-100">
            <h6 className="mb-3 fw-semibold">Productividad (últimos 30 días)</h6>
            <div style={{ height: 200 }}>
              <Line data={prodChartData} options={{
                ...baseOpts,
                scales: {
                  x: { ticks: { color: '#94a3b8', maxTicksLimit: 7, font: { size: 10 } }, grid: { color: '#1c2030' } },
                  y: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: '#1c2030' }, beginAtZero: true }
                }
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Panel IA ── */}
      <div className="st-card p-3 p-md-4">
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <i className="bi bi-robot" style={{ color: 'var(--st-secondary)', fontSize: '1.2rem' }} />
            <h6 className="mb-0 fw-semibold">Análisis de carga de trabajo</h6>
            <span className="ia-badge">IA</span>
          </div>
          <button className="btn btn-sm d-flex align-items-center gap-2" onClick={handleAnalizarIA} disabled={cargandoIA}
            style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--st-primary)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 'var(--st-radius-sm)', whiteSpace: 'nowrap' }}>
            {cargandoIA
              ? <><span className="spinner-border spinner-border-sm" /> Analizando...</>
              : <><i className="bi bi-magic" /> Analizar con IA</>
            }
          </button>
        </div>
        {analisisIA ? (
          <div className="p-3 rounded-2"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', whiteSpace: 'pre-line', fontSize: '0.9rem', lineHeight: 1.7 }}>
            <i className="bi bi-stars me-2" style={{ color: 'var(--st-secondary)' }} />
            {analisisIA}
          </div>
        ) : (
          <p style={{ color: 'var(--st-muted)', fontSize: '0.875rem', margin: 0 }}>
            Haz clic en "Analizar con IA" para recibir recomendaciones personalizadas sobre tu carga de trabajo.
          </p>
        )}
      </div>
    </div>
  );
}
