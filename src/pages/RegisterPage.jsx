import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

// ─── Validación de contraseña alfanumérica ───────────────
// Mínimo 6 chars, al menos 1 letra y 1 número
const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&_\-]{6,}$/;

const validarPassword = (password) => {
  if (password.length < 6)        return 'Mínimo 6 caracteres';
  if (!/[a-zA-Z]/.test(password)) return 'Debe contener al menos una letra';
  if (!/\d/.test(password))       return 'Debe contener al menos un número';
  if (!passwordRegex.test(password)) return 'Solo letras, números y @$!%*?&_-';
  return null;
};

// ─── Indicador de fortaleza ──────────────────────────────
const getFortaleza = (password) => {
  if (!password) return null;
  let puntos = 0;
  if (password.length >= 6)  puntos++;
  if (password.length >= 10) puntos++;
  if (/[a-zA-Z]/.test(password)) puntos++;
  if (/\d/.test(password))        puntos++;
  if (/[A-Z]/.test(password))     puntos++;
  if (/[@$!%*?&_\-]/.test(password)) puntos++;

  if (puntos <= 2) return { label: 'Débil',   color: '#ef4444', width: '33%'  };
  if (puntos <= 4) return { label: 'Media',   color: '#f59e0b', width: '66%'  };
  return            { label: 'Fuerte',  color: '#10b981', width: '100%' };
};

export default function RegisterPage() {
  const [form, setForm] = useState({
    nombre: '', email: '', password: '', confirmar: ''
  });
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const { registrar } = useAuth();
  const navigate = useNavigate();

  const fortaleza = getFortaleza(form.password);

  const validarCampo = (nombre, valor) => {
    switch (nombre) {
      case 'nombre':
        return valor.trim().length < 2 ? 'Mínimo 2 caracteres' : null;
      case 'email':
        return !/^\S+@\S+\.\S+$/.test(valor) ? 'Email no válido' : null;
      case 'password':
        return validarPassword(valor);
      case 'confirmar':
        return valor !== form.password ? 'Las contraseñas no coinciden' : null;
      default:
        return null;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Validación en tiempo real
    const error = validarCampo(name, value);
    setErrores(prev => ({ ...prev, [name]: error }));
    // Revalidar confirmar si cambia password
    if (name === 'password' && form.confirmar) {
      setErrores(prev => ({
        ...prev,
        confirmar: value !== form.confirmar ? 'Las contraseñas no coinciden' : null
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar todos los campos antes de enviar
    const nuevosErrores = {
      nombre:   validarCampo('nombre',   form.nombre),
      email:    validarCampo('email',    form.email),
      password: validarCampo('password', form.password),
      confirmar: form.password !== form.confirmar ? 'Las contraseñas no coinciden' : null,
    };
    setErrores(nuevosErrores);

    if (Object.values(nuevosErrores).some(Boolean)) return;

    setCargando(true);
    try {
      const data = await registrar(form.nombre, form.email, form.password);
      toast.success(data.mensaje);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg
        || err.response?.data?.error
        || 'Error al registrarse';
      toast.error(msg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100"
      style={{ background: 'var(--st-bg)' }}>

      {/* Fondo decorativo */}
      <div className="position-fixed top-0 start-0 w-100 h-100"
        style={{ pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)' }} />
      </div>

      <div className="w-100 px-3 fade-in-up" style={{ maxWidth: 440, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
            style={{ width: 56, height: 56, background: 'var(--st-primary)' }}>
            <i className="bi bi-lightning-charge-fill text-white fs-4" />
          </div>
          <h2 className="fw-bold mb-1" style={{ fontFamily: 'Space Grotesk', letterSpacing: '-0.02em' }}>
            Crear cuenta
          </h2>
          <p style={{ color: 'var(--st-muted)', fontSize: '0.9rem' }}>
            Empieza a gestionar tus tareas con IA
          </p>
        </div>

        {/* Card */}
        <div className="st-card p-4">
          <form onSubmit={handleSubmit} noValidate>

            {/* Nombre */}
            <div className="mb-3">
              <label className="form-label" htmlFor="reg-nombre">Nombre completo</label>
              <div className="input-group">
                <span className="input-group-text"
                  style={{ background: 'var(--st-surface2)', border: '1px solid var(--st-border)', color: 'var(--st-muted)' }}>
                  <i className="bi bi-person" />
                </span>
                <input
                  id="reg-nombre" type="text" name="nombre"
                  className={`form-control ${errores.nombre ? 'is-invalid' : form.nombre.length >= 2 ? 'is-valid' : ''}`}
                  placeholder="Tu nombre" required minLength={2}
                  value={form.nombre} onChange={handleChange}
                />
              </div>
              {errores.nombre && (
                <small style={{ color: '#f87171', fontSize: '0.78rem' }}>
                  <i className="bi bi-exclamation-circle me-1" />{errores.nombre}
                </small>
              )}
            </div>

            {/* Email */}
            <div className="mb-3">
              <label className="form-label" htmlFor="reg-email">Email</label>
              <div className="input-group">
                <span className="input-group-text"
                  style={{ background: 'var(--st-surface2)', border: '1px solid var(--st-border)', color: 'var(--st-muted)' }}>
                  <i className="bi bi-envelope" />
                </span>
                <input
                  id="reg-email" type="email" name="email"
                  className={`form-control ${errores.email ? 'is-invalid' : form.email && !errores.email ? 'is-valid' : ''}`}
                  placeholder="tu@email.com" required
                  value={form.email} onChange={handleChange}
                />
              </div>
              {errores.email && (
                <small style={{ color: '#f87171', fontSize: '0.78rem' }}>
                  <i className="bi bi-exclamation-circle me-1" />{errores.email}
                </small>
              )}
            </div>

            {/* Contraseña */}
            <div className="mb-3">
              <label className="form-label" htmlFor="reg-password">Contraseña</label>
              <div className="input-group">
                <span className="input-group-text"
                  style={{ background: 'var(--st-surface2)', border: '1px solid var(--st-border)', color: 'var(--st-muted)' }}>
                  <i className="bi bi-lock" />
                </span>
                <input
                  id="reg-password"
                  type={mostrarPassword ? 'text' : 'password'}
                  name="password"
                  className={`form-control ${errores.password ? 'is-invalid' : form.password && !errores.password ? 'is-valid' : ''}`}
                  placeholder="Mín. 6 caracteres con letras y números"
                  required
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="input-group-text"
                  onClick={() => setMostrarPassword(v => !v)}
                  style={{ background: 'var(--st-surface2)', border: '1px solid var(--st-border)', color: 'var(--st-muted)', cursor: 'pointer' }}
                  aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <i className={`bi ${mostrarPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>

              {/* Indicador de fortaleza */}
              {form.password && (
                <div className="mt-2">
                  <div style={{ height: 4, background: 'var(--st-border)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 4,
                      width: fortaleza?.width || '0%',
                      background: fortaleza?.color || '#ef4444',
                      transition: 'width 0.3s, background 0.3s',
                    }} />
                  </div>
                  <div className="d-flex justify-content-between mt-1">
                    <small style={{ color: 'var(--st-muted)', fontSize: '0.72rem' }}>
                      Seguridad de la contraseña
                    </small>
                    <small style={{ color: fortaleza?.color, fontSize: '0.72rem', fontWeight: 600 }}>
                      {fortaleza?.label}
                    </small>
                  </div>
                </div>
              )}

              {/* Reglas de validación */}
              <div className="mt-2 d-flex flex-column gap-1">
                {[
                  { ok: form.password.length >= 6,       label: 'Mínimo 6 caracteres'     },
                  { ok: /[a-zA-Z]/.test(form.password),  label: 'Al menos una letra'       },
                  { ok: /\d/.test(form.password),        label: 'Al menos un número'       },
                ].map(({ ok, label }) => (
                  <small key={label} style={{
                    fontSize: '0.72rem',
                    color: ok ? '#10b981' : 'var(--st-muted)',
                    transition: 'color 0.2s',
                  }}>
                    <i className={`bi ${ok ? 'bi-check-circle-fill' : 'bi-circle'} me-1`} />
                    {label}
                  </small>
                ))}
              </div>

              {errores.password && (
                <small style={{ color: '#f87171', fontSize: '0.78rem' }}>
                  <i className="bi bi-exclamation-circle me-1" />{errores.password}
                </small>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div className="mb-4">
              <label className="form-label" htmlFor="reg-confirmar">Confirmar contraseña</label>
              <div className="input-group">
                <span className="input-group-text"
                  style={{ background: 'var(--st-surface2)', border: '1px solid var(--st-border)', color: 'var(--st-muted)' }}>
                  <i className="bi bi-shield-lock" />
                </span>
                <input
                  id="reg-confirmar"
                  type={mostrarPassword ? 'text' : 'password'}
                  name="confirmar"
                  className={`form-control ${errores.confirmar ? 'is-invalid' : form.confirmar && !errores.confirmar ? 'is-valid' : ''}`}
                  placeholder="Repite la contraseña"
                  required
                  value={form.confirmar}
                  onChange={handleChange}
                />
              </div>
              {errores.confirmar && (
                <small style={{ color: '#f87171', fontSize: '0.78rem' }}>
                  <i className="bi bi-exclamation-circle me-1" />{errores.confirmar}
                </small>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2"
              disabled={cargando || Object.values(errores).some(Boolean)}
            >
              {cargando
                ? <><span className="spinner-border spinner-border-sm me-2" />Creando cuenta...</>
                : <><i className="bi bi-person-plus me-2" />Crear cuenta gratis</>
              }
            </button>
          </form>
        </div>

        <p className="text-center mt-3" style={{ color: 'var(--st-muted)', fontSize: '0.875rem' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="fw-semibold"
            style={{ color: 'var(--st-primary)', textDecoration: 'none' }}>
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}