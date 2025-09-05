import React, { useEffect, useState } from 'react';

export default function LiveEvents() {
  const [events, setEvents] = useState([]);
  const [initialLoadTime] = useState(Date.now());

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:4001');

    ws.onmessage = (msg) => {
      try {
        const eventData = JSON.parse(msg.data);

        // تعیین نوع رویداد بر اساس زمان
        const type = Date.now() - initialLoadTime < 5000 ? 'history' : 'live';

        setEvents(prev => [
          { ...eventData, type },
          ...prev
        ]);
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    return () => ws.close();
  }, [initialLoadTime]);

  return (
    <div style={{border: '1px solid #ccc', padding: '1rem', marginTop: '1rem'}}>
      <h3>📡 Blockchain Events</h3>
      {events.length === 0 && <p>No events yet...</p>}
      <ul>
        {events.map((ev, i) => (
          <li
            key={i}
            style={{
              color: ev.type === 'history' ? '#888' : '#0f0', // خاکستری برای history، سبز برای live
              fontWeight: ev.type === 'live' ? 'bold' : 'normal',
              marginBottom: '0.5rem'
            }}
          >
            [{ev.type.toUpperCase()}] <strong>{ev.domainName}</strong> — Token #{ev.tokenId}
            <br/>
            From: {ev.from}
            <br/>
            To: {ev.to}
            <br/>
            Block: {ev.blockNumber}
          </li>
        ))}
      </ul>
    </div>
  );
}
