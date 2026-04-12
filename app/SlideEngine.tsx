"use client";

import React, {
    createContext,
    forwardRef,
    useCallback,
    useContext,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from "react";
import "./slide-engine.css";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SlideEngineHandle {
    goTo: (h: number, v?: number) => void;
    next: () => void;
    prev: () => void;
    getPosition: () => { h: number; v: number };
}

interface SlideProps {
    children?: React.ReactNode;
    background?: string;       // background-image URL
    backgroundColor?: string;  // CSS background-color value
    className?: string;
    style?: React.CSSProperties;
}

interface SlideGroupProps {
    children: React.ReactNode;
    className?: string;
}

interface SlideEngineProps {
    children: React.ReactNode;
    theme?: "sky" | "moon" | "black" | "white" | "none";
    transition?: "slide" | "concave" | "convex" | "fade" | "none";
    controls?: boolean;
    showProgress?: boolean;
    showSlideNumber?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

// ─── Internal slide data structure ──────────────────────────────────────────

interface SlideData {
    h: number;
    v: number;
    content: React.ReactNode;
    background?: string;
    backgroundColor?: string;
    className?: string;
    style?: React.CSSProperties;
}

// ─── Context (fragment step, accessible to children) ────────────────────────

interface EngineContextValue {
    fragmentStep: number;
    h: number;
    v: number;
}

const EngineContext = createContext<EngineContextValue>({
    fragmentStep: 0,
    h: 0,
    v: 0,
});

export const useSlideEngine = () => useContext(EngineContext);

// ─── Slide component ─────────────────────────────────────────────────────────

/**
 * Wraps individual slide content. Must be a direct child of SlideGroup.
 * SlideEngine reads this component's props to build the slide grid.
 */
export function Slide({ children, background, backgroundColor, className, style }: SlideProps) {
    // Slide renders its children when placed by SlideEngine.
    // Direct rendering (outside SlideEngine) is a passthrough.
    return (
        <div
            className={className}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundImage: background ? `url(${background})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundColor: backgroundColor,
                ...style,
            }}
        >
            {children}
        </div>
    );
}

// Mark component type for identification
Slide.displayName = "Slide";

// ─── SlideGroup component ────────────────────────────────────────────────────

/**
 * Groups vertical slides together. Must be a direct child of SlideEngine.
 */
export function SlideGroup({ children, className }: SlideGroupProps) {
    // Passthrough — SlideEngine reads the children of SlideGroup directly
    return <>{children}</>;
}

SlideGroup.displayName = "SlideGroup";

// ─── Helper: extract slides from children ───────────────────────────────────

function extractSlides(children: React.ReactNode): SlideData[] {
    const slides: SlideData[] = [];
    let h = 0;

    React.Children.forEach(children, (child) => {
        if (!React.isValidElement(child)) return;

        const type = child.type as any;

        // A SlideGroup contains vertical slides
        if (type?.displayName === "SlideGroup") {
            const groupChildren = (child.props as SlideGroupProps).children;
            let v = 0;
            React.Children.forEach(groupChildren, (slideChild) => {
                if (!React.isValidElement(slideChild)) return;
                const slideType = slideChild.type as any;
                if (slideType?.displayName === "Slide") {
                    const p = slideChild.props as SlideProps;
                    slides.push({
                        h,
                        v,
                        content: p.children,
                        background: p.background,
                        backgroundColor: p.backgroundColor,
                        className: p.className,
                        style: p.style,
                    });
                    v++;
                }
            });
            if (v > 0) h++;
        }
        // A bare Slide (no group) — treated as a single-slide group
        else if (type?.displayName === "Slide") {
            const p = child.props as SlideProps;
            slides.push({
                h,
                v: 0,
                content: p.children,
                background: p.background,
                backgroundColor: p.backgroundColor,
                className: p.className,
                style: p.style,
            });
            h++;
        }
    });

    return slides;
}

// ─── Direction helper ────────────────────────────────────────────────────────

type Direction = "right" | "left" | "up" | "down" | "none";

function entryClass(direction: Direction): string {
    switch (direction) {
        case "right": return "enter-right";
        case "left":  return "enter-left";
        case "up":    return "enter-top";
        case "down":  return "enter-bottom";
        default:      return "enter-right";
    }
}

function exitClass(direction: Direction): string {
    switch (direction) {
        case "right": return "exit-left";
        case "left":  return "exit-right";
        case "up":    return "exit-top";
        case "down":  return "exit-bottom";
        default:      return "exit-left";
    }
}

// ─── SlideEngine ─────────────────────────────────────────────────────────────

export const SlideEngine = forwardRef<SlideEngineHandle, SlideEngineProps>(
    (
        {
            children,
            theme = "black",
            transition = "slide",
            controls = false,
            showProgress = false,
            showSlideNumber = false,
            className,
            style,
        },
        ref
    ) => {
        const slides = useMemo(() => extractSlides(children), [children]);

        const [h, setH] = useState(0);
        const [v, setV] = useState(0);
        const [fragmentStep, setFragmentStep] = useState(0);
        const [prevIndex, setPrevIndex] = useState<number | null>(null);
        const [direction, setDirection] = useState<Direction>("right");
        const [animating, setAnimating] = useState(false);

        const maxH = useMemo(() => {
            const hs = slides.map((s) => s.h);
            return hs.length ? Math.max(...hs) : 0;
        }, [slides]);

        const maxVAtH = useCallback(
            (hIndex: number) => {
                const vs = slides.filter((s) => s.h === hIndex).map((s) => s.v);
                return vs.length ? Math.max(...vs) : 0;
            },
            [slides]
        );

        const currentIndex = useMemo(
            () => slides.findIndex((s) => s.h === h && s.v === v),
            [slides, h, v]
        );

        const countFragmentsInCurrent = useCallback(() => {
            // Count .se-fragment elements in the current slide content — placeholder
            // The fragment count is derived from slide content; we cap at a safe max
            return 10;
        }, []);

        const navigate = useCallback(
            (newH: number, newV: number, dir: Direction) => {
                if (animating) return;
                if (newH < 0 || newH > maxH) return;
                const newMaxV = maxVAtH(newH);
                const clampedV = Math.min(newV, newMaxV);
                if (clampedV < 0) return;

                setPrevIndex(currentIndex);
                setDirection(dir);
                setAnimating(true);
                setFragmentStep(0);
                setH(newH);
                setV(clampedV);

                setTimeout(() => {
                    setAnimating(false);
                    setPrevIndex(null);
                }, 450);
            },
            [animating, currentIndex, maxH, maxVAtH]
        );

        const goNext = useCallback(() => {
            const maxV = maxVAtH(h);
            if (v < maxV) {
                navigate(h, v + 1, "down");
            } else if (h < maxH) {
                navigate(h + 1, 0, "right");
            }
        }, [h, v, maxH, maxVAtH, navigate]);

        const goPrev = useCallback(() => {
            if (v > 0) {
                navigate(h, v - 1, "up");
            } else if (h > 0) {
                const prevMaxV = maxVAtH(h - 1);
                navigate(h - 1, prevMaxV, "left");
            }
        }, [h, v, maxVAtH, navigate]);

        useImperativeHandle(ref, () => ({
            goTo: (newH: number, newV = 0) => navigate(newH, newV, "right"),
            next: goNext,
            prev: goPrev,
            getPosition: () => ({ h, v }),
        }));

        // Keyboard navigation
        useEffect(() => {
            const handler = (e: KeyboardEvent) => {
                switch (e.key) {
                    case "ArrowRight":
                    case "Space":
                        e.preventDefault();
                        goNext();
                        break;
                    case "ArrowLeft":
                        e.preventDefault();
                        goPrev();
                        break;
                    case "ArrowDown":
                        e.preventDefault();
                        if (v < maxVAtH(h)) {
                            navigate(h, v + 1, "down");
                        } else {
                            setFragmentStep((s) => s + 1);
                        }
                        break;
                    case "ArrowUp":
                        e.preventDefault();
                        if (v > 0) {
                            navigate(h, v - 1, "up");
                        } else {
                            setFragmentStep((s) => Math.max(0, s - 1));
                        }
                        break;
                    case "Escape":
                        e.preventDefault();
                        navigate(0, 0, "left");
                        break;
                }
            };
            window.addEventListener("keydown", handler);
            return () => window.removeEventListener("keydown", handler);
        }, [goNext, goPrev, h, v, maxVAtH, navigate]);

        // Touch/swipe support
        const touchStartRef = useRef<{ x: number; y: number } | null>(null);
        const handleTouchStart = (e: React.TouchEvent) => {
            touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        };
        const handleTouchEnd = (e: React.TouchEvent) => {
            if (!touchStartRef.current) return;
            const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
            const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
            touchStartRef.current = null;
            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx < -50) goNext();
                else if (dx > 50) goPrev();
            } else {
                if (dy < -50) {
                    if (v < maxVAtH(h)) navigate(h, v + 1, "down");
                } else if (dy > 50) {
                    if (v > 0) navigate(h, v - 1, "up");
                }
            }
        };

        const transitionClass = transition !== "none" ? `se-${transition}` : "";
        const themeClass = theme !== "none" ? `se-theme-${theme}` : "";
        const totalSlides = slides.length;

        return (
            <EngineContext.Provider value={{ fragmentStep, h, v }}>
                <div
                    className={`se-viewport ${themeClass} ${transitionClass} ${className ?? ""}`}
                    style={style}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    {slides.map((slide, index) => {
                        const isCurrent = index === currentIndex;
                        const isPrev = index === prevIndex;

                        let stateClass = "hidden";
                        if (isCurrent) stateClass = "active";
                        else if (isPrev) stateClass = exitClass(direction);

                        return (
                            <div
                                key={`${slide.h}-${slide.v}`}
                                className={`se-slide ${stateClass}`}
                                style={{
                                    backgroundImage: slide.background
                                        ? `url(${slide.background})`
                                        : undefined,
                                    backgroundColor: slide.backgroundColor,
                                }}
                            >
                                <EngineContext.Provider value={{ fragmentStep: isCurrent ? fragmentStep : 0, h, v }}>
                                    <div
                                        className={slide.className}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            ...slide.style,
                                        }}
                                    >
                                        {slide.content}
                                    </div>
                                </EngineContext.Provider>
                            </div>
                        );
                    })}

                    {/* Progress bar */}
                    {showProgress && (
                        <div
                            className="se-progress"
                            style={{ width: `${((currentIndex + 1) / totalSlides) * 100}%` }}
                        />
                    )}

                    {/* Slide number */}
                    {showSlideNumber && (
                        <div className="se-slide-number">
                            {currentIndex + 1} / {totalSlides}
                        </div>
                    )}

                    {/* Controls */}
                    {controls && (
                        <div className="se-controls">
                            <button onClick={goPrev} disabled={h === 0 && v === 0} title="Previous">
                                ←
                            </button>
                            <button onClick={goNext} disabled={currentIndex >= totalSlides - 1} title="Next">
                                →
                            </button>
                        </div>
                    )}
                </div>
            </EngineContext.Provider>
        );
    }
);

SlideEngine.displayName = "SlideEngine";
