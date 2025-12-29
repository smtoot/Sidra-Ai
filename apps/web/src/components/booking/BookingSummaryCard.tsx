import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Calendar, Clock, User, BookOpen, DollarSign, FileText, Globe } from 'lucide-react';

interface BookingSummaryCardProps {
    teacherName: string;
    subjectName: string;
    childName?: string;
    selectedDate: Date;
    selectedTime: string;
    price: number;
    bookingType: string;
    notes?: string;
    userTimezone?: string; // Add timezone display
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
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-primary/20 rounded-xl p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-primary/20 pb-3">
                <FileText className="w-5 h-5 text-primary" />
                <h4 className="font-bold text-primary">ملخص الحجز</h4>
            </div>

            {/* Details */}
            <div className="space-y-3">
                <SummaryRow
                    icon={<User className="w-4 h-4 text-gray-600" />}
                    label="المعلم"
                    value={teacherName}
                />

                <SummaryRow
                    icon={<BookOpen className="w-4 h-4 text-gray-600" />}
                    label="المادة"
                    value={subjectName}
                />

                {childName && (
                    <SummaryRow
                        icon={<User className="w-4 h-4 text-gray-600" />}
                        label="الطالب"
                        value={childName}
                    />
                )}

                <SummaryRow
                    icon={<Calendar className="w-4 h-4 text-gray-600" />}
                    label="التاريخ"
                    value={format(selectedDate, 'EEEE، d MMMM yyyy', { locale: ar })}
                />

                <SummaryRow
                    icon={<Clock className="w-4 h-4 text-gray-600" />}
                    label="الوقت"
                    value={selectedTime}
                />

                {userTimezone && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                        <div className="flex items-center gap-2 text-xs">
                            <Globe className="w-3 h-3 text-amber-700" />
                            <span className="text-amber-800">
                                <span className="font-semibold">توقيتك:</span> {userTimezone}
                            </span>
                        </div>
                    </div>
                )}

                <SummaryRow
                    icon={<FileText className="w-4 h-4 text-gray-600" />}
                    label="نوع الحجز"
                    value={bookingType}
                />

                {notes && (
                    <div className="pt-2 border-t border-primary/10">
                        <p className="text-xs text-gray-600 mb-1">الملاحظات:</p>
                        <p className="text-sm text-gray-800 bg-white/50 p-2 rounded">{notes}</p>
                    </div>
                )}

                {/* Price */}
                <div className="pt-3 border-t-2 border-primary/20 flex items-center justify-between">
                    <span className="font-bold text-gray-900 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        الإجمالي:
                    </span>
                    <span className="text-2xl font-bold text-primary font-mono">
                        {price === 0 ? 'مجاناً' : `${price.toLocaleString()} SDG`}
                    </span>
                </div>
            </div>

            {/* Confirmation Note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                <p className="font-medium mb-1">📌 ملاحظة مهمة:</p>
                <p>سيتم إرسال طلب الحجز للمعلم. سيصلك إشعار بمجرد الموافقة على الطلب.</p>
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
        <div className="flex items-start gap-3">
            <div className="mt-0.5">{icon}</div>
            <div className="flex-1">
                <p className="text-xs text-gray-600">{label}</p>
                <p className="text-sm font-semibold text-gray-900">{value}</p>
            </div>
        </div>
    );
}
