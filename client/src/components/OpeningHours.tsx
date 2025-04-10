import { useEffect, useState } from 'react';

type DaySchedule = {
  day: string;
  hours: string;
};

type OpeningStatus = 'open' | 'closed';

// Aktualizované otváracie hodiny
const OPENING_HOURS: DaySchedule[] = [
  { day: 'Pondelok', hours: 'zatvorené' },
  { day: 'Utorok', hours: '15:00 - 22:00' },
  { day: 'Streda', hours: '15:00 - 22:00' },
  { day: 'Štvrtok', hours: '15:00 - 22:00' },
  { day: 'Piatok', hours: '15:00 - 22:00' },
  { day: 'Sobota', hours: '15:00 - 22:00' },
  { day: 'Nedeľa', hours: 'zatvorené' },
];

const OpeningHours = () => {
  const [status, setStatus] = useState<OpeningStatus>('closed');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  useEffect(() => {
    // Nastavenie počiatočného stavu
    checkOpeningStatus();
    
    // Aktualizácia času každú minútu
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      checkOpeningStatus();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Konvertovanie času na počet minút od polnoci
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  // Kontrola, či je aktuálne otvorené
  const checkOpeningStatus = () => {
    // Získanie aktuálneho času v Bratislave (CEST/CET)
    const now = new Date();
    
    // Nastavenie aktuálneho dátumu a času
    setCurrentTime(now);
    
    // Normálna implementácia
    const bratislavaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Bratislava' }));
    
    const dayOfWeek = bratislavaTime.getDay(); // 0 = Nedeľa, 1 = Pondelok, ...
    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Prekonvertovanie na náš index (0 = Pondelok)
    
    const daySchedule = OPENING_HOURS[dayIndex];
    
    // Ak sú otváracie hodiny "zatvorené", nastavíme stav na zatvorené
    if (daySchedule.hours === 'zatvorené') {
      setStatus('closed');
      return;
    }
    
    const [openTime, closeTime] = daySchedule.hours.split(' - ');
    
    const currentMinutes = bratislavaTime.getHours() * 60 + bratislavaTime.getMinutes();
    const openMinutes = timeToMinutes(openTime);
    const closeMinutes = timeToMinutes(closeTime);
    
    // Ak je aktuálny čas medzi otváracím a zatváracím časom, pizzeria je otvorená
    if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
      setStatus('open');
    } else {
      setStatus('closed');
    }
  };
  
  return (
    <div className="text-center text-sm">
      <div className="inline-flex items-center">
        <div 
          className={`mr-2 w-2 h-2 rounded-full ${
            status === 'open' ? 'bg-green-500' : 'bg-red-500'
          }`} 
          aria-hidden="true"
        ></div>
        <span 
          className="text-neutral-200"
          aria-live="polite"
        >
          {status === 'open' ? 'Otvorené' : 'Zatvorené'}
        </span>
      </div>
    </div>
  );
};

export default OpeningHours;