'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface ValuesVisibilityContextType {
  showValues: boolean
  toggleValues: () => void
  currency: string
  setCurrency: (currency: string) => void
}

const ValuesVisibilityContext = createContext<ValuesVisibilityContextType | undefined>(undefined)

export function ValuesVisibilityProvider({ children }: { children: ReactNode }) {
  const [showValues, setShowValues] = useState(true)
  const [currency, setCurrency] = useState('BRL')

  // Fetch user currency on mount
  useEffect(() => {
    const fetchUserCurrency = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          if (data.user?.currency) {
            setCurrency(data.user.currency)
          }
        }
      } catch (error) {
        console.error('Error fetching user currency:', error)
      }
    }

    fetchUserCurrency()
  }, [])

  const toggleValues = () => {
    setShowValues(!showValues)
  }

  return (
    <ValuesVisibilityContext.Provider value={{ showValues, toggleValues, currency, setCurrency }}>
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

const currencyConfig = {
  BRL: {
    symbol: 'R$',
    locale: 'pt-BR',
    code: 'BRL'
  },
  USD: {
    symbol: '$',
    locale: 'en-US',
    code: 'USD'
  },
  EUR: {
    symbol: '€',
    locale: 'de-DE',
    code: 'EUR'
  }
}

export function formatCurrency(value: number, showValue: boolean = true, currencyCode: string = 'BRL') {
  if (!showValue) {
    const config = currencyConfig[currencyCode as keyof typeof currencyConfig] || currencyConfig.BRL
    return `${config.symbol} ••••••`
  }

  const config = currencyConfig[currencyCode as keyof typeof currencyConfig] || currencyConfig.BRL

  return `${config.symbol} ${value.toLocaleString(config.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
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