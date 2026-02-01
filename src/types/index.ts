import { UserRole, ContentStatus } from '@prisma/client'

export type { UserRole, ContentStatus }

export interface User {
  id: string
  email: string
  name: string | null
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface Post {
  id: string
  title: string
  slug: string
  content: string | null
  excerpt: string | null
  featuredImage: string | null
  status: ContentStatus
  metaTitle: string | null
  metaDescription: string | null
  authorId: string
  categoryId: string | null
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}