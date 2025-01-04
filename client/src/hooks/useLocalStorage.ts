import { useState, useEffect } from 'react';

const useLocalStorage = <T>(key: string, initialValue: T) => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
    });

    useEffect(() => {
        if (storedValue !== undefined) {
            window.localStorage.setItem(key, JSON.stringify(storedValue));
        }
    }, [key, storedValue]);

    return [storedValue, setStoredValue] as const;
};

export { useLocalStorage };
