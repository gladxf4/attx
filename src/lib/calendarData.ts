import { SubjectRecord } from "./types";

export interface PeriodDetail {
  periodNumber: number;
  timeSlot: string;
  subjectCode: string;
  subjectName: string;
  isLab: boolean;
  held: number;
  present: number;
}

export interface DayAttendanceLog {
  dateStr: string; // "2026-11-18"
  displayDate: string; // "18 Nov"
  dayNumber: number; // 18
  dayName: string; // "Wednesday"
  dayShort: string; // "Wed"
  isWeekend: boolean;
  isHoliday: boolean;
  holidayReason?: string;
  isToday: boolean;
  isFuture: boolean;
  isExamDay: boolean;
  totalHeld: number;
  totalPresent: number;
  periods: PeriodDetail[];
}

export const TIME_SLOTS = [
  "09:00 - 09:50",
  "09:50 - 10:40",
  "10:40 - 11:30",
  "11:30 - 12:20",
  "01:10 - 02:00",
  "02:00 - 02:50",
  "02:50 - 03:40",
  "03:40 - 04:30",
];

// Reference historical timetable schedule for November 2026 (Semester III AIML-3A)
export function getNovemberAttendanceSchedule(
  todaySubjects: SubjectRecord[] = []
): DayAttendanceLog[] {
  // Compute today's dynamic breakdown if logged
  const todayHeld = todaySubjects.reduce((acc, s) => acc + (s.todayHeld || 0), 0);
  const todayPres = todaySubjects.reduce((acc, s) => acc + (s.todayPresent || 0), 0);

  const todayPeriods: PeriodDetail[] = [];
  let periodIdx = 1;

  for (const s of todaySubjects) {
    const sHeld = s.todayHeld || 0;
    const sPres = s.todayPresent || 0;
    if (sHeld > 0) {
      todayPeriods.push({
        periodNumber: periodIdx,
        timeSlot: TIME_SLOTS[Math.min(periodIdx - 1, 7)],
        subjectCode: s.code,
        subjectName: s.name,
        isLab: !!s.isLab,
        held: sHeld,
        present: sPres,
      });
      periodIdx += sHeld;
    }
  }

  // If no periods logged today yet, show default template for Thursday
  if (todayPeriods.length === 0) {
    todayPeriods.push(
      { periodNumber: 1, timeSlot: TIME_SLOTS[0], subjectCode: "25CS301", subjectName: "OOPS with C++", isLab: false, held: 1, present: 0 },
      { periodNumber: 2, timeSlot: TIME_SLOTS[1], subjectCode: "25CS302", subjectName: "Operating System", isLab: false, held: 1, present: 0 },
      { periodNumber: 3, timeSlot: TIME_SLOTS[2], subjectCode: "25AS301", subjectName: "Applied Maths for Computing", isLab: false, held: 1, present: 0 },
      { periodNumber: 4, timeSlot: TIME_SLOTS[3], subjectCode: "25CS303", subjectName: "Advanced Data Structures", isLab: false, held: 1, present: 0 },
      { periodNumber: 5, timeSlot: TIME_SLOTS[4], subjectCode: "25CS351", subjectName: "OOPS with C++ Lab", isLab: true, held: 2, present: 0 },
      { periodNumber: 7, timeSlot: TIME_SLOTS[6], subjectCode: "25VA309", subjectName: "Employability Skills", isLab: false, held: 1, present: 0 },
      { periodNumber: 8, timeSlot: TIME_SLOTS[7], subjectCode: "HCL Tech.", subjectName: "HCL Tech Industry Aptitude", isLab: false, held: 1, present: 0 }
    );
  }

  return [
    // Mon 16 Nov
    {
      dateStr: "2026-11-16",
      displayDate: "16 Nov",
      dayNumber: 16,
      dayName: "Monday",
      dayShort: "Mon",
      isWeekend: false,
      isHoliday: false,
      isToday: false,
      isFuture: false,
      isExamDay: false,
      totalHeld: 8,
      totalPresent: 7,
      periods: [
        { periodNumber: 1, timeSlot: TIME_SLOTS[0], subjectCode: "25VA302", subjectName: "Fundamentals of Cloud Computing", isLab: true, held: 2, present: 2 },
        { periodNumber: 3, timeSlot: TIME_SLOTS[2], subjectCode: "25AS301", subjectName: "Applied Maths for Computing", isLab: false, held: 1, present: 1 },
        { periodNumber: 4, timeSlot: TIME_SLOTS[3], subjectCode: "25CS301", subjectName: "OOPS with C++", isLab: false, held: 1, present: 1 },
        { periodNumber: 5, timeSlot: TIME_SLOTS[4], subjectCode: "25CS302", subjectName: "Operating System", isLab: false, held: 1, present: 0 },
        { periodNumber: 6, timeSlot: TIME_SLOTS[5], subjectCode: "25HU301", subjectName: "Universal Human Values", isLab: false, held: 1, present: 1 },
        { periodNumber: 7, timeSlot: TIME_SLOTS[6], subjectCode: "25CS353", subjectName: "ADS Lab", isLab: true, held: 2, present: 2 },
      ],
    },
    // Tue 17 Nov
    {
      dateStr: "2026-11-17",
      displayDate: "17 Nov",
      dayNumber: 17,
      dayName: "Tuesday",
      dayShort: "Tue",
      isWeekend: false,
      isHoliday: false,
      isToday: false,
      isFuture: false,
      isExamDay: false,
      totalHeld: 8,
      totalPresent: 7,
      periods: [
        { periodNumber: 1, timeSlot: TIME_SLOTS[0], subjectCode: "25CS303", subjectName: "Advanced Data Structures", isLab: false, held: 1, present: 1 },
        { periodNumber: 2, timeSlot: TIME_SLOTS[1], subjectCode: "25CS302", subjectName: "Operating System", isLab: false, held: 1, present: 0 },
        { periodNumber: 3, timeSlot: TIME_SLOTS[2], subjectCode: "25AS301", subjectName: "Applied Maths for Computing", isLab: false, held: 1, present: 1 },
        { periodNumber: 4, timeSlot: TIME_SLOTS[3], subjectCode: "25VA301", subjectName: "Data Visualization using Python", isLab: false, held: 1, present: 1 },
        { periodNumber: 5, timeSlot: TIME_SLOTS[4], subjectCode: "25VA351", subjectName: "Web Designing Workshop-III", isLab: true, held: 2, present: 2 },
        { periodNumber: 7, timeSlot: TIME_SLOTS[6], subjectCode: "25CS352", subjectName: "Operating System Lab", isLab: true, held: 2, present: 2 },
      ],
    },
    // Wed 18 Nov (Baseline Day)
    {
      dateStr: "2026-11-18",
      displayDate: "18 Nov",
      dayNumber: 18,
      dayName: "Wednesday",
      dayShort: "Wed",
      isWeekend: false,
      isHoliday: false,
      isToday: false,
      isFuture: false,
      isExamDay: false,
      totalHeld: 8,
      totalPresent: 6,
      periods: [
        { periodNumber: 1, timeSlot: TIME_SLOTS[0], subjectCode: "25AS301", subjectName: "Applied Maths for Computing", isLab: false, held: 1, present: 1 },
        { periodNumber: 2, timeSlot: TIME_SLOTS[1], subjectCode: "25CS301", subjectName: "OOPS with C++", isLab: false, held: 1, present: 1 },
        { periodNumber: 3, timeSlot: TIME_SLOTS[2], subjectCode: "25CS302", subjectName: "Operating System", isLab: false, held: 1, present: 1 },
        { periodNumber: 4, timeSlot: TIME_SLOTS[3], subjectCode: "25HU301", subjectName: "Universal Human Values", isLab: false, held: 1, present: 0 },
        { periodNumber: 5, timeSlot: TIME_SLOTS[4], subjectCode: "25CS351", subjectName: "OOPS with C++ Lab", isLab: true, held: 2, present: 2 },
        { periodNumber: 7, timeSlot: TIME_SLOTS[6], subjectCode: "25VA309", subjectName: "Employability Skills", isLab: false, held: 1, present: 1 },
        { periodNumber: 8, timeSlot: TIME_SLOTS[7], subjectCode: "25CS303", subjectName: "Advanced Data Structures", isLab: false, held: 1, present: 0 },
      ],
    },
    // Thu 19 Nov (Today)
    {
      dateStr: "2026-11-19",
      displayDate: "19 Nov",
      dayNumber: 19,
      dayName: "Thursday",
      dayShort: "Thu",
      isWeekend: false,
      isHoliday: false,
      isToday: true,
      isFuture: false,
      isExamDay: false,
      totalHeld: todayHeld > 0 ? todayHeld : 8,
      totalPresent: todayHeld > 0 ? todayPres : 0,
      periods: todayPeriods,
    },
    // Fri 20 Nov (Tomorrow - Forecast)
    {
      dateStr: "2026-11-20",
      displayDate: "20 Nov",
      dayNumber: 20,
      dayName: "Friday",
      dayShort: "Fri",
      isWeekend: false,
      isHoliday: false,
      isToday: false,
      isFuture: true,
      isExamDay: false,
      totalHeld: 8,
      totalPresent: 8,
      periods: [
        { periodNumber: 1, timeSlot: TIME_SLOTS[0], subjectCode: "25CS301", subjectName: "OOPS with C++", isLab: false, held: 1, present: 1 },
        { periodNumber: 2, timeSlot: TIME_SLOTS[1], subjectCode: "25CS302", subjectName: "Operating System", isLab: false, held: 1, present: 1 },
        { periodNumber: 3, timeSlot: TIME_SLOTS[2], subjectCode: "25AS301", subjectName: "Applied Maths for Computing", isLab: false, held: 1, present: 1 },
        { periodNumber: 4, timeSlot: TIME_SLOTS[3], subjectCode: "25CS303", subjectName: "Advanced Data Structures", isLab: false, held: 1, present: 1 },
        { periodNumber: 5, timeSlot: TIME_SLOTS[4], subjectCode: "25CS352", subjectName: "Operating System Lab", isLab: true, held: 2, present: 2 },
        { periodNumber: 7, timeSlot: TIME_SLOTS[6], subjectCode: "25VA309", subjectName: "Employability Skills", isLab: false, held: 1, present: 1 },
        { periodNumber: 8, timeSlot: TIME_SLOTS[7], subjectCode: "HCL Tech.", subjectName: "HCL Tech Industry Aptitude", isLab: false, held: 1, present: 1 },
      ],
    },
    // Sat 21 Nov (Weekend)
    {
      dateStr: "2026-11-21",
      displayDate: "21 Nov",
      dayNumber: 21,
      dayName: "Saturday",
      dayShort: "Sat",
      isWeekend: true,
      isHoliday: true,
      holidayReason: "Weekend",
      isToday: false,
      isFuture: true,
      isExamDay: false,
      totalHeld: 0,
      totalPresent: 0,
      periods: [],
    },
    // Sun 22 Nov (Weekend)
    {
      dateStr: "2026-11-22",
      displayDate: "22 Nov",
      dayNumber: 22,
      dayName: "Sunday",
      dayShort: "Sun",
      isWeekend: true,
      isHoliday: true,
      holidayReason: "Weekend",
      isToday: false,
      isFuture: true,
      isExamDay: false,
      totalHeld: 0,
      totalPresent: 0,
      periods: [],
    },
    // Mon 23 Nov
    {
      dateStr: "2026-11-23",
      displayDate: "23 Nov",
      dayNumber: 23,
      dayName: "Monday",
      dayShort: "Mon",
      isWeekend: false,
      isHoliday: false,
      isToday: false,
      isFuture: true,
      isExamDay: false,
      totalHeld: 8,
      totalPresent: 8,
      periods: [
        { periodNumber: 1, timeSlot: TIME_SLOTS[0], subjectCode: "25VA302", subjectName: "Cloud Computing", isLab: true, held: 2, present: 2 },
        { periodNumber: 3, timeSlot: TIME_SLOTS[2], subjectCode: "25AS301", subjectName: "Applied Maths", isLab: false, held: 1, present: 1 },
        { periodNumber: 4, timeSlot: TIME_SLOTS[3], subjectCode: "25CS301", subjectName: "OOPS with C++", isLab: false, held: 1, present: 1 },
        { periodNumber: 5, timeSlot: TIME_SLOTS[4], subjectCode: "25CS302", subjectName: "Operating System", isLab: false, held: 1, present: 1 },
        { periodNumber: 6, timeSlot: TIME_SLOTS[5], subjectCode: "25HU301", subjectName: "Universal Human Values", isLab: false, held: 1, present: 1 },
        { periodNumber: 7, timeSlot: TIME_SLOTS[6], subjectCode: "25CS353", subjectName: "ADS Lab", isLab: true, held: 2, present: 2 },
      ],
    },
    // Tue 24 Nov (Holiday)
    {
      dateStr: "2026-11-24",
      displayDate: "24 Nov",
      dayNumber: 24,
      dayName: "Tuesday",
      dayShort: "Tue",
      isWeekend: false,
      isHoliday: true,
      holidayReason: "Guru Tegh Bahadur Martyrdom Day",
      isToday: false,
      isFuture: true,
      isExamDay: false,
      totalHeld: 0,
      totalPresent: 0,
      periods: [],
    },
    // Wed 25 Nov
    {
      dateStr: "2026-11-25",
      displayDate: "25 Nov",
      dayNumber: 25,
      dayName: "Wednesday",
      dayShort: "Wed",
      isWeekend: false,
      isHoliday: false,
      isToday: false,
      isFuture: true,
      isExamDay: false,
      totalHeld: 8,
      totalPresent: 8,
      periods: [
        { periodNumber: 1, timeSlot: TIME_SLOTS[0], subjectCode: "25AS301", subjectName: "Applied Maths", isLab: false, held: 1, present: 1 },
        { periodNumber: 2, timeSlot: TIME_SLOTS[1], subjectCode: "25CS301", subjectName: "OOPS with C++", isLab: false, held: 1, present: 1 },
        { periodNumber: 3, timeSlot: TIME_SLOTS[2], subjectCode: "25CS302", subjectName: "Operating System", isLab: false, held: 1, present: 1 },
        { periodNumber: 4, timeSlot: TIME_SLOTS[3], subjectCode: "25HU301", subjectName: "Universal Human Values", isLab: false, held: 1, present: 1 },
        { periodNumber: 5, timeSlot: TIME_SLOTS[4], subjectCode: "25CS351", subjectName: "OOPS Lab", isLab: true, held: 2, present: 2 },
        { periodNumber: 7, timeSlot: TIME_SLOTS[6], subjectCode: "25VA309", subjectName: "Employability Skills", isLab: false, held: 1, present: 1 },
        { periodNumber: 8, timeSlot: TIME_SLOTS[7], subjectCode: "25CS303", subjectName: "ADS", isLab: false, held: 1, present: 1 },
      ],
    },
    // Thu 26 Nov
    {
      dateStr: "2026-11-26",
      displayDate: "26 Nov",
      dayNumber: 26,
      dayName: "Thursday",
      dayShort: "Thu",
      isWeekend: false,
      isHoliday: false,
      isToday: false,
      isFuture: true,
      isExamDay: false,
      totalHeld: 8,
      totalPresent: 8,
      periods: [
        { periodNumber: 1, timeSlot: TIME_SLOTS[0], subjectCode: "25CS301", subjectName: "OOPS with C++", isLab: false, held: 1, present: 1 },
        { periodNumber: 2, timeSlot: TIME_SLOTS[1], subjectCode: "25CS302", subjectName: "Operating System", isLab: false, held: 1, present: 1 },
        { periodNumber: 3, timeSlot: TIME_SLOTS[2], subjectCode: "25AS301", subjectName: "Applied Maths", isLab: false, held: 1, present: 1 },
        { periodNumber: 4, timeSlot: TIME_SLOTS[3], subjectCode: "25CS303", subjectName: "Advanced Data Structures", isLab: false, held: 1, present: 1 },
        { periodNumber: 5, timeSlot: TIME_SLOTS[4], subjectCode: "25CS352", subjectName: "OS Lab", isLab: true, held: 2, present: 2 },
        { periodNumber: 7, timeSlot: TIME_SLOTS[6], subjectCode: "25VA351", subjectName: "Web Designing Workshop", isLab: true, held: 2, present: 2 },
      ],
    },
    // Fri 27 Nov (Last Working Day before MT2)
    {
      dateStr: "2026-11-27",
      displayDate: "27 Nov",
      dayNumber: 27,
      dayName: "Friday",
      dayShort: "Fri",
      isWeekend: false,
      isHoliday: false,
      isToday: false,
      isFuture: true,
      isExamDay: false,
      totalHeld: 8,
      totalPresent: 8,
      periods: [
        { periodNumber: 1, timeSlot: TIME_SLOTS[0], subjectCode: "25AS301", subjectName: "Applied Maths", isLab: false, held: 1, present: 1 },
        { periodNumber: 2, timeSlot: TIME_SLOTS[1], subjectCode: "25CS301", subjectName: "OOPS with C++", isLab: false, held: 1, present: 1 },
        { periodNumber: 3, timeSlot: TIME_SLOTS[2], subjectCode: "25CS302", subjectName: "Operating System", isLab: false, held: 1, present: 1 },
        { periodNumber: 4, timeSlot: TIME_SLOTS[3], subjectCode: "25CS303", subjectName: "ADS", isLab: false, held: 1, present: 1 },
        { periodNumber: 5, timeSlot: TIME_SLOTS[4], subjectCode: "25VA302", subjectName: "Cloud Computing", isLab: true, held: 2, present: 2 },
        { periodNumber: 7, timeSlot: TIME_SLOTS[6], subjectCode: "HCL Tech.", subjectName: "HCL Tech", isLab: false, held: 1, present: 1 },
        { periodNumber: 8, timeSlot: TIME_SLOTS[7], subjectCode: "25VA309", subjectName: "Employability Skills", isLab: false, held: 1, present: 1 },
      ],
    },
    // Sat 28 Nov (Weekend)
    {
      dateStr: "2026-11-28",
      displayDate: "28 Nov",
      dayNumber: 28,
      dayName: "Saturday",
      dayShort: "Sat",
      isWeekend: true,
      isHoliday: true,
      holidayReason: "Weekend",
      isToday: false,
      isFuture: true,
      isExamDay: false,
      totalHeld: 0,
      totalPresent: 0,
      periods: [],
    },
    // Sun 29 Nov (Weekend)
    {
      dateStr: "2026-11-29",
      displayDate: "29 Nov",
      dayNumber: 29,
      dayName: "Sunday",
      dayShort: "Sun",
      isWeekend: true,
      isHoliday: true,
      holidayReason: "Weekend",
      isToday: false,
      isFuture: true,
      isExamDay: false,
      totalHeld: 0,
      totalPresent: 0,
      periods: [],
    },
    // Mon 30 Nov (MT2 Exam Begins)
    {
      dateStr: "2026-11-30",
      displayDate: "30 Nov",
      dayNumber: 30,
      dayName: "Monday",
      dayShort: "Mon",
      isWeekend: false,
      isHoliday: false,
      isToday: false,
      isFuture: true,
      isExamDay: true,
      holidayReason: "MT2 Examinations Start",
      totalHeld: 0,
      totalPresent: 0,
      periods: [],
    },
  ];
}
