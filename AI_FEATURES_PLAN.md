# AI Features for Household Routine Manager

## Firebase AI Capabilities

Firebase itself doesn't have built-in AI, but it integrates seamlessly with Google Cloud AI services:

### 1. **Google Gemini API** (Recommended)
- **Free tier**: 15 requests/minute, 1,500 requests/day
- **Cost**: Very affordable for small apps
- **Integration**: Via Firebase Cloud Functions or directly from client
- **Best for**: Natural language processing, task suggestions, smart categorization

### 2. **Vertex AI** (Enterprise)
- More powerful but requires Google Cloud setup
- Better for complex ML models
- Overkill for this use case initially

### 3. **Firebase Extensions**
- Check Firebase Extensions marketplace for AI-related extensions
- Some community-built AI integrations available

## Recommended AI Features

### 1. **Smart Task Suggestions** ⭐ (High Priority)

**What it does:**
- Analyzes your household data (categories, completion patterns, time of day/week)
- Suggests new routines based on:
  - Household areas (bathroom, kitchen, bedroom, etc.)
  - Seasonal tasks (spring cleaning, winter prep)
  - Common household maintenance
  - Your existing patterns

**Example suggestions:**
- "It's been 3 weeks since you cleaned the oven. Would you like to add 'Clean Oven' as a monthly routine?"
- "Based on your kitchen routines, you might want to add 'Deep clean refrigerator' (monthly)"
- "Spring is coming! Consider adding 'Clean windows' and 'Organize garage'"

**Implementation:**
```typescript
// Use Gemini API to generate contextual suggestions
const suggestions = await generateTaskSuggestions({
  existingCategories: categories,
  completionHistory: tasks,
  timeOfYear: getSeason(),
  householdAreas: ['kitchen', 'bathroom', 'bedroom', 'living room']
})
```

### 2. **Natural Language Task Creation** ⭐ (High Priority)

**What it does:**
- User types: "Clean bathroom every week"
- AI parses and creates routine automatically:
  - Name: "Clean bathroom"
  - Frequency: "weekly"
  - Category: "Bathroom" (auto-detected or created)

**Example inputs:**
- "Wash dishes daily"
- "Vacuum living room twice a week"
- "Change air filter every 3 months"
- "Take out trash every Monday and Thursday"

**Implementation:**
```typescript
// Parse natural language input
const parsed = await parseTaskInput("Clean bathroom every week")
// Returns: { name: "Clean bathroom", frequency: "weekly", category: "Bathroom" }
```

### 3. **Smart Insights Dashboard** ⭐

**What it does:**
- Shows personalized insights when you open the app
- Examples:
  - "You complete 90% of tasks on weekends - consider spreading them out"
  - "Kitchen tasks are most frequently missed - set earlier reminders?"
  - "Your household is most productive on Sundays"
  - "You haven't done 'Deep clean' tasks in 2 months"

**Implementation:**
- Analyze task completion patterns
- Use Gemini to generate human-readable insights
- Show 1-2 insights per day (not overwhelming)

### 4. **Predictive Scheduling**

**What it does:**
- Suggests optimal times for tasks based on:
  - When you usually complete similar tasks
  - Your activity patterns
  - Other household members' schedules

**Example:**
- "You usually do laundry on Sundays. Schedule it for this Sunday?"
- "Based on your patterns, you complete kitchen tasks best in the morning"

### 5. **Auto-Categorization**

**What it does:**
- When creating a routine, AI suggests the best category
- Learns from your existing categories
- Creates new categories when needed

**Example:**
- User creates "Clean toilet" → AI suggests "Bathroom" category
- User creates "Mow lawn" → AI suggests creating "Outdoor" category

### 6. **Smart Reminder Timing**

**What it does:**
- Analyzes when you actually complete tasks
- Suggests reminder times that match your behavior
- "You usually complete tasks 2 hours after the reminder. Set reminder for 2 hours before?"

### 7. **Household Area Detection**

**What it does:**
- Automatically detects household areas from task names
- Suggests related tasks for each area
- Creates area-based task groups

**Areas to detect:**
- Kitchen (dishes, oven, refrigerator, pantry)
- Bathroom (toilet, shower, sink, mirror)
- Bedroom (bed, closet, dresser)
- Living Room (vacuum, dust, organize)
- Outdoor (yard, garage, patio)
- Laundry (washing, folding, ironing)

## Implementation Plan

### Phase 1: Quick Wins (No AI needed)
1. **Rule-based suggestions** based on:
   - Time since last completion
   - Common household tasks database
   - Seasonal patterns (hardcoded)

### Phase 2: Gemini API Integration
1. Set up Firebase Cloud Functions
2. Integrate Gemini API (free tier)
3. Implement natural language parsing
4. Add smart suggestions endpoint

### Phase 3: Advanced Features
1. Predictive scheduling
2. Pattern recognition
3. Personalized insights

## Code Structure

```
src/
  ai/
    suggestions.ts        # Generate task suggestions
    nlp.ts               # Natural language parsing
    insights.ts          # Generate insights
    categorization.ts    # Auto-categorize tasks
  components/
    AISuggestions.tsx    # UI for suggestions
    SmartInsights.tsx    # Insights dashboard
    NaturalLanguageInput.tsx  # NLP task creation
```

## Firebase Cloud Functions Setup

```typescript
// functions/src/ai-suggestions.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

export const generateSuggestions = functions.https.onCall(async (data, context) => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
  
  const prompt = `Based on these household routines: ${data.routines}
    Suggest 3 new tasks that would be useful. Consider:
    - Household areas: kitchen, bathroom, bedroom, living room
    - Seasonal needs
    - Common maintenance tasks
    
    Return JSON format with name, frequency, and suggested category.`
  
  const result = await model.generateContent(prompt)
  return JSON.parse(result.response.text())
})
```

## Cost Estimation

### Gemini API (Free Tier)
- **Free**: 15 requests/minute, 1,500/day
- **Paid**: $0.00025 per 1K characters input, $0.0005 per 1K characters output
- **Estimated cost**: $0-5/month for small household app

### Firebase Cloud Functions
- **Free tier**: 2 million invocations/month
- **Paid**: $0.40 per million invocations
- **Estimated cost**: $0-2/month

**Total estimated cost**: $0-7/month (very affordable!)

## Getting Started

1. **Get Gemini API Key**:
   - Go to https://makersuite.google.com/app/apikey
   - Create free API key
   - Add to Firebase Functions environment

2. **Install dependencies**:
   ```bash
   npm install @google/generative-ai
   ```

3. **Create Cloud Function**:
   ```bash
   firebase init functions
   ```

4. **Deploy**:
   ```bash
   firebase deploy --only functions
   ```

## Example AI Suggestions

### Based on Household Areas:
- **Kitchen**: "Clean oven", "Organize pantry", "Deep clean refrigerator"
- **Bathroom**: "Clean grout", "Replace shower curtain", "Organize medicine cabinet"
- **Bedroom**: "Wash bedding", "Organize closet", "Dust under bed"
- **Living Room**: "Vacuum under furniture", "Clean windows", "Organize books"

### Based on Patterns:
- "You haven't done a deep clean in 6 weeks"
- "Your weekly tasks are usually completed on Sundays"
- "Kitchen tasks are most frequently missed - set earlier reminders?"

### Seasonal:
- **Spring**: "Spring cleaning", "Clean windows", "Organize garage"
- **Summer**: "Clean AC filters", "Maintain garden", "Clean patio"
- **Fall**: "Rake leaves", "Winterize home", "Clean gutters"
- **Winter**: "Check heating", "Organize holiday decorations", "Deep clean"

## Next Steps

1. **Start simple**: Implement rule-based suggestions first
2. **Add Gemini**: Integrate for natural language and smart suggestions
3. **Iterate**: Gather user feedback and improve suggestions
4. **Scale**: Add more advanced features as needed

Would you like me to implement any of these features?

