import { ForcedLightTheme } from '@/components/signup/ForcedLightTheme';

export default function SignupLayout({ children }: { children: React.ReactNode }) {
    return <ForcedLightTheme>{children}</ForcedLightTheme>;
}
