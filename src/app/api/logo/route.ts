import { NextResponse } from 'next/server'
import fs from 'fs'

export async function GET() {
  try {
    const filePath = "C:\\Users\\ewhof\\.gemini\\antigravity\\brain\\0772288e-39e9-4683-a48b-40af064eb763\\.user_uploaded\\media__1786044548064.jpg"
    const imageBuffer = fs.readFileSync(filePath)
    return new NextResponse(imageBuffer, {
      headers: { 'Content-Type': 'image/jpeg' }
    })
  } catch (error) {
    return new NextResponse('Not found', { status: 404 })
  }
}
