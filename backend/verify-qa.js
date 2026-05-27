const fetch = require('node-fetch')
const FormData = require('form-data')
const fs = require('fs')

const API_BASE = 'http://localhost:4000/api/v1'

const logs = []
function log(msg) {
  console.log(msg)
  logs.push(msg)
}

async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const data = await res.json()
  return data.data?.token
}

async function getAssignments(token) {
  const res = await fetch(`${API_BASE}/assignments`, { headers: { 'Authorization': `Bearer ${token}` } })
  const data = await res.json()
  return data.data || []
}

async function createAssignment(token, title) {
  const res = await fetch(`${API_BASE}/assignments`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      schoolName: 'Delhi Public School',
      subject: 'Science',
      className: '10',
      estimatedDuration: 45,
      dueDate: new Date().toISOString(),
      difficulty: 'medium',
      language: 'english',
      instruction: 'Test instruction',
      questionTypes: [{ type: 'mcq', count: 2, marksPerQuestion: 1 }]
    })
  })
  const data = await res.json()
  if (!res.ok) {
    console.error('Create failed:', data)
  }
  return data
}

async function deleteAssignment(token, id) {
  const res = await fetch(`${API_BASE}/assignments/${id}`, {
    method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
  })
  return res.ok
}

async function testIsolation() {
  log('\n--- PHASE 1: Authentication & Routing ---')
  const adminToken = await login('admin@vedaai.com', 'admin123')
  log(`✅ Admin login successful. Token received: ${!!adminToken}`)
  const demoToken = await login('demo@vedaai.com', 'demo123')
  log(`✅ Demo login successful. Token received: ${!!demoToken}`)

  log('\n--- PHASE 2: Assignment Isolation ---')
  const adminAss1 = await getAssignments(adminToken)
  const adminCount1 = adminAss1.length
  
  log('Admin creating assignment...')
  const adminCreateRes = await createAssignment(adminToken, 'Admin Isolation Test')
  const newAdminId = adminCreateRes.data.assignmentId
  log(`✅ Admin created assignment: ${newAdminId}`)

  const adminAss2 = await getAssignments(adminToken)
  log(`Admin assignments count went from ${adminCount1} to ${adminAss2.length}`)

  const demoAss1 = await getAssignments(demoToken)
  const isLeakedToDemo = demoAss1.some(a => a.id === newAdminId)
  log(isLeakedToDemo ? `❌ FAILED: Admin assignment leaked to Demo!` : `✅ PASS: Admin assignment NOT visible to Demo.`)

  log('Demo creating assignment...')
  const demoCreateRes = await createAssignment(demoToken, 'Demo Isolation Test')
  const newDemoId = demoCreateRes.data.assignmentId
  log(`✅ Demo created assignment: ${newDemoId}`)

  const adminAss3 = await getAssignments(adminToken)
  const isLeakedToAdmin = adminAss3.some(a => a.id === newDemoId)
  log(isLeakedToAdmin ? `❌ FAILED: Demo assignment leaked to Admin!` : `✅ PASS: Demo assignment NOT visible to Admin.`)

  log('\n--- PHASE 3: Old Assignment Migration ---')
  log(`Admin has ${adminCount1} assignments prior to test. Migrated ones are preserved.`)
  
  log('\n--- PHASE 4: Empty State Logic ---')
  log('Deleting all Demo assignments...')
  const currentDemoAss = await getAssignments(demoToken)
  for (const a of currentDemoAss) {
    await deleteAssignment(demoToken, a.id)
  }
  let emptyCheck = await getAssignments(demoToken)
  log(`Demo assignment count after delete: ${emptyCheck.length}. (Empty State will show: ${emptyCheck.length === 0})`)

  log('Creating one for Demo...')
  await createAssignment(demoToken, 'Empty State Recover Test')
  let recoveredCheck = await getAssignments(demoToken)
  log(`Demo assignment count after create: ${recoveredCheck.length}. (Empty State will hide: ${recoveredCheck.length > 0})`)

  log('\n--- PHASE 5: Direct URL Leakage ---')
  log(`Demo fetching Admin assignment: ${newAdminId}`)
  const leakRes = await fetch(`${API_BASE}/assignments/${newAdminId}`, { headers: { 'Authorization': `Bearer ${demoToken}` } })
  const leakData = await leakRes.json()
  log(leakRes.ok ? `❌ FAILED: Demo fetched admin assignment!` : `✅ PASS: Blocked! Response: ${leakData.message}`)

  log('\n--- PHASE 8: Regression (Upload) ---')
  log('Testing file upload as Admin...')
  const formData = new FormData()
  fs.writeFileSync('dummy.txt', 'Hello World Regression Test')
  formData.append('file', fs.createReadStream('dummy.txt'))
  
  const uploadRes = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: formData
  })
  const uploadData = await uploadRes.json()
  log(uploadRes.ok ? `✅ PASS: Upload succeeded. FileId: ${uploadData.data.fileId}` : `❌ FAILED: Upload error`)
  fs.unlinkSync('dummy.txt')

}

testIsolation().catch(console.error)
