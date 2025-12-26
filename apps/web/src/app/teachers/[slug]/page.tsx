
import { Metadata } from 'next';
import { marketplaceApi } from '@/lib/api/marketplace';
import TeacherProfilePageClient from '@/components/teacher/public-profile/TeacherProfilePageClient';
import { getFileUrl } from '@/lib/api/upload';

type Props = {
    params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    try {
        const teacher = await marketplaceApi.getTeacherProfile(params.slug);

        return {
            title: `${teacher.displayName || 'معلم سدرة'} | منصة سدرة`,
            description: teacher.bio ? teacher.bio.substring(0, 160) : 'احجز جلسات تعليمية مع أفضل المعلمين على منصة سدرة',
            openGraph: {
                title: `${teacher.displayName || 'معلم سدرة'} | منصة سدرة`,
                description: teacher.bio ? teacher.bio.substring(0, 160) : 'احجز جلسات تعليمية مع أفضل المعلمين على منصة سدرة',
                images: teacher.profilePhotoUrl ? [getFileUrl(teacher.profilePhotoUrl)] : [],
                type: 'profile',
            },
        };
    } catch (error) {
        return {
            title: 'معلم سدرة | منصة سدرة',
            description: 'احجز جلسات تعليمية مع أفضل المعلمين على منصة سدرة',
        };
    }
}

export default function TeacherProfilePage({ params }: Props) {
    return <TeacherProfilePageClient slug={params.slug} />;
}
