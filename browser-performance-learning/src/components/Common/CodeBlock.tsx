import './CodeBlock.css'

interface CodeBlockProps {
  code: string
  language?: string
  title?: string
  highlight?: number[]
  showLineNumbers?: boolean
}

export function CodeBlock({
  code,
  language = 'javascript',
  title,
  highlight = [],
  showLineNumbers = true,
}: CodeBlockProps) {
  const lines = code.trim().split('\n')

  return (
    <div className="code-block">
      {title && (
        <div className="code-block-header">
          <span className="code-block-title">{title}</span>
          <span className="code-block-language">{language}</span>
        </div>
      )}
      <pre className="code-block-content">
        <code>
          {lines.map((line, index) => (
            <div
              key={index}
              className={`code-line ${highlight.includes(index + 1) ? 'highlighted' : ''}`}
            >
              {showLineNumbers && (
                <span className="line-number">{index + 1}</span>
              )}
              <span className="line-content">{line}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  )
}

interface CodeComparisonProps {
  before: {
    code: string
    title?: string
  }
  after: {
    code: string
    title?: string
  }
  language?: string
}

export function CodeComparison({ before, after, language = 'javascript' }: CodeComparisonProps) {
  return (
    <div className="code-comparison">
      <div className="code-comparison-panel before">
        <div className="code-comparison-badge">Bad Practice</div>
        <CodeBlock
          code={before.code}
          language={language}
          title={before.title}
        />
      </div>
      <div className="code-comparison-panel after">
        <div className="code-comparison-badge">Good Practice</div>
        <CodeBlock
          code={after.code}
          language={language}
          title={after.title}
        />
      </div>
    </div>
  )
}
