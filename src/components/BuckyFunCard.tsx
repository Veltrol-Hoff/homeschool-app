'use client'

import { useState, useEffect } from 'react'
import * as LucideIcons from 'lucide-react'

const BUCKY_ACTIVITIES = [
  {
    title: "Bucky's Fun Fact 🧠",
    content: "Did you know that a dog's nose print is as unique as a human's fingerprint? No two are alike!",
    icon: "Lightbulb"
  },
  {
    title: "Bucky's Daily Challenge 🏃‍♂️",
    content: "Can you do 15 jumping jacks right now? Stand up and give it a try to get your blood flowing before your next lesson!",
    icon: "Activity"
  },
  {
    title: "Bucky's Science Corner 🔬",
    content: "Water can boil and freeze at the same time! It's called the 'triple point', and it happens under specific pressure conditions in a vacuum.",
    icon: "FlaskConical"
  },
  {
    title: "Bucky's Brain Teaser 🧩",
    content: "What has keys but can't open locks? A piano! How many keys does a standard piano have? (Hint: 88)",
    icon: "Puzzle"
  },
  {
    title: "Bucky's Reading Challenge 📚",
    content: "Read a page of a book out loud using your best silly voice! Maybe try sounding like a pirate?",
    icon: "BookOpen"
  },
  {
    title: "Bucky's Fun Fact 🌍",
    content: "Octopuses have three hearts! Two pump blood to the gills, and one pumps it to the rest of the body.",
    icon: "Heart"
  },
  {
    title: "Bucky's Nature Quest 🍃",
    content: "Next time you go outside, try to find 3 different types of leaves. Notice how their veins and shapes are different!",
    icon: "Leaf"
  }
]

export default function BuckyFunCard() {
  const [funItem, setFunItem] = useState(BUCKY_ACTIVITIES[0])

  useEffect(() => {
    // Pick a new one based on the day of the year so it changes daily, or just random
    // We will use random for now but store it in session storage so it doesn't flip on every render
    const stored = sessionStorage.getItem('bucky_fun_card_index')
    let idx = 0
    if (stored) {
      idx = parseInt(stored)
    } else {
      idx = Math.floor(Math.random() * BUCKY_ACTIVITIES.length)
      sessionStorage.setItem('bucky_fun_card_index', idx.toString())
    }
    setFunItem(BUCKY_ACTIVITIES[idx])
  }, [])

  const IconComponent = (LucideIcons as any)[funItem.icon] || LucideIcons.Star

  return (
    <div className="bg-sky-50 border border-sky-200 p-5 rounded-2xl relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className="absolute -bottom-4 -right-4 opacity-10 transform -rotate-12 group-hover:scale-110 transition-transform duration-500">
        <IconComponent size={120} />
      </div>
      <div className="relative z-10">
        <h3 className="font-bold text-sky-900 text-lg flex items-center gap-2 mb-2">
          <IconComponent size={20} className="text-sky-600" />
          {funItem.title}
        </h3>
        <p className="text-sm font-medium text-sky-800 leading-relaxed max-w-sm">
          {funItem.content}
        </p>
      </div>
    </div>
  )
}
