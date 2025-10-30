-- Create user credits table
CREATE TABLE IF NOT EXISTS public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_credits INTEGER NOT NULL DEFAULT 10,
  used_credits INTEGER NOT NULL DEFAULT 0,
  remaining_credits INTEGER NOT NULL DEFAULT 10,
  last_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Users can only read their own credits
CREATE POLICY "Users can view their own credits"
ON public.user_credits
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own credits
CREATE POLICY "Users can update their own credits"
ON public.user_credits
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can insert their own credits
CREATE POLICY "Users can insert their own credits"
ON public.user_credits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to check and reset credits if needed (IST timezone)
CREATE OR REPLACE FUNCTION public.check_and_reset_credits(p_user_id UUID)
RETURNS TABLE (
  total_credits INTEGER,
  used_credits INTEGER,
  remaining_credits INTEGER,
  last_reset_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_reset TIMESTAMPTZ;
  v_current_time_ist TIMESTAMPTZ;
  v_midnight_ist TIMESTAMPTZ;
BEGIN
  -- Get current time in IST (UTC+5:30)
  v_current_time_ist := NOW() AT TIME ZONE 'Asia/Kolkata';
  
  -- Get user's last reset time
  SELECT user_credits.last_reset_at INTO v_last_reset
  FROM public.user_credits
  WHERE user_credits.user_id = p_user_id;
  
  -- If user doesn't exist, create record
  IF v_last_reset IS NULL THEN
    INSERT INTO public.user_credits (user_id, total_credits, used_credits, remaining_credits, last_reset_at)
    VALUES (p_user_id, 10, 0, 10, v_current_time_ist)
    RETURNING user_credits.total_credits, user_credits.used_credits, user_credits.remaining_credits, user_credits.last_reset_at
    INTO total_credits, used_credits, remaining_credits, last_reset_at;
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Calculate midnight IST for today
  v_midnight_ist := DATE_TRUNC('day', v_current_time_ist AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata';
  
  -- Check if we need to reset (last reset was before today's midnight)
  IF v_last_reset < v_midnight_ist THEN
    UPDATE public.user_credits
    SET 
      used_credits = 0,
      remaining_credits = 10,
      last_reset_at = v_current_time_ist,
      updated_at = NOW()
    WHERE user_credits.user_id = p_user_id
    RETURNING user_credits.total_credits, user_credits.used_credits, user_credits.remaining_credits, user_credits.last_reset_at
    INTO total_credits, used_credits, remaining_credits, last_reset_at;
  ELSE
    -- Return current credits
    SELECT user_credits.total_credits, user_credits.used_credits, user_credits.remaining_credits, user_credits.last_reset_at
    INTO total_credits, used_credits, remaining_credits, last_reset_at
    FROM public.user_credits
    WHERE user_credits.user_id = p_user_id;
  END IF;
  
  RETURN NEXT;
END;
$$;

-- Function to deduct credit
CREATE OR REPLACE FUNCTION public.deduct_credit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  -- Get current remaining credits
  SELECT remaining_credits INTO v_remaining
  FROM public.user_credits
  WHERE user_id = p_user_id;
  
  -- Check if user has credits
  IF v_remaining IS NULL OR v_remaining <= 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct credit
  UPDATE public.user_credits
  SET 
    used_credits = used_credits + 1,
    remaining_credits = remaining_credits - 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$$;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.user_credits
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();