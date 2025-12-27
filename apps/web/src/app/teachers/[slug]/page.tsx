
import { Metadata } from 'next';
import { marketplaceApi } from '@/lib/api/marketplace';
import TeacherProfilePageClient from '@/components/teacher/public-profile/TeacherProfilePageClient';
import { getFileUrl } from '@/lib/api/upload';

type Props = {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    try {
        const { slug } = await params;
        const teacher = await marketplaceApi.getTeacherProfile(slug);

        return {
            title: `${teacher.displayName || 'معلم سدرة'} | منصة سدرة`,
            description: teacher.bio ? teacher.bio.substring(0, 160) : 'احجز حصص تعليمية مع أفضل المعلمين على منصة سدرة',
            openGraph: {
                title: `${teacher.displayName || 'معلم سدرة'} | منصة سدرة`,
                description: teacher.bio ? teacher.bio.substring(0, 160) : 'احجز حصص تعليمية مع أفضل المعلمين على منصة سدرة',
                images: teacher.profilePhotoUrl ? [getFileUrl(teacher.profilePhotoUrl)] : [],
                type: 'profile',
            },
        };
    } catch (error) {
        return {
            title: 'معلم سدرة | منصة سدرة',
            description: 'احجز حصص تعليمية مع أفضل المعلمين على منصة سدرة',
        };
    }
}

export default async function TeacherProfilePage({ params }: Props) {
    const { slug } = await params;
    return <TeacherProfilePageClient slug={slug} />;
}
