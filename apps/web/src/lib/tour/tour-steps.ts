import type { DriveStep } from 'driver.js';

export type UserRole = 'TEACHER' | 'PARENT' | 'STUDENT';
export type TourTriggerSource = 'auto' | 'manual';

type CompletionHandler = (destination: string) => Promise<void>;
type SkipHandler = () => void;

export function getTourSteps(
  role: UserRole,
  isMobile: boolean,
  onComplete: CompletionHandler,
  onSkip?: SkipHandler
): DriveStep[] {
  // Add common "Skip" logic to steps if needed, but for now we rely on the header button
  // We can also add a "Skip Tour" button in the footer via custom popover if requested.
  // For this iteration, we focus on better copy.

  const baseSteps = getBaseSteps(isMobile);
  const roleSteps = getRoleSpecificSteps(role, isMobile, onComplete);

  return [...baseSteps, ...roleSteps];
}

function getBaseSteps(isMobile: boolean): DriveStep[] {
  return [
    {
      element: '[data-tour="nav-dashboard"]',
      popover: {
        title: 'أهلاً بك في سدرة! 👋',
        description: 'جولة سريعة لتتعرف على المنصة.'
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
        description: 'لمحة سريعة عن يومك: حصصك القادمة، أرباحك، وإشعاراتك المهمة.'
      }
    },
    {
      element: '[data-tour="nav-availability"]',
      popover: {
        title: 'مواعيد التوفّر ⭐',
        description: 'الخطوة الأهم! حدد أوقات فراغك ليتمكن الطلاب من حجز حصص معك.'
      }
    },
    {
      element: '[data-tour="nav-lessons"]',
      popover: {
        title: 'حصصي',
        description: 'أرشيف حصصك وتفاصيلها. من هنا تقدر تبدأ الحصة وتشوف كل البيانات.'
      }
    },
    {
      element: '[data-tour="nav-wallet"]',
      popover: {
        title: 'المحفظة',
        description: 'تابع دخلك أول بأول، واطلب سحب أرباحك بكل سهولة.'
      }
    },
    {
      element: '[data-tour="nav-profile"]',
      popover: {
        title: 'الملف الشخصي',
        description: 'واجهتك أمام الطلاب. أكمل بياناتك وخبراتك لتزيد فرص حجزك.'
      }
    },
    {
      element: '[data-tour="nav-help"]',
      popover: {
        title: 'مركز المساعدة',
        description: 'عندك استفسار؟ فريقنا جاهز لخدمتك في أي وقت.'
      }
    },
    {
      // Final step - CTA with explicit completion
      element: '[data-tour="nav-availability"]',
      popover: {
        title: 'جاهز للانطلاق؟ 🚀',
        description: 'دعنا نضبط جدولك لتبدأ في استقبال الحجوزات فوراً.',
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
        description: 'ملخص شامل لحجوزات أطفالك والحصص القادمة في مكان واحد.'
      }
    },
    {
      element: '[data-tour="nav-children"]',
      popover: {
        title: 'أطفالي ⭐',
        description: 'أضف بيانات أطفالك لتتمكن من حجز المعلمين لهم.'
      }
    },
    {
      element: '[data-tour="nav-book-teacher"]',
      popover: {
        title: 'احجز معلم',
        description: 'ابحث عن أفضل المعلمين المعتمدين واختر الأنسب لاحتياجات طفلك.'
      }
    },
    {
      element: '[data-tour="nav-lessons"]',
      popover: {
        title: 'الحصص',
        description: 'جدول بجميع الحصص القادمة والسابقة للرجوع إليها بسهولة.'
      }
    },
    {
      element: '[data-tour="nav-help"]',
      popover: {
        title: 'مركز المساعدة',
        description: 'نحن هنا لمساعدتك! تواصل معنا لأي استفسار.'
      }
    },
    {
      // Final step - CTA with explicit completion
      element: '[data-tour="nav-children"]',
      popover: {
        title: 'لنبدأ الرحلة! 🚀',
        description: 'أضف طفلك الأول وابدأ رحلة التعلم الممتعة.',
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
        description: 'نظرة عامة على حصصك القادمة ومستوى تقدمك.'
      }
    },
    {
      element: '[data-tour="nav-book-teacher"]',
      popover: {
        title: 'احجز معلم ⭐',
        description: 'تصفح قائمة المعلمين واحجز حصتك الأولى في دقائق.'
      }
    },
    {
      element: '[data-tour="nav-lessons"]',
      popover: {
        title: 'حصصي',
        description: 'كل حجوزاتك هنا. اضغط للدخول إلى الحصة أو مراجعة التفاصيل.'
      }
    },
    {
      element: '[data-tour="nav-wallet"]',
      popover: {
        title: 'المحفظة',
        description: 'رصيدك الحالي وتاريخ جميع معاملاتك المالية.'
      }
    },
    {
      element: '[data-tour="nav-help"]',
      popover: {
        title: 'مركز المساعدة',
        description: 'محتاج مساعدة؟ لا تتردد في التواصل معنا.'
      }
    },
    {
      // Final step - CTA with explicit completion
      element: '[data-tour="nav-book-teacher"]',
      popover: {
        title: 'انطلق في التعلم! 🚀',
        description: 'لنبحث عن المعلم المثالي لك الآن.',
        onNextClick: () => {
          onComplete('/search');
        }
      }
    }
  ];
}
