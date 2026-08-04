'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
    BarChart3,
    Building2,
    CheckCircle2,
    Clock,
    Package,
    ScanLine,
    Shield,
    Sparkles,
    Users,
} from 'lucide-react';
import { SignupButton } from './SignupButton';
import { SignInButton } from './SignInButton';
import { AnimatedCounter } from './AnimatedCounter';
import { Reveal } from './Reveal';

const features = [
    {
        icon: ScanLine,
        title: 'Réception ultra-rapide',
        description:
            'Scannez, sélectionnez les articles et validez une commande en quelques secondes grâce au mode Fast-Scan.',
    },
    {
        icon: Package,
        title: 'Gestion des rayons',
        description:
            "Visualisez l'occupation de vos emplacements en temps réel et retrouvez chaque commande instantanément.",
    },
    {
        icon: Users,
        title: 'Fiches clients complètes',
        description:
            'Historique, préférences et programme fidélité centralisés pour un service personnalisé à chaque visite.',
    },
    {
        icon: BarChart3,
        title: 'Tableaux de bord & KPIs',
        description:
            "Suivez votre activité, vos retards et votre chiffre d'affaires avec des indicateurs clairs et actionnables.",
    },
    {
        icon: Building2,
        title: 'Multi-agences',
        description:
            'Pilotez plusieurs points de vente depuis une interface unique, avec des droits adaptés à chaque équipe.',
    },
    {
        icon: Shield,
        title: 'Sécurité & multi-tenant',
        description:
            'Données isolées par pressing, authentification sécurisée et gestion fine des rôles utilisateurs.',
    },
];

const benefits = [
    'Réduisez les erreurs de réception et de livraison',
    'Accélérez le passage en caisse et le suivi des paiements',
    'Gagnez du temps sur le rangement et la recherche de commandes',
    'Anticipez les retards grâce aux alertes en temps réel',
    'Fidélisez vos clients avec un suivi personnalisé',
    'Pilotez votre activité avec des rapports consolidés',
];

const steps = [
    {
        step: '01',
        title: 'Réception',
        description: 'Enregistrez les articles et créez la commande en quelques clics ou via scan.',
    },
    {
        step: '02',
        title: 'Traitement',
        description: "Suivez chaque étape du workflow jusqu'à la mise en rayon.",
    },
    {
        step: '03',
        title: 'Livraison',
        description: 'Localisez la commande, encaissez et remettez au client en toute confiance.',
    },
];

const stats = [
    { end: 3, suffix: '×', label: 'Plus rapide à la réception', decimals: 0 },
    { end: 100, suffix: '%', label: 'Traçabilité des commandes', decimals: 0 },
    { end: 24, suffix: '/7', label: 'Accès cloud sécurisé', decimals: 0 },
    { end: 50, suffix: '+', label: 'Agences accompagnées', decimals: 0 },
];

export function LandingPage() {
    return (
        <div className="light min-h-screen overflow-x-hidden bg-white text-gray-900 antialiased">
            {/* Navbar */}
            <header className="landing-nav-enter fixed inset-x-0 top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
                    <Link href="/" className="flex shrink-0 items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1A5AD7]">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-gray-900">
                            CleanTrack Pro
                        </span>
                    </Link>
                    <nav className="hidden items-center gap-8 md:flex">
                        <a href="#produit" className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">
                            Produit
                        </a>
                        <a href="#avantages" className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">
                            Tarifs
                        </a>
                        <a href="#avantages" className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">
                            À propos
                        </a>
                    </nav>
                    <div className="flex items-center gap-3">
                        <SignInButton variant="nav">Se connecter</SignInButton>
                        <SignInButton variant="navPrimary">Accéder à mon espace</SignInButton>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="relative flex min-h-[calc(100vh-0px)] items-center overflow-hidden pt-16">
                {/* Full-bleed background — slightly blurred */}
                <div className="pointer-events-none absolute inset-0">
                    <Image
                        src="/images/hero-banner.png"
                        alt=""
                        fill
                        priority
                        sizes="100vw"
                        className="landing-hero-banner object-cover object-center scale-105 blur-[2px]"
                    />
                    <div className="absolute inset-0 bg-slate-900/20" />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white" />
                </div>

                <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-16 md:py-24">
                    {/* Glassmorphism card */}
                    <div className="landing-hero-item landing-hero-delay-1 mx-auto max-w-2xl rounded-[2rem] border border-white/60 bg-white/55 px-8 py-12 text-center shadow-[0_8px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl md:px-14 md:py-14">
                        <div className="landing-hero-item landing-hero-delay-1 mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100/80 bg-blue-50/90 px-4 py-1.5 text-sm font-medium text-[#1A5AD7]">
                            <Sparkles className="h-4 w-4" />
                            La solution SaaS pour pressings & blanchisseries
                        </div>
                        <h1 className="landing-hero-item landing-hero-delay-2 text-3xl font-bold leading-tight tracking-tight text-gray-900 md:text-5xl">
                            Gérez votre pressing avec
                            <br />
                            <span className="bg-gradient-to-r from-[#1A5AD7] to-[#3B82F6] bg-clip-text text-transparent">
                                simplicité et efficacité
                            </span>
                        </h1>
                        <p className="landing-hero-item landing-hero-delay-3 mx-auto mt-5 max-w-xl text-base leading-relaxed text-gray-600 md:text-lg">
                            CleanTrack Pro centralise la réception, le suivi des commandes, le rangement
                            et la livraison. Offrez un service premium à vos clients tout en gagnant
                            en productivité.
                        </p>
                        <div className="landing-hero-item landing-hero-delay-4 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <SignInButton variant="hero" showArrow>
                                Se connecter
                            </SignInButton>
                            <SignupButton shortLabel />
                        </div>
                        <p className="landing-hero-item landing-hero-delay-5 mt-5 text-sm text-gray-500">
                            Déjà client ? Connectez-vous pour accéder à votre tableau de bord.
                        </p>
                    </div>

                    {/* Stats strip */}
                    <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
                        {stats.map((stat, index) => (
                            <Reveal key={stat.label} delay={index * 100} direction="up">
                                <div className="landing-stat-card rounded-2xl border border-white/50 bg-white/60 p-5 text-center shadow-sm backdrop-blur-md transition-shadow hover:shadow-md md:p-6">
                                    <div className="text-3xl font-bold text-[#1A5AD7]">
                                        <AnimatedCounter
                                            end={stat.end}
                                            suffix={stat.suffix}
                                            decimals={stat.decimals}
                                            duration={1600 + index * 200}
                                        />
                                    </div>
                                    <div className="mt-1 text-sm text-gray-500">{stat.label}</div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="produit" className="border-t border-gray-100 bg-gray-50/50 py-24">
                <div className="mx-auto max-w-6xl px-6">
                    <Reveal>
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                                Tout ce dont votre pressing a besoin
                            </h2>
                            <p className="mt-4 text-lg text-gray-600">
                                Une plateforme complète pensée pour les équipes de réception, de production
                                et de direction.
                            </p>
                        </div>
                    </Reveal>
                    <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature, index) => (
                            <Reveal key={feature.title} delay={index * 80} direction="up">
                                <div className="group h-full rounded-2xl border border-gray-100 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-lg hover:shadow-blue-500/5">
                                    <div className="mb-5 inline-flex rounded-xl bg-blue-50 p-3 text-[#1A5AD7] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#1A5AD7] group-hover:text-white">
                                        <feature.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                                        {feature.description}
                                    </p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-24">
                <div className="mx-auto max-w-6xl px-6">
                    <Reveal>
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                                Un parcours fluide, de la réception à la remise
                            </h2>
                            <p className="mt-4 text-lg text-gray-600">
                                Chaque commande est suivie étape par étape, sans perte d&apos;information.
                            </p>
                        </div>
                    </Reveal>
                    <div className="mt-16 grid gap-8 md:grid-cols-3">
                        {steps.map((item, index) => (
                            <Reveal key={item.step} delay={index * 150} direction="scale">
                                <div className="relative text-center">
                                    {index < steps.length - 1 && (
                                        <div className="absolute left-[calc(50%+2rem)] top-8 hidden h-px w-[calc(100%-4rem)] bg-gradient-to-r from-blue-200 to-transparent md:block" />
                                    )}
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1A5AD7] text-xl font-bold text-white shadow-lg shadow-blue-500/30 transition-transform duration-300 hover:scale-110">
                                        {item.step}
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                                        {item.description}
                                    </p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section id="avantages" className="border-t border-gray-100 bg-[#0F172A] py-24 text-white">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="grid items-center gap-16 lg:grid-cols-2">
                        <Reveal direction="right">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                                    Pourquoi choisir CleanTrack Pro ?
                                </h2>
                                <p className="mt-4 text-lg text-slate-400">
                                    Conçu avec des professionnels du pressing pour répondre aux exigences
                                    du terrain : rapidité, fiabilité et visibilité.
                                </p>
                                <ul className="mt-10 space-y-4">
                                    {benefits.map((benefit, index) => (
                                        <li key={benefit} className="flex items-start gap-3">
                                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                                            <span
                                                className="text-slate-300"
                                                style={{
                                                    opacity: 0,
                                                    animation: `landing-fade-up 0.6s ease-out ${0.3 + index * 0.08}s both`,
                                                }}
                                            >
                                                {benefit}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </Reveal>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { icon: Clock, label: 'Gain de temps', sub: 'Au comptoir', end: 40, suffix: '%' },
                                { icon: Package, label: 'Zéro perte', sub: 'Traçabilité totale', end: 99, suffix: '%' },
                                { icon: BarChart3, label: 'Pilotage', sub: 'KPIs en direct', end: 12, suffix: '+' },
                                { icon: Shield, label: 'Sécurisé', sub: 'Données protégées', end: 100, suffix: '%' },
                            ].map((item, index) => (
                                <Reveal key={item.label} delay={index * 100} direction="left">
                                    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:bg-slate-800">
                                        <item.icon className="h-8 w-8 text-blue-400" />
                                        <div className="mt-3 text-2xl font-bold text-white">
                                            <AnimatedCounter
                                                end={item.end}
                                                suffix={item.suffix}
                                                duration={1500 + index * 150}
                                            />
                                        </div>
                                        <div className="mt-1 font-semibold">{item.label}</div>
                                        <div className="text-sm text-slate-400">{item.sub}</div>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24">
                <div className="mx-auto max-w-6xl px-6">
                    <Reveal direction="scale">
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A5AD7] to-[#3B82F6] px-8 py-16 text-center text-white md:px-16">
                            <div className="landing-blob pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
                            <div className="landing-blob-delayed pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
                            <div className="relative">
                                <h2 className="text-3xl font-bold md:text-4xl">
                                    Prêt à moderniser votre pressing ?
                                </h2>
                                <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">
                                    Connectez-vous pour accéder à votre espace ou inscrivez votre établissement
                                    — l&apos;inscription en ligne arrive très bientôt.
                                </p>
                                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                                    <SignInButton variant="cta" showArrow>
                                        Se connecter
                                    </SignInButton>
                                    <SignupButton variant="light" />
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-100 bg-gray-50 py-12">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A5AD7]">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-semibold text-gray-900">CleanTrack Pro</span>
                    </div>
                    <p className="text-sm text-gray-500">
                        Solution SaaS de gestion pour pressings et blanchisseries.
                    </p>
                    <SignInButton variant="footer">Se connecter</SignInButton>
                </div>
            </footer>
        </div>
    );
}
