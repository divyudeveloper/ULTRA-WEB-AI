import { useCallback, useEffect, useState } from 'react'
import JSZip from 'jszip'
import './App.css'

const navigation = [
  { name: 'Dashboard', icon: 'D' },
  { name: 'AI Builder', icon: 'AI' },
  { name: 'My Projects', icon: 'P' },
  { name: 'Templates', icon: 'T' },
]

function createPreviewHtml(files) {
  const html = files.find((file) => file.name === 'index.html')?.content || ''
  const css = files.find((file) => file.name === 'style.css')?.content || ''
  const js = files.find((file) => file.name === 'script.js')?.content || ''

  if (!html) return ''

  let result = html

  const styleTag = `<style>\n${css.replace(/<\/style/gi, '<\\/style')}\n</style>`

  if (/<link\b[^>]*href=["'][^"']*style\.css[^"']*["'][^>]*>/i.test(result)) {
    result = result.replace(/<link\b[^>]*href=["'][^"']*style\.css[^"']*["'][^>]*>/i, styleTag)
  } else if (css) {
    result = result.replace(/<\/head>/i, `${styleTag}</head>`)
  }

  const scriptTag = `<script>\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>`

  if (/<script\b[^>]*src=["'][^"']*script\.js[^"']*["'][^>]*>\s*<\/script>/i.test(result)) {
    result = result.replace(/<script\b[^>]*src=["'][^"']*script\.js[^"']*["'][^>]*>\s*<\/script>/i, scriptTag)
  } else if (js) {
    result = result.replace(/<\/body>/i, `${scriptTag}</body>`)
  }

  return result
}
function App() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [apiStatus, setApiStatus] = useState('checking')
  const [backendInfo, setBackendInfo] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [generatedFiles, setGeneratedFiles] = useState([])
  const [activeFile, setActiveFile] = useState('index.html')
  const [previewKey, setPreviewKey] = useState(0)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [builderMode, setBuilderMode] = useState('prompt')
  const [websiteType, setWebsiteType] = useState('Business')
  const [websiteName, setWebsiteName] = useState('')
  const [websiteDetails, setWebsiteDetails] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#00BFFF')
  const [designStyle, setDesignStyle] = useState('Modern')
  const [selectedSections, setSelectedSections] = useState(['Hero', 'About', 'Services', 'Contact', 'Footer'])
  const [selectedFeatures, setSelectedFeatures] = useState(['Responsive Design', 'Animations'])
  const [customInstructions, setCustomInstructions] = useState('')

  const checkBackend = useCallback(async () => {
    setApiStatus('checking')

    try {
      const response = await fetch('/api/status')

      if (!response.ok) {
        throw new Error('Backend request failed')
      }

      const data = await response.json()
      setBackendInfo(data)
      setApiStatus(data.status === 'online' ? 'online' : 'offline')
    } catch {
      setBackendInfo(null)
      setApiStatus('offline')
    }
  }, [])

  useEffect(() => {
    checkBackend()
  }, [checkBackend])

  async function generateWebsite() {
    if (aiLoading) return

    let finalPrompt = prompt.trim()

    if (builderMode === 'smart') {
      if (!websiteName.trim() || !websiteDetails.trim()) {
        setAiError('Please enter website name and details.')
        return
      }

      finalPrompt = `Create a ${websiteType} website named "${websiteName}".

Purpose and details: ${websiteDetails}

Primary color: ${primaryColor}
Design style: ${designStyle}
Required sections: ${selectedSections.join(', ')}
Extra features: ${selectedFeatures.join(', ')}
Custom instructions: ${customInstructions}

Create a complete, professional, responsive website using HTML, CSS and JavaScript.`
    }

    if (!finalPrompt) return

    setAiLoading(true)
    setAiError('')
    setGeneratedFiles([])

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: finalPrompt }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'AI generation failed')
      }

      setGeneratedFiles(data.files)
      setActiveFile(data.files[0]?.name || 'index.html')
    } catch (error) {
      setAiError(error.message || 'Unable to connect to AI')
    } finally {
      setAiLoading(false)
    }
  }
  async function downloadProjectZip() {
    const zip = new JSZip()
    generatedFiles.forEach((file) => zip.file(file.name, file.content))
    const blob = await zip.generateAsync({ type: "blob" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "ultra-web-ai-website.zip"
    link.click()
    URL.revokeObjectURL(url)
  }

  const activeFileData = generatedFiles.find((file) => file.name === activeFile)
  const previewHtml = createPreviewHtml(generatedFiles)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">U</div>
          <div>
            <h2>ULTRA<span>WEB</span></h2>
            <p>AI WEBSITE BUILDER</p>
          </div>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="navigation">
          {navigation.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${activePage === item.name ? 'active' : ''}`}
              onClick={() => setActivePage(item.name)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.name}
              {item.name === 'AI Builder' && (
                <span className="new-tag">AI</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon">AI</div>
            <h3>Your ideas. Your websites.</h3>
            <p>Build something extraordinary with AI.</p>
            <span>AI POWERED</span>
          </div>

          <div className="profile">
            <div className="avatar">U</div>
            <div>
              <h4>Developer</h4>
              <p>Local workspace</p>
            </div>
            <span className="profile-menu">...</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> {activePage}
          </div>

          <div className="topbar-right">
            <div className={`connection-status ${apiStatus}`}>
              <span className="status-dot"></span>
              {apiStatus === 'checking'
                ? 'Checking API'
                : apiStatus === 'online'
                  ? 'Backend Online'
                  : 'Backend Offline'}
            </div>

            <button className="refresh-button" onClick={checkBackend}>
              Refresh
            </button>
          </div>
        </header>

        {activePage === 'Dashboard' || activePage === 'AI Builder' ? (
          <section className="dashboard">
            <div className="welcome-section">
              <div>
                <div className="eyebrow">
                  <span className="eyebrow-line"></span>
                  YOUR AI DEVELOPMENT STUDIO
                </div>
                <h1>Build something<br /><span>extraordinary.</span></h1>
                <p>
                  Turn your ideas into real websites and applications.
                  Describe what you imagine. We'll build it together.
                </p>
              </div>

              <div className="hero-orbit">
                <div className="orbit orbit-one"></div>
                <div className="orbit orbit-two"></div>
                <div className="orbit-core">U</div>
                <span className="orbit-particle particle-one"></span>
                <span className="orbit-particle particle-two"></span>
              </div>
            </div>

            <div className="builder-card">
              <div className="builder-heading">
                <div>
                  <span className="section-kicker">AI WEBSITE GENERATOR</span>
                  <h2>What do you want to build?</h2>
                </div>
                <span className="ai-indicator">AI QWEN3 AI</span>
              </div>

              <div className="builder-mode-switch">
                <button
                  className={builderMode === 'prompt' ? 'active' : ''}
                  onClick={() => setBuilderMode('prompt')}
                >
                  Prompt Mode
                </button>
                <button
                  className={builderMode === 'smart' ? 'active' : ''}
                  onClick={() => setBuilderMode('smart')}
                >
                  Smart Builder
                </button>
              </div>
              {builderMode === 'prompt' && (
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Describe your website... For example: Create a modern e-commerce website with products, cart, login and admin dashboard."
                  maxLength={12000}
                />
              )}
              {builderMode === 'smart' && (
                <div className="smart-builder-form">
                  <div className="smart-form-grid">
                    <label>
                      Website Type
                      <select value={websiteType} onChange={(event) => setWebsiteType(event.target.value)}>
                        <option>Business</option>
                        <option>Portfolio</option>
                        <option>E-commerce</option>
                        <option>Agency</option>
                        <option>Blog</option>
                        <option>Landing Page</option>
                        <option>Education</option>
                      </select>
                    </label>

                    <label>
                      Website Name
                      <input value={websiteName} onChange={(event) => setWebsiteName(event.target.value)} placeholder="Enter website name" />
                    </label>

                    <label>
                      Primary Color
                      <input type="color" value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} />
                    </label>

                    <label>
                      Design Style
                      <select value={designStyle} onChange={(event) => setDesignStyle(event.target.value)}>
                        <option>Modern</option>
                        <option>Minimal</option>
                        <option>Luxury</option>
                        <option>Professional</option>
                        <option>Creative</option>
                        <option>Futuristic</option>
                      </select>
                    </label>
                  </div>

                  <label className="smart-form-full">
                    Website Purpose & Details
                    <textarea
                      value={websiteDetails}
                      onChange={(event) => setWebsiteDetails(event.target.value)}
                      placeholder="Describe your website, target audience and what it should do..."
                    />
                  </label>

                  <div className="smart-form-group">
                    <span>Website Sections</span>
                    <div className="smart-checkbox-grid">
                      {['Hero', 'About', 'Services', 'Products', 'Portfolio', 'Testimonials', 'Contact', 'Footer'].map((section) => (
                        <label key={section}>
                          <input
                            type="checkbox"
                            checked={selectedSections.includes(section)}
                            onChange={(event) => setSelectedSections(event.target.checked ? [...selectedSections, section] : selectedSections.filter((item) => item !== section))}
                          />
                          {section}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="smart-form-group">
                    <span>Extra Features</span>
                    <div className="smart-checkbox-grid">
                      {['Responsive Design', 'Animations', 'Dark Mode', 'Login System', 'Search', 'Shopping Cart'].map((feature) => (
                        <label key={feature}>
                          <input
                            type="checkbox"
                            checked={selectedFeatures.includes(feature)}
                            onChange={(event) => setSelectedFeatures(event.target.checked ? [...selectedFeatures, feature] : selectedFeatures.filter((item) => item !== feature))}
                          />
                          {feature}
                        </label>
                      ))}
                    </div>
                  </div>

                  <label className="smart-form-full">
                    Custom Instructions (Optional)
                    <textarea
                      value={customInstructions}
                      onChange={(event) => setCustomInstructions(event.target.value)}
                      placeholder="Any extra design or functionality instructions..."
                    />
                  </label>
                </div>
              )}
              <div className="builder-footer">
                <span>HTML | CSS | JavaScript | React | Full Stack</span>
                <button
                  onClick={generateWebsite}
                  disabled={(builderMode === 'prompt' ? !prompt.trim() : (!websiteName.trim() || !websiteDetails.trim())) || aiLoading}
                >
                  {aiLoading ? 'Generating...' : 'Generate Website'}
                  <span>{'>'}</span>
                </button>
              </div>

              {aiLoading && (
                <p className="coming-note">Qwen3 is thinking. Please wait...</p>
              )}

              {aiError && (
                <p className="coming-note" role="alert">{aiError}</p>
              )}

              {generatedFiles.length > 0 && (
                <div className="ai-response">
                  <div className="builder-heading">
                    <div>
                      <span className="section-kicker">LIVE WORKSPACE</span>
                      <h2>Website Editor & Preview</h2>
                    </div>
                    <div className="workspace-actions">
                      <button className="download-zip-button" onClick={downloadProjectZip}>
                        Download ZIP
                      </button>
                      <span className="ai-indicator">AI qwen3:8b</span>
                    </div>
                  </div>

                  <div className="live-file-tabs">
                    {generatedFiles.map((file) => (
                      <button
                        key={file.name}
                        className={activeFile === file.name ? 'active' : ''}
                        onClick={() => setActiveFile(file.name)}
                      >
                        {file.name}
                      </button>
                    ))}
                  </div>

                  <div className="live-workspace">
                    <div className="live-editor">
                      <div className="live-panel-heading">
                        <span>CODE EDITOR</span>
                        <span>{activeFile}</span>
                      </div>
              <textarea
                        className="code-editor"
                        value={activeFileData?.content || ''}
                        onChange={(event) => {
                          setGeneratedFiles((current) =>
                            current.map((file) =>
                              file.name === activeFile
                                ? { ...file, content: event.target.value }
                                : file
                            )
                          )
                        }}
                        spellCheck="false"
                      />
                    </div>

                    <div className="live-preview">
                      <div className="live-panel-heading">
                        <span>LIVE PREVIEW</span>
                        <button onClick={() => setPreviewKey((value) => value + 1)}>
                          Refresh
                        </button>
                      </div>
                      <iframe
                        key={previewKey}
                        title="Generated website preview"
                        srcDoc={previewHtml}
                        sandbox="allow-scripts allow-forms"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="section-heading">
              <div>
                <span className="section-kicker">YOUR WORKSPACE</span>
                <h2>Development overview</h2>
              </div>
              <span className="local-badge">LOCAL DEVELOPMENT</span>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-top">
                  <span>AI ENGINE</span>
                  <span className="stat-icon purple">AI</span>
                </div>
                <h3>Qwen3:8B</h3>
                <p>Connected through Ollama</p>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <span>BACKEND API</span>
                  <span className="stat-icon green">API</span>
                </div>
                <h3>{apiStatus === 'online' ? 'Connected' : apiStatus === 'checking' ? 'Checking...' : 'Offline'}</h3>
                <p>{backendInfo?.message || 'Waiting for API connection'}</p>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <span>DATABASE</span>
                  <span className="stat-icon orange">P</span>
                </div>
                <h3>MongoDB</h3>
                <p>Integration pending</p>
              </div>
            </div>

            <div className="system-panel">
              <div>
                <span className="section-kicker">SYSTEM INFORMATION</span>
                <h3>ULTRA WEB AI Core</h3>
                <p>Version {backendInfo?.version || "1.0.0"} | Development environment</p>
              </div>

              <div className="system-details">
                <span>API STATUS</span>
                <strong className={apiStatus}>
                  {apiStatus === 'online' ? 'OPERATIONAL' : apiStatus.toUpperCase()}
                </strong>
              </div>
            </div>
          </section>
        ) : (
          <section className="empty-page">
            <div className="empty-icon">AI</div>
            <span className="section-kicker">ULTRA WEB AI WORKSPACE</span>
            <h1>{activePage}</h1>
            <p>This section is planned for a future development phase.</p>
            <button onClick={() => setActivePage('Dashboard')}>
              Back to Dashboard
            </button>
          </section>
        )}
      </main>
    </div>
  )
}

export default App










