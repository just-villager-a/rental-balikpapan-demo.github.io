import dayGridPlugin from '@fullcalendar/vue3/daygrid'
import listPlugin from '@fullcalendar/vue3/list'
import timeGridPlugin from '@fullcalendar/vue3/timegrid'
import classicThemePlugin from '@fullcalendar/vue3/themes/classic'
import type { CalendarOptions } from '@fullcalendar/vue3'

export const adminCalendarOptions: CalendarOptions = {
  plugins: [classicThemePlugin, dayGridPlugin, timeGridPlugin, listPlugin],
  initialView: 'dayGridMonth',
  timeZone: 'Asia/Makassar',
  locale: 'id',
  firstDay: 1,
  headerToolbar: {
    start: 'prev,next today',
    center: 'title',
    end: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
  },
}
