"use client";
import { createContext, useContext, useState } from "react";

type CountryContextType = {
  country: string;
  setCountry: (c: string) => void;
};

const CountryContext = createContext<CountryContextType | undefined>(undefined);

export function CountryProvider({
  initialCountry,
  children,
}: {
  initialCountry: string;
  children: React.ReactNode;
}) {
  const [country, setCountry] = useState(initialCountry);

  return (
    <CountryContext.Provider value={{ country, setCountry }}>
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const context = useContext(CountryContext);
  if (!context) {
    throw new Error("useCountry must be used within a CountryProvider");
  }
  return context;
}
