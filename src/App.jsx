import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TareasPage from './pages/TareasPage';
import TareaDetallePage from './pages/TareaDetallePage';
import PerfilPage from './pages/PerfilPage';
import Layout from './components/layout/Layout';
import UserCard from './components/UserCard';

import 'bootstrap-icons/font/bootstrap-icons.css';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

// Ruta protegida
const RutaPrivada = ({ children }) => {
  const { usuario, cargando } = useAuth();
  if (cargando) return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-dark">
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} />
        <p className="text-muted">Cargando SmartTask IA...</p>
      </div>
    </div>
  );
  return usuario ? children : <Navigate to="/login" replace />;
};

// Ruta pública (redirige si ya está logueado)
const RutaPublica = ({ children }) => {
  const { usuario, cargando } = useAuth();
  if (cargando) return null;
  return !usuario ? children : <Navigate to="/dashboard" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<RutaPublica><LoginPage /></RutaPublica>} />
      <Route path="/registro" element={<RutaPublica><RegisterPage /></RutaPublica>} />
      <Route path="/" element={<RutaPrivada><Layout /></RutaPrivada>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tareas" element={<TareasPage />} />
        <Route path="/tareas/:id" element={<TareaDetallePage />} />
        <Route path="/perfil" element={<PerfilPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer
          position="top-right"
          autoClose={3500}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="dark"
        />
        
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;