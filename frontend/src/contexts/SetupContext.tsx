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
    const value: unknown = raw ? JSON.parse(raw) : null;
    if (!value || typeof value !== "object") return defaultState;
    const saved = value as Partial<SetupState>;
    if (
      saved.done !== true ||
      !["demo", "own"].includes(saved.mode ?? "") ||
      typeof saved.companyName !== "string" ||
      !saved.companyName.trim() ||
      saved.companyName.length > 120
    )
      return defaultState;
    return {
      done: true,
      mode: saved.mode!,
      companyName: saved.companyName.trim(),
    };
  } catch {
    return defaultState;
  }
}

const SetupContext = createContext<SetupContextValue | null>(null);

export const SetupProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<SetupState>(load);

  const completeSetup = (mode: SetupMode, companyName = "") => {
    const name =
      mode === "demo"
        ? "Steel City Beverages"
        : companyName.trim().slice(0, 120) || "My Company";
    const next: SetupState = { done: true, mode, companyName: name };
    setState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* Setup remains available for this session. */
    }
  };

  const resetSetup = () => {
    setState(defaultState);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Storage may be disabled. */
    }
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
