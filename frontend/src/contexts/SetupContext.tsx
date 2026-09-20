import React, { createContext, useContext, useState } from "react";

export type SetupMode = "demo" | "own";

interface SetupState {
  done: boolean;
  mode: SetupMode;
  companyName: string;
}

interface SetupContextValue extends SetupState {
  completeSetup: (mode: SetupMode, companyName?: string) => void;
  resetSetup: () => void;
}

const STORAGE_KEY = "marginguard_setup_v1";
const defaultState: SetupState = { done: false, mode: "demo", companyName: "" };

function load(): SetupState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SetupState) : defaultState;
  } catch {
    return defaultState;
  }
}

const SetupContext = createContext<SetupContextValue | null>(null);

export const SetupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SetupState>(load);

  const completeSetup = (mode: SetupMode, companyName = "") => {
    const name = mode === "demo" ? "Steel City Beverages" : companyName.trim() || "My Company";
    const next: SetupState = { done: true, mode, companyName: name };
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const resetSetup = () => {
    setState(defaultState);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <SetupContext.Provider value={{ ...state, completeSetup, resetSetup }}>
      {children}
    </SetupContext.Provider>
  );
};

export const useSetup = (): SetupContextValue => {
  const ctx = useContext(SetupContext);
  if (!ctx) throw new Error("useSetup must be used inside SetupProvider");
  return ctx;
};
