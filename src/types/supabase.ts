export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'user' | 'moderator' | 'admin'

export type SketchStatus = 'pending' | 'approved' | 'rejected' | 'draft'

export type SketchDifficulty = 'Лёгкая' | 'Средняя' | 'Тяжёлая'

export type ModerationAction = 'approved' | 'rejected'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          role: UserRole
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
      }
      sketches: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          code: string
          thumbnail_url: string | null
          tags: string[]
          category: string | null
          difficulty: SketchDifficulty | null
          status: SketchStatus
          views: number
          likes: number
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          code: string
          thumbnail_url?: string | null
          tags?: string[]
          category?: string | null
          difficulty?: SketchDifficulty | null
          status?: SketchStatus
          views?: number
          likes?: number
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          code?: string
          thumbnail_url?: string | null
          tags?: string[]
          category?: string | null
          difficulty?: SketchDifficulty | null
          status?: SketchStatus
          views?: number
          likes?: number
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sketch_moderation_logs: {
        Row: {
          id: string
          sketch_id: string
          moderator_id: string
          action: ModerationAction
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          sketch_id: string
          moderator_id: string
          action: ModerationAction
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          sketch_id?: string
          moderator_id?: string
          action?: ModerationAction
          comment?: string | null
          created_at?: string
        }
      }
      sketch_likes: {
        Row: {
          id: string
          user_id: string
          sketch_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          sketch_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          sketch_id?: string
          created_at?: string
        }
      }
      sketch_comments: {
        Row: {
          id: string
          user_id: string
          sketch_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          sketch_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          sketch_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      gallery_sketches: {
        Row: {
          id: string
          title: string
          description: string
          author_name: string
          author_avatar: string | null
          thumbnail_url: string | null
          tags: string[]
          category: string | null
          difficulty: SketchDifficulty | null
          likes: number
          views: number
          created_at: string
        }
      }
    }
  }
}

// Типы для профилей
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

// Типы для скетчей
export type Sketch = Database['public']['Tables']['sketches']['Row']
export type SketchInsert = Database['public']['Tables']['sketches']['Insert']
export type SketchUpdate = Database['public']['Tables']['sketches']['Update']

// Типы для лайков
export type SketchLike = Database['public']['Tables']['sketch_likes']['Row']
export type SketchLikeInsert = Database['public']['Tables']['sketch_likes']['Insert']

// Типы для комментариев
export type SketchComment = Database['public']['Tables']['sketch_comments']['Row']
export type SketchCommentInsert = Database['public']['Tables']['sketch_comments']['Insert']

// Тип для галереи
export type GallerySketch = Database['public']['Views']['gallery_sketches']['Row']

// Экспортируем типы для использования в composables
export type ProfilesUpdate = Database['public']['Tables']['profiles']['Update']
export type SketchesInsert = Database['public']['Tables']['sketches']['Insert']
export type SketchesUpdate = Database['public']['Tables']['sketches']['Update']
export type SketchLikesInsert = Database['public']['Tables']['sketch_likes']['Insert']

// Типы для модерации
export type SketchModerationLog = Database['public']['Tables']['sketch_moderation_logs']['Row']
export type SketchModerationLogInsert = Database['public']['Tables']['sketch_moderation_logs']['Insert']

// Тип для скетча с данными профиля автора
export interface SketchWithProfile extends Sketch {
  profiles?: {
    id: string
    display_name: string | null
    email: string
    avatar_url: string | null
  } | null
  moderation_log?: {
    action: ModerationAction
    comment: string | null
    moderator_name: string
    created_at: string
  } | null
}
