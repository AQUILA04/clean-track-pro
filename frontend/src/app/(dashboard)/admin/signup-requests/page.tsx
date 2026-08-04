'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SignupService, type SignupRequest } from '@/services/signup.service';
import { useToast } from '@/components/ui/simple-toast';

export default function SignupRequestsPage() {
    const { showToast } = useToast();
    const [requests, setRequests] = useState<SignupRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('PENDING');
    const [actingId, setActingId] = useState<string | null>(null);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const data = await SignupService.listRequests(filter === 'ALL' ? undefined : filter);
            setRequests(data);
        } catch {
            showToast('Impossible de charger les demandes', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    const handleApprove = async (id: string) => {
        setActingId(id);
        try {
            await SignupService.approve(id);
            showToast('Demande approuvée — tenant créé', 'success');
            fetchRequests();
        } catch (e) {
            showToast(e instanceof Error ? e.message : 'Échec', 'error');
        } finally {
            setActingId(null);
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt('Motif du refus (optionnel)');
        setActingId(id);
        try {
            await SignupService.reject(id, reason || undefined);
            showToast('Demande refusée', 'success');
            fetchRequests();
        } catch (e) {
            showToast(e instanceof Error ? e.message : 'Échec', 'error');
        } finally {
            setActingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <ClipboardList className="h-6 w-6 text-primary" />
                    Demandes d&apos;inscription
                </h1>
                <p className="text-muted-foreground mt-1">
                    Validez les demandes free tier en validation manuelle.
                </p>
            </div>

            <div className="flex gap-2">
                {['PENDING', 'COMPLETED', 'REJECTED', 'ALL'].map((status) => (
                    <Button
                        key={status}
                        variant={filter === status ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setFilter(status)}
                    >
                        {status === 'ALL' ? 'Toutes' : status}
                    </Button>
                ))}
            </div>

            {loading ? (
                <p className="text-muted-foreground">Chargement...</p>
            ) : requests.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">Aucune demande</Card>
            ) : (
                <div className="space-y-3">
                    {requests.map((req) => (
                        <Card key={req.id} className="p-5">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div>
                                    <p className="font-semibold">{req.organization_name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {req.agency_name} · {req.admin_first_name} {req.admin_last_name} · {req.admin_email}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Sous-domaine : {req.subdomain} · {new Date(req.created_at).toLocaleString('fr-FR')}
                                    </p>
                                    <p className="text-xs mt-1">
                                        Statut : <span className="font-medium">{req.status}</span>
                                    </p>
                                </div>
                                {req.status === 'PENDING' && (
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handleApprove(req.id)}
                                            disabled={actingId === req.id}
                                        >
                                            <Check className="h-4 w-4 mr-1" />
                                            Approuver
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleReject(req.id)}
                                            disabled={actingId === req.id}
                                        >
                                            <X className="h-4 w-4 mr-1" />
                                            Refuser
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
