import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  pointerWithin,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { tareaService } from '../services/api.service';
import ModalCrearTarea from '../components/tasks/ModalCrearTarea';

const PRIORIDAD_ORDEN = { urgente: 0, alta: 1, media: 2, baja: 3 };

const COLUMNAS = [
  { key: 'pendiente',   label: 'Pendiente',   color: '#64748b', icon: 'bi-circle' },
  { key: 'en_progreso', label: 'En Progreso',  color: '#6366f1', icon: 'bi-arrow-repeat' },
  { key: 'completada',  label: 'Completada',   color: '#10b981', icon: 'bi-check-circle' },
  { key: 'cancelada',   label: 'Cancelada',    color: '#ef4444', icon: 'bi-x-circle' },
];

/* ─── Tarjeta arrastrable (Presentacional) ─────────────────────────────── */
function TareaCard({ tarea, isDragging = false }) {
  const prioColors = { baja: '#10b981', media: '#3b82f6', alta: '#f59e0b', urgente: '#ef4444' };
  const color = prioColors[tarea.prioridad] || '#6366f1';

  return (
    <div
      style={{
        background: isDragging ? 'var(--st-surface)' : 'var(--st-surface2)',
        border: `1px solid ${isDragging ? 'rgba(99,102,241,0.6)' : 'var(--st-border)'}`,
        borderRadius: 10,
        padding: '10px 12px',
        cursor: isDragging ? 'grabbing' : 'grab',
        boxShadow: isDragging ? '0 8px 32px rgba(0,0,0,0.5)' : 'none',
        opacity: isDragging ? 0.95 : 1,
        transform: isDragging ? 'rotate(1.5deg) scale(1.02)' : 'none',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        borderLeft: `3px solid ${color}`,
      }}
    >
      <p
        className="mb-1 fw-semibold"
        style={{
          fontSize: '0.83rem',
          color: tarea.estado === 'completada' ? 'var(--st-muted)' : 'var(--st-text)',
          textDecoration: tarea.estado === 'completada' ? 'line-through' : 'none',
          wordBreak: 'break-word',
          lineHeight: 1.4,
        }}
      >
        {tarea.titulo}
      </p>

      {tarea.descripcion && (
        <p
          className="mb-2"
          style={{
            fontSize: '0.75rem',
            color: 'var(--st-muted)',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.4,
          }}
        >
          {tarea.descripcion}
        </p>
      )}

      <div className="d-flex align-items-center gap-1 flex-wrap">
        <span className={`badge-prioridad badge-${tarea.prioridad}`}>{tarea.prioridad}</span>
        {tarea.subtareasGeneradasPorIA && <span className="ia-badge">IA</span>}
        {tarea.subtareas?.length > 0 && (
          <span style={{ fontSize: '0.7rem', color: 'var(--st-muted)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
            <i className="bi bi-list-check me-1" />
            {tarea.subtareas.filter(s => s.completada).length}/{tarea.subtareas.length}
          </span>
        )}
      </div>

      {tarea.progreso > 0 && (
        <div className="progress mt-2" style={{ height: 3 }}>
          <div
            className="progress-bar"
            style={{ width: `${tarea.progreso}%`, background: color, transition: 'width 0.4s' }}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Tarjeta con useSortable ─────────────────────────── */
function SortableTareaCard({ tarea }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tarea._id, data: { tarea, tipo: 'tarea' } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link
        to={`/tareas/${tarea._id}`}
        className="text-decoration-none d-block"
        onClick={e => { if (isDragging) e.preventDefault(); }}
        draggable={false}
      >
        <TareaCard tarea={tarea} />
      </Link>
    </div>
  );
}

/* ─── Columna droppable ───────────────────────────────── */
function KanbanColumna({ col, tareas, isOver }) {
  // Asignamos la zona droppable a la columna entera
  const { setNodeRef } = useDroppable({ id: col.key, data: { tipo: 'columna', colKey: col.key } });

  return (
    <div className="kanban-col" ref={setNodeRef}>
      <div
        style={{
          background: isOver ? `${col.color}0d` : 'var(--st-surface)',
          border: `1px solid ${isOver ? col.color + '55' : 'var(--st-border)'}`,
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 300,
          transition: 'background 0.2s, border-color 0.2s',
        }}
      >
        {/* Header columna */}
        <div
          className="d-flex align-items-center gap-2 px-3 py-2"
          style={{
            borderBottom: `1px solid ${isOver ? col.color + '33' : 'var(--st-border)'}`,
            borderRadius: '12px 12px 0 0',
          }}
        >
          <i className={`bi ${col.icon}`} style={{ color: col.color, fontSize: '0.9rem' }} />
          <span className="fw-semibold" style={{ fontSize: '0.875rem' }}>{col.label}</span>
          <span
            className="badge rounded-pill ms-auto"
            style={{ background: col.color + '22', color: col.color, fontSize: '0.72rem', minWidth: 22, textAlign: 'center' }}
          >
            {tareas.length}
          </span>
        </div>

        {/* Lista de tarjetas */}
        <div
          style={{
            flex: 1,
            padding: '0.6rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            minHeight: 120,
          }}
        >
          <SortableContext items={tareas.map(t => t._id)} strategy={verticalListSortingStrategy}>
            {tareas.map(t => <SortableTareaCard key={t._id} tarea={t} />)}
          </SortableContext>

          {tareas.length === 0 && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--st-muted)',
                fontSize: '0.8rem',
                minHeight: 100,
                border: `2px dashed ${isOver ? col.color + '55' : 'var(--st-border)'}`,
                borderRadius: 8,
                transition: 'border-color 0.2s',
              }}
            >
              {isOver ? (
                <span style={{ color: col.color }}>
                  <i className="bi bi-plus-circle me-1" />Soltar aquí
                </span>
              ) : (
                <span>Sin tareas</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Página principal ────────────────────────────────── */
export default function TareasPage() {
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({ estado: '', prioridad: '', buscar: '' });
  const [showModal, setShowModal] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [vista, setVista] = useState('lista');

  /* DnD state */
  const [activeId, setActiveId] = useState(null);
  const [overColKey, setOverColKey] = useState(null);
  const activeTarea = tareas.find(t => t._id === activeId);

  const actualizandoRef = useRef(false);

  const cargarTareas = useCallback(async () => {
    setCargando(true);
    try {
      const params = {
        page: pagina,
        limit: 100,
        ...Object.fromEntries(Object.entries(filtros).filter(([, v]) => v)),
      };
      const { data } = await tareaService.obtenerTodas(params);
      setTareas(data.tareas);
      setTotalPaginas(data.totalPaginas);
    } catch {
      toast.error('Error al cargar tareas');
    } finally {
      setCargando(false);
    }
  }, [filtros, pagina]);

  useEffect(() => { cargarTareas(); }, [cargarTareas]);

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta tarea?')) return;
    try {
      await tareaService.eliminar(id);
      toast.success('Tarea eliminada');
      cargarTareas();
    } catch { toast.error('Error al eliminar'); }
  };

  const handleCambiarEstado = async (id, estado) => {
    try {
      await tareaService.cambiarEstado(id, estado);
      toast.success('Estado actualizado');
      cargarTareas();
    } catch { toast.error('Error al actualizar estado'); }
  };

  const formatFecha = (f) => f
    ? new Date(f).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  const getDiasRestantes = (fecha) => {
    const dias = Math.ceil((new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24));
    if (dias < 0) return { label: `Venció hace ${Math.abs(dias)}d`, color: '#ef4444' };
    if (dias === 0) return { label: 'Vence hoy', color: '#f59e0b' };
    if (dias <= 3) return { label: `${dias}d restantes`, color: '#f59e0b' };
    return { label: `${dias}d restantes`, color: 'var(--st-muted)' };
  };

  // Obtener tareas filtradas por columna
  const tareasPorEstado = (estado) => tareas.filter(t => t.estado === estado);

  /* ── Sensores DnD ── */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Algoritmo de detección de colisiones personalizado para Kanban
  const customCollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return closestCorners(args);
  }, []);

  const handleDragStart = ({ active }) => {
    setActiveId(active.id);
  };

  const handleDragOver = ({ active, over }) => {
    if (!over) { setOverColKey(null); return; }

    const overId = over.id;
    const esColumna = COLUMNAS.some(c => c.key === overId);

    if (esColumna) {
      setOverColKey(overId);
    } else {
      const tareaOver = tareas.find(t => t._id === overId);
      setOverColKey(tareaOver?.estado || null);
    }
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null);
    setOverColKey(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const tareaArrastrada = tareas.find(t => t._id === activeId);
    if (!tareaArrastrada) return;

    // Determinar nuevo estado objetivo
    let nuevoEstado = null;
    const esColumnaDirecta = COLUMNAS.some(c => c.key === overId);

    if (esColumnaDirecta) {
      nuevoEstado = overId;
    } else {
      const tareaDestino = tareas.find(t => t._id === overId);
      nuevoEstado = tareaDestino?.estado;
    }

    if (!nuevoEstado || nuevoEstado === tareaArrastrada.estado) return;

    const estadoAnterior = tareaArrastrada.estado;

    // 1. Actualización optimista del estado local
    setTareas(prev =>
      prev.map(t => (t._id === activeId ? { ...t, estado: nuevoEstado } : t))
    );

    // 2. Persistencia en Backend en segundo plano sin forzar re-fetch completo
    try {
      actualizandoRef.current = true;
      await tareaService.cambiarEstado(activeId, nuevoEstado);

      const col = COLUMNAS.find(c => c.key === nuevoEstado);
      toast.success(`Movida a ${col?.label || nuevoEstado}`, { autoClose: 1500 });
    } catch (error) {
      console.error('Error al guardar estado de la tarea:', error);
      // 3. Rollback en caso de error
      setTareas(prev =>
        prev.map(t => (t._id === activeId ? { ...t, estado: estadoAnterior } : t))
      );
      toast.error('Error al conectar con el servidor');
    } finally {
      actualizandoRef.current = false;
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverColKey(null);
  };

  return (
    <div className="fade-in-up">

      {/* ── Header ── */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="mb-1 fw-bold">Mis Tareas</h4>
          <p style={{ color: 'var(--st-muted)', fontSize: '0.875rem', margin: 0 }}>
            {tareas.length} tarea{tareas.length !== 1 ? 's' : ''} encontrada{tareas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {/* Vista toggle */}
          <div
            className="btn-group"
            style={{ border: '1px solid var(--st-border)', borderRadius: 'var(--st-radius-sm)' }}
          >
            {[['lista', 'bi-list-ul'], ['kanban', 'bi-kanban']].map(([v, icon]) => (
              <button
                key={v}
                className="btn btn-sm"
                onClick={() => setVista(v)}
                title={v === 'lista' ? 'Vista lista' : 'Vista Kanban con drag & drop'}
                style={{
                  background: vista === v ? 'var(--st-primary)' : 'transparent',
                  color: vista === v ? '#fff' : 'var(--st-muted)',
                  border: 'none',
                  padding: '6px 12px',
                }}
              >
                <i className={`bi ${icon}`} />
              </button>
            ))}
          </div>
          <button
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={() => setShowModal(true)}
          >
            <i className="bi bi-plus-lg" />
            <span className="d-none d-sm-inline">Nueva tarea</span>
            <span className="d-sm-none">Nueva</span>
          </button>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="st-card p-3 mb-4">
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-search" />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar tareas..."
                value={filtros.buscar}
                onChange={e => { setFiltros({ ...filtros, buscar: e.target.value }); setPagina(1); }}
              />
            </div>
          </div>
          <div className="col-6 col-md-3">
            <select
              className="form-select"
              value={filtros.estado}
              onChange={e => { setFiltros({ ...filtros, estado: e.target.value }); setPagina(1); }}
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_progreso">En Progreso</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
          <div className="col-5 col-md-3">
            <select
              className="form-select"
              value={filtros.prioridad}
              onChange={e => { setFiltros({ ...filtros, prioridad: e.target.value }); setPagina(1); }}
            >
              <option value="">Todas</option>
              <option value="urgente">Urgente</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
          <div className="col-1 col-md-1">
            <button
              className="btn btn-sm w-100 d-flex align-items-center justify-content-center"
              onClick={() => { setFiltros({ estado: '', prioridad: '', buscar: '' }); setPagina(1); }}
              style={{
                background: 'var(--st-surface2)',
                color: 'var(--st-muted)',
                border: '1px solid var(--st-border)',
                minHeight: '38px',
              }}
              title="Limpiar filtros"
            >
              <i className="bi bi-x-lg" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Vista Lista ── */}
      {vista === 'lista' && (
        cargando ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" />
          </div>
        ) : tareas.length === 0 ? (
          <div className="text-center py-5 st-card p-4 p-md-5">
            <i className="bi bi-inbox display-3" style={{ color: 'var(--st-muted)' }} />
            <p className="mt-3 mb-2 fw-semibold">No hay tareas</p>
            <p style={{ color: 'var(--st-muted)', fontSize: '0.875rem' }}>Crea tu primera tarea para empezar</p>
            <button className="btn btn-primary mt-2" onClick={() => setShowModal(true)}>
              <i className="bi bi-plus-lg me-1" /> Nueva tarea
            </button>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {[...tareas]
              .sort((a, b) => (PRIORIDAD_ORDEN[a.prioridad] || 99) - (PRIORIDAD_ORDEN[b.prioridad] || 99))
              .map(tarea => {
                const dr = getDiasRestantes(tarea.fechaVencimiento);
                return (
                  <div key={tarea._id} className="st-card p-3">
                    <div className="d-flex align-items-start gap-3">
                      <div className="form-check mt-1 flex-shrink-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={tarea.estado === 'completada'}
                          onChange={() => handleCambiarEstado(tarea._id, tarea.estado === 'completada' ? 'pendiente' : 'completada')}
                          style={{ width: 18, height: 18, borderColor: 'var(--st-border)', cursor: 'pointer' }}
                        />
                      </div>
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="d-flex align-items-start justify-content-between gap-2">
                          <Link
                            to={`/tareas/${tarea._id}`}
                            className="fw-semibold text-decoration-none"
                            style={{
                              color: tarea.estado === 'completada' ? 'var(--st-muted)' : 'var(--st-text)',
                              textDecoration: tarea.estado === 'completada' ? 'line-through' : 'none',
                              wordBreak: 'break-word',
                            }}
                          >
                            {tarea.titulo}
                          </Link>
                          <div className="d-flex gap-1 flex-shrink-0">
                            <Link
                              to={`/tareas/${tarea._id}`}
                              className="btn btn-sm"
                              style={{ background: 'transparent', border: '1px solid var(--st-border)', color: 'var(--st-muted)', padding: '3px 8px' }}
                              title="Ver detalle"
                            >
                              <i className="bi bi-eye" />
                            </Link>
                            <button
                              className="btn btn-sm"
                              onClick={() => handleEliminar(tarea._id)}
                              style={{ background: 'transparent', border: '1px solid var(--st-border)', color: '#f87171', padding: '3px 8px' }}
                              title="Eliminar"
                            >
                              <i className="bi bi-trash3" />
                            </button>
                          </div>
                        </div>
                        <div className="d-flex gap-1 flex-wrap mt-1 mb-1">
                          <span className={`badge-prioridad badge-${tarea.prioridad}`}>{tarea.prioridad}</span>
                          <span className={`badge-prioridad badge-${tarea.estado}`}>
                            {tarea.estado === 'en_progreso' ? 'En Progreso' : tarea.estado?.charAt(0).toUpperCase() + tarea.estado?.slice(1)}
                          </span>
                          {tarea.subtareasGeneradasPorIA && <span className="ia-badge">IA</span>}
                        </div>
                        {tarea.descripcion && (
                          <p className="mb-1" style={{ color: 'var(--st-muted)', fontSize: '0.82rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {tarea.descripcion}
                          </p>
                        )}
                        <div className="d-flex align-items-center gap-2 gap-md-3 flex-wrap">
                          <span style={{ fontSize: '0.78rem', color: dr.color, whiteSpace: 'nowrap' }}>
                            <i className="bi bi-calendar3 me-1" />
                            <span className="d-none d-sm-inline">{formatFecha(tarea.fechaVencimiento)} · </span>
                            {dr.label}
                          </span>
                          {tarea.categoria && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--st-muted)', whiteSpace: 'nowrap' }}>
                              <i className="bi bi-tag me-1" />{tarea.categoria}
                            </span>
                          )}
                          {tarea.subtareas?.length > 0 && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--st-muted)', whiteSpace: 'nowrap' }}>
                              <i className="bi bi-list-check me-1" />
                              {tarea.subtareas.filter(s => s.completada).length}/{tarea.subtareas.length}
                            </span>
                          )}
                        </div>
                        {tarea.progreso > 0 && (
                          <div className="progress mt-2" style={{ height: 4, maxWidth: 200 }}>
                            <div className="progress-bar" style={{ width: `${tarea.progreso}%`, background: 'var(--st-primary)' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )
      )}

      {/* ── Vista Kanban con Drag & Drop ── */}
      {vista === 'kanban' && (
        cargando ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" />
          </div>
        ) : (
          <>
            <div
              className="d-flex align-items-center gap-2 mb-3 px-1"
              style={{ fontSize: '0.78rem', color: 'var(--st-muted)' }}
            >
              <i className="bi bi-grip-vertical" />
              <span className="d-none d-sm-inline">Arrastra las tarjetas entre columnas para cambiar su estado</span>
              <span className="d-sm-none">Mantén pulsado para arrastrar</span>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={customCollisionDetection}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <div className="kanban-board">
                {COLUMNAS.map(col => (
                  <KanbanColumna
                    key={col.key}
                    col={col}
                    tareas={tareasPorEstado(col.key)}
                    isOver={overColKey === col.key}
                  />
                ))}
              </div>

              <DragOverlay dropAnimation={{
                duration: 180,
                easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
              }}>
                {activeTarea ? (
                  <div style={{ width: 260, pointerEvents: 'none' }}>
                    <TareaCard tarea={activeTarea} isDragging />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </>
        )
      )}

      {/* ── Paginación (solo vista lista) ── */}
      {vista === 'lista' && totalPaginas > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-4">
          <button
            className="btn btn-sm"
            disabled={pagina === 1}
            onClick={() => setPagina(p => p - 1)}
            style={{ background: 'var(--st-surface2)', border: '1px solid var(--st-border)', color: 'var(--st-text)' }}
          >
            <i className="bi bi-chevron-left" />
          </button>
          <span className="d-flex align-items-center px-3" style={{ fontSize: '0.85rem', color: 'var(--st-muted)' }}>
            {pagina} / {totalPaginas}
          </span>
          <button
            className="btn btn-sm"
            disabled={pagina === totalPaginas}
            onClick={() => setPagina(p => p + 1)}
            style={{ background: 'var(--st-surface2)', border: '1px solid var(--st-border)', color: 'var(--st-text)' }}
          >
            <i className="bi bi-chevron-right" />
          </button>
        </div>
      )}

      <ModalCrearTarea
        show={showModal}
        onHide={() => setShowModal(false)}
        onCreada={cargarTareas}
      />
    </div>
  );
}