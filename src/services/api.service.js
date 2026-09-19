import axios from 'axios';

// ─── Instancia Base de Axios ─────────────────────────────────────────────
// Usa la variable de entorno de Vite/React o la URL directa del backend en Railway
const API_URL = import.meta.env.VITE_API_URL || 'https://smarttask-ia-backend-production.up.railway.app/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Interceptor de Peticiones (Adjunta el Token JWT) ─────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Interceptor de Respuestas (Manejo global de 401 Unauthorized) ────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Opcional: Limpiar sesión si el token expira
      // localStorage.removeItem('token');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/* ─── Servicio de Autenticación ────────────────────────────────────────── */
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  registro: (data) => api.post('/auth/registro', data),
  getPerfil: () => api.get('/auth/perfil'),
};

/* ─── Servicio de Tareas ───────────────────────────────────────────────── */
export const tareaService = {
  obtenerTodas: (params) => api.get('/tareas', { params }),
  obtenerPorId: (id) => api.get(`/tareas/${id}`),
  crear: (data) => api.post('/tareas', data),
  actualizar: (id, data) => api.put(`/tareas/${id}`, data),
  cambiarEstado: (id, estado) => api.patch(`/tareas/${id}/estado`, { estado }),
  eliminar: (id) => api.delete(`/tareas/${id}`),
};

/* ─── Servicio de Inteligencia Artificial (AI) ─────────────────────────── */
export const iaService = {
  // Coincide exactamente con POST /api/ai/sugerir-descripcion en Express
  sugerirDescripcion: (datos) => api.post('/ai/sugerir-descripcion', datos),
  
  // POST /api/ai/generar-subtareas
  generarSubtareas: (tareaId) => api.post('/ai/generar-subtareas', { tareaId }),
  
  // GET /api/ai/analizar-carga
  analizarCarga: () => api.get('/ai/analizar-carga'),
};

export default api;