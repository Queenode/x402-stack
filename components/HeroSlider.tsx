'use client';

import React, { useEffect, useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';

interface Slide {
    id: number;
    layout: 'full' | 'split';
    image: string;
    title: string;
    subtitle: string;
    cta: string;
    link: string;
}

const SLIDES: Slide[] = [
    {
        id: 1,
        layout: 'full',
        image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30',
        title: 'The Future of Event Ticketing',
        subtitle: 'Secure, transparent, and decentralized ticketing powered by Stacks.',
        cta: 'Explore Events',
        link: '#events-section'
    },
    {
        id: 2,
        layout: 'split',
        image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7',
        title: 'Unforgettable Experiences',
        subtitle: 'From underground raves to exclusive conferences, find your next adventure.',
        cta: 'Create Event',
        link: '/create'
    },
    {
        id: 3,
        layout: 'split',
        image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14',
        title: 'Powered by Bitcoin Layer 2',
        subtitle: 'Leveraging the security of Bitcoin with the flexibility of Stacks smart contracts.',
        cta: 'Learn More',
        link: '#features-section'
    }
];

export function HeroSlider() {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
    const [selectedIndex, setSelectedIndex] = useState(0);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        emblaApi.on('select', onSelect);

        // Auto-advance
        const interval = setInterval(() => {
            if (emblaApi.canScrollNext()) {
                emblaApi.scrollNext();
            } else {
                emblaApi.scrollTo(0);
            }
        }, 5000);

        return () => {
            emblaApi.off('select', onSelect);
            clearInterval(interval);
        };
    }, [emblaApi, onSelect]);

    const handleScrollToStart = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
        if (targetId.startsWith('#')) {
            e.preventDefault();
            const element = document.getElementById(targetId.substring(1));
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    return (
        <div className="relative h-screen min-h-[600px] w-full overflow-hidden bg-slate-950 group">
            <div className="overflow-hidden h-full" ref={emblaRef}>
                <div className="flex h-full touch-pan-y">
                    {SLIDES.map((slide, index) => (
                        <div className="relative flex-[0_0_100%] min-w-0 h-full" key={slide.id}>

                            {/* === LAYOUT: FULL BACKGROUND === */}
                            {slide.layout === 'full' && (
                                <>
                                    <div className="absolute inset-0 z-0">
                                        <Image
                                            src={slide.image}
                                            alt={slide.title}
                                            fill
                                            className="object-cover animate-slow-zoom"
                                            priority={index === 0}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/70 to-slate-950" />
                                    </div>

                                    {/* Removed opacity transition class to ensure visibility */}
                                    <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center text-center">
                                        <div className="space-y-8 max-w-4xl">

                                            {/* Removed Powered By Stacks badge as requested */}

                                            <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight tracking-tight drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
                                                {slide.title}
                                            </h1>

                                            <p className="text-xl md:text-2xl text-slate-200 font-light leading-relaxed drop-shadow-md max-w-2xl mx-auto">
                                                {slide.subtitle}
                                            </p>

                                            <div className="flex justify-center pt-6">
                                                <Link href={slide.link} onClick={(e) => handleScrollToStart(e, slide.link)}>
                                                    <Button
                                                        size="lg"
                                                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-14 px-10 rounded-full text-lg shadow-[0_0_30px_rgba(249,115,22,0.5)] hover:shadow-[0_0_50px_rgba(249,115,22,0.7)] transition-all transform hover:-translate-y-1"
                                                    >
                                                        {slide.cta}
                                                        <ArrowRight className="ml-2 w-5 h-5" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* === LAYOUT: SPLIT FLEX === */}
                            {slide.layout === 'split' && (
                                <>
                                    {/* Blurred Background with Fade In */}
                                    <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${selectedIndex === index ? 'opacity-100' : 'opacity-0'}`}>
                                        <Image
                                            src={slide.image}
                                            alt={slide.title}
                                            fill
                                            className="object-cover opacity-20 blur-3xl scale-110"
                                            priority={index === 0}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                                    </div>

                                    <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                                        {/* Text Content */}
                                        <div className={`w-full md:w-1/2 space-y-8 transition-all duration-700 delay-100 transform ${selectedIndex === index ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm text-orange-400 text-xs font-bold uppercase tracking-wider">
                                                <Zap className="w-3 h-3" />
                                                Web3 Experience
                                            </div>

                                            <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight tracking-tight">
                                                {slide.title}
                                            </h1>

                                            <p className="text-lg md:text-xl text-slate-300 font-light max-w-lg leading-relaxed">
                                                {slide.subtitle}
                                            </p>

                                            <div className="flex flex-wrap gap-4 pt-4">
                                                <Link href={slide.link} onClick={(e) => handleScrollToStart(e, slide.link)}>
                                                    <Button
                                                        size="lg"
                                                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 h-14 rounded-full transition-all"
                                                        style={{ boxShadow: '0 0 30px rgba(249,115,22,0.4)' }}
                                                    >
                                                        {slide.cta}
                                                        <ArrowRight className="ml-2 w-5 h-5" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>

                                        {/* Image Card with Reflection Effect */}
                                        <div className={`hidden md:block w-[45%] h-[500px] relative transition-all duration-1000 delay-300 transform ${selectedIndex === index ? 'opacity-100 translate-y-0 rotate-3' : 'opacity-0 translate-y-20 rotate-12'}`}>

                                            {/* Reflection/Shadow under the card */}
                                            <div className="absolute -bottom-10 left-10 right-10 h-20 bg-orange-500/30 blur-2xl rounded-[100%]" />

                                            <div className="absolute inset-0 bg-orange-500/20 rounded-[2rem] blur-3xl -rotate-6 transform scale-90" />
                                            <div className="relative h-full w-full rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl skew-y-1">
                                                <Image
                                                    src={slide.image}
                                                    alt={slide.title}
                                                    fill
                                                    className="object-cover"
                                                    priority={index === 0}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-40" />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                        </div>
                    ))}
                </div>
            </div>

            {/* === BOTTOM MIRROR GLOW EFFECT === */}
            {/* 1. Floor Reflection/Glow Base */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-orange-500/10 via-slate-950/0 to-transparent pointer-events-none blur-3xl z-0" />

            {/* 2. Intense Bottom Line Glow (Mirror Edge) */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent shadow-[0_0_50px_rgba(249,115,22,0.8)] opacity-70 z-10" />

            {/* 3. Subtle ambient light rising from bottom */}
            <div className="absolute -bottom-20 left-1/4 right-1/4 h-32 bg-orange-600/20 blur-[100px] pointer-events-none z-0" />

            {/* Dots Navigation */}
            <div className="absolute bottom-10 left-0 right-0 z-20 flex justify-center gap-3">
                {SLIDES.map((_, index) => (
                    <button
                        key={index}
                        className={`w-3 h-3 rounded-full transition-all duration-300 shadow-lg ${index === selectedIndex
                            ? 'bg-orange-500 w-8 shadow-orange-500/50'
                            : 'bg-white/20 hover:bg-white/40'
                            }`}
                        onClick={() => emblaApi?.scrollTo(index)}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
