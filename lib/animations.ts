import { Variants } from "framer-motion"

// Page transition variants
export const pageVariants: Variants = {
    initial: {
        opacity: 0,
        y: 8,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.2,
            ease: "easeOut",
        },
    },
    exit: {
        opacity: 0,
        y: -8,
        transition: {
            duration: 0.15,
            ease: "easeIn",
        },
    },
}

// Modal/Dialog variants
export const modalVariants: Variants = {
    initial: {
        opacity: 0,
        scale: 0.95,
    },
    animate: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.2,
            ease: "easeOut",
        },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        transition: {
            duration: 0.15,
            ease: "easeIn",
        },
    },
}

// Slide in from right (for mobile menu)
export const slideInVariants: Variants = {
    initial: {
        x: "100%",
    },
    animate: {
        x: 0,
        transition: {
            duration: 0.3,
            ease: "easeOut",
        },
    },
    exit: {
        x: "100%",
        transition: {
            duration: 0.25,
            ease: "easeIn",
        },
    },
}

// Fade in variants
export const fadeInVariants: Variants = {
    initial: {
        opacity: 0,
    },
    animate: {
        opacity: 1,
        transition: {
            duration: 0.2,
        },
    },
    exit: {
        opacity: 0,
        transition: {
            duration: 0.15,
        },
    },
}

// Stagger children animation
export const staggerContainer: Variants = {
    animate: {
        transition: {
            staggerChildren: 0.05,
        },
    },
}

// List item variants (for stagger effect)
export const listItemVariants: Variants = {
    initial: {
        opacity: 0,
        y: 10,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.2,
        },
    },
}

// Hover scale effect
export const hoverScale = {
    scale: 1.02,
    transition: {
        duration: 0.15,
        ease: "easeOut",
    },
}

// Tap scale effect
export const tapScale = {
    scale: 0.98,
}
