using System;
using System.Collections.Generic;
using System.Linq;

namespace Asc_Time_Tracker.Models
{
    public class IndexViewModel
    {
        public TimeLog TimeLog { get; set; }

        public IQueryable<TimeLog> TimeLogs { get; set; }

        public IndexViewModel(IQueryable<TimeLog> timeLogs)
        {
            TimeLogs = timeLogs;
        }

        /// <summary>
        /// Take an IQueryable of TimeLogs and return the ones with the given
        /// employee id (usually their email).
        /// </summary>
        public static IQueryable<TimeLog> FilterTimeLogsByEmpIds(
            IQueryable<TimeLog> timeLogs,
            IEnumerable<string> empIds)
        {
            if (empIds.Contains("all"))
            {
                return timeLogs;
            }

            return timeLogs.Where(t => empIds.Contains(t.EmpId));
        }

        /// <summary>
        /// Take an IQueryable of TimeLogs and return the ones within the given time frame.
        /// </summary>
        public static IQueryable<TimeLog> FilterTimeLogsByDate(
            IQueryable<TimeLog> timeLogs,
            DateTime? startDate,
            DateTime? endDate)
        {
            if (startDate == null || endDate == null)
            {
                return Enumerable.Empty<TimeLog>().AsQueryable();
            }
            // Set hours back to 0 (since Javascript sends them through with timezone adjustment).
            DateTime convStart = (DateTime)startDate;
            DateTime convEnd = (DateTime)endDate;
            startDate = new DateTime(convStart.Year, convStart.Month, convStart.Day,
                0, 0, 0);
            endDate = new DateTime(convEnd.Year, convEnd.Month, convEnd.Day,
                0, 0, 0);

            // Filter by date.
            return timeLogs.Where(t =>
                t.Date >= startDate &&
                t.Date < endDate);
        }

        /// <summary>
        /// Take an IQueryable of TimeLogs and return them in sorted order of
        /// time spent, descending, up to the given limit.
        /// </summary>
        public static IQueryable<TimeLog> TakeTopXTimeLogs(IQueryable<TimeLog> timeLogs, int limit)
        {
            return timeLogs.GroupBy(t => t.JobNum)
                .Select(tg => new TimeLog
                {
                    JobNum = tg.Key,
                    Time = tg.Sum(t => t.Time)
                })
                .Where(t => t.JobNum != null)  // Skip null job num logs
                .OrderByDescending(t => t.Time)
                .Take(limit);
        }
    }
}