import React, { useState, useCallback, useEffect } from "react"
import SelectField from "./components/Select"
import listOfGenreOption from "./store/genre.json"
import listOfMoodOption from "./store/mood.json"

export default function App() {
  const [genre, setGenre] = useState('')
  const [mood, setMood] = useState('')
  const [level, setLevel] = useState('')
  const [aiResponses, setAiResponses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Reset mood when genre changes
  useEffect(() => {
    setMood('')
  }, [genre])

  const availableMoodBasedOnGenre = listOfMoodOption[genre]

  const fetchRecommendations = useCallback(async () => {
    if (!genre || !mood || !level) {
      setError('Please select all fields')
      return
    }

    setLoading(true)
    setError(null)

    try {
     
      const GEMINI_API_KEY = 'AIzaSyAaitFnIuiRbEjr7EcmMq9Ieg5LQJzAs2I'
      
      if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not found')
      }

      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY',
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Recommend 6 ${genre} books for a ${level} reader feeling ${mood}. For each book, provide:
`
              }]
            }]
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`API error: ${response.status} - ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()
      console.log('API Response:', data) 
      
      
      if (data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
        const candidateContent = data.candidates[0]?.content
        const partsArray = candidateContent?.parts
        
        if (partsArray && Array.isArray(partsArray) && partsArray.length > 0) {
          const recommendation = {
            genre,
            mood,
            level,
            text: partsArray[0].text,
            timestamp: new Date().toLocaleString()
          }
          setAiResponses(prev => [...prev, recommendation])
        } else {
          setError('Invalid response structure from API')
          console.error('Parts not found or invalid:', candidateContent)
        }
      } else if (data.error) {
        setError(`API Error: ${data.error.message || 'Unknown error'}`)
        console.error('API Error:', data.error)
      } else {
        setError('No recommendations received from API')
        console.error('Unexpected response:', data)
      }
    } catch (err) {
      console.error('Fetch Error:', err)
      setError(`Failed to fetch recommendations: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [genre, mood, level])

  return (
    <section style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>
        📚 Book Recommendation App
      </h1>
      
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '20px', 
        borderRadius: '10px',
        marginBottom: '20px'
      }}>
        <SelectField
          placeholder="Please select a genre"
          id="genre"
          options={listOfGenreOption}
          onSelect={setGenre}
          value={genre}
        />

        <SelectField
          placeholder="Please select a mood"
          id="mood"
          options={availableMoodBasedOnGenre || []}
          onSelect={setMood}
          value={mood}
        />

        <SelectField
          placeholder="Please select a level"
          id="level"
          options={['Beginner', "Intermediate", "Expert"]}
          onSelect={setLevel}
          value={level}
        />

        <button 
          onClick={fetchRecommendations}
          disabled={loading || !genre || !mood || !level}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            fontWeight: 'bold',
            backgroundColor: loading ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s'
          }}
        >
          {loading ? 'Loading...' : 'Get Recommendations'}
        </button>

        {error && (
          <div style={{ 
            marginTop: '10px', 
            padding: '10px', 
            backgroundColor: '#ffebee', 
            color: '#c62828',
            borderRadius: '5px'
          }}>
            {error}
          </div>
        )}
      </div>

      {aiResponses.length > 0 && (
        <div>
          <h2 style={{ color: '#333' }}>Your Recommendations</h2>
          {aiResponses.map((recommend, index) => (
            <details 
              key={index} 
              style={{ 
                marginBottom: '15px',
                backgroundColor: 'white',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <summary style={{ 
                cursor: 'pointer', 
                fontWeight: 'bold',
                fontSize: '18px',
                color: '#4CAF50',
                marginBottom: '10px'
              }}>
                Recommendation {index + 1} - {recommend.genre} ({recommend.mood})
                <div style={{ 
                  fontSize: '12px', 
                  color: '#666', 
                  fontWeight: 'normal',
                  marginTop: '5px'
                }}>
                  {recommend.timestamp} • {recommend.level} level
                </div>
              </summary>
              <div style={{ 
                marginTop: '15px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {recommend.text}
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  )
}