import { Box } from "@chakra-ui/react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function CalendarComponent({
    events,
    date,
    setDate,
    viewMode,
    setViewMode,
    getEventsForDate,
    getEventsForMonth,
    setSelectedEvent,
    children,
}) {
    const handleDateChange = (newDate) => {
        setDate(newDate);
        setViewMode("date");
    };

    const handleActiveDateChange = ({ activeStartDate }) => {
        setDate(new Date(activeStartDate.getFullYear(), activeStartDate.getMonth(), 1));
        setViewMode("month");
    };

    return (
        <Box
        width="360px"
        bg="gray.50"
        borderLeft="4px solid #e2e8f0"
        p={4}
        overflowY="auto"
        >
        <Calendar
            onChange={handleDateChange}
            onActiveStartDateChange={handleActiveDateChange}
            value={date}
            locale="id-ID"
            tileClassName={({ date: tileDate }) => {
            const today = new Date();
            const isToday = new Date(tileDate).toDateString() === new Date(today).toDateString();
            const hasEvents = events.some((event) => {
                if (!event.dateRange || !Array.isArray(event.dateRange)) {
                return false;
                }
                return event.dateRange.some((eventDate) => {
                return (
                    eventDate.getDate() === tileDate.getDate() &&
                    eventDate.getMonth() === tileDate.getMonth() &&
                    eventDate.getFullYear() === tileDate.getFullYear()
                );
                });
            });
            const classes = [];
            if (isToday) classes.push("highlight");
            if (hasEvents) classes.push("has-events");
            return classes.join(" ");
            }}
        />
        <style jsx>{`
            .react-calendar {
            width: 100%;
            border: none;
            font-family: inherit;
            background: white;
            borderRadius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .react-calendar__tile {
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            position: relative;
            color: #2d3748;
            }
            .react-calendar__tile--now {
            background: #edf2f7;
            color: #2b6cb0;
            }
            .react-calendar__tile:global(.highlight) {
            background: #edf2f7;
            color: #2b6cb0;
            }
            .react-calendar__tile:global(.has-events):after {
            content: '';
            width: 6px;
            height: 6px;
            background: #2b6cb0;
            border-radius: 50%;
            position: absolute;
            bottom: 4px;
            }
            .react-calendar__navigation button {
            color: #2b6cb0;
            font-weight: bold;
            }
            .react-calendar__month-view__days__day--neighboringMonth {
            color: #a0aec0;
            }
            .react-calendar__tile:hover {
            background-color: #e2e8f0;
            color: #2d3748;
            }
            .react-calendar__tile--active {
            background-color: #e2e8f0;
            color: #2d3748;
            }
        `}</style>
        <Box mt={4}>{children}</Box>
        </Box>
    );
}