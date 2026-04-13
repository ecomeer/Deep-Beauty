# Deep Beauty - Marketing Campaigns Migration
# Run: .\scripts\apply-migration.ps1

Write-Host "`n==============================================" -ForegroundColor Cyan
Write-Host "   Deep Beauty - Apply Marketing Migration" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# Load environment variables
$envPath = Join-Path $PSScriptRoot "..\.env.local"
if (-not (Test-Path $envPath)) {
    Write-Host "`n❌ .env.local not found!" -ForegroundColor Red
    exit 1
}

# Parse .env.local
$envContent = Get-Content $envPath -Raw
$matches = [regex]::Matches($envContent, '^([^#=]+)=(.+)$', [System.Text.RegularExpressions.RegexOptions]::Multiline)
$envVars = @{}
foreach ($match in $matches) {
    $key = $match.Groups[1].Value.Trim()
    $value = $match.Groups[2].Value.Trim() -replace "^['\"]|['\"]$"
    $envVars[$key] = $value
}

$supabaseUrl = $envVars['NEXT_PUBLIC_SUPABASE_URL']
$supabaseKey = $envVars['SUPABASE_SERVICE_ROLE_KEY']

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "`n❌ Missing credentials in .env.local" -ForegroundColor Red
    Write-Host "   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n📦 Connecting to Supabase..." -ForegroundColor Blue

# SQL to execute
$sql = @"
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('email', 'sms', 'push', 'social')),
  target_audience text DEFAULT 'all' CHECK (target_audience IN ('all', 'customers', 'vip', 'new')),
  content jsonb NOT NULL DEFAULT '{}',
  scheduled_at timestamptz,
  sent_at timestamptz,
  is_active boolean DEFAULT true,
  sent_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_marketing_campaigns" ON public.marketing_campaigns;
CREATE POLICY "admin_marketing_campaigns" ON public.marketing_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_is_active ON public.marketing_campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_type ON public.marketing_campaigns(type);
"@

try {
    # Try to execute via pg_rest or similar
    $headers = @{
        'Authorization' = "Bearer $supabaseKey"
        'apikey' = $supabaseKey
        'Content-Type' = 'application/json'
    }

    # Check if exec_sql RPC exists
    $checkBody = @{
        sql = "SELECT 1"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/exec_sql" -Method POST -Headers $headers -Body $checkBody -TimeoutSec 10 -ErrorAction SilentlyContinue
    
    if ($response) {
        Write-Host "✅ exec_sql RPC available, applying migration..." -ForegroundColor Green
        
        $body = @{
            sql = $sql
        } | ConvertTo-Json
        
        Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/exec_sql" -Method POST -Headers $headers -Body $body
        
        Write-Host "`n✅ Migration applied successfully!" -ForegroundColor Green
        Write-Host "   Table 'marketing_campaigns' is ready." -ForegroundColor Green
    } else {
        throw "exec_sql not available"
    }
} catch {
    Write-Host "`n⚠️  Auto-apply not available (requires exec_sql RPC)" -ForegroundColor Yellow
    Write-Host "`n📋 SQL ready for manual execution:" -ForegroundColor Cyan
    Write-Host "==============================================" -ForegroundColor Gray
    Write-Host $sql -ForegroundColor White
    Write-Host "==============================================" -ForegroundColor Gray
    
    # Save for easy access
    $sqlPath = Join-Path $PSScriptRoot "..\supabase\apply-now.sql"
    $sql | Out-File $sqlPath -Encoding UTF8
    Write-Host "`n💾 SQL saved to: $sqlPath" -ForegroundColor Green
    
    Write-Host "`n🌐 Quick link to Supabase Studio:" -ForegroundColor Cyan
    $projectRef = ($supabaseUrl -split '//')[1] -split '\.' | Select-Object -First 1
    Write-Host "   https://supabase.com/dashboard/project/$projectRef/sql/new" -ForegroundColor Blue
}

Write-Host "`n"
