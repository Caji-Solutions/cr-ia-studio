'use client'

import { motion, type Variants } from 'framer-motion'

const containerVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
}

const itemVariants: Variants = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
}

interface Props {
  children:  React.ReactNode
  className?: string
}

/** Wrap a grid container — each direct child animates in with 50ms stagger */
export function StaggerGrid({ children, className }: Props) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Wrap each card inside a StaggerGrid */
export function StaggerItem({ children, className }: Props) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  )
}
