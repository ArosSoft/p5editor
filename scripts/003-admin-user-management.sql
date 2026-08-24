-- ============================================================
-- p5editor — Миграция 003: права администратора на управление пользователями
-- Версия: 0.7.x
-- Примечание: выполните этот скрипт в Supabase SQL Editor (после supabase-migrations.sql)
-- ============================================================

-- ВАЖНО: предыдущая версия использовала inline-подзапрос к public.profiles
-- внутри политики НА таблицу profiles. Это вызывало 500 (Internal Server Error)
-- при PATCH из-за рекурсивной оценки RLS. Используем SECURITY DEFINER функцию,
-- которая обходит RLS и исключает рекурсию.

-- Помощник: проверка роли админа без рекурсии RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'admin'
  );
$$;

-- Администраторы могут обновлять ЛЮБОЙ профиль (смена роли и т.п.)
-- Политика не конфликтует с "Users can update own profile" — RLS применяет ИЛИ.
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- ВАЖНО: удаление auth-аккаунта (а не только записи profiles) требует
-- service_role и выполняется через Supabase Edge Function (см. цикл P3).
-- Здесь намеренно НЕ добавляем политику DELETE для профилей, чтобы не
-- создавать «осиротевшие» auth-пользователи без записи profiles.
-- ============================================================
