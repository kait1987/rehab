-- Enable RLS
ALTER TABLE gym_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own reports
CREATE POLICY "Users can insert their own reports"
ON gym_reports
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own reports
CREATE POLICY "Users can view their own reports"
ON gym_reports
FOR SELECT
USING (auth.uid() = user_id);

-- Note: Admin access is handled via service role key in Next.js API, 
-- or we can add a policy for admins if they access via client (but plan says API server)
