-- ============================================================
-- p5editor — SQL миграции для Supabase (исправлено)
-- Версия: 0.5.3
-- Дата: 21 марта 2026 г.
-- ============================================================

-- Примечание: убедитесь, что расширение pgcrypto включено, если вы используете gen_random_uuid():
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- Проверка (опционально):
-- SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto';

-- ============================================================
-- 1. Создание таблиц
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sketches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  code TEXT NOT NULL,
  thumbnail_url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  category TEXT,
  difficulty TEXT CHECK (difficulty IN ('Лёгкая', 'Средняя', 'Тяжёлая')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'draft')),
  rejection_reason TEXT,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sketch_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sketch_id UUID NOT NULL REFERENCES public.sketches(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected')),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sketch_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sketch_id UUID NOT NULL REFERENCES public.sketches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, sketch_id)
);

CREATE TABLE IF NOT EXISTS public.sketch_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sketch_id UUID NOT NULL REFERENCES public.sketches(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. Индексы для оптимизации поиска
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

CREATE INDEX IF NOT EXISTS idx_sketches_user_id ON public.sketches(user_id);
CREATE INDEX IF NOT EXISTS idx_sketches_status ON public.sketches(status);
CREATE INDEX IF NOT EXISTS idx_sketches_category ON public.sketches(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sketches_difficulty ON public.sketches(difficulty) WHERE difficulty IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sketches_created_at ON public.sketches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sketches_likes ON public.sketches(likes DESC);
CREATE INDEX IF NOT EXISTS idx_sketches_views ON public.sketches(views DESC);
CREATE INDEX IF NOT EXISTS idx_sketches_tags ON public.sketches USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_sketch_likes_user_id ON public.sketch_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_sketch_likes_sketch_id ON public.sketch_likes(sketch_id);

CREATE INDEX IF NOT EXISTS idx_sketch_comments_user_id ON public.sketch_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_sketch_comments_sketch_id ON public.sketch_comments(sketch_id);

CREATE INDEX IF NOT EXISTS idx_sketch_moderation_logs_sketch_id ON public.sketch_moderation_logs(sketch_id);
CREATE INDEX IF NOT EXISTS idx_sketch_moderation_logs_moderator_id ON public.sketch_moderation_logs(moderator_id);
CREATE INDEX IF NOT EXISTS idx_sketch_moderation_logs_action ON public.sketch_moderation_logs(action);

-- ============================================================
-- 3. Triggers для автоматического создания профилей
-- ============================================================

-- Функция для создания профиля при регистрации (использует ON CONFLICT DO NOTHING)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url, bio, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
    NULL,
    NULL,
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger для автоматического создания профиля
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 4. Triggers для обновления updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sketches_updated_at ON public.sketches;
CREATE TRIGGER update_sketches_updated_at
  BEFORE UPDATE ON public.sketches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sketch_comments_updated_at ON public.sketch_comments;
CREATE TRIGGER update_sketch_comments_updated_at
  BEFORE UPDATE ON public.sketch_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 5. View для галереи (только одобренные скетчи)
-- ============================================================

CREATE OR REPLACE VIEW public.gallery_sketches AS
SELECT
  s.id,
  s.title,
  s.description,
  COALESCE(p.display_name, SPLIT_PART(p.email, '@', 1)) AS author_name,
  p.avatar_url AS author_avatar,
  s.thumbnail_url,
  s.tags,
  s.category,
  s.difficulty,
  s.likes,
  s.views,
  s.created_at
FROM public.sketches s
JOIN public.profiles p ON s.user_id = p.id
WHERE s.status = 'approved'
ORDER BY s.created_at DESC;

-- ============================================================
-- 6. Включение Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sketches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sketch_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sketch_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. RLS политики для profiles
-- ============================================================

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = id);

-- ============================================================
-- 8. RLS политики для sketches
-- ============================================================

-- Пользователи могут видеть свои собственные скетчи (включая черновики и ожидающие модерации)
DROP POLICY IF EXISTS "Users can view own sketches" ON public.sketches;
CREATE POLICY "Users can view own sketches"
  ON public.sketches FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

-- Все могут видеть только одобренные скетчи
DROP POLICY IF EXISTS "Approved sketches are viewable by everyone" ON public.sketches;
CREATE POLICY "Approved sketches are viewable by everyone"
  ON public.sketches FOR SELECT
  USING (status = 'approved');

DROP POLICY IF EXISTS "Authenticated users can create sketches" ON public.sketches;
CREATE POLICY "Authenticated users can create sketches"
  ON public.sketches FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own sketches" ON public.sketches;
CREATE POLICY "Users can update own sketches"
  ON public.sketches FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own sketches" ON public.sketches;
CREATE POLICY "Users can delete own sketches"
  ON public.sketches FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Moderators can update any sketch status" ON public.sketches;
CREATE POLICY "Moderators can update any sketch status"
  ON public.sketches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role IN ('moderator', 'admin')
    )
  );

DROP POLICY IF EXISTS "Moderators can view all sketches" ON public.sketches;
CREATE POLICY "Moderators can view all sketches"
  ON public.sketches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role IN ('moderator', 'admin')
    )
  );

-- ============================================================
-- 9. RLS политики для sketch_likes
-- ============================================================

DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.sketch_likes;
CREATE POLICY "Likes are viewable by everyone"
  ON public.sketch_likes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create likes" ON public.sketch_likes;
CREATE POLICY "Authenticated users can create likes"
  ON public.sketch_likes FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own likes" ON public.sketch_likes;
CREATE POLICY "Users can delete own likes"
  ON public.sketch_likes FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================
-- 10. RLS политики для sketch_comments
-- ============================================================

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.sketch_comments;
CREATE POLICY "Comments are viewable by everyone"
  ON public.sketch_comments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.sketch_comments;
CREATE POLICY "Authenticated users can create comments"
  ON public.sketch_comments FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON public.sketch_comments;
CREATE POLICY "Users can update own comments"
  ON public.sketch_comments FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.sketch_comments;
CREATE POLICY "Users can delete own comments"
  ON public.sketch_comments FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================
-- 10.5. RLS политики для sketch_moderation_logs
-- ============================================================

ALTER TABLE public.sketch_moderation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Moderators can view moderation logs" ON public.sketch_moderation_logs;
CREATE POLICY "Moderators can view moderation logs"
  ON public.sketch_moderation_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role IN ('moderator', 'admin')
    )
  );

DROP POLICY IF EXISTS "Moderators can create moderation logs" ON public.sketch_moderation_logs;
CREATE POLICY "Moderators can create moderation logs"
  ON public.sketch_moderation_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role IN ('moderator', 'admin')
    )
  );

-- ============================================================
-- 11. Функции для автоматического обновления счётчиков
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_sketch_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.sketches SET likes = likes + 1 WHERE id = NEW.sketch_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.decrement_sketch_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.sketches SET likes = GREATEST(0, likes - 1) WHERE id = OLD.sketch_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_like_created ON public.sketch_likes;
CREATE TRIGGER on_like_created
  AFTER INSERT ON public.sketch_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_sketch_likes();

DROP TRIGGER IF EXISTS on_like_deleted ON public.sketch_likes;
CREATE TRIGGER on_like_deleted
  AFTER DELETE ON public.sketch_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_sketch_likes();

-- ============================================================
-- 12. Вставка тестовых данных (опционально)
-- ============================================================

-- Раскомментируйте, если нужно создать тестового админа
-- Сначала зарегистрируйте пользователя через Auth (в Dashboard),
-- затем выполните:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@example.com';

-- ============================================================
-- Конец миграций
-- ============================================================
