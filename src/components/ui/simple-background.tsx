'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const SimpleBackground = () => {
  const [particles, setParticles] = useState<Array<{top: number, left: number, duration: number, delay: number}>>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Gera partículas fixas para evitar erro de hidratação
    const particleData = Array.from({ length: 12 }, () => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: 4 + Math.random() * 4,
      delay: Math.random() * 2
    }))
    setParticles(particleData)
    setMounted(true)
  }, [])

  if (!mounted) {
    // Renderização inicial simples para evitar erro de hidratação
    return (
      <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
              linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.8) 100%)
            `
          }}
        />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Base gradient - similar ao original */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
            linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.8) 100%)
          `
        }}
      />

      {/* Orbs flutuantes grandes */}
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-blue-400/10 to-purple-400/10 blur-3xl"
        style={{ top: '10%', left: '10%' }}
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -100, 50, 0],
          scale: [1, 1.2, 0.8, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div
        className="absolute w-80 h-80 rounded-full bg-gradient-to-r from-purple-400/10 to-green-400/10 blur-3xl"
        style={{ top: '60%', right: '10%' }}
        animate={{
          x: [0, -80, 60, 0],
          y: [0, 80, -40, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div
        className="absolute w-72 h-72 rounded-full bg-gradient-to-r from-green-400/10 to-blue-400/10 blur-3xl"
        style={{ bottom: '20%', left: '50%', transform: 'translateX(-50%)' }}
        animate={{
          x: [0, 70, -70, 0],
          y: [0, -60, 30, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Partículas pequenas animadas - com posições fixas */}
      {particles.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/40 rounded-full"
          style={{
            top: `${particle.top}%`,
            left: `${particle.left}%`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Pontos maiores flutuantes */}
      <motion.div
        className="absolute w-3 h-3 bg-blue-400/30 rounded-full"
        style={{ top: '20%', left: '10%' }}
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div
        className="absolute w-4 h-4 bg-purple-400/20 rounded-full"
        style={{ top: '60%', left: '80%' }}
        animate={{
          y: [0, -30, 0],
          x: [0, -15, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />

      <motion.div
        className="absolute w-2 h-2 bg-green-400/40 rounded-full"
        style={{ top: '80%', left: '30%' }}
        animate={{
          y: [0, -25, 0],
          x: [0, 20, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />

      {/* Overlay sutil com movimento */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/2 to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  )
}

export default SimpleBackground