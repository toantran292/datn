import React from 'react';

type TArgs = {
    elementId: string;
    pathname: string;
    scrollDelay?: number;
};
type TReturnType = {
    isHashMatch: boolean;
    hashIds: string[];
    scrollToElement: () => boolean;
};
/**
 * Custom hook for handling hash-based scrolling to a specific element
 * Supports multiple IDs in URL hash (comma-separated, space-separated, or other delimiters)
 *
 * @param {TArgs} args - The ID of the element to scroll to
 * @returns {TReturnType} Object containing hash match status and scroll function
 */
declare const useHashScroll: (args: TArgs) => TReturnType;

declare const getValueFromLocalStorage: (key: string, defaultValue: any) => any;
declare const setValueIntoLocalStorage: (key: string, value: any) => boolean;
declare const useLocalStorage: <T>(key: string, initialValue: T) => {
    readonly storedValue: T | null;
    readonly setValue: (value: T) => void;
    readonly clearValue: () => void;
};

declare const useOutsideClickDetector: (ref: React.RefObject<HTMLElement> | any, callback: () => void, useCapture?: boolean) => void;

declare const usePlatformOS: () => {
    isMobile: boolean;
    platform: string;
};

export { getValueFromLocalStorage, setValueIntoLocalStorage, useHashScroll, useLocalStorage, useOutsideClickDetector, usePlatformOS };
