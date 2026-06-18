#!/usr/bin/env pwsh

# Integration Testing Script for Frontend-Backend
# Usage: .\test-integration.ps1

param(
    [string]$Frontend = "http://localhost:3000",
    [string]$Backend = "http://localhost:8000",
    [string]$TestType = "all"
)

$ErrorActionPreference = "Continue"

# Colors
$SUCCESS = "`e[32m"  # Green
$FAIL = "`e[31m"     # Red
$INFO = "`e[36m"     # Cyan
$WARN = "`e[33m"     # Yellow
$RESET = "`e[0m"

function Write-Success { Write-Host "$SUCCESS✓ $args $RESET" }
function Write-Fail { Write-Host "$FAIL✗ $args $RESET" }
function Write-Info { Write-Host "$INFO→ $args $RESET" }
function Write-Warn { Write-Host "$WARN! $args $RESET" }

Write-Host "`n$INFO═══════════════════════════════════════════════════════$RESET"
Write-Host "$INFO  Frontend-Backend Integration Test Suite$RESET"
Write-Host "$INFO═══════════════════════════════════════════════════════$RESET`n"

Write-Info "Frontend: $Frontend"
Write-Info "Backend: $Backend"
Write-Info "Test Type: $TestType`n"

# Test 1: CORS Preflight
function Test-CORS-Preflight {
    Write-Info "Test 1.1: CORS Preflight Request"
    
    try {
        $response = Invoke-WebRequest `
            -Method OPTIONS `
            -Uri "$Backend/api/login" `
            -Headers @{
                "Origin" = $Frontend
                "Access-Control-Request-Method" = "POST"
                "Access-Control-Request-Headers" = "content-type"
            } `
            -ErrorAction Continue
        
        $hasCredentials = $response.Headers.Keys | Where-Object { $_ -eq "Access-Control-Allow-Credentials" }
        
        if ($hasCredentials -and $response.Headers["Access-Control-Allow-Credentials"] -eq "true") {
            Write-Success "CORS headers correct"
            Write-Host "  - Access-Control-Allow-Credentials: true"
            Write-Host "  - Access-Control-Allow-Origin: $($response.Headers['Access-Control-Allow-Origin'])`n"
            return $true
        } else {
            Write-Fail "Missing Access-Control-Allow-Credentials"
            Write-Warn "  Backend may not have CORS configured correctly`n"
            return $false
        }
    } catch {
        Write-Fail "CORS request failed: $($_.Exception.Message)"
        return $false
    }
}

# Test 2: Login & Cookie
function Test-Login-And-Cookie {
    Write-Info "Test 2.1: Login and Capture Cookie"
    
    $cookieFile = "$env:TEMP\test-cookies.txt"
    
    try {
        $body = @{
            email = "admin@test.local"
            password = "password123"
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest `
            -Method POST `
            -Uri "$Backend/api/login" `
            -Headers @{
                "Origin" = $Frontend
                "Content-Type" = "application/json"
            } `
            -Body $body `
            -SessionVariable session `
            -ErrorAction Continue
        
        if ($response.StatusCode -eq 200) {
            Write-Success "Login successful (200 OK)"
            
            # Check for Set-Cookie header
            $setCookie = $response.Headers["Set-Cookie"]
            if ($setCookie) {
                Write-Success "Set-Cookie header present"
                if ($setCookie -match "HttpOnly") {
                    Write-Success "HttpOnly flag present"
                } else {
                    Write-Fail "HttpOnly flag MISSING - Cookie vulnerable to XSS!"
                }
                Write-Host "  Cookie: $($setCookie.Substring(0, 50))...`n"
            } else {
                Write-Fail "No Set-Cookie header - Backend not setting cookie!`n"
                return $false
            }
            
            return $true
        } else {
            Write-Fail "Login failed with status $($response.StatusCode)"
            return $false
        }
    } catch {
        Write-Fail "Login request failed: $($_.Exception.Message)"
        Write-Warn "Ensure backend is running and test user exists`n"
        return $false
    }
}

# Test 3: Role Verification
function Test-Role-Verification {
    Write-Info "Test 3.1: Non-Admin Access to Admin Endpoint"
    
    try {
        # Assuming we have a session from login
        $response = Invoke-WebRequest `
            -Method GET `
            -Uri "$Backend/api/usuarios" `
            -Headers @{
                "Origin" = $Frontend
                "Authorization" = "Bearer dummy-token"  # Should use cookie instead
            } `
            -ErrorAction Continue
        
        if ($response.StatusCode -eq 403) {
            Write-Success "403 Forbidden - Role verification working!"
            $content = $response.Content | ConvertFrom-Json
            Write-Host "  Message: $($content.message)`n"
            return $true
        } elseif ($response.StatusCode -eq 200) {
            Write-Fail "Expected 403, got 200 - Role middleware not enforced!"
            return $false
        } else {
            Write-Info "Got status $($response.StatusCode)`n"
            return $false
        }
    } catch {
        if ($_.Exception.Response.StatusCode -eq 403) {
            Write-Success "403 Forbidden - Role verification working!"
            return $true
        } else {
            Write-Fail "Unexpected error: $($_.Exception.Message)`n"
            return $false
        }
    }
}

# Test 4: CSP Headers
function Test-CSP-Headers {
    Write-Info "Test 5.1: CSP Security Headers"
    
    try {
        $response = Invoke-WebRequest `
            -Method GET `
            -Uri "$Frontend" `
            -ErrorAction Continue
        
        $csp = $response.Headers.Keys | Where-Object { $_ -eq "Content-Security-Policy" }
        
        if ($csp) {
            Write-Success "CSP header present"
            $policy = $response.Headers[$csp]
            Write-Host "  CSP: $($policy.Substring(0, 80))...`n"
            return $true
        } else {
            Write-Warn "CSP header NOT present`n"
            return $false
        }
    } catch {
        Write-Fail "CSP check failed: $($_.Exception.Message)`n"
        return $false
    }
}

# Test 5: Frontend Running
function Test-Frontend-Running {
    Write-Info "Test 0: Verifying Frontend is Running"
    
    try {
        $response = Invoke-WebRequest -Uri $Frontend -ErrorAction Continue
        if ($response.StatusCode -eq 200) {
            Write-Success "Frontend is running"
            return $true
        }
    } catch {
        Write-Fail "Frontend not responding"
        Write-Warn "Start with: npm run dev`n"
        return $false
    }
}

# Test 6: Backend Running
function Test-Backend-Running {
    Write-Info "Test 0: Verifying Backend is Running"
    
    try {
        $response = Invoke-WebRequest -Uri "$Backend/api" -ErrorAction Continue
        Write-Success "Backend is running"
        return $true
    } catch {
        Write-Fail "Backend not responding"
        Write-Warn "Start with: php artisan serve --port=8000`n"
        return $false
    }
}

# Run tests
$results = @{
    Frontend = Test-Frontend-Running
    Backend = Test-Backend-Running
}

if ($results.Frontend -and $results.Backend) {
    switch ($TestType) {
        "cors" {
            $results["CORS Preflight"] = Test-CORS-Preflight
        }
        "login" {
            $results["Login & Cookie"] = Test-Login-And-Cookie
        }
        "roles" {
            $results["Role Verification"] = Test-Role-Verification
        }
        "csp" {
            $results["CSP Headers"] = Test-CSP-Headers
        }
        "all" {
            $results["CORS Preflight"] = Test-CORS-Preflight
            $results["Login & Cookie"] = Test-Login-And-Cookie
            $results["CSP Headers"] = Test-CSP-Headers
        }
        default {
            Write-Warn "Unknown test type: $TestType"
            Write-Info "Available: cors, login, roles, csp, all"
        }
    }
}

# Summary
Write-Host "`n$INFO═══════════════════════════════════════════════════════$RESET"
Write-Host "$INFO  Test Results Summary$RESET"
Write-Host "$INFO═══════════════════════════════════════════════════════$RESET`n"

$passed = 0
$failed = 0

foreach ($test in $results.Keys) {
    $result = $results[$test]
    if ($result) {
        Write-Success "$test"
        $passed++
    } else {
        Write-Fail "$test"
        $failed++
    }
}

Write-Host "`n$INFO Passed: $SUCCESS$passed$RESET | Failed: $($failed > 0 ? "$FAIL$failed$RESET" : "$SUCCESS$failed$RESET")`n"

if ($failed -eq 0) {
    Write-Success "All tests passed! ✓"
} else {
    Write-Fail "Some tests failed. Check output above."
}

exit $failed
