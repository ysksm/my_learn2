import './DevToolsGuide.css'

interface Step {
  instruction: string
  detail?: string
  image?: string
}

interface DevToolsGuideProps {
  title: string
  steps: Step[]
  tips?: string[]
}

export function DevToolsGuide({ title, steps, tips }: DevToolsGuideProps) {
  return (
    <div className="devtools-guide">
      <h3 className="devtools-guide-title">
        <span className="devtools-icon">🛠️</span>
        {title}
      </h3>

      <ol className="devtools-steps">
        {steps.map((step, index) => (
          <li key={index} className="devtools-step">
            <div className="step-number">{index + 1}</div>
            <div className="step-content">
              <div className="step-instruction">{step.instruction}</div>
              {step.detail && (
                <div className="step-detail">{step.detail}</div>
              )}
              {step.image && (
                <div className="step-image">
                  <img src={step.image} alt={step.instruction} />
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>

      {tips && tips.length > 0 && (
        <div className="devtools-tips">
          <h4 className="tips-title">💡 Tips</h4>
          <ul className="tips-list">
            {tips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

interface KeyboardShortcutProps {
  keys: string[]
  description: string
}

export function KeyboardShortcut({ keys, description }: KeyboardShortcutProps) {
  return (
    <div className="keyboard-shortcut">
      <div className="shortcut-keys">
        {keys.map((key, index) => (
          <span key={index}>
            <kbd>{key}</kbd>
            {index < keys.length - 1 && <span className="key-separator">+</span>}
          </span>
        ))}
      </div>
      <span className="shortcut-desc">{description}</span>
    </div>
  )
}

export function DevToolsShortcuts() {
  const shortcuts = [
    { keys: ['F12'], description: 'DevToolsを開く' },
    { keys: ['Cmd', 'Shift', 'P'], description: 'コマンドパレット' },
    { keys: ['Cmd', 'Shift', 'M'], description: 'デバイスモード切替' },
    { keys: ['Esc'], description: 'Consoleドロワー切替' },
  ]

  return (
    <div className="devtools-shortcuts">
      <h4 className="shortcuts-title">Keyboard Shortcuts</h4>
      <div className="shortcuts-list">
        {shortcuts.map((shortcut, index) => (
          <KeyboardShortcut
            key={index}
            keys={shortcut.keys}
            description={shortcut.description}
          />
        ))}
      </div>
    </div>
  )
}
