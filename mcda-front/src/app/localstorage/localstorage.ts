import {sets} from "@/hooks/useGetSets";

export const addToLocalStorage = (key: string, newObject: sets) => {
    try {

        const storedList = JSON.parse(localStorage.getItem(key) || "[]");

        const objectExists = storedList.some(
            (item: any) => JSON.stringify(item) === JSON.stringify(newObject)
        );

        if (!objectExists) {
            storedList.push(newObject);
            localStorage.setItem(key, JSON.stringify(storedList));
        }
    } catch (error) {
        console.error("Error saving to localStorage:", error);
    }
};


export const getFromLocalStorage = (key: string): sets[] => {
    if (typeof window === 'undefined') {
        console.warn('localStorage is not available on the server.');
        return [];
    }

    try {
        const jsonValue = localStorage.getItem(key);
        return jsonValue ? JSON.parse(jsonValue) : [];
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return [];
    }
};


export const removeFromLocalStorage = (key: string, objectToRemove: sets) => {
    try {

        const storedList = JSON.parse(localStorage.getItem(key) || "[]");

        const updatedList = storedList.filter(
            (item: any) => JSON.stringify(item) !== JSON.stringify(objectToRemove)
        );

        localStorage.setItem(key, JSON.stringify(updatedList));
    } catch (error) {
        console.error("Error removing from localStorage:", error);
    }
};
