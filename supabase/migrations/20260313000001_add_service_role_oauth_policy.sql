/*
  # Add service role policy for oauth_tokens
  
  1. Changes
    - Add policy to allow service_role to insert into oauth_tokens
    - This ensures edge functions using service role key can save tokens
  
  2. Security
    - Service role is a trusted server-side role
    - Only accessible via service role key (server-side only)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'oauth_tokens' 
    AND policyname = 'Service role can manage oauth_tokens'
  ) THEN
    CREATE POLICY "Service role can manage oauth_tokens"
      ON oauth_tokens
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
