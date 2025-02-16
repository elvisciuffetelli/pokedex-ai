'use client'

import { useEffect, useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const html = document.documentElement
    if (darkMode) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }, [darkMode])

  return (
    <div className="fixed top-4 right-4 flex items-center gap-2">
      <Sun className="h-4 w-4" />
      <Switch
        checked={darkMode}
        onCheckedChange={setDarkMode}
        aria-label="Toggle theme"
      />
      <Moon className="h-4 w-4" />
    </div>
  )
}