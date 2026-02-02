import React, { createContext, useContext, useState, useEffect } from "react";

interface SettingsState {
    focusGameOnPlay: boolean;
    focusConsoleOnPlay: boolean;
    maximizeGameOnPlay: boolean;
}

interface SettingsContextType extends SettingsState {
    toggleSetting: (key: keyof SettingsState) => void;
}

const DEFAULT_SETTINGS: SettingsState = {
    focusGameOnPlay: true,
    focusConsoleOnPlay: false,
    maximizeGameOnPlay: false,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "triton_settings";

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);

    // Load from Local Storage on mount
    useEffect(() => {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
            try {
                setSettings(prev => ({ ...prev, ...JSON.parse(stored) }));
            } catch (e) {
                console.error("Failed to parse settings", e);
            }
        }
    }, []);

    // Save to Local Storage on change
    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
    }, [settings]);

    const toggleSetting = (key: keyof SettingsState) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <SettingsContext.Provider value={{ ...settings, toggleSetting }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
};
