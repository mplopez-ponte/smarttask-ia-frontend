import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { tareaService, iaService } from '../../services/api.service';

export default function ModalCrearTarea({ show, onHide, onCreada }) {
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'media',
    categoria: 'General',
    fechaVencimiento: '',
    etiquetas: '',
  });

  const [cargandoIA, setCargandoIA] = useState(false);
  const [enviando, setEnviando] = useState(false);

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* ─── Botón: Sugerir con IA ───────────────────────────── */
  const handleSugerirIA = async () => {
    if (!formData.titulo.trim()) {
      toast.warning('Por favor, introduce un título primero para generar la descripción');
      return;
    }

    setCargandoIA(true);
    try {
      // Intenta llamar al servicio de IA
      const res = await iaService.sugerirDescripcion({ titulo: formData.titulo });
      const descripcionGenerada = res.data?.descripcion || res.data?.sugerencia || res.data;

      if (descripcionGenerada && typeof descripcionGenerada === 'string') {
        setFormData((prev) => ({ ...prev, descripcion: descripcionGenerada }));
        toast.success('Descripción generada con IA');
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error) {
      console.error('Error al generar descripción con IA:', error);
      toast.error('Error al generar descripción');
    } finally {
      setCargandoIA(false);
    }
  };

  /* ─── Submit Formulario ──────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.fechaVencimiento) {
      toast.warning('Por favor completa los campos obligatorios (*)');
      return;
    }

    setEnviando(true);
    try {
      const payload = {
        ...formData,
        etiquetas: formData.etiquetas
          ? formData.etiquetas.split(',').map((tag) => tag.trim()).filter(Boolean)
          : [],
      };

      await tareaService.crear(payload);
      toast.success('Tarea creada con éxito');
      
      // Limpiar formulario y notificar
      setFormData({
        titulo: '',
        descripcion: '',
        prioridad: 'media',
        categoria: 'General',
        fechaVencimiento: '',
        etiquetas: '',
      });
      onCreada();
      onHide();
    } catch (error) {
      console.error('Error al crear tarea:', error);
      toast.error('Error al crear la tarea');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div
          className="modal-content"
          style={{
            background: 'var(--st-surface, #1e293b)',
            border: '1px solid var(--st-border, #334155)',
            color: 'var(--st-text, #f8fafc)',
            borderRadius: 16,
          }}
        >
          {/* Header */}
          <div
            className="modal-header"
            style={{ borderBottom: '1px solid var(--st-border, #334155)' }}
          >
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
              <i className="bi bi-plus-circle text-primary" /> Nueva Tarea
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onHide}
            />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {/* Título */}
              <div className="mb-3">
                <label className="form-label fw-semibold" style={{ fontSize: '0.875rem' }}>
                  Título <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="titulo"
                  className="form-control"
                  placeholder="Crear el anteproyecto de SmartTask IA"
                  value={formData.titulo}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Descripción + Botón IA */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label fw-semibold mb-0" style={{ fontSize: '0.875rem' }}>
                    Descripción
                  </label>
                  <button
                    type="button"
                    className="btn btn-sm d-flex align-items-center gap-1"
                    onClick={handleSugerirIA}
                    disabled={cargandoIA}
                    style={{
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: '#818cf8',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: 8,
                      fontSize: '0.78rem',
                      padding: '4px 10px',
                    }}
                  >
                    {cargandoIA ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-[#6366f1] bi-magic" /> Sugerir con IA
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  name="descripcion"
                  className="form-control"
                  rows="3"
                  placeholder="Describe la tarea en detalle..."
                  value={formData.descripcion}
                  onChange={handleChange}
                />
              </div>

              {/* Prioridad, Categoría, Fecha */}
              <div className="row g-3 mb-3">
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold" style={{ fontSize: '0.875rem' }}>
                    Prioridad <span className="text-danger">*</span>
                  </label>
                  <select
                    name="prioridad"
                    className="form-select"
                    value={formData.prioridad}
                    onChange={handleChange}
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold" style={{ fontSize: '0.875rem' }}>
                    Categoría
                  </label>
                  <input
                    type="text"
                    name="categoria"
                    className="form-control"
                    placeholder="General"
                    value={formData.categoria}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold" style={{ fontSize: '0.875rem' }}>
                    Fecha de vencimiento <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    name="fechaVencimiento"
                    className="form-control"
                    value={formData.fechaVencimiento}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Etiquetas */}
              <div className="mb-2">
                <label className="form-label fw-semibold" style={{ fontSize: '0.875rem' }}>
                  Etiquetas <span className="text-muted fw-normal">(separadas por coma)</span>
                </label>
                <input
                  type="text"
                  name="etiquetas"
                  className="form-control"
                  placeholder="ej: react, backend, urgente"
                  value={formData.etiquetas}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Footer */}
            <div
              className="modal-footer"
              style={{ borderTop: '1px solid var(--st-border, #334155)' }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onHide}
                disabled={enviando}
                style={{
                  background: 'var(--st-surface2, #334155)',
                  border: 'none',
                  color: 'var(--st-text, #f8fafc)',
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary d-flex align-items-center gap-1"
                disabled={enviando}
              >
                {enviando ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg" /> Crear tarea
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}