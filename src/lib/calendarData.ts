import { SubjectRecord, DatewiseSubjectLog } from "./types";

export interface PeriodDetail {
  periodNumber: number;
  timeSlot?: string;
  subjectCode: string;
  subjectName: string;
  isLab: boolean;
  held: number;
  present: number;
  status?: "P" | "A";
  source?: "erp" | "manual" | "forecast";
}

export interface DayAttendanceLog {
  dateStr: string; // "2026-11-19"
  displayDate: string; // "19 Nov"
  dayNumber: number; // 19
  dayName: string; // "Thursday"
  dayShort: string; // "Thu"
  isWeekend: boolean;
  isHoliday: boolean;
  holidayReason?: string;
  isToday: boolean;
  isFuture: boolean;
  isExamDay: boolean;
  totalHeld: number;
  totalPresent: number;
  isVerifiedERP?: boolean;
  periods: PeriodDetail[];
}

// Ground-truth verified attendance from ABES College ERP records
const VERIFIED_ERP_NOVEMBER_LOGS: Record<string, PeriodDetail[]> = {
  "2026-11-16": [
    { periodNumber: 1, subjectCode: "25VA351", subjectName: "Web Designing Workshop-III", isLab: true, held: 2, present: 0, status: "A", source: "erp" },
    { periodNumber: 3, subjectCode: "25VA309", subjectName: "Employability Skills", isLab: false, held: 2, present: 2, status: "P", source: "erp" },
    { periodNumber: 5, subjectCode: "25AS301", subjectName: "Applied Maths for Computing", isLab: false, held: 1, present: 0, status: "A", source: "erp" },
    { periodNumber: 6, subjectCode: "25VA302", subjectName: "Fundamentals of Cloud Computing", isLab: true, held: 2, present: 0, status: "A", source: "erp" },
    { periodNumber: 8, subjectCode: "25CS303", subjectName: "Advanced Data Structures using C++", isLab: false, held: 1, present: 0, status: "A", source: "erp" },
  ],
  "2026-11-17": [
    { periodNumber: 1, subjectCode: "25VA309", subjectName: "Employability Skills", isLab: false, held: 1, present: 1, status: "P", source: "erp" },
    { periodNumber: 2, subjectCode: "25HU301", subjectName: "Universal Human Values", isLab: false, held: 1, present: 1, status: "P", source: "erp" },
    { periodNumber: 3, subjectCode: "25AS301", subjectName: "Applied Maths for Computing", isLab: false, held: 1, present: 0, status: "A", source: "erp" },
    { periodNumber: 4, subjectCode: "25CS302", subjectName: "Operating System", isLab: false, held: 1, present: 1, status: "P", source: "erp" },
    { periodNumber: 5, subjectCode: "25CS302", subjectName: "Operating System", isLab: false, held: 1, present: 0, status: "A", source: "erp" },
    { periodNumber: 6, subjectCode: "25CS301", subjectName: "OOPS with C++", isLab: false, held: 1, present: 1, status: "P", source: "erp" },
  ],
  "2026-11-18": [
    { periodNumber: 1, subjectCode: "25CS351", subjectName: "OOPS with C++ Lab", isLab: true, held: 2, present: 2, status: "P", source: "erp" },
    { periodNumber: 3, subjectCode: "25HU301", subjectName: "Universal Human Values", isLab: false, held: 1, present: 1, status: "P", source: "erp" },
    { periodNumber: 4, subjectCode: "25AS301", subjectName: "Applied Maths for Computing", isLab: false, held: 1, present: 1, status: "P", source: "erp" },
    { periodNumber: 5, subjectCode: "25CS352", subjectName: "Operating System Lab", isLab: true, held: 2, present: 2, status: "P", source: "erp" },
  ],
  "2026-11-19": [
    { periodNumber: 1, subjectCode: "25VA301", subjectName: "Data Visualization using Python", isLab: false, held: 1, present: 1, status: "P", source: "erp" },
    { periodNumber: 2, subjectCode: "25HU301", subjectName: "Universal Human Values", isLab: false, held: 1, present: 0, status: "A", source: "erp" },
    { periodNumber: 3, subjectCode: "25AS301", subjectName: "Applied Maths for Computing", isLab: false, held: 1, present: 1, status: "P", source: "erp" },
    { periodNumber: 4, subjectCode: "25CS302", subjectName: "Operating System", isLab: false, held: 1, present: 0, status: "A", source: "erp" },
    { periodNumber: 5, subjectCode: "25CS301", subjectName: "OOPS with C++", isLab: false, held: 1, present: 1, status: "P", source: "erp" },
  ],
};

export function getNovemberAttendanceSchedule(
  todaySubjects: SubjectRecord[] = [],
  liveErpDatewise: Record<string, DatewiseSubjectLog[]> = {}
): DayAttendanceLog[] {
  // Construct today's dynamic breakdown
  // 1. Start with verified ERP records uploaded so far for today (19 Nov)
  const erpTodayRaw = liveErpDatewise["2026-11-19"] || [];
  let todayBasePeriods: PeriodDetail[] = [];

  if (erpTodayRaw.length > 0) {
    let pNum = 1;
    todayBasePeriods = erpTodayRaw.map((r) => {
      const p: PeriodDetail = {
        periodNumber: pNum,
        subjectCode: r.code,
        subjectName: r.name,
        isLab: !!r.isLab,
        held: r.held,
        present: r.present,
        status: r.status,
        source: "erp",
      };
      pNum += r.held;
      return p;
    });
  } else {
    // Fallback to verified ERP baseline for 19 Nov
    todayBasePeriods = [...VERIFIED_ERP_NOVEMBER_LOGS["2026-11-19"]];
  }

  // 2. Append any extra classes marked locally by student in TodayPeriodTracker
  const locallyTrackedPeriods: PeriodDetail[] = [];
  let nextPeriodNumber = todayBasePeriods.reduce((acc, p) => acc + p.held, 1);

  for (const s of todaySubjects) {
    const sHeld = s.todayHeld || 0;
    const sPres = s.todayPresent || 0;
    if (sHeld > 0) {
      locallyTrackedPeriods.push({
        periodNumber: nextPeriodNumber,
        subjectCode: s.code,
        subjectName: s.name,
        isLab: !!s.isLab,
        held: sHeld,
        present: sPres,
        status: sPres === sHeld ? "P" : sPres === 0 ? "A" : undefined,
        source: "manual",
      });
      nextPeriodNumber += sHeld;
    }
  }

  const combinedTodayPeriods = [...todayBasePeriods, ...locallyTrackedPeriods];
  const todayTotalHeld = combinedTodayPeriods.reduce((acc, p) => acc + p.held, 0);
  const todayTotalPres = combinedTodayPeriods.reduce((acc, p) => acc + p.present, 0);

  // Helper to resolve day periods
  const getPeriodsForDate = (dateStr: string, fallback: PeriodDetail[]): { periods: PeriodDetail[]; isVerified: boolean } => {
    const erpList = liveErpDatewise[dateStr];
    if (erpList && erpList.length > 0) {
      let pNum = 1;
      const mapped = erpList.map((r) => {
        const item: PeriodDetail = {
          periodNumber: pNum,
          subjectCode: r.code,
          subjectName: r.name,
          isLab: !!r.isLab,
          held: r.held,
          present: r.present,
          status: r.status,
          source: "erp",
        };
        pNum += r.held;
        return item;
      });
      return { periods: mapped, isVerified: true };
    }
    return { periods: fallback, isVerified: true };
  };

  const day16 = getPeriodsForDate("2026-11-16", VERIFIED_ERP_NOVEMBER_LOGS["2026-11-16"]);
  const day17 = getPeriodsForDate("2026-11-17", VERIFIED_ERP_NOVEMBER_LOGS["2026-11-17"]);
  const day18 = getPeriodsForDate("2026-11-18", VERIFIED_ERP_NOVEMBER_LOGS["2026-11-18"]);

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
      totalHeld: day16.periods.reduce((a, b) => a + b.held, 0),
      totalPresent: day16.periods.reduce((a, b) => a + b.present, 0),
      isVerifiedERP: day16.isVerified,
      periods: day16.periods,
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
      totalHeld: day17.periods.reduce((a, b) => a + b.held, 0),
      totalPresent: day17.periods.reduce((a, b) => a + b.present, 0),
      isVerifiedERP: day17.isVerified,
      periods: day17.periods,
    },
    // Wed 18 Nov
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
      totalHeld: day18.periods.reduce((a, b) => a + b.held, 0),
      totalPresent: day18.periods.reduce((a, b) => a + b.present, 0),
      isVerifiedERP: day18.isVerified,
      periods: day18.periods,
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
      totalHeld: todayTotalHeld,
      totalPresent: todayTotalPres,
      isVerifiedERP: true,
      periods: combinedTodayPeriods,
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
        { periodNumber: 1, subjectCode: "25CS301", subjectName: "OOPS with C++", isLab: false, held: 1, present: 1, source: "forecast" },
        { periodNumber: 2, subjectCode: "25CS302", subjectName: "Operating System", isLab: false, held: 1, present: 1, source: "forecast" },
        { periodNumber: 3, subjectCode: "25AS301", subjectName: "Applied Maths for Computing", isLab: false, held: 1, present: 1, source: "forecast" },
        { periodNumber: 4, subjectCode: "25CS303", subjectName: "Advanced Data Structures", isLab: false, held: 1, present: 1, source: "forecast" },
        { periodNumber: 5, subjectCode: "25CS352", subjectName: "Operating System Lab", isLab: true, held: 2, present: 2, source: "forecast" },
        { periodNumber: 7, subjectCode: "25VA309", subjectName: "Employability Skills", isLab: false, held: 1, present: 1, source: "forecast" },
        { periodNumber: 8, subjectCode: "HCL Tech.", subjectName: "Industry Aptitude (HCL)", isLab: false, held: 1, present: 1, source: "forecast" },
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
        { periodNumber: 1, subjectCode: "25VA302", subjectName: "Fundamentals of Cloud Computing", isLab: true, held: 2, present: 2, source: "forecast" },
        { periodNumber: 3, subjectCode: "25AS301", subjectName: "Applied Maths for Computing", isLab: false, held: 1, present: 1, source: "forecast" },
        { periodNumber: 4, subjectCode: "25CS301", subjectName: "OOPS with C++", isLab: false, held: 1, present: 1, source: "forecast" },
        { periodNumber: 5, subjectCode: "25CS302", subjectName: "Operating System", isLab: false, held: 1, present: 1, source: "forecast" },
        { periodNumber: 6, subjectCode: "25HU301", subjectName: "Universal Human Values", isLab: false, held: 1, present: 1, source: "forecast" },
        { periodNumber: 7, subjectCode: "25CS353", subjectName: "ADS Lab", isLab: true, held: 2, present: 2, source: "forecast" },
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
        { periodNumber: 1, subjectCode: "25AS301", subjectName: "Applied Maths for Computing", isLab: false, held: 1, present: 1, source: "forecast" },
        { periodNumber: 2, subjectCode: "25CS301", subjectName: "OOPS with C++", isLab: false, held: 1, present: 1, source: "forecast" },
        { periodNumber: 3, subjectCode: "25CS302", subjectName: "Operating System", isLab: false, held: 1, present: 1, source: "forecast" },
        { periodNumber: 4, subjectCode: "25HU301", subjectName: "Universal Human Values", isLab: false, held: 1, present: 1, source: "forecast" },
        { periodNumber: 5, subjectCode: "25CS351", subjectName: "OOPS with C++ Lab", isLab: true, held: 2, present: 2, source: "forecast" },
        { periodNumber: 7, subjectCode: "25VA309", subjectName: "Employability Skills", isLab: false, held: 1, present: 1, source: "forecast" },
        { periodNumber: 8, subjectCode: "25CS303", subjectName: "Advanced Data Structures", isLab: false, held: 1, present: 1, source: "forecast" },
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
        { periodNumber: 1, subjectCode: "25CS301", subjectName: "OOPS with C++", isLab: false, held: 1, present: 1, source: "forecast" },
        { periodNumber: 2, subjectCode: "25CS302", subjectName: "Operating System", isLab: false, held: 1, present: 1, source: "forecast" },
        { periodNumber: 3, subjectCode: "25AS301", subjectName: "Applied Maths for Computing", isLab: false, held: 1, present: 1, source: "forecast" },
        { periodNumber: 4, subjectCode: "25CS303", subjectName: "Advanced Data Structures", isLab: false, held: 1, present: 1, source: "forecast" },
        { periodNumber: 5, subjectCode: "25CS352", subjectName: "Operating System Lab", isLab: true, held: 2, present: 2, source: "forecast" },
        { periodNumber: 7, subjectCode: "25VA351", subjectName: "Web Designing Workshop-III", isLab: true, held: 2, present: 2, source: "forecast" },
      ],
    },
    // Fri 27 Nov (Final Working Day before MT2)
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
        { periodNumber: 1, subjectCode: "25AS301", subjectName: "Applied Maths for Computing", isLab: false, held: 1, present: 1, source: "forecast" },
        { periodNumber: 2, subjectCode: "25CS301", subjectName: "OOPS with C++", isLab: false, held: 1, present: 1, source: "forecast" },
        { periodNumber: 3, subjectCode: "25CS302", subjectName: "Operating System", isLab: false, held: 1, present: 1, source: "forecast" },
        { periodNumber: 4, subjectCode: "25CS303", subjectName: "Advanced Data Structures", isLab: false, held: 1, present: 1, source: "forecast" },
        { periodNumber: 5, subjectCode: "25VA302", subjectName: "Fundamentals of Cloud Computing", isLab: true, held: 2, present: 2, source: "forecast" },
        { periodNumber: 7, subjectCode: "HCL Tech.", subjectName: "Industry Aptitude (HCL)", isLab: false, held: 1, present: 1, source: "forecast" },
        { periodNumber: 8, subjectCode: "25VA309", subjectName: "Employability Skills", isLab: false, held: 1, present: 1, source: "forecast" },
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
      holidayReason: "MT2 Midterm Examinations Begin",
      totalHeld: 0,
      totalPresent: 0,
      periods: [],
    },
  ];
}
