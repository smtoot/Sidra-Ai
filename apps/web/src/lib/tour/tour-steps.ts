import type { DriveStep } from 'driver.js';

export type UserRole = 'TEACHER' | 'PARENT' | 'STUDENT';
export type TourTriggerSource = 'auto' | 'manual';

type CompletionHandler = (destination: string) => Promise<void>;

export function getTourSteps(
  role: UserRole,
  isMobile: boolean,
  onComplete: CompletionHandler
): DriveStep[] {
  const baseSteps = getBaseSteps(isMobile);
  const roleSteps = getRoleSpecificSteps(role, isMobile, onComplete);

  return [...baseSteps, ...roleSteps];
}

function getBaseSteps(isMobile: boolean): DriveStep[] {
  return [
    {
      element: '[data-tour="nav-dashboard"]',
      popover: {
        title: 'مرحباً بك في سدرة! 👋',
        description: 'هذي لوحة التحكم الخاصة فيك. خلّينا نعرفك عليها بسرعة.'
      }
    }
  ];
}

function getRoleSpecificSteps(
  role: UserRole,
  isMobile: boolean,
  onComplete: CompletionHandler
): DriveStep[] {
  switch (role) {
    case 'TEACHER':
      return getTeacherSteps(isMobile, onComplete);
    case 'PARENT':
      return getParentSteps(isMobile, onComplete);
    case 'STUDENT':
      return getStudentSteps(isMobile, onComplete);
    default:
      return [];
  }
}

function getTeacherSteps(isMobile: boolean, onComplete: CompletionHandler): DriveStep[] {
  return [
    {
      element: '[data-tour="nav-dashboard"]',
      popover: {
        title: 'لوحة التحكم',
        description: 'هنا تشوف ملخص يومك: الحصص الجاية، الأرباح، والإشعارات المهمة.'
      }
    },
    {
      element: '[data-tour="nav-availability"]',
      popover: {
        title: 'مواعيد التوفّر ⭐',
        description: 'أهم خطوة! حدد الأوقات البتكون متاح فيها عشان الطلاب يقدرون يحجزون معك.'
      }
    },
    {
      element: '[data-tour="nav-lessons"]',
      popover: {
        title: 'حصصي',
        description: 'هنا تلاقي كل حجوزاتك - الجاية والماضية. تقدر تبدأ الحصة أو تشوف التفاصيل.'
      }
    },
    {
      element: '[data-tour="nav-wallet"]',
      popover: {
        title: 'المحفظة',
        description: 'تابع أرباحك واطلب سحب رصيدك بسهولة.'
      }
    },
    {
      element: '[data-tour="nav-profile"]',
      popover: {
        title: 'الملف الشخصي',
        description: 'عدّل بياناتك، خبراتك، وأسعارك. ملف كامل = ثقة أكثر من الطلاب!'
      }
    },
    {
      element: '[data-tour="nav-help"]',
      popover: {
        title: 'المساعدة',
        description: 'محتاج مساعدة؟ تواصل معنا في أي وقت. وتقدر تعيد الجولة من هنا!'
      }
    },
    {
      // Final step - CTA with explicit completion
      element: '[data-tour="nav-availability"]',
      popover: {
        title: 'يلّا نبدأ! 🚀',
        description: 'خلّينا نحدد أوقات توفّرك عشان تبدأ تستقبل حجوزات.',
        onNextClick: () => {
          onComplete('/teacher/availability');
        }
      }
    }
  ];
}

function getParentSteps(isMobile: boolean, onComplete: CompletionHandler): DriveStep[] {
  return [
    {
      element: '[data-tour="nav-dashboard"]',
      popover: {
        title: 'لوحة التحكم',
        description: 'هنا تشوف ملخص حجوزات أطفالك والحصص الجاية.'
      }
    },
    {
      element: '[data-tour="nav-children"]',
      popover: {
        title: 'أطفالي ⭐',
        description: 'أضف أطفالك عشان تقدر تحجز لهم دروس مع أفضل المعلمين.'
      }
    },
    {
      element: '[data-tour="nav-book-teacher"]',
      popover: {
        title: 'احجز معلم',
        description: 'تصفح قائمة المعلمين المعتمدين واختر الأنسب لطفلك.'
      }
    },
    {
      element: '[data-tour="nav-lessons"]',
      popover: {
        title: 'الحصص',
        description: 'تابع جميع الحجوزات - الجاية والمكتملة.'
      }
    },
    {
      element: '[data-tour="nav-help"]',
      popover: {
        title: 'المساعدة',
        description: 'محتاج مساعدة؟ فريقنا جاهز لخدمتك. وتقدر تعيد الجولة من هنا!'
      }
    },
    {
      // Final step - CTA with explicit completion
      element: '[data-tour="nav-children"]',
      popover: {
        title: 'يلّا نبدأ! 🚀',
        description: 'أضف طفلك الأول عشان نبدأ رحلة التعلم!',
        onNextClick: () => {
          onComplete('/parent/children');
        }
      }
    }
  ];
}

function getStudentSteps(isMobile: boolean, onComplete: CompletionHandler): DriveStep[] {
  return [
    {
      element: '[data-tour="nav-dashboard"]',
      popover: {
        title: 'لوحة التحكم',
        description: 'هنا تشوف ملخص حصصك الجاية وتقدمك.'
      }
    },
    {
      element: '[data-tour="nav-book-teacher"]',
      popover: {
        title: 'احجز معلم ⭐',
        description: 'تصفح المعلمين المعتمدين واحجز حصتك الأولى!'
      }
    },
    {
      element: '[data-tour="nav-lessons"]',
      popover: {
        title: 'حصصي',
        description: 'تابع جميع حجوزاتك ودخّل الحصة من هنا.'
      }
    },
    {
      element: '[data-tour="nav-wallet"]',
      popover: {
        title: 'المحفظة',
        description: 'شوف رصيدك وتاريخ معاملاتك.'
      }
    },
    {
      element: '[data-tour="nav-help"]',
      popover: {
        title: 'المساعدة',
        description: 'محتاج مساعدة؟ تواصل معنا! وتقدر تعيد الجولة من هنا.'
      }
    },
    {
      // Final step - CTA with explicit completion
      element: '[data-tour="nav-book-teacher"]',
      popover: {
        title: 'يلّا نبدأ! 🚀',
        description: 'خلّينا نلاقي لك المعلم المناسب!',
        onNextClick: () => {
          onComplete('/search');
        }
      }
    }
  ];
}
