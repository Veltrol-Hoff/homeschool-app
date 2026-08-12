'use client'

import { useState, useEffect } from 'react'

const BUCKY_SAYINGS = [
  "Woof! You're doing great, {name}! Let's learn something new today!",
  "Did you know? Dogs have a sense of time. I know exactly when it's time for recess!",
  "What do you call a dog magician? A labracadabrador! Ta-da! 🎩✨",
  "Why did the student eat his homework? Because the teacher said it was a piece of cake! 🍰",
  "Keep up the great work, {name}! You're pawsome!",
  "I'm ready for another adventure today! Are you?",
  "Why did the tree go to the dentist? It needed a root canal! 🌳",
  "Learning is a treat, {name}! Let's dig in!",
  "What do you call a dog that can do magic? A labracadabrador! Wait, did I already tell that one? 🐶",
  "You're barking up the right tree with your studies today!",
  "Why do bees have sticky hair? Because they use honeycombs! 🐝",
  "Fun fact: A greyhound could beat a cheetah in a long-distance race!",
  "Ready to fetch some knowledge today, {name}?",
  "What animal is always at a baseball game? A bat! 🦇⚾",
  "Keep your tail wagging and your brain growing!"
]

export default function BuckyMascot({ studentName }: { studentName: string }) {
  const [saying, setSaying] = useState("Woof! Let's learn something new today!")

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * BUCKY_SAYINGS.length)
    const rawSaying = BUCKY_SAYINGS[randomIndex]
    setSaying(rawSaying.replace('{name}', studentName))
  }, [studentName])

  return (
    <div className="flex items-center gap-4 bg-white/80 p-4 rounded-3xl shadow-sm border border-stone-100 backdrop-blur-sm">
      <div className="bg-stone-100 px-4 py-3 rounded-2xl rounded-tr-none shadow-sm relative max-w-[200px] sm:max-w-[250px]">
        <p className="text-sm sm:text-base font-medium text-stone-700">{saying}</p>
        <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-0 h-0 border-y-8 border-y-transparent border-l-8 border-l-stone-100"></div>
      </div>
      <img src="/mascot.jpg" alt="Bucky the Mascot" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-sm border-2 border-white"/>
    </div>
  )
}
