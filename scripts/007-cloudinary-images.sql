-- ============================================================
-- p5editor — SQL миграция: хранилище изображений Cloudinary
-- Версия: 0.6.0
-- Дата: 11 ноября 2026 г.
-- ============================================================
--
-- У каждого пользователя свой личный аккаунт Cloudinary (бесплатный).
-- Эта таблица хранит привязку «пользователь p5editor → его Cloudinary».
--
-- ВАЖНО (безопасность):
--   api_secret_encrypted — API Secret в зашифрованном виде (AES-GCM).
--   Ключ шифрования CLOUDINARY_ENC_KEY лежит только в секретах Edge
--   Function cloudinary-proxy. Клиент (браузер) секрет не видит никогда:
--     • прямого доступа к таблице у anon/authenticated нет (REVOKE + RLS без политик);
--     • для фронтенда существует view cloudinary_accounts_safe — только своя
--       строка и только несекретные колонки.
--
-- Создать ключ шифрования (32 байта base64), например в PowerShell:
--   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
-- и задать секрет функции:
--   supabase secrets set CLOUDINARY_ENC_KEY=<значение>
-- ============================================================

-- 14.1. Таблица привязки аккаунтов Cloudinary
CREATE TABLE IF NOT EXISTS public.cloudinary_accounts (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  cloud_name text NOT NULL,
  api_key text NOT NULL,
  api_secret_encrypted text NOT NULL,
  cloudinary_email text,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cloudinary_accounts IS
  'Привязка личного аккаунта Cloudinary к пользователю; API Secret зашифрован и читается только Edge Function cloudinary-proxy';
COMMENT ON COLUMN public.cloudinary_accounts.api_secret_encrypted IS
  'AES-GCM, base64(iv + ciphertext), ключ — секрет CLOUDINARY_ENC_KEY в Edge Function';
COMMENT ON COLUMN public.cloudinary_accounts.cloudinary_email IS
  'Почта пользователя p5editor на момент привязки (аккаунт Cloudinary регистрируется на ту же почту)';

-- 14.2. RLS: политик для anon/authenticated НЕТ — напрямую через
-- PostgREST таблицу прочитать нельзя. Service role обходит RLS.
ALTER TABLE public.cloudinary_accounts ENABLE ROW LEVEL SECURITY;

-- Supabase выдаёт права на новые таблицы через default privileges —
-- забираем их, чтобы таблица (включая шифротекст секрета) была
-- доступна только service role (Edge Function).
REVOKE ALL ON public.cloudinary_accounts FROM anon, authenticated;

-- 14.3. Безопасный view для фронтенда: только своя строка,
-- только несекретные колонки (api_secret_encrypted не входит).
-- auth.uid() фильтрует строки; view выполняется от имени владельца
-- (postgres), поэтому REVOKE выше фронтенду не мешает.
CREATE OR REPLACE VIEW public.cloudinary_accounts_safe AS
SELECT
  user_id,
  cloud_name,
  api_key,
  cloudinary_email,
  verified,
  created_at,
  updated_at
FROM public.cloudinary_accounts
WHERE user_id = auth.uid();

GRANT SELECT ON public.cloudinary_accounts_safe TO authenticated;

-- 14.4. Обновлённый_at при изменении привязки
CREATE OR REPLACE FUNCTION public.set_cloudinary_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cloudinary_accounts_updated ON public.cloudinary_accounts;
CREATE TRIGGER trg_cloudinary_accounts_updated
  BEFORE UPDATE ON public.cloudinary_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_cloudinary_updated_at();

-- ============================================================
-- Конец миграции
-- ============================================================
