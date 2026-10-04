import dayGridPlugin from '@fullcalendar/vue3/daygrid'
import listPlugin from '@fullcalendar/vue3/list'
import timeGridPlugin from '@fullcalendar/vue3/timegrid'
import type { CalendarOptions } from '@fullcalendar/vue3'

export const adminCalendarOptions: CalendarOptions = {
  plugins: [dayGridPlugin, timeGridPlugin, listPlugin],
  initialView: 'dayGridMonth',
  timeZone: 'Asia/Makassar',
  locale: 'id',
  firstDay: 1,
  height: 'auto',
  headerToolbar: {
    start: 'prev,next today',
    center: 'title',
    end: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
  },
}
