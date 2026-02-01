import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, email, name } = body

    const user = await prisma.user.create({
      data: {
        id,
        email,
        name,
        role: 'AUTHOR',
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}