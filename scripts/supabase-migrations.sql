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
-- 13. Функционал «Класс»: комнаты и присоединение скетчей
-- ============================================================
-- Добавлено по loop-реализации страницы «Класс» (docs/CLASS_IMPLEMENTATION_LOOP.md).
-- Отклонения от ТЗ: вместо owner_id используется user_id -> profiles(id),
-- как во всём репозитории (sketches.user_id и т.д.).

-- 13.1. Расширение таблицы sketches: numeric_sketch_id + статус 'saved'
-- (CREATE TABLE выше уже существует, меняем ограничение и добавляем колонку)
-- Имена констрейнтов ищем динамически, чтобы не зависеть от имён в проде.

-- Добавляем колонку (существующие строки получают NULL — без потери данных)
ALTER TABLE public.sketches ADD COLUMN IF NOT EXISTS numeric_sketch_id BIGINT;

-- Снимаем любой CHECK-констрейнт на колонке status и ставим расширенный
DO $$
DECLARE
  v_con text;
BEGIN
  SELECT c.conname INTO v_con
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
  WHERE c.conrelid = 'public.sketches'::regclass
    AND c.contype = 'c'
    AND a.attname = 'status';

  IF v_con IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.sketches DROP CONSTRAINT %I', v_con);
  END IF;

  -- Не добавляем, если уже есть констрейнт с нужным именем (идемпотентность)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sketches_status_check'
      AND conrelid = 'public.sketches'::regclass
  ) THEN
    ALTER TABLE public.sketches
      ADD CONSTRAINT sketches_status_check
      CHECK (status IN ('pending', 'approved', 'rejected', 'draft', 'saved'));
  END IF;
END $$;

-- Уникальность цифрового ID (допускаются NULL у старых записей).
-- Снимаем любой UNIQUE-констрейнт на колонке, затем ставим именованный.
DO $$
DECLARE
  v_con text;
BEGIN
  SELECT c.conname INTO v_con
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
  WHERE c.conrelid = 'public.sketches'::regclass
    AND c.contype = 'u'
    AND a.attname = 'numeric_sketch_id';

  IF v_con IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.sketches DROP CONSTRAINT %I', v_con);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sketches_numeric_sketch_id_key'
      AND conrelid = 'public.sketches'::regclass
  ) THEN
    ALTER TABLE public.sketches
      ADD CONSTRAINT sketches_numeric_sketch_id_key UNIQUE (numeric_sketch_id);
  END IF;
END $$;

-- 13.2. Таблица class_rooms (комнаты учителя)
CREATE TABLE IF NOT EXISTS public.class_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  room_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (room_key),
  CHECK (room_key ~ '^\d{4}$')
);

-- 13.3. Таблица связи room_sketches
CREATE TABLE IF NOT EXISTS public.room_sketches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.class_rooms(id) ON DELETE CASCADE,
  sketch_id UUID NOT NULL REFERENCES public.sketches(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sketch_id),
  CHECK (rating BETWEEN 0 AND 4)
);

-- 13.4. Индексы
CREATE INDEX IF NOT EXISTS idx_class_rooms_user_id ON public.class_rooms(user_id);
CREATE INDEX IF NOT EXISTS idx_room_sketches_room_id ON public.room_sketches(room_id);
CREATE INDEX IF NOT EXISTS idx_room_sketches_sketch_id ON public.room_sketches(sketch_id);
CREATE INDEX IF NOT EXISTS idx_room_sketches_student_id ON public.room_sketches(student_id);

-- 13.5. Триггеры updated_at
DROP TRIGGER IF EXISTS update_class_rooms_updated_at ON public.class_rooms;
CREATE TRIGGER update_class_rooms_updated_at
  BEFORE UPDATE ON public.class_rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_room_sketches_updated_at ON public.room_sketches;
CREATE TRIGGER update_room_sketches_updated_at
  BEFORE UPDATE ON public.room_sketches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13.6. Включение RLS
ALTER TABLE public.class_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_sketches ENABLE ROW LEVEL SECURITY;

-- 13.7. RLS для class_rooms (владелец видит/создаёт/обновляет/удаляет только свои)
DROP POLICY IF EXISTS "Room owners can view own rooms" ON public.class_rooms;
CREATE POLICY "Room owners can view own rooms"
  ON public.class_rooms FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Room owners can create own rooms" ON public.class_rooms;
CREATE POLICY "Room owners can create own rooms"
  ON public.class_rooms FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Room owners can update own rooms" ON public.class_rooms;
CREATE POLICY "Room owners can update own rooms"
  ON public.class_rooms FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Room owners can delete own rooms" ON public.class_rooms;
CREATE POLICY "Room owners can delete own rooms"
  ON public.class_rooms FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- 13.8. RLS для room_sketches
-- Владелец комнаты видит/обновляет/удаляет связи своей комнаты
DROP POLICY IF EXISTS "Room owners can view room sketches" ON public.room_sketches;
CREATE POLICY "Room owners can view room sketches"
  ON public.room_sketches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_rooms cr
      WHERE cr.id = room_sketches.room_id AND cr.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Room owners can update room sketches" ON public.room_sketches;
CREATE POLICY "Room owners can update room sketches"
  ON public.room_sketches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.class_rooms cr
      WHERE cr.id = room_sketches.room_id AND cr.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.class_rooms cr
      WHERE cr.id = room_sketches.room_id AND cr.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Room owners can delete room sketches" ON public.room_sketches;
CREATE POLICY "Room owners can delete room sketches"
  ON public.room_sketches FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.class_rooms cr
      WHERE cr.id = room_sketches.room_id AND cr.user_id = (SELECT auth.uid())
    )
  );

-- Ученик может создать связь только для своего скетча и под своим id
DROP POLICY IF EXISTS "Students can link own sketch" ON public.room_sketches;
CREATE POLICY "Students can link own sketch"
  ON public.room_sketches FOR INSERT
  WITH CHECK (
    student_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.sketches s
      WHERE s.id = sketch_id AND s.user_id = (SELECT auth.uid())
    )
  );

-- 13.9. RLS для sketches: владелец комнаты читает скетчи, привязанные к его комнате
DROP POLICY IF EXISTS "Room owners can view linked sketches" ON public.sketches;
CREATE POLICY "Room owners can view linked sketches"
  ON public.sketches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.room_sketches rs
      JOIN public.class_rooms cr ON rs.room_id = cr.id
      WHERE rs.sketch_id = sketches.id AND cr.user_id = (SELECT auth.uid())
    )
  );

-- 13.10. Генерация уникального 4-значного room_key
CREATE OR REPLACE FUNCTION public.generate_room_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key text;
  i int := 0;
BEGIN
  LOOP
    v_key := lpad(floor(random() * 10000)::int::text, 4, '0');
    IF NOT EXISTS (SELECT 1 FROM public.class_rooms WHERE room_key = v_key) THEN
      RETURN v_key;
    END IF;
    i := i + 1;
    IF i > 100 THEN
      RAISE EXCEPTION 'Не удалось сгенерировать уникальный room_key';
    END IF;
  END LOOP;
END;
$$;

-- 13.11. Генерация уникального numeric_sketch_id (используется при сохранении скетча)
CREATE OR REPLACE FUNCTION public.generate_numeric_sketch_id()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id bigint;
  i int := 0;
BEGIN
  LOOP
    v_id := floor(random() * 9000000000)::bigint + 1000000000; -- 10-значный
    IF NOT EXISTS (SELECT 1 FROM public.sketches WHERE numeric_sketch_id = v_id) THEN
      RETURN v_id;
    END IF;
    i := i + 1;
    IF i > 100 THEN
      RAISE EXCEPTION 'Не удалось сгенерировать уникальный numeric_sketch_id';
    END IF;
  END LOOP;
END;
$$;

-- 13.12. RPC: создание комнаты
CREATE OR REPLACE FUNCTION public.create_room(p_title text, p_description text)
RETURNS public.class_rooms
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_room public.class_rooms;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  INSERT INTO public.class_rooms (user_id, title, description, room_key)
  VALUES ((SELECT auth.uid()), p_title, p_description, public.generate_room_key())
  RETURNING * INTO new_room;
  RETURN new_room;
END;
$$;

-- 13.13. RPC: присоединение скетча к комнате по ключу (транзакционно)
CREATE OR REPLACE FUNCTION public.join_room_by_key(p_room_key text, p_sketch_id uuid)
RETURNS TABLE(room_id uuid, room_title text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room public.class_rooms;
  v_uid uuid := (SELECT auth.uid());
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO v_room FROM public.class_rooms WHERE room_key = p_room_key;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'room not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.sketches WHERE id = p_sketch_id AND user_id = v_uid
  ) THEN
    RAISE EXCEPTION 'sketch does not belong to user';
  END IF;

  IF EXISTS (SELECT 1 FROM public.room_sketches WHERE sketch_id = p_sketch_id) THEN
    RAISE EXCEPTION 'sketch already in a room';
  END IF;

  INSERT INTO public.room_sketches (room_id, sketch_id, student_id, rating)
  VALUES (v_room.id, p_sketch_id, v_uid, 0);

  RETURN QUERY SELECT v_room.id, v_room.title;
END;
$$;

-- 13.13b. RPC: проверка существования комнаты по ключу (до присоединения).
-- Доступен любому авторизованному пользователю (SECURITY DEFINER), т.к.
-- напрямую читать class_rooms нельзя из-за RLS (видит только владелец).
CREATE OR REPLACE FUNCTION public.get_room_info(p_room_key text)
RETURNS TABLE(room_id uuid, title text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  RETURN QUERY
    SELECT cr.id, cr.title
    FROM public.class_rooms cr
    WHERE cr.room_key = p_room_key;
END;
$$;

-- 13.13c. RPC: список скетчей ТЕКУЩЕГО пользователя, связанных с комнатами.
-- Нужен, т.к. SELECT к room_sketches разрешён только владельцу комнаты (RLS),
-- а здесь студент должен видеть свои собственные связи.
CREATE OR REPLACE FUNCTION public.get_my_linked_sketches()
RETURNS TABLE(
  room_sketch_id uuid,
  room_id uuid,
  room_title text,
  sketch_id uuid,
  sketch_title text,
  numeric_sketch_id bigint,
  rating int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  RETURN QUERY
    SELECT
      rs.id,
      rs.room_id,
      cr.title,
      s.id,
      s.title,
      s.numeric_sketch_id,
      rs.rating
    FROM public.room_sketches rs
    JOIN public.class_rooms cr ON cr.id = rs.room_id
    JOIN public.sketches s ON s.id = rs.sketch_id
    WHERE rs.student_id = (SELECT auth.uid())
    ORDER BY cr.title, s.title;
END;
$$;

-- 13.14. RPC: удаление связи скетча с комнатой (только владелец комнаты)
CREATE OR REPLACE FUNCTION public.remove_sketch_from_room(p_room_sketch_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted int;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  DELETE FROM public.room_sketches rs
  USING public.class_rooms cr
  WHERE rs.id = p_room_sketch_id
    AND rs.room_id = cr.id
    AND cr.user_id = (SELECT auth.uid());

  GET DIAGNOSTICS deleted = ROW_COUNT;
  IF deleted = 0 THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
END;
$$;

-- 13.15. RPC: обновление названия/описания комнаты (только владелец)
CREATE OR REPLACE FUNCTION public.update_room(p_room_id uuid, p_title text, p_description text)
RETURNS public.class_rooms
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.class_rooms;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  UPDATE public.class_rooms
  SET title = p_title, description = p_description, updated_at = NOW()
  WHERE id = p_room_id AND user_id = (SELECT auth.uid())
  RETURNING * INTO r;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  RETURN r;
END;
$$;

-- 13.16. RPC: изменение рейтинга скетча в комнате (только владелец комнаты), диапазон 0..4
CREATE OR REPLACE FUNCTION public.update_room_sketch_rating(p_room_sketch_id uuid, p_delta int)
RETURNS public.room_sketches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.room_sketches;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  UPDATE public.room_sketches rs
  SET rating = GREATEST(0, LEAST(4, rs.rating + p_delta))
  FROM public.class_rooms cr
  WHERE rs.id = p_room_sketch_id
    AND rs.room_id = cr.id
    AND cr.user_id = (SELECT auth.uid())
  RETURNING rs.* INTO r;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  RETURN r;
END;
$$;

-- ============================================================
-- Конец миграций
-- ============================================================
