import { useEffect, useState } from 'react';
import {
  Bell,
  CalendarDays,
  CircleUserRound,
  Compass,
  HelpCircle,
  House,
  LogOut,
  Menu,
  MessagesSquare,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  SunMedium,
  UsersRound,
} from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AnnouncementTicker from './AnnouncementTicker';
import AppStatusBanner from './AppStatusBanner';
import OnboardingCards from '../onboarding/OnboardingCards';
import { updateUserProfile } from '../../firebase/firestore';
import { applyTheme, persistTheme, resolveThemePreference } from '../../utils/theme';
import { getUserDisplayName, getUserFirstName, getUserInitials } from '../../utils/userIdentity';

const navigationItems = [
  {
    label: 'Feed',
    path: '/feed',
    icon: House,
  },
  {
    label: 'Groups',
    path: '/groups',
    icon: UsersRound,
  },
  {
    label: 'Chat',
    path: '/chat',
    icon: MessagesSquare,
  },
  {
    label: 'Profile',
    path: '/profile',
    icon: CircleUserRound,
  },
  {
    label: 'Help',
    path: '/help',
    icon: HelpCircle,
  },
];

const topbarNavigationItems = navigationItems.filter((item) =>
  ['/feed', '/groups', '/chat'].includes(item.path),
);

const mobileNavigationItems = navigationItems.filter((item) =>
  ['/feed', '/groups', '/chat'].includes(item.path),
);

const routeMeta = {
  '/feed': {
    kicker: 'Campus pulse',
    title: 'Live student signal',
    note: 'Urgent updates, useful gist, and what students should open right now.',
  },
  '/groups': {
    kicker: 'Group radar',
    title: 'Useful circles',
    note: 'Departments, hostels, study crews, builders, and community spaces.',
  },
  '/chat': {
    kicker: 'Direct messages',
    title: 'Conversations',
    note: 'Fast check-ins, planning, and moving campus energy person to person.',
  },
  '/profile': {
    kicker: 'Identity',
    title: 'Campus card',
    note: 'Show enough context for students to trust and recognize you quickly.',
  },
  '/help': {
    kicker: 'Support',
    title: 'Help center',
    note: 'Replay onboarding, read policies, and manage account safety.',
  },
};

function AppShell() {
  const { currentUser, isAdmin, profile, signOut } = useAuth();
  const location = useLocation();
  const [theme, setTheme] = useState(resolveThemePreference);
  const [dataSaver, setDataSaver] = useState(() => {
    if (typeof navigator === 'undefined') return false;

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return Boolean(connection?.saveData || ['slow-2g', '2g'].includes(connection?.effectiveType));
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [skippingOnboarding, setSkippingOnboarding] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userIdentity = { ...profile, email: currentUser?.email };
  const publicName = getUserDisplayName(userIdentity);
  const firstName = getUserFirstName(userIdentity, 'You');
  const profileFields = [publicName, profile?.department, profile?.level, profile?.avatarUrl];
  const profileCompletion = Math.round(
    (profileFields.filter(Boolean).length / profileFields.length) * 100,
  );
  const initials = getUserInitials(userIdentity);
  const currentMeta = routeMeta[location.pathname] || routeMeta['/feed'];
  const todayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());
  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  const isMobileMenuRoute = ['/profile', '/help'].includes(location.pathname);
  const sidebarNavigationItems = isAdmin
    ? [
        ...navigationItems,
        {
          label: 'Admin',
          path: '/admin',
          icon: ShieldCheck,
        },
      ]
    : navigationItems;

  const handleToggleTheme = () => {
    setTheme(nextTheme);
    persistTheme(nextTheme);
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!connection) return undefined;

    const handleConnectionChange = () => {
      setDataSaver(
        Boolean(connection.saveData || ['slow-2g', '2g'].includes(connection.effectiveType)),
      );
    };

    connection.addEventListener?.('change', handleConnectionChange);
    return () => connection.removeEventListener?.('change', handleConnectionChange);
  }, []);

  useEffect(() => {
    if (!currentUser || profile?.onboardingSkippedAt || location.pathname === '/help') return;

    const sessionKey = `vasiq:onboarding-closed:${currentUser.uid}`;
    if (!window.sessionStorage.getItem(sessionKey)) {
      setShowOnboarding(true);
    }
  }, [currentUser, location.pathname, profile?.onboardingSkippedAt]);

  useEffect(() => {
    const handleOpenOnboarding = () => {
      setShowOnboarding(true);
    };

    window.addEventListener('vasiq:open-onboarding', handleOpenOnboarding);
    return () => window.removeEventListener('vasiq:open-onboarding', handleOpenOnboarding);
  }, []);

  const handleCloseOnboarding = () => {
    if (currentUser) {
      window.sessionStorage.setItem(`vasiq:onboarding-closed:${currentUser.uid}`, 'true');
    }
    setShowOnboarding(false);
  };

  const handleSkipOnboarding = async () => {
    if (!currentUser || skippingOnboarding) return;

    setSkippingOnboarding(true);
    try {
      await updateUserProfile(currentUser.uid, {
        onboardingSkippedAt: new Date().toISOString(),
      });
      setShowOnboarding(false);
    } finally {
      setSkippingOnboarding(false);
    }
  };

  return (
    <div className={`app-shell ${dataSaver ? 'app-shell-save-data' : ''}`}>
      <div className="app-shell-atmosphere" aria-hidden="true">
        <span className="app-shell-glow app-shell-glow-a" />
        <span className="app-shell-glow app-shell-glow-b" />
        <span className="app-shell-grid" />
      </div>

      <aside className="sidebar">
        <div className="sidebar-header-stack">
          <div className="sidebar-logo-lockup">
            <div className="sidebar-logo-mark" aria-hidden="true">
              <span className="sidebar-logo-orb sidebar-logo-orb-main" />
              <span className="sidebar-logo-orb sidebar-logo-orb-top" />
              <span className="sidebar-logo-orb sidebar-logo-orb-bottom" />
            </div>
            <div className="sidebar-logo-copy">
              <strong>VASIQ</strong>
              <span>Campus Social</span>
            </div>
          </div>

          <NavLink to="/profile" className="sidebar-user-row sidebar-user-row-primary">
            <div className="avatar avatar-sm sidebar-avatar-frame">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt={publicName} />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="sidebar-user-copy">
              <strong>{publicName}</strong>
              <span>{profile?.department || 'Campus community'}</span>
            </div>
          </NavLink>

          <div className="sidebar-user-meta">
            <span>{profile?.level || 'Student'}</span>
            <span>{profile?.role || 'Member'}</span>
          </div>
        </div>

        <section className="sidebar-block">
          <div className="sidebar-section-heading">
            <p className="sidebar-section-title">Menu</p>
          </div>
          <nav className="sidebar-nav">
            {sidebarNavigationItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-pill ${isActive ? 'nav-pill-active' : ''}`}
              >
                <span className="nav-pill-icon">
                  <item.icon size={18} strokeWidth={2} aria-hidden="true" />
                </span>
                <span className="nav-pill-copy">
                  <span className="nav-pill-label">{item.label}</span>
                </span>
              </NavLink>
            ))}
          </nav>
        </section>

        <section className="sidebar-spotlight">
          <div className="sidebar-spotlight-header">
            <div>
              <p className="sidebar-section-title">Campus radar</p>
            </div>
            <span className="spotlight-live-pill">Live</span>
          </div>
          <div className="spotlight-list">
            <article className="spotlight-item">
              <span className="spotlight-dot" />
              <div>
                <strong>Fresh conversations</strong>
              </div>
              <span className="spotlight-count">Now</span>
            </article>
            <article className="spotlight-item">
              <span className="spotlight-dot spotlight-dot-warm" />
              <div>
                <strong>{profile?.department || 'Campus network'}</strong>
              </div>
              <span className="spotlight-count">{todayLabel}</span>
            </article>
          </div>
        </section>

        <div className="sidebar-profile sidebar-footer-stack">
          <button type="button" className="sidebar-logout" onClick={signOut}>
            <span className="sidebar-logout-icon">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt={publicName} />
              ) : (
                <span>{initials}</span>
              )}
            </span>
            <span className="sidebar-logout-copy">
              <strong>Log out</strong>
              <small>Leave your campus session</small>
            </span>
          </button>
        </div>
      </aside>

      <main className="page-shell">
        <div className="page-shell-frame">
          <header className="social-topbar">
            <div className="social-topbar-left">
              <div className="mobile-topbar-brand" aria-label="VASIQ Campus Social">
                <div className="sidebar-logo-mark mobile-topbar-logo" aria-hidden="true">
                  <span className="sidebar-logo-orb sidebar-logo-orb-main" />
                  <span className="sidebar-logo-orb sidebar-logo-orb-top" />
                  <span className="sidebar-logo-orb sidebar-logo-orb-bottom" />
                </div>
                <strong>VASIQ</strong>
              </div>
              <div className="social-topbar-meta">
                <span className="social-topbar-kicker">{currentMeta.kicker}</span>
                <strong className="social-topbar-title">{currentMeta.title}</strong>
              </div>
              <label className="social-search">
                <Search size={16} strokeWidth={2.2} aria-hidden="true" />
                <input type="text" placeholder="Search hostel gist, opportunities, groups, or people" />
              </label>
            </div>

            <nav className="social-topbar-nav">
              {topbarNavigationItems.map((item) => (
                <NavLink
                  key={`top-${item.path}`}
                  to={item.path}
                  className={({ isActive }) =>
                    `social-topbar-tab ${isActive ? 'social-topbar-tab-active' : ''}`
                  }
                >
                  <item.icon size={20} strokeWidth={2.1} aria-hidden="true" />
                </NavLink>
              ))}
            </nav>

            <div className="social-topbar-actions">
              <button
                type="button"
                className="social-action-bubble theme-toggle-button"
                aria-label={`Switch to ${nextTheme} mode`}
                title={`Switch to ${nextTheme} mode`}
                onClick={handleToggleTheme}
              >
                {theme === 'dark' ? (
                  <SunMedium size={16} strokeWidth={2.1} aria-hidden="true" />
                ) : (
                  <Moon size={16} strokeWidth={2.1} aria-hidden="true" />
                )}
              </button>
              <button type="button" className="social-action-bubble" aria-label="Explore campus">
                <Compass size={16} strokeWidth={2.1} aria-hidden="true" />
              </button>
              <button type="button" className="social-action-bubble" aria-label="Notifications">
                <Bell size={16} strokeWidth={2.1} aria-hidden="true" />
              </button>
              <span className="social-topbar-date">
                <CalendarDays size={15} strokeWidth={2.1} aria-hidden="true" />
                <span>{todayLabel}</span>
              </span>
              <NavLink to="/profile" className="social-profile-mini">
                <div className="avatar social-profile-mini-avatar">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={publicName} />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <strong>{firstName}</strong>
              </NavLink>
              <button type="button" className="social-logout-button" onClick={signOut}>
                <LogOut size={16} strokeWidth={2.1} aria-hidden="true" />
                <span>Log out</span>
              </button>
            </div>
          </header>
          <AnnouncementTicker />
          <AppStatusBanner />
        </div>
        <div className="page-shell-content">
          <Outlet />
        </div>
      </main>

      <nav className="mobile-nav">
        {mobileNavigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `mobile-nav-item ${isActive ? 'mobile-nav-item-active' : ''}`
            }
          >
            <span className="mobile-nav-icon">
              <item.icon size={18} strokeWidth={2} aria-hidden="true" />
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className={`mobile-nav-item ${
            mobileMenuOpen || isMobileMenuRoute ? 'mobile-nav-item-active' : ''
          }`}
          onClick={() => setMobileMenuOpen((current) => !current)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu-sheet"
        >
          <span className="mobile-nav-icon">
            <Menu size={18} strokeWidth={2} aria-hidden="true" />
          </span>
          <span>Menu</span>
        </button>
      </nav>

      {mobileMenuOpen ? (
        <div
          className="mobile-menu-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setMobileMenuOpen(false);
            }
          }}
        >
          <section id="mobile-menu-sheet" className="mobile-menu-sheet panel">
            <div className="mobile-menu-user">
              <div className="avatar avatar-sm">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={publicName} />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div>
                <strong>{publicName}</strong>
                <p>{profile?.department || 'Campus community'}</p>
              </div>
            </div>

            <div className="mobile-menu-actions">
              <NavLink to="/profile" onClick={() => setMobileMenuOpen(false)}>
                <CircleUserRound size={18} strokeWidth={2.1} aria-hidden="true" />
                <span>Profile</span>
              </NavLink>
              <NavLink to="/help" onClick={() => setMobileMenuOpen(false)}>
                <HelpCircle size={18} strokeWidth={2.1} aria-hidden="true" />
                <span>Help and support</span>
              </NavLink>
              <button type="button" onClick={handleToggleTheme}>
                {theme === 'dark' ? (
                  <SunMedium size={18} strokeWidth={2.1} aria-hidden="true" />
                ) : (
                  <Moon size={18} strokeWidth={2.1} aria-hidden="true" />
                )}
                <span>Switch to {nextTheme} mode</span>
              </button>
              <button type="button" onClick={signOut}>
                <LogOut size={18} strokeWidth={2.1} aria-hidden="true" />
                <span>Log out</span>
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {showOnboarding ? (
        <div className="onboarding-modal-backdrop" role="presentation">
          <OnboardingCards
            onClose={handleCloseOnboarding}
            onSkip={handleSkipOnboarding}
            skipping={skippingOnboarding}
          />
        </div>
      ) : null}
    </div>
  );
}

export default AppShell;
