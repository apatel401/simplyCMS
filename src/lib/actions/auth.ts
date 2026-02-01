'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

/**
 * Sign up a new user
 */
export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    name: formData.get('name') as string,
  }

  // Create auth user in Supabase
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  })

  if (authError) {
    return { error: authError.message }
  }

  // Create user in database with Prisma
  if (authData.user) {
    try {
      await prisma.user.create({
        data: {
          id: authData.user.id,
          email: data.email,
          name: data.name,
          role: 'AUTHOR', // Default role
        },
      })
    } catch (error) {
      console.error('Failed to create user profile:', error)
      return { error: 'Failed to create user profile' }
    }
  }

  return { success: true }
}

/**
 * Sign in an existing user
 */
export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/admin')
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}

/**
 * Request a password reset email
 */
export async function resetPasswordRequest(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'Password reset email sent. Check your inbox.' }
}

/**
 * Reset password with new password
 */
export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'Password updated successfully' }
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // Get user data from database
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return dbUser
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return user
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, data: {
  name?: string
  email?: string
}) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
      },
    })

    revalidatePath('/admin/profile')
    return { success: true, user }
  } catch (error) {
    console.error('Error updating user profile:', error)
    return { error: 'Failed to update profile' }
  }
}

/**
 * Check if user has required role
 */
export async function checkUserRole(requiredRole: 'ADMIN' | 'EDITOR' | 'AUTHOR') {
  const user = await getCurrentUser()
  
  if (!user) {
    return false
  }

  const roleHierarchy = {
    ADMIN: 3,
    EDITOR: 2,
    AUTHOR: 1,
  }

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
}

/**
 * Check if user is admin
 */
export async function isAdmin() {
  const user = await getCurrentUser()
  return user?.role === 'ADMIN'
}

/**
 * Check if user is editor or admin
 */
export async function isEditorOrAdmin() {
  const user = await getCurrentUser()
  return user?.role === 'ADMIN' || user?.role === 'EDITOR'
}