import { Suspense } from 'react';
import { SignupSuccessContent } from './SignupSuccessContent';

export default function SignupSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
            <SignupSuccessContent />
        </Suspense>
    );
}
