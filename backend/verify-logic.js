const fetch = require('node-fetch')

const BASE_URL = 'http://localhost:4000/api/v1'

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

const logs = []
function log(msg) {
  console.log(msg)
  logs.push(msg)
}

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const data = await res.json()
  return data.data.token
}

async function verify() {
  log('--- Starting Verification ---')

  const adminToken = await login('admin@vedaai.com', 'admin123')
  log('✅ Logged in as Admin')

  const demoToken = await login('demo@vedaai.com', 'demo123')
  log('✅ Logged in as Demo')

  log('\n--- Checking Migration & Data Isolation ---')
  
  // Check Admin Assignments
  let res = await fetch(`${BASE_URL}/assignments`, { headers: { 'Authorization': `Bearer ${adminToken}` } })
  let adminData = await res.json()
  const adminAssignments = adminData.data || []
  log(`Admin sees ${adminAssignments.length} assignments.`)
  if (adminAssignments.length > 0) {
    log(`✅ Admin successfully sees migrated assignments (Example ID: ${adminAssignments[0].id})`)
  }

  // Check Demo Assignments
  res = await fetch(`${BASE_URL}/assignments`, { headers: { 'Authorization': `Bearer ${demoToken}` } })
  let demoData = await res.json()
  const demoAssignments = demoData.data || []
  log(`Demo sees ${demoAssignments.length} assignments.`)
  if (demoAssignments.length === 0) {
    log(`✅ Demo sees ZERO old assignments. Empty state logic will trigger correctly.`)
  }

  // Test Direct URL Isolation
  if (adminAssignments.length > 0) {
    const adminId = adminAssignments[0].id
    log(`\n--- Testing Direct URL Isolation ---`)
    log(`Demo attempting to fetch Admin assignment (${adminId})...`)
    
    res = await fetch(`${BASE_URL}/assignments/${adminId}`, { headers: { 'Authorization': `Bearer ${demoToken}` } })
    const isolationData = await res.json()
    if (!res.ok) {
      log(`✅ Direct URL access blocked! Response: ${JSON.stringify(isolationData)}`)
    } else {
      log(`❌ SECURITY FLAW: Demo accessed Admin assignment!`)
    }
  }

  log('\n--- Verification Complete ---')
}

verify().catch(console.error)
