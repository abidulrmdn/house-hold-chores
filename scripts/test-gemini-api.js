#!/usr/bin/env node

/**
 * Test script to find which Gemini model works with the API key
 * Reads API key from .env file and tests different model names
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read .env file
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env')
  const env = {}
  
  // Try to read .env file
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
        }
      }
    })
  }
  
  // Also check environment variables
  Object.keys(process.env).forEach(key => {
    if (key.includes('GEMINI') || key.includes('API')) {
      env[key] = process.env[key]
    }
  })
  
  return env
}

async function listAvailableModels(apiKey) {
  try {
    console.log('\n📋 Fetching available models from API...')
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    const data = await response.json()
    
    if (data.models && data.models.length > 0) {
      console.log(`\n✅ Found ${data.models.length} available models:`)
      const geminiModels = data.models
        .filter(m => m.name && m.name.includes('gemini'))
        .map(m => m.name.replace('models/', ''))
      
      geminiModels.forEach(model => {
        console.log(`   - ${model}`)
      })
      
      return geminiModels
    } else {
      console.log('⚠️  No models found in API response')
      return []
    }
  } catch (error) {
    console.log(`⚠️  Could not list models: ${error.message}`)
    return []
  }
}

async function testModel(genAI, modelName) {
  try {
    console.log(`\n🧪 Testing model: ${modelName}`)
    const model = genAI.getGenerativeModel({ model: modelName })
    
    const prompt = 'Say "Hello, this is a test" in JSON format: {"message": "Hello"}'
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()
    
    console.log(`✅ SUCCESS! Model ${modelName} works!`)
    console.log(`   Response: ${text.substring(0, 100)}...`)
    return { success: true, model: modelName, response: text }
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`)
    return { success: false, model: modelName, error: error.message }
  }
}

async function getApiKeyFromFirebase() {
  try {
    const { execSync } = await import('child_process')
    const output = execSync('firebase functions:config:get', { encoding: 'utf-8' })
    const config = JSON.parse(output)
    return config?.gemini?.api_key
  } catch (error) {
    console.log('⚠️  Could not get API key from Firebase config:', error.message)
    return null
  }
}

async function main() {
  console.log('🔍 Testing Gemini API Models\n')
  console.log('=' .repeat(60))
  
  // Load environment variables
  const env = loadEnv()
  
  // Try to get API key from different sources
  let apiKey = env.GEMINI_API_KEY || 
               env.VITE_GEMINI_API_KEY || 
               process.env.GEMINI_API_KEY ||
               process.env.VITE_GEMINI_API_KEY
  
  // If not found, try Firebase config
  if (!apiKey) {
    console.log('📝 API key not found in .env, trying Firebase config...')
    apiKey = await getApiKeyFromFirebase()
  }
  
  if (!apiKey) {
    console.error('\n❌ No API key found!')
    console.error('   Looking for:')
    console.error('   1. GEMINI_API_KEY or VITE_GEMINI_API_KEY in .env file')
    console.error('   2. Firebase Functions config: gemini.api_key')
    console.error('\n💡 To set Firebase config:')
    console.error('   firebase functions:config:set gemini.api_key="YOUR_API_KEY"')
    process.exit(1)
  }
  
  // Mask API key for display
  const maskedKey = apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4)
  console.log(`\n📝 Using API Key: ${maskedKey}`)
  
  // Initialize Gemini AI
  const genAI = new GoogleGenerativeAI(apiKey)
  
  // First, try to list available models from the API
  const availableModels = await listAvailableModels(apiKey)
  
  // List of models to test (in order of preference)
  // Start with available models from API, then fallback to common names
  const modelsToTest = availableModels.length > 0 
    ? [...availableModels, 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']
    : [
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-pro',
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro-latest',
        'gemini-1.0-pro',
        'gemini-1.0-pro-latest'
      ]
  
  // Remove duplicates
  const uniqueModels = [...new Set(modelsToTest)]
  
  console.log(`\n📋 Testing ${uniqueModels.length} models...`)
  console.log('=' .repeat(60))
  
  const results = []
  
  for (const modelName of uniqueModels) {
    const result = await testModel(genAI, modelName)
    results.push(result)
    
    // If successful, we can stop early
    if (result.success) {
      console.log('\n' + '='.repeat(60))
      console.log(`\n🎉 FOUND WORKING MODEL: ${modelName}`)
      console.log('\n✅ Use this model name in your Firebase Functions:')
      console.log(`   const model = genAI.getGenerativeModel({ model: '${modelName}' })`)
      console.log('\n' + '='.repeat(60))
      break
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  // Summary
  console.log('\n📊 SUMMARY:')
  console.log('=' .repeat(60))
  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)
  
  if (successful.length > 0) {
    console.log(`\n✅ Working models (${successful.length}):`)
    successful.forEach(r => {
      console.log(`   - ${r.model}`)
    })
  }
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed models (${failed.length}):`)
    failed.forEach(r => {
      console.log(`   - ${r.model}: ${r.error}`)
    })
  }
  
  if (successful.length === 0) {
    console.log('\n❌ NO WORKING MODELS FOUND!')
    console.log('\n🔧 Troubleshooting:')
    console.log('   1. Check if your API key is valid at: https://makersuite.google.com/app/apikey')
    console.log('   2. Ensure the API key has access to Gemini models')
    console.log('   3. Check if there are any API restrictions on the key')
    console.log('   4. Verify your Google Cloud project has Gemini API enabled')
    process.exit(1)
  }
  
  console.log('\n✅ Test completed successfully!')
}

main().catch(error => {
  console.error('\n❌ Unexpected error:', error)
  process.exit(1)
})

