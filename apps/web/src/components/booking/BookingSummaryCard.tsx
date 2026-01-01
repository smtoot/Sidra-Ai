import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Calendar, Clock, User, BookOpen, DollarSign, FileText, Globe, Info } from 'lucide-react';
import { formatCurrency } from './formatUtils';

interface BookingSummaryCardProps {
    teacherName: string;
    subjectName: string;
    childName?: string;
    selectedDate: Date;
    selectedTime: string;
    price: number;
    bookingType: string;
    notes?: string;
    userTimezone?: string;
}

export function BookingSummaryCard({
    teacherName,
    subjectName,
    childName,
    selectedDate,
    selectedTime,
    price,
    bookingType,
    notes,
    userTimezone
}: BookingSummaryCardProps) {
    return (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="bg-gray-50/50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <h4 className="font-semibold text-gray-900 text-sm">بيانات الحجز</h4>
            </div>

            <div className="p-4 space-y-4">
                {/* Main Details Grid */}
                <div className="grid grid-cols-1 gap-3">
                    <SummaryRow
                        icon={<User className="w-3.5 h-3.5 text-gray-500" />}
                        label="المعلم"
                        value={teacherName}
                    />

                    <SummaryRow
                        icon={<BookOpen className="w-3.5 h-3.5 text-gray-500" />}
                        label="المادة"
                        value={subjectName}
                    />

                    {childName && (
                        <SummaryRow
                            icon={<User className="w-3.5 h-3.5 text-gray-500" />}
                            label="الطالب"
                            value={childName}
                        />
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <SummaryRow
                            icon={<Calendar className="w-3.5 h-3.5 text-gray-500" />}
                            label="التاريخ"
                            value={format(selectedDate, 'EEEE، d MMMM', { locale: ar })}
                        />
                        <SummaryRow
                            icon={<Clock className="w-3.5 h-3.5 text-gray-500" />}
                            label="الوقت"
                            value={selectedTime}
                        />
                    </div>

                    {userTimezone && (
                        <div className="flex items-center gap-1.5 text-xs bg-gray-50 text-gray-500 px-2 py-1.5 rounded-md w-fit">
                            <Globe className="w-3 h-3" />
                            <span>الموعد بتوقيت: {userTimezone}</span>
                        </div>
                    )}

                    <SummaryRow
                        icon={<FileText className="w-3.5 h-3.5 text-gray-500" />}
                        label="نوع الحجز"
                        value={bookingType}
                    />
                </div>

                {notes && (
                    <div className="bg-gray-50 rounded-lg p-3 text-xs">
                        <span className="font-medium text-gray-700 block mb-1">ملاحظات:</span>
                        <p className="text-gray-600 leading-relaxed">{notes}</p>
                    </div>
                )}

                {/* Price Section - Cleaner & Reassuring */}
                <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">
                            الإجمالي المستحق لاحقًا
                        </span>
                        <span className={`text-base font-bold ${price === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                            {price === 0 ? 'مجاناً' : formatCurrency(price).replace('SDG', '') + ' SDG'}
                        </span>
                    </div>
                </div>

                {/* Reassurance Message - Blue Style */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                        لن يتم خصم أي مبلغ قبل موافقة المعلم على الحجز.
                    </p>
                </div>
            </div>
        </div>
    );
}

interface SummaryRowProps {
    icon: React.ReactNode;
    label: string;
    value: string;
}

function SummaryRow({ icon, label, value }: SummaryRowProps) {
    return (
        <div className="flex items-center gap-3 min-h-[24px]">
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-50 shrink-0">
                {icon}
            </div>
            <div className="flex items-center gap-2 flex-1">
                <span className="text-xs text-gray-500 w-12 shrink-0">{label}</span>
                <span className="text-sm font-medium text-gray-900 truncate">{value}</span>
            </div>
        </div>
    );
}
