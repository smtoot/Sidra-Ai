import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar as CalendarIcon, Download, ExternalLink } from 'lucide-react';

interface AddToCalendarProps {
    title: string;
    description: string;
    location: string;
    startTime: Date | string;
    endTime: Date | string;
}

// Helper: Format date for Google/Yahoo/Outlook (YYYYMMDDTHHmmssZ)
const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
};

// Helper: Generate and download ICS (Pure logic moved outside component)
const generateAndDownloadIcs = (title: string, description: string, location: string, start: Date, end: Date) => {
    const uid = `sidra-booking-${Date.now()}@sidra.com`;
    const now = formatDate(new Date());

    // Proper escaping for ICS text fields
    const escapeText = (text: string) =>
        text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Sidra//EdTech//EN',
        'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${now}`,
        `DTSTART:${formatDate(start)}`,
        `DTEND:${formatDate(end)}`,
        `SUMMARY:${escapeText(title)}`,
        `DESCRIPTION:${escapeText(description)}`,
        `LOCATION:${escapeText(location)}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sidra-session.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export function AddToCalendar({ title, description, location, startTime, endTime }: AddToCalendarProps) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    // 1. Google Calendar URL
    const googleUrl = new URL('https://calendar.google.com/calendar/render');
    googleUrl.searchParams.append('action', 'TEMPLATE');
    googleUrl.searchParams.append('text', title);
    googleUrl.searchParams.append('dates', `${formatDate(start)}/${formatDate(end)}`);
    googleUrl.searchParams.append('details', description);
    googleUrl.searchParams.append('location', location);

    // 2. Outlook.com URL
    const outlookUrl = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
    outlookUrl.searchParams.append('path', '/calendar/action/compose');
    outlookUrl.searchParams.append('rru', 'addevent');
    outlookUrl.searchParams.append('startdt', start.toISOString());
    outlookUrl.searchParams.append('enddt', end.toISOString());
    outlookUrl.searchParams.append('subject', title);
    outlookUrl.searchParams.append('body', description);
    outlookUrl.searchParams.append('location', location);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto h-11" dir="ltr">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Add to Calendar
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white">
                <DropdownMenuItem asChild>
                    <a href={googleUrl.toString()} target="_blank" rel="noopener noreferrer" className="flex items-center cursor-pointer">
                        <ExternalLink className="w-3 h-3 mr-2 opacity-50" />
                        Google Calendar
                    </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <a href={outlookUrl.toString()} target="_blank" rel="noopener noreferrer" className="flex items-center cursor-pointer">
                        <ExternalLink className="w-3 h-3 mr-2 opacity-50" />
                        Outlook.com
                    </a>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => generateAndDownloadIcs(title, description, location, start, end)} className="cursor-pointer">
                    <Download className="w-3 h-3 mr-2 opacity-50" />
                    Apple / Other (ICS)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
