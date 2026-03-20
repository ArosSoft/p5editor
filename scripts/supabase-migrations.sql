-- ============================================================
-- p5editor — SQL миграции для Supabase
-- Версия: 0.3.0
-- Дата: 20 марта 2026 г.
-- ============================================================

-- ============================================================
-- 1. Создание таблиц
-- ============================================================

-- Таблица профилей пользователей
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Таблица скетчей
CREATE TABLE IF NOT EXISTS sketches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  code TEXT NOT NULL,
  thumbnail_url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  category TEXT,
  difficulty TEXT CHECK (difficulty IN ('Лёгкая', 'Средняя', 'Тяжёлая')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'draft')),
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Таблица лайков скетчей
CREATE TABLE IF NOT EXISTS sketch_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sketch_id UUID NOT NULL REFERENCES sketches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, sketch_id)
);

-- Таблица комментариев к скетчам
CREATE TABLE IF NOT EXISTS sketch_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sketch_id UUID NOT NULL REFERENCES sketches(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. Индексы для оптимизации поиска
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

CREATE INDEX IF NOT EXISTS idx_sketches_user_id ON sketches(user_id);
CREATE INDEX IF NOT EXISTS idx_sketches_status ON sketches(status);
CREATE INDEX IF NOT EXISTS idx_sketches_category ON sketches(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sketches_difficulty ON sketches(difficulty) WHERE difficulty IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sketches_created_at ON sketches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sketches_likes ON sketches(likes DESC);
CREATE INDEX IF NOT EXISTS idx_sketches_views ON sketches(views DESC);
CREATE INDEX IF NOT EXISTS idx_sketches_tags ON sketches USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_sketch_likes_user_id ON sketch_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_sketch_likes_sketch_id ON sketch_likes(sketch_id);

CREATE INDEX IF NOT EXISTS idx_sketch_comments_user_id ON sketch_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_sketch_comments_sketch_id ON sketch_comments(sketch_id);

-- ============================================================
-- 3. Triggers для автоматического создания профилей
-- ============================================================

-- Функция для создания профиля при регистрации
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
  );
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

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger для profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger для sketches
DROP TRIGGER IF EXISTS update_sketches_updated_at ON sketches;
CREATE TRIGGER update_sketches_updated_at
  BEFORE UPDATE ON sketches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger для sketch_comments
DROP TRIGGER IF EXISTS update_sketch_comments_updated_at ON sketch_comments;
CREATE TRIGGER update_sketch_comments_updated_at
  BEFORE UPDATE ON sketch_comments
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
FROM sketches s
JOIN profiles p ON s.user_id = p.id
WHERE s.status = 'approved'
ORDER BY s.created_at DESC;

-- ============================================================
-- 6. Включение Row Level Security (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sketches ENABLE ROW LEVEL SECURITY;
ALTER TABLE sketch_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sketch_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. RLS политики для profiles
-- ============================================================

-- Все могут читать профили
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Пользователи могут обновлять только свой профиль
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Пользователи могут вставлять только свой профиль (при регистрации)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- 8. RLS политики для sketches
-- ============================================================

-- Все могут читать одобренные скетчи
DROP POLICY IF EXISTS "Approved sketches are viewable by everyone" ON sketches;
CREATE POLICY "Approved sketches are viewable by everyone"
  ON sketches FOR SELECT
  USING (status = 'approved');

-- Авторизованные пользователи могут создавать скетчи
DROP POLICY IF EXISTS "Authenticated users can create sketches" ON sketches;
CREATE POLICY "Authenticated users can create sketches"
  ON sketches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Владелец может обновлять свой скетч
DROP POLICY IF EXISTS "Users can update own sketches" ON sketches;
CREATE POLICY "Users can update own sketches"
  ON sketches FOR UPDATE
  USING (auth.uid() = user_id);

-- Владелец может удалять свой скетч
DROP POLICY IF EXISTS "Users can delete own sketches" ON sketches;
CREATE POLICY "Users can delete own sketches"
  ON sketches FOR DELETE
  USING (auth.uid() = user_id);

-- Модераторы и админы могут обновлять статус любого скетча
DROP POLICY IF EXISTS "Moderators can update any sketch status" ON sketches;
CREATE POLICY "Moderators can update any sketch status"
  ON sketches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('moderator', 'admin')
    )
  );

-- Модераторы и админы могут читать все скетчи (включая pending)
DROP POLICY IF EXISTS "Moderators can view all sketches" ON sketches;
CREATE POLICY "Moderators can view all sketches"
  ON sketches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('moderator', 'admin')
    )
  );

-- ============================================================
-- 9. RLS политики для sketch_likes
-- ============================================================

-- Все могут читать лайки
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON sketch_likes;
CREATE POLICY "Likes are viewable by everyone"
  ON sketch_likes FOR SELECT
  USING (true);

-- Авторизованные пользователи могут ставить лайки
DROP POLICY IF EXISTS "Authenticated users can create likes" ON sketch_likes;
CREATE POLICY "Authenticated users can create likes"
  ON sketch_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Владелец лайка может удалить его
DROP POLICY IF EXISTS "Users can delete own likes" ON sketch_likes;
CREATE POLICY "Users can delete own likes"
  ON sketch_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 10. RLS политики для sketch_comments
-- ============================================================

-- Все могут читать комментарии
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON sketch_comments;
CREATE POLICY "Comments are viewable by everyone"
  ON sketch_comments FOR SELECT
  USING (true);

-- Авторизованные пользователи могут создавать комментарии
DROP POLICY IF EXISTS "Authenticated users can create comments" ON sketch_comments;
CREATE POLICY "Authenticated users can create comments"
  ON sketch_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Владелец комментария может обновлять его
DROP POLICY IF EXISTS "Users can update own comments" ON sketch_comments;
CREATE POLICY "Users can update own comments"
  ON sketch_comments FOR UPDATE
  USING (auth.uid() = user_id);

-- Владелец комментария может удалить его
DROP POLICY IF EXISTS "Users can delete own comments" ON sketch_comments;
CREATE POLICY "Users can delete own comments"
  ON sketch_comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 11. Функции для автоматического обновления счётчиков
-- ============================================================

-- Функция для увеличения счётчика лайков
CREATE OR REPLACE FUNCTION public.increment_sketch_likes(sketch_uuid UUID)
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sketches SET likes = likes + 1 WHERE id = sketch_uuid;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Функция для уменьшения счётчика лайков
CREATE OR REPLACE FUNCTION public.decrement_sketch_likes(sketch_uuid UUID)
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sketches SET likes = GREATEST(0, likes - 1) WHERE id = sketch_uuid;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger для увеличения лайков при добавлении
DROP TRIGGER IF EXISTS on_like_created ON sketch_likes;
CREATE TRIGGER on_like_created
  AFTER INSERT ON sketch_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_sketch_likes(NEW.sketch_id);

-- Trigger для уменьшения лайков при удалении
DROP TRIGGER IF EXISTS on_like_deleted ON sketch_likes;
CREATE TRIGGER on_like_deleted
  AFTER DELETE ON sketch_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_sketch_likes(OLD.sketch_id);

-- ============================================================
-- 12. Вставка тестовых данных (опционально)
-- ============================================================

-- Раскомментируйте, если нужно создать тестового админа
-- Для этого сначала нужно зарегистрировать пользователя через Auth
-- Затем обновить его роль:
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';

-- ============================================================
-- Конец миграций
-- ============================================================
