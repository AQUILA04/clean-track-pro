'use client';



import { useState } from 'react';

import { Building2 } from 'lucide-react';

import { Input } from '@/components/ui/Input';

import { Button } from '@/components/ui/Button';

import type { Tenant } from '@/services/tenant.service';



export interface MainAgencyFormData {

    name: string;

    location: string;

    city: string;

    postal_code: string;

    email: string;

    phone: string;

}



export interface TenantFormData {

    name: string;

    subdomain: string;

    adminEmail?: string;

    mainAgency: MainAgencyFormData;

}



interface TenantFormProps {

    initialData?: Tenant;

    onSubmit: (data: TenantFormData) => Promise<void>;

    onCancel?: () => void;

    submitLabel?: string;

    isEdit?: boolean;

}



const defaultMainAgency: MainAgencyFormData = {

    name: '',

    location: '',

    city: '',

    postal_code: '',

    email: '',

    phone: '',

};



export function TenantForm({

    initialData,

    onSubmit,

    onCancel,

    submitLabel,

    isEdit = false,

}: TenantFormProps) {

    const [formData, setFormData] = useState<TenantFormData>({

        name: initialData?.name ?? '',

        subdomain: initialData?.subdomain ?? '',

        adminEmail: '',

        mainAgency: { ...defaultMainAgency },

    });

    const [error, setError] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);



    const handleSubmit = async (e: React.FormEvent) => {

        e.preventDefault();

        setLoading(true);

        setError(null);



        try {
            const { location, city, postal_code, email, phone, name } = formData.mainAgency;
            const payload: TenantFormData = {
                name: formData.name,
                subdomain: formData.subdomain,
                adminEmail: formData.adminEmail?.trim() || undefined,
                mainAgency: {
                    name: name.trim(),
                    location: location.trim(),
                    city: city.trim(),
                    postal_code: postal_code.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                },
            };
            await onSubmit(payload);

        } catch (err) {

            const message =

                err instanceof Error

                    ? err.message

                    : isEdit

                      ? 'Échec de la mise à jour du tenant. Veuillez réessayer.'

                      : 'Échec de la création du tenant. Veuillez réessayer.';

            setError(message);

        } finally {

            setLoading(false);

        }

    };



    const updateMainAgency = (field: keyof MainAgencyFormData, value: string) => {

        setFormData((prev) => ({

            ...prev,

            mainAgency: { ...prev.mainAgency, [field]: value },

        }));

    };



    return (

        <form onSubmit={handleSubmit} className="space-y-6">

            {error && (

                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">

                    {error}

                </div>

            )}



            <div className="space-y-4">

                <h3 className="text-sm font-semibold text-foreground">Informations du tenant</h3>



                <Input

                    label="Nom de l'organisation"

                    id="name"

                    required

                    value={formData.name}

                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}

                    placeholder="Ex : Pressing Paris Centre"

                />



                <div>

                    <Input

                        label="Sous-domaine"

                        id="subdomain"

                        required={!isEdit}

                        disabled={isEdit}

                        pattern="[a-zA-Z0-9-]+"

                        title="Caractères alphanumériques et tirets uniquement"

                        value={formData.subdomain}

                        onChange={(e) =>

                            setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })

                        }

                        placeholder="ex : paris-centre"

                    />

                    <p className="text-xs text-muted-foreground mt-1.5">

                        {isEdit

                            ? `URL : ${formData.subdomain}.cleantrack.pro`

                            : `URL attendue : ${formData.subdomain ? `${formData.subdomain}.cleantrack.pro` : '...'}`}

                    </p>

                </div>



                {!isEdit && (

                    <div>

                        <Input

                            label="E-mail de l'administrateur"

                            id="adminEmail"

                            type="email"

                            value={formData.adminEmail ?? ''}

                            onChange={(e) =>

                                setFormData({ ...formData, adminEmail: e.target.value })

                            }

                            placeholder="admin@exemple.fr"

                        />

                        <p className="text-xs text-muted-foreground mt-1.5">

                            Un compte administrateur sera créé avec le prénom « Admin » et le nom du tenant, puis une invitation sera envoyée à cette adresse.

                        </p>

                    </div>

                )}

            </div>



            {!isEdit && (

                <div className="space-y-4 pt-2 border-t border-border">

                    <div className="flex items-center gap-2">

                        <div className="p-1.5 rounded-lg bg-primary/10">

                            <Building2 className="h-4 w-4 text-primary" />

                        </div>

                        <div>

                            <h3 className="text-sm font-semibold text-foreground">Agence principale</h3>

                            <p className="text-xs text-muted-foreground">

                                Premier point de service créé automatiquement pour ce tenant.

                            </p>

                        </div>

                    </div>



                    <Input

                        label="Nom de l'agence"

                        id="mainAgencyName"

                        required

                        value={formData.mainAgency.name}

                        onChange={(e) => updateMainAgency('name', e.target.value)}

                        placeholder="Ex : Agence Centre-Ville"

                    />



                    <Input

                        label="Adresse"

                        id="mainAgencyLocation"

                        value={formData.mainAgency.location}

                        onChange={(e) => updateMainAgency('location', e.target.value)}

                        placeholder="Numéro et rue..."

                    />



                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        <Input

                            label="Ville"

                            id="mainAgencyCity"

                            value={formData.mainAgency.city}

                            onChange={(e) => updateMainAgency('city', e.target.value)}

                            placeholder="Ex : Paris"

                        />

                        <Input

                            label="Code postal"

                            id="mainAgencyPostalCode"

                            value={formData.mainAgency.postal_code}

                            onChange={(e) => updateMainAgency('postal_code', e.target.value)}

                            placeholder="Ex : 75001"

                        />

                    </div>



                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        <Input

                            label="Téléphone"

                            id="mainAgencyPhone"

                            type="tel"

                            value={formData.mainAgency.phone}

                            onChange={(e) => updateMainAgency('phone', e.target.value)}

                            placeholder="+33 1 23 45 67 89"

                        />

                        <Input

                            label="E-mail"

                            id="mainAgencyEmail"

                            type="email"

                            value={formData.mainAgency.email}

                            onChange={(e) => updateMainAgency('email', e.target.value)}

                            placeholder="agence@exemple.fr"

                        />

                    </div>

                </div>

            )}



            <div className="flex gap-3 pt-2">

                {onCancel && (

                    <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>

                        Annuler

                    </Button>

                )}

                <Button

                    type="submit"

                    className={onCancel ? 'flex-1' : 'w-full'}

                    isLoading={loading}

                >

                    {submitLabel ?? (isEdit ? 'Enregistrer' : 'Créer le tenant')}

                </Button>

            </div>

        </form>

    );

}


