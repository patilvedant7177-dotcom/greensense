import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card'

type SuggestionsPanelProps = {
  suggestions: string[]
}

export function SuggestionsPanel({ suggestions }: SuggestionsPanelProps) {
  const getBorderColor = (text: string) => {
    const lowercase = text.toLowerCase()
    if (lowercase.includes('declined') || lowercase.includes('crack')) return 'border-l-danger'
    if (lowercase.includes('heat') || lowercase.includes('tilt')) return 'border-l-amber'
    return 'border-l-accentGreen'
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>System Suggestions</CardTitle>
        <CardDescription>Actionable tips to improve your solar yield today.</CardDescription>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <div className="flex h-[200px] flex-col items-center justify-center text-center">
            <p className="text-sm text-textMuted italic">
              System operating well. No improvements needed right now.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`rounded-lg border border-border border-l-4 ${getBorderColor(suggestion)} bg-bgSurface p-4 shadow-sm transition-all hover:bg-white`}
              >
                <p className="text-sm leading-relaxed text-textPrimary">
                  {suggestion}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SuggestionsPanel
