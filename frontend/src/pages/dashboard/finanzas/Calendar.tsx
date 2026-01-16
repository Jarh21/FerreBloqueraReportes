// Calendar.tsx
import React, { useState } from 'react';
import { useAuth } from "../../../context/AuthContext";
import { useNavigate  } from 'react-router-dom';

const Calendar: React.FC = () => {
    const { usuario, empresaActual, empresas } = useAuth();
    const navigate = useNavigate();
    
    const [currentDate, setCurrentDate] = useState(new Date());

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const handleDayClick = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        navigate(`/dashboard/finanzas/arqueo/${dateStr}/${empresaActual?.id}`);
    };

    const renderCalendar = () => {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const daysInMonth = monthEnd.getDate();
        
        const startDay = monthStart.getDay();
        const calendar: (Date | null)[][] = Array.from({ length: 6 }, () => Array(7).fill(null));

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            const week = Math.floor((startDay + i - 1) / 7);
            const day = (startDay + i - 1) % 7;
            calendar[week][day] = date;
        }

        return calendar;
    };

    const calendar = renderCalendar();
    const today = new Date();

    return (
        <div className="p-6 bg-white rounded-2xl shadow-xl max-w-4xl mx-auto border border-gray-100">
  {/* Header del Calendario */}
  <div className="flex items-center justify-between mb-8">
    <button 
      className="p-2 rounded-full hover:bg-red-50 text-red-600 transition-colors duration-200 border border-red-100"
      onClick={handlePrevMonth}
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    <h2 className="text-3xl font-extrabold text-gray-800 capitalize">
      {currentDate.toLocaleString('default', { month: 'long' })} 
      <span className="text-red-600 ml-2">{currentDate.getFullYear()}</span>
    </h2>

    <button 
      className="p-2 rounded-full hover:bg-red-50 text-red-600 transition-colors duration-200 border border-red-100"
      onClick={handleNextMonth}
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>

  {/* Contenedor del Calendario */}
  <div className="overflow-hidden rounded-xl border border-gray-200">
    <table className="min-w-full border-collapse">
      <thead>
        <tr className="bg-red-600">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <th key={day} className="p-4 text-sm font-bold text-white uppercase tracking-widest border-b border-red-700">
              {day}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white">
        {calendar.map((week, weekIndex) => (
          <tr key={weekIndex} className="border-b border-gray-100 last:border-0">
            {week.map((day, dayIndex) => {
              const isToday = day && day.toDateString() === today.toDateString();
              return (
                <td
                  key={dayIndex}
                  onClick={() => day && handleDayClick(day)}
                  className={`
                    relative h-24 p-2 text-center cursor-pointer transition-all duration-200
                    ${!day ? 'bg-gray-50' : 'hover:bg-yellow-50'}
                    ${dayIndex === 0 || dayIndex === 6 ? 'text-red-400' : 'text-gray-600'}
                  `}
                >
                  {day && (
                    <div className="flex flex-col items-center h-full">
                      <span className={`
                        w-10 h-10 flex items-center justify-center rounded-full text-lg font-semibold
                        ${isToday ? 'bg-yellow-300 text-black shadow-md ring-2 ring-red-600/20' : 'group-hover:text-red-600'}
                      `}>
                        {day.getDate()}
                      </span>
                      
                      {/* Indicador visual de eventos (opcional) */}
                      {isToday && (
                        <span className="mt-1 text-[10px] font-bold text-red-600 uppercase italic">Hoy</span>
                      )}
                    </div>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
    );
};

export default Calendar;