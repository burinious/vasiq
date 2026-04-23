import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Moon,
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
  { label: 'Announcements', href: '#announcements', icon: Megaphone },
  { label: 'Users', href: '#community', icon: UsersRound },
];

function AdminShell() {
  const { currentUser, profile, signOut } = useAuth();
  const [theme, setTheme] = useState(resolveThemePreference);
  const adminIdentity = { ...profile, email: currentUser?.email };
  const publicName = getUserDisplayName(adminIdentity, 'Admin user');
  const initials = getUserInitials(adminIdentity, 'AD');
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

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
            <a key={item.href} href={item.href} className="admin-shell-link">
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
          <div>
            <p className="eyebrow">Admin</p>
            <h1>Campus controls</h1>
          </div>
          <button
            type="button"
            className="ghost-button theme-toggle-button"
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
        </header>

        <Outlet />
      </main>
    </div>
  );
}

export default AdminShell;
