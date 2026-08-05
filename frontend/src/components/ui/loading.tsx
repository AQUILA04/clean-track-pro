import { cn } from '@/lib/utils';

type SpinnerSize = 'sm' | 'md' | 'lg';

const spinnerSizes: Record<SpinnerSize, string> = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-10 w-10 border-[3px]',
};

export function Spinner({
    size = 'md',
    className,
}: {
    size?: SpinnerSize;
    className?: string;
}) {
    return (
        <div
            role="status"
            aria-label="Chargement"
            className={cn(
                'rounded-full border-primary border-t-transparent animate-spin',
                spinnerSizes[size],
                className,
            )}
        />
    );
}

export function ContentLoader({
    label = 'Chargement…',
    className,
}: {
    label?: string;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground',
                className,
            )}
        >
            <Spinner />
            {label ? <p className="text-sm">{label}</p> : null}
        </div>
    );
}

export function PageLoader({
    label = 'Chargement…',
    title,
    className,
}: {
    label?: string;
    title?: string;
    className?: string;
}) {
    return (
        <div className={cn('container mx-auto p-6', className)}>
            {title ? <h1 className="text-2xl font-bold mb-6 text-foreground">{title}</h1> : null}
            <div className={cn('flex items-center justify-center', title ? 'h-64' : 'min-h-[50vh]')}>
                <ContentLoader label={label} className="py-0" />
            </div>
        </div>
    );
}

export function TableLoadingRow({
    colSpan,
    label = 'Chargement…',
}: {
    colSpan: number;
    label?: string;
}) {
    return (
        <tr>
            <td colSpan={colSpan} className="px-4 py-6">
                <ContentLoader label={label} className="py-4" />
            </td>
        </tr>
    );
}
