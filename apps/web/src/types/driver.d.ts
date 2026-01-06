declare module 'driver.js' {
    export interface Driver {
        drive: (stepIndex?: number) => void;
        destroy: () => void;
        setSteps: (steps: DriveStep[]) => void;
        getActiveIndex: () => number;
        hasNextStep: () => boolean;
        hasPreviousStep: () => boolean;
        isActivated: () => boolean;
        moveNext: () => void;
        movePrevious: () => void;
        moveTo: (stepIndex: number) => void;
    }

    export interface DriveStep {
        element: string | HTMLElement | Element;
        popover?: {
            title?: string;
            description?: string;
            side?: "top" | "right" | "bottom" | "left" | "top-start" | "top-end" | "right-start" | "right-end" | "bottom-start" | "bottom-end" | "left-start" | "left-end";
            align?: "start" | "center" | "end";
            showButtons?: string[];
            disableButtons?: string[];
            nextBtnText?: string;
            prevBtnText?: string;
            doneBtnText?: string;
            onNextClick?: (element?: Element, step?: DriveStep, context?: { config: Config; state: any }) => void;
            onPrevClick?: (element?: Element, step?: DriveStep, context?: { config: Config; state: any }) => void;
            onCloseClick?: (element?: Element, step?: DriveStep, context?: { config: Config; state: any }) => void;
            popoverClass?: string;
        };
        onDeselected?: (element?: Element, step?: DriveStep, context?: { config: Config; state: any }) => void;
        onHighlightStarted?: (element?: Element, step?: DriveStep, context?: { config: Config; state: any }) => void;
        onHighlighted?: (element?: Element, step?: DriveStep, context?: { config: Config; state: any }) => void;
    }

    export interface Config {
        animate?: boolean;
        overlayColor?: string;
        smoothScroll?: boolean;
        allowClose?: boolean;
        opacity?: number;
        stagePadding?: number;
        stageRadius?: number;
        allowKeyboardControl?: boolean;
        disableActiveInteraction?: boolean;
        popoverClass?: string;
        popoverOffset?: number;
        showButtons?: string[];
        disableButtons?: string[];
        showProgress?: boolean;
        progressText?: string;
        nextBtnText?: string;
        prevBtnText?: string;
        doneBtnText?: string;
        onHighlightStarted?: (element?: Element, step?: DriveStep, context?: { config: Config; state: any }) => void;
        onHighlighted?: (element?: Element, step?: DriveStep, context?: { config: Config; state: any }) => void;
        onDeselected?: (element?: Element, step?: DriveStep, context?: { config: Config; state: any }) => void;
        onDestroyStarted?: (element?: Element, step?: DriveStep, context?: { config: Config; state: any }) => void;
        onDestroyed?: (element?: Element, step?: DriveStep, context?: { config: Config; state: any }) => void;
        onNextClick?: (element?: Element, step?: DriveStep, context?: { config: Config; state: any }) => void;
        onPrevClick?: (element?: Element, step?: DriveStep, context?: { config: Config; state: any }) => void;
        onCloseClick?: (element?: Element, step?: DriveStep, context?: { config: Config; state: any }) => void;
        steps?: DriveStep[];
    }

    export type DriverOption = Config;

    export function driver(options?: Config): Driver;
}
