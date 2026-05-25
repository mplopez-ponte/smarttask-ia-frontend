import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import Footer from './Footer';

const SIDEBAR_W        = '260px';
const SIDEBAR_W_TABLET = '220px';

const LayoutRoot = styled.div`
  display: flex;
  min-height: 100vh;
  min-height: calc(var(--vh, 1vh) * 100);
  overflow-x: hidden;
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  z-index: 1040;
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
`;

const Sidebar = styled.aside`
  width: ${SIDEBAR_W};
  height: 100vh;
  height: calc(var(--vh, 1vh) * 100); 
  /* 🚀 Clave 1: Forzar límite máximo estricto del viewport */
  max-height: 100vh;
  max-height: calc(var(--vh, 1vh) * 100);
  background: var(--st-surface);
  border-right: 1px solid var(--st-border);
  position: fixed;
  left: 0; top: 0; bottom: 0;
  z-index: 1041;
  
  /* Flexbox estricto */
  display: flex;
  flex-direction: column;
  /* 🚀 Clave 2: Evita que el sidebar entero crezca hacia abajo */
  overflow: hidden; 
  
  transition: transform 0.28s cubic-bezier(0.4,0,0.2,1), width 0.28s;
  will-change: transform;

  @media (min-width: 993px) {
    transform: translateX(0) !important;
    width: ${SIDEBAR_W};
    box-shadow: none;
  }

  @media (min-width: 769px) and (max-width: 992px) {
    width: ${SIDEBAR_W_TABLET};
    transform: ${props => props.$open ? 'translateX(0)' : 'translateX(-100%)'};
    box-shadow: ${props => props.$open ? 'var(--st-shadow-lg)' : 'none'};
  }

  @media (max-width: 768px) {
    width: min(${SIDEBAR_W}, 85vw);
    transform: ${props => props.$open ? 'translateX(0)' : 'translateX(-100%)'};
    box-shadow: ${props => props.$open ? 'var(--st-shadow-lg)' : 'none'};
  }
`;

const SidebarHeader = styled.div`
  padding: 1.1rem 1rem 0.85rem;
  border-bottom: 1px solid var(--st-border);
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
`;

const LogoCircle = styled.div`
  width: 38px; height: 38px; min-width: 38px;
  background: var(--st-primary);
  display: flex; align-items: center; justify-content: center;
  border-radius: 10px; font-size: 1rem;
`;

const Nav = styled.nav`
  padding: 1rem 0.75rem;
  /* 🚀 Clave 3: Permite reducir el contenedor dinámicamente */
  flex: 1 1 0%; 
  min-height: 0; 
  display: flex; 
  flex-direction: column;
  
  /* 🚀 El scroll vertical vive EXCLUSIVAMENTE aquí dentro */
  overflow-y: auto; 
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.2);
    border-radius: 4px;
  }
`;

const SectionLabel = styled.p`
  text-transform: uppercase;
  margin: 0 0 0.6rem 0.25rem;
  color: var(--st-muted);
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  font-weight: 600;
`;

const StyledNavLink = styled(NavLink)`
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.72rem 0.85rem;
  border-radius: 9px; margin-bottom: 0.3rem;
  width: 100%; text-decoration: none;
  transition: background 0.15s, color 0.15s;
  color: var(--st-text); font-size: 0.92rem; font-weight: 500;
  min-height: 44px;

  &.active {
    background: var(--st-primary); color: white;
    box-shadow: 0 2px 12px rgba(99,102,241,0.35);
  }
  &:not(.active):hover { background: var(--st-surface2); color: var(--st-text); }
  i { flex-shrink: 0; font-size: 1.1rem; width: 20px; text-align: center; }
`;

const UserBlock = styled.div`
  padding: 0.85rem 0.85rem 1.25rem;
  border-top: 1px solid var(--st-border);
  
  /* Bloquear cualquier reducción o aplastamiento flexible */
  flex-shrink: 0; 
  /* 🚀 Clave 4: Empuja el bloque de usuario siempre a la base */
  margin-top: auto; 
  
  overflow: visible;
  position: relative;
  z-index: 5;
  background: var(--st-surface);
  box-sizing: border-box;
  width: 100%;

  @media (max-width: 768px) {
    padding: 1rem 0.85rem 1.75rem; 
  }
`;

const Avatar = styled.div`
  width: 40px; height: 40px; min-width: 40px;
  border-radius: 50%;
  background: rgba(99,102,241,0.18); color: var(--st-primary);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 1rem;
`;

const LogoutBtn = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 44px;
  box-sizing: border-box;
  padding: 0.65rem 1rem;

  /* Estilos base */
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s, border-color 0.15s, transform 0.1s;
  flex-shrink: 0;
  overflow: visible;
  position: relative;
  
  transform: translateZ(0);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  &:hover, &:focus-visible {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.45);
    outline: none;
  }

  &:active {
    background: rgba(239, 68, 68, 0.28);
    transform: scale(0.98) translateZ(0);
  }

  i { font-size: 1rem; flex-shrink: 0; }

  @media (max-width: 768px) {
    min-height: 46px;
    padding: 0.75rem 0.85rem; 
    border-radius: 10px;
    background: #1e1517; 
    color: #ff6b6b;      
    border: 1.5px solid #e04f4f; 
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.08);

    font-size: 0.88rem; 
    font-weight: 700;
    white-space: normal; 
    word-break: keep-all; 
  }
`;

const Main = styled.div`
  flex: 1 1 auto; display: flex; flex-direction: column;
  min-width: 0; width: 100%;

  @media (min-width: 993px) {
    margin-left: ${SIDEBAR_W};
    width: calc(100% - ${SIDEBAR_W});
  }
  @media (max-width: 992px) { margin-left: 0; width: 100%; }
`;

const MobileHeader = styled.header`
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid var(--st-border);
  background: var(--st-surface);
  padding: 0.7rem 1rem;
  position: sticky; top: 0; z-index: 100; flex-shrink: 0;

  @media (min-width: 993px) { display: none; }
`;

const MobileLogo = styled.div`
  width: 34px; height: 34px; min-width: 34px;
  background: var(--st-primary); border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
`;

const HamburgerBtn = styled.button`
  background: var(--st-surface2); color: var(--st-text);
  border: 1px solid var(--st-border); border-radius: 8px;
  padding: 0.38rem 0.55rem; cursor: pointer;
  min-width: 44px; min-height: 44px;
  display: flex; align-items: center; justify-content: center;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
  &:hover { background: var(--st-border); }
`;

const ContentWrap = styled.main`
  display: flex; flex-direction: column; flex: 1 1 auto; min-width: 0;
`;

const ContentInner = styled.div`
  flex: 1 1 auto;
  padding: 1.25rem 1rem;

  @media (min-width: 576px)  { padding: 1.5rem 1.25rem; }
  @media (min-width: 768px)  { padding: 1.75rem 1.5rem; }
  @media (min-width: 1200px) { padding: 2rem; }
  @media (min-width: 1400px) { padding: 2.25rem 2.5rem; }
`;

export default function Layout() {
  const { usuario, cerrarSesion } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await cerrarSesion();
      toast.info('Sesión cerrada correctamente');
      navigate('/login', { replace: true });
    } catch { toast.error('Error al cerrar sesión'); }
  };

  /* 🚀 Clave 4: Listener real para inyectar los píxeles exactos libres del viewport móvil */
  useEffect(() => {
    const calcularCalculoVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    calcularCalculoVH();
    window.addEventListener('resize', calcularCalculoVH);
    window.addEventListener('orientationchange', calcularCalculoVH);
    
    return () => {
      window.removeEventListener('resize', calcularCalculoVH);
      window.removeEventListener('orientationchange', calcularCalculoVH);
    };
  }, []);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    const isNarrow = window.innerWidth < 993;
    document.body.style.overflow = (sidebarOpen && isNarrow) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const navLinks = [
    { to: '/dashboard', icon: 'bi-grid-1x2-fill', label: 'Dashboard'  },
    { to: '/tareas',    icon: 'bi-check2-square',  label: 'Mis Tareas' },
    { to: '/perfil',    icon: 'bi-person-circle',  label: 'Mi Perfil'  },
  ];

  return (
    <LayoutRoot>
      {sidebarOpen && (
        <Overlay onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      <Sidebar $open={sidebarOpen} aria-label="Menú de navegación">
        {/* Logo */}
        <SidebarHeader>
          <LogoCircle>
            <i className="bi bi-lightning-charge-fill" style={{ color: 'white' }} />
          </LogoCircle>
          <div style={{ minWidth: 0 }}>
            <h5 style={{
              margin: 0, fontFamily: 'Space Grotesk',
              letterSpacing: '-0.01em', fontSize: '1rem', whiteSpace: 'nowrap',
            }}>
              SmartTask
            </h5>
            <span style={{ fontSize: '0.6rem', color: 'var(--st-muted)' }}>
              IA · Gestión inteligente
            </span>
          </div>
        </SidebarHeader>

        {/* Navegación */}
        <Nav>
          <SectionLabel>Navegación</SectionLabel>
          {navLinks.map(({ to, icon, label }) => (
            <StyledNavLink key={to} to={to} onClick={() => setSidebarOpen(false)}>
              <i className={`bi ${icon}`} />
              <span>{label}</span>
            </StyledNavLink>
          ))}
        </Nav>

        {/* Usuario + cerrar sesión */}
        <UserBlock>
          <UserCard>
            <Avatar>{(usuario?.nombre?.[0] || 'U').toUpperCase()}</Avatar>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{
                margin: 0, fontWeight: 600, fontSize: '0.875rem',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {usuario?.nombre || 'Usuario'}
              </p>
              <p style={{
                margin: 0, fontSize: '0.75rem', color: 'var(--st-muted)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {usuario?.email || ''}
              </p>
            </div>
          </UserCard>

          <LogoutBtn onClick={handleLogout} aria-label="Cerrar sesión">
            <i className="bi bi-box-arrow-right" />
            <span>Cerrar sesión</span>
          </LogoutBtn>
        </UserBlock>
      </Sidebar>

      <Main>
        {/* Topbar móvil */}
        <MobileHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MobileLogo>
              <i className="bi bi-lightning-charge-fill"
                style={{ color: 'white', fontSize: '0.9rem' }} />
            </MobileLogo>
            <span style={{
              fontWeight: 700, fontFamily: 'Space Grotesk',
              fontSize: '0.95rem', letterSpacing: '-0.01em',
            }}>
              SmartTask IA
            </span>
          </div>
          <HamburgerBtn
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú de navegación"
            aria-expanded={sidebarOpen}
          >
            <i className="bi bi-list" style={{ fontSize: '1.25rem' }} />
          </HamburgerBtn>
        </MobileHeader>

        <ContentWrap>
          <ContentInner>
            <Outlet />
          </ContentInner>
          <Footer />
        </ContentWrap>
      </Main>
    </LayoutRoot>
  );
}