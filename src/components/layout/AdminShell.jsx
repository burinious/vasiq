import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  SunMedium,
  UsersRound,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { applyTheme, persistTheme, resolveThemePreference } from '../../utils/theme';
import { getUserDisplayName, getUserInitials } from '../../utils/userIdentity';

const adminSections = [
  { label: 'Overview', href: '#overview', icon: LayoutDashboard },
  { label: 'Notices', href: '#announcements', icon: Megaphone },
  { label: 'Groups', href: '#groups', icon: ShieldCheck },
  { label: 'Users', href: '#community', icon: UsersRound },
  { label: 'Safety', href: '#safety', icon: Bell },
  { label: 'Posts', href: '#posts', icon: LayoutDashboard },
];

function AdminShell() {
  const { currentUser, profile, signOut } = useAuth();
  const [theme, setTheme] = useState(resolveThemePreference);
  const [activeHash, setActiveHash] = useState(() =>
    typeof window === 'undefined' ? '#overview' : window.location.hash || '#overview'
  );
  const adminIdentity = { ...profile, email: currentUser?.email };
  const publicName = getUserDisplayName(adminIdentity, 'Admin user');
  const initials = getUserInitials(adminIdentity, 'AD');
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const syncHash = () => {
      setActiveHash(window.location.hash || '#overview');
    };

    window.addEventListener('hashchange', syncHash);
    syncHash();

    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  const handleSectionClick = (event, href) => {
    event.preventDefault();
    setActiveHash(href);

    if (typeof window === 'undefined') return;

    if (window.location.hash !== href) {
      window.history.replaceState(null, '', href);
    }
    window.dispatchEvent(new Event('hashchange'));
  };

  return (
    <div className="admin-shell admin-shell-clean">
      <aside className="admin-sidebar admin-sidebar-clean">
        <div className="admin-brand">
          <div className="admin-brand-mark">
            <ShieldCheck size={21} strokeWidth={2.1} aria-hidden="true" />
          </div>
          <div>
            <strong>VASIQ Admin</strong>
            <span>Control panel</span>
          </div>
        </div>

        <nav className="admin-shell-nav">
          {adminSections.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`admin-shell-link ${
                activeHash === item.href ? 'admin-shell-link-active' : ''
              }`}
              onClick={(event) => handleSectionClick(event, item.href)}
            >
              <item.icon size={17} strokeWidth={2.1} aria-hidden="true" />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="admin-sidebar-card admin-sidebar-card-clean">
          <div className="admin-sidebar-user">
            <div className="avatar avatar-sm">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt={publicName} />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div>
              <strong>{publicName}</strong>
              <p>{currentUser?.email || 'Admin account'}</p>
            </div>
          </div>
        </div>

        <NavLink to="/feed" className="admin-back-link">
          <ArrowLeft size={16} strokeWidth={2.1} aria-hidden="true" />
          <span>Back to app</span>
        </NavLink>

        <button type="button" className="ghost-button admin-shell-logout" onClick={signOut}>
          <LogOut size={16} strokeWidth={2.1} aria-hidden="true" />
          <span>Log out</span>
        </button>
      </aside>

      <main className="admin-shell-main admin-shell-main-clean">
        <header className="admin-shell-topbar admin-shell-topbar-clean">
          <label className="admin-topbar-search">
            <Search size={17} strokeWidth={2.1} aria-hidden="true" />
            <input type="search" placeholder="Search users, groups, reports, or notices..." />
          </label>

          <div className="admin-topbar-title-block">
            <p className="eyebrow">Admin</p>
            <h1>Campus controls</h1>
          </div>

          <div className="admin-topbar-controls">
            <button type="button" className="admin-icon-button" aria-label="Admin notifications">
              <Bell size={17} strokeWidth={2.1} aria-hidden="true" />
            </button>
            <button type="button" className="admin-icon-button" aria-label="Admin settings">
              <Settings size={17} strokeWidth={2.1} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="admin-icon-button theme-toggle-button"
              aria-label={`Switch to ${nextTheme} mode`}
              title={`Switch to ${nextTheme} mode`}
              onClick={() => {
                setTheme(nextTheme);
                persistTheme(nextTheme);
              }}
            >
              {theme === 'dark' ? (
                <SunMedium size={16} strokeWidth={2.1} aria-hidden="true" />
              ) : (
                <Moon size={16} strokeWidth={2.1} aria-hidden="true" />
              )}
            </button>
            <div className="admin-topbar-profile">
              <div>
                <strong>{publicName}</strong>
                <span>{profile?.role || 'Admin'}</span>
              </div>
              <div className="avatar avatar-sm admin-topbar-avatar">
                {profile?.avatarUrl ? <img src={profile.avatarUrl} alt={publicName} /> : <span>{initials}</span>}
              </div>
            </div>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}

export default AdminShell;
