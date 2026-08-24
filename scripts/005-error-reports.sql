-- ============================================================
-- p5editor — SQL миграция: сообщения об ошибках (error_reports)
-- Версия: 0.5.4
-- Дата: 21 августа 2026 г.
-- ============================================================

-- Примечание: убедитесь, что расширение pgcrypto включено для gen_random_uuid():
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. Создание таблицы сообщений об ошибках
-- ============================================================

CREATE TABLE IF NOT EXISTS public.error_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reporter_email TEXT,
  message TEXT NOT NULL CHECK (char_length(message) > 0),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'resolved')),
  reply TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. Индексы
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_error_reports_status ON public.error_reports(status);
CREATE INDEX IF NOT EXISTS idx_error_reports_created_at ON public.error_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_reports_user_id ON public.error_reports(user_id);

-- ============================================================
-- 3. Trigger для обновления updated_at
-- ============================================================

DROP TRIGGER IF EXISTS update_error_reports_updated_at ON public.error_reports;
CREATE TRIGGER update_error_reports_updated_at
  BEFORE UPDATE ON public.error_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 4. RLS для error_reports
-- ============================================================

ALTER TABLE public.error_reports ENABLE ROW LEVEL SECURITY;

-- Просмотр: свои сообщения для автора, все сообщения для админов/модераторов
DROP POLICY IF EXISTS "Error reports are viewable by author or staff" ON public.error_reports;
CREATE POLICY "Error reports are viewable by author or staff"
  ON public.error_reports FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role IN ('moderator', 'admin')
    )
  );

-- Создание: любой авторизованный пользователь может отправить сообщение
DROP POLICY IF EXISTS "Authenticated users can create error reports" ON public.error_reports;
CREATE POLICY "Authenticated users can create error reports"
  ON public.error_reports FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND ((SELECT auth.uid()) = user_id OR user_id IS NULL)
  );

-- Изменение статуса: только админы/модераторы
DROP POLICY IF EXISTS "Staff can update error reports" ON public.error_reports;
CREATE POLICY "Staff can update error reports"
  ON public.error_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role IN ('moderator', 'admin')
    )
  );

-- Удаление: только админы/модераторы
DROP POLICY IF EXISTS "Staff can delete error reports" ON public.error_reports;
CREATE POLICY "Staff can delete error reports"
  ON public.error_reports FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role IN ('moderator', 'admin')
    )
  );

-- ============================================================
-- Конец миграции
-- ============================================================
