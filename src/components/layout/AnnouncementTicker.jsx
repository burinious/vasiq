import { useEffect, useMemo, useState } from 'react';
import { listenToAnnouncements } from '../../firebase/firestore';

const fallbackAnnouncements = [
  'VASIQ orientation updates and faculty announcements will scroll here.',
  'Admins can publish deadline reminders, event notices, and campus alerts from the Admin page.',
];

function AnnouncementTicker() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const unsubscribe = listenToAnnouncements(setAnnouncements);
    return unsubscribe;
  }, []);

  const tickerItems = useMemo(() => {
    const activeItems = announcements
      .filter((item) => item.isActive !== false)
      .map((item) => `${item.tag || 'Notice'}: ${item.title} - ${item.message}`);

    return activeItems.length ? activeItems : fallbackAnnouncements;
  }, [announcements]);

  return (
    <div className="announcement-ticker">
      <span className="ticker-label">Live</span>
      <div className="ticker-track">
        <div className="ticker-marquee">
          {[...tickerItems, ...tickerItems].map((item, index) => (
            <span key={`${item}-${index}`} className="ticker-item">
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AnnouncementTicker;
