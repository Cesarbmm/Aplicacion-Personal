"use client"

import React, { useRef } from 'react'
import { MotionValue, motion, useScroll, useTransform } from 'framer-motion'

export function ContainerScroll({
  titleComponent,
  children,
}: {
  titleComponent: React.ReactNode
  children: React.ReactNode
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const rotate = useTransform(scrollYProgress, [0, 1], [18, 0])
  const scale = useTransform(scrollYProgress, [0, 1], isMobile ? [0.88, 1] : [1.04, 1])
  const translate = useTransform(scrollYProgress, [0, 1], [0, -80])

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-[54rem] items-center justify-center px-4 pb-12 pt-28 md:min-h-[74rem] md:px-8"
    >
      <div className="relative w-full py-12 md:py-28" style={{ perspective: '1100px' }}>
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  )
}

function Header({
  translate,
  titleComponent,
}: {
  translate: MotionValue<number>
  titleComponent: React.ReactNode
}) {
  return (
    <motion.div style={{ translateY: translate }} className="mx-auto max-w-5xl text-center">
      {titleComponent}
    </motion.div>
  )
}

function Card({
  rotate,
  scale,
  children,
}: {
  rotate: MotionValue<number>
  scale: MotionValue<number>
  children: React.ReactNode
}) {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          '0 12px 32px rgba(0,0,0,0.32), 0 42px 120px rgba(2,6,23,0.46), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
      className="liquid-glass-card mx-auto mt-10 h-[30rem] w-full max-w-6xl rounded-[34px] p-2 md:mt-14 md:h-[42rem] md:p-4"
    >
      <div className="sigma-grid h-full w-full overflow-hidden rounded-[28px] border border-red-500/16 bg-[radial-gradient(circle_at_top,rgba(239,27,27,0.14),transparent_32%),linear-gradient(180deg,rgba(17,17,17,0.72),rgba(5,5,5,0.88))]">
        {children}
      </div>
    </motion.div>
  )
}
