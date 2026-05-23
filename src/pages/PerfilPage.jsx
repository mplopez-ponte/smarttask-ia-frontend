import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api.service';

/* ─── Modal de confirmación de eliminación ─────────────── */
function ModalEliminarCuenta({ show, onHide, onConfirmar, cargando, nombreUsuario }) {
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const CONFIRM_WORD = 'ELIMINAR';

  const handleClose = () => {
    setPassword('');
    setConfirmText('');
    onHide();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (confirmText !== CONFIRM_WORD) return;
    onConfirmar(password);
  };

  const puedeEnviar = password.length >= 6 && confirmText === CONFIRM_WORD && !cargando;

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.75)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
        style={{ maxWidth: 'min(480px, calc(100vw - 1rem))', margin: '0.5rem auto' }}>
        <div className="modal-content" style={{ border: '1px solid rgba(239,68,68,0.4)' }}>

          <div className="modal-header" style={{ borderBottomColor: 'rgba(239,68,68,0.2)' }}>
            <div className="d-flex align-items-center gap-2">
              <div className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 36, height: 36, background: 'rgba(239,68,68,0.15)' }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ color: '#ef4444' }} />
              </div>
              <h5 className="modal-title mb-0 fw-semibold">Eliminar cuenta</h5>
            </div>
            <button className="btn-close btn-close-white" onClick={handleClose} disabled={cargando} />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Aviso de peligro */}
              <div className="rounded-2 p-3 mb-4"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <p className="mb-2 fw-semibold" style={{ color: '#fca5a5', fontSize: '0.875rem' }}>
                  <i className="bi bi-shield-x me-2" />Esta acción es permanente e irreversible
                </p>
                <ul className="mb-0 ps-3" style={{ color: '#fca5a5', fontSize: '0.82rem', lineHeight: 1.8 }}>
                  <li>Se eliminará tu cuenta <strong style={{ color: '#fff' }}>({nombreUsuario})</strong></li>
                  <li>Se eliminarán <strong style={{ color: '#fff' }}>todas tus tareas</strong> y subtareas</li>
                  <li>Se eliminarán <strong style={{ color: '#fff' }}>todas tus estadísticas</strong></li>
                  <li>No podrás recuperar ningún dato después</li>
                </ul>
              </div>

              <div className="mb-3">
                <label className="form-label" style={{ fontSize: '0.875rem' }}>
                  Confirma tu contraseña actual
                </label>
                <input type="password" className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required autoFocus disabled={cargando} />
              </div>

              <div className="mb-1">
                <label className="form-label" style={{ fontSize: '0.875rem' }}>
                  Escribe <strong style={{ color: '#ef4444', letterSpacing: '0.05em' }}>{CONFIRM_WORD}</strong> para confirmar
                </label>
                <input type="text" className="form-control"
                  placeholder={CONFIRM_WORD}
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value.toUpperCase())}
                  disabled={cargando}
                  style={{
                    borderColor: confirmText.length > 0
                      ? (confirmText === CONFIRM_WORD ? 'rgba(16,185,129,0.6)' : 'rgba(239,68,68,0.5)')
                      : undefined
                  }} />
              </div>
              {confirmText.length > 0 && confirmText !== CONFIRM_WORD && (
                <small style={{ color: '#f87171', fontSize: '0.75rem' }}>
                  Escribe exactamente: {CONFIRM_WORD}
                </small>
              )}
            </div>

            <div className="modal-footer" style={{ borderTopColor: 'rgba(239,68,68,0.2)' }}>
              <button type="button" className="btn btn-sm" onClick={handleClose} disabled={cargando}
                style={{ background: 'var(--st-surface2)', border: '1px solid var(--st-border)', color: 'var(--st-muted)' }}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-sm d-flex align-items-center gap-2" disabled={!puedeEnviar}
                style={{
                  background: puedeEnviar ? 'rgba(239,68,68,0.9)' : 'rgba(239,68,68,0.3)',
                  border: '1px solid rgba(239,68,68,0.5)',
                  color: puedeEnviar ? '#fff' : '#f87171',
                  transition: 'all 0.2s'
                }}>
                {cargando
                  ? <><span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14 }} /> Eliminando...</>
                  : <><i className="bi bi-trash3-fill" /> Eliminar mi cuenta</>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ─── Página de Perfil ─────────────────────────────────── */
export default function PerfilPage() {
  const { usuario, actualizarUsuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [passwords, setPasswords] = useState({ actual: '', nueva: '', confirmar: '' });
  const [cargandoPerfil, setCargandoPerfil] = useState(false);
  const [cargandoPass, setCargandoPass] = useState(false);
  const [cargandoEliminar, setCargandoEliminar] = useState(false);
  const [showModalEliminar, setShowModalEliminar] = useState(false);

  const handleActualizarPerfil = async (e) => {
    e.preventDefault();
    setCargandoPerfil(true);
    try {
      const { data } = await authService.actualizarPerfil({ nombre });
      actualizarUsuario(data.usuario);
      toast.success('Perfil actualizado correctamente');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar');
    } finally {
      setCargandoPerfil(false);
    }
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    if (passwords.nueva !== passwords.confirmar) return toast.error('Las contraseñas no coinciden');
    if (passwords.nueva.length < 6) return toast.error('La contraseña debe tener al menos 6 caracteres');
    setCargandoPass(true);
    try {
      await authService.cambiarPassword({ passwordActual: passwords.actual, passwordNueva: passwords.nueva });
      toast.success('Contraseña cambiada correctamente');
      setPasswords({ actual: '', nueva: '', confirmar: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cambiar contraseña');
    } finally {
      setCargandoPass(false);
    }
  };

  const handleEliminarCuenta = async (password) => {
    setCargandoEliminar(true);
    try {
      const { data } = await authService.eliminarCuenta({ password });
      cerrarSesion();
      toast.success(`Cuenta eliminada. Se han borrado ${data.resumen.tareasEliminadas} tarea(s).`, { autoClose: 5000 });
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al eliminar la cuenta');
      setCargandoEliminar(false);
    }
  };

  return (
    <div className="fade-in-up">
      {/* Título */}
      <h4 className="fw-bold mb-1">Mi Perfil</h4>
      <p className="mb-4" style={{ color: 'var(--st-muted)', fontSize: '0.875rem' }}>
        Gestiona tu información personal
      </p>

      {/* Contenedor centrado en desktop, ancho completo en móvil */}
      <div style={{ width: '100%' }}>

        {/* ── Avatar / resumen ── */}
        <div className="st-card p-3 p-md-4 mb-3">
          <div className="d-flex align-items-center gap-3 gap-md-4 flex-wrap">
            <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
              style={{
                width: 64,
                height: 64,
                background: 'rgba(99,102,241,0.2)',
                color: 'var(--st-primary)',
                fontSize: '1.6rem',
                fontFamily: 'Space Grotesk'
              }}>
              {usuario?.nombre?.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <h5 className="mb-1 fw-bold text-truncate">{usuario?.nombre}</h5>
              <p className="mb-1 text-truncate" style={{ color: 'var(--st-muted)', fontSize: '0.875rem' }}>
                {usuario?.email}
              </p>
              <span className="badge rounded-pill"
                style={{ background: 'rgba(99,102,241,0.2)', color: 'var(--st-primary)', fontSize: '0.72rem' }}>
                <i className="bi bi-person-check me-1" />{usuario?.rol}
              </span>
            </div>
          </div>
        </div>

        {/* ── Información personal ── */}
        <div className="st-card p-3 p-md-4 mb-3">
          <h6 className="fw-semibold mb-3">
            <i className="bi bi-person me-2" style={{ color: 'var(--st-primary)' }} />
            Información personal
          </h6>
          <form onSubmit={handleActualizarPerfil}>
            <div className="mb-3">
              <label className="form-label">Nombre completo</label>
              <input type="text" className="form-control"
                value={nombre} minLength={2} required
                onChange={e => setNombre(e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" className="form-control"
                value={usuario?.email} disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              <small style={{ color: 'var(--st-muted)', fontSize: '0.75rem' }}>
                El email no se puede modificar
              </small>
            </div>
            <div className="mb-4">
              <label className="form-label">Miembro desde</label>
              <input type="text" className="form-control" disabled
                value={new Date(usuario?.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            </div>
            <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={cargandoPerfil}>
              {cargandoPerfil
                ? <><span className="spinner-border spinner-border-sm" /> Guardando...</>
                : <><i className="bi bi-floppy" /> Guardar cambios</>
              }
            </button>
          </form>
        </div>

        {/* ── Cambiar contraseña ── */}
        <div className="st-card p-3 p-md-4 mb-3">
          <h6 className="fw-semibold mb-3">
            <i className="bi bi-shield-lock me-2" style={{ color: 'var(--st-primary)' }} />
            Cambiar contraseña
          </h6>
          <form onSubmit={handleCambiarPassword}>
            <div className="mb-3">
              <label className="form-label">Contraseña actual</label>
              <input type="password" className="form-control"
                placeholder="••••••••" required
                value={passwords.actual}
                onChange={e => setPasswords({ ...passwords, actual: e.target.value })} />
            </div>
            <div className="mb-3">
              <label className="form-label">Nueva contraseña</label>
              <input type="password" className="form-control"
                placeholder="Mínimo 6 caracteres" required minLength={6}
                value={passwords.nueva}
                onChange={e => setPasswords({ ...passwords, nueva: e.target.value })} />
            </div>
            <div className="mb-4">
              <label className="form-label">Confirmar nueva contraseña</label>
              <input type="password" className="form-control"
                placeholder="Repite la contraseña" required
                value={passwords.confirmar}
                onChange={e => setPasswords({ ...passwords, confirmar: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={cargandoPass}>
              {cargandoPass
                ? <><span className="spinner-border spinner-border-sm" /> Cambiando...</>
                : <><i className="bi bi-key" /> Cambiar contraseña</>
              }
            </button>
          </form>
        </div>

        {/* ── Zona de peligro ── */}
        <div className="st-card p-3 p-md-4" style={{ border: '1px solid rgba(239,68,68,0.25)' }}>
          <h6 className="fw-semibold mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-octagon-fill" style={{ color: '#ef4444' }} />
            Zona de peligro
          </h6>
          <p className="mb-3" style={{ color: 'var(--st-muted)', fontSize: '0.82rem' }}>
            Las acciones de esta sección son permanentes e irreversibles.
          </p>
          <div className="d-flex align-items-start justify-content-between gap-3 p-3 rounded-2 flex-wrap"
            style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <div style={{ minWidth: 0 }}>
              <p className="mb-1 fw-semibold" style={{ fontSize: '0.875rem' }}>Eliminar cuenta</p>
              <p className="mb-0" style={{ color: 'var(--st-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                Elimina permanentemente tu cuenta y{' '}
                <strong style={{ color: '#fca5a5' }}>todo tu historial de tareas</strong>.
                Esta acción no se puede deshacer.
              </p>
            </div>
            <button className="btn btn-sm d-flex align-items-center gap-2 flex-shrink-0"
              onClick={() => setShowModalEliminar(true)}
              style={{
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.35)',
                color: '#f87171',
                borderRadius: 'var(--st-radius-sm)',
                fontWeight: 500,
                whiteSpace: 'nowrap'
              }}>
              <i className="bi bi-person-x-fill" />
              Eliminar cuenta
            </button>
          </div>
        </div>
      </div>

      <ModalEliminarCuenta
        show={showModalEliminar}
        onHide={() => setShowModalEliminar(false)}
        onConfirmar={handleEliminarCuenta}
        cargando={cargandoEliminar}
        nombreUsuario={usuario?.email}
      />
    </div>
  );
}
