'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface ValuesVisibilityContextType {
  showValues: boolean
  toggleValues: () => void
}

const ValuesVisibilityContext = createContext<ValuesVisibilityContextType | undefined>(undefined)

export function ValuesVisibilityProvider({ children }: { children: ReactNode }) {
  const [showValues, setShowValues] = useState(true)

  const toggleValues = () => {
    setShowValues(!showValues)
  }

  return (
    <ValuesVisibilityContext.Provider value={{ showValues, toggleValues }}>
      {children}
    </ValuesVisibilityContext.Provider>
  )
}

export function useValuesVisibility() {
  const context = useContext(ValuesVisibilityContext)
  if (context === undefined) {
    throw new Error('useValuesVisibility must be used within a ValuesVisibilityProvider')
  }
  return context
}

export function formatCurrency(value: number, showValue: boolean = true) {
  if (!showValue) {
    return 'R$ ••••••'
  }
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatPercentage(value: number, showValue: boolean = true) {
  if (!showValue) {
    return '••••%'
  }
  return `${value.toFixed(1)}%`
}

export function formatNumber(value: number, showValue: boolean = true) {
  if (!showValue) {
    return '••••'
  }
  return value.toLocaleString('pt-BR')
}