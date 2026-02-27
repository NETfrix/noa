#!/usr/bin/env bash
set -euo pipefail

# Generate daily literary content for Tel Aviv Libraries Facebook page
# Usage: ANTHROPIC_API_KEY=sk-... ./generate.sh [MM-DD]

if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  echo "Error: ANTHROPIC_API_KEY environment variable is required" >&2
  exit 1
fi

# Date to generate for (default: today)
if [ -n "${1:-}" ]; then
  TARGET_DATE="$1"
  FULL_DATE="$(date -d "2026-${TARGET_DATE}" +%Y-%m-%d 2>/dev/null || echo "2026-${TARGET_DATE}")"
else
  TARGET_DATE="$(date +%m-%d)"
  FULL_DATE="$(date +%Y-%m-%d)"
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_FILE="${SCRIPT_DIR}/content/${TARGET_DATE}.json"

echo "Generating content for ${TARGET_DATE} (${FULL_DATE})..."

# Use Python for the entire API call to avoid encoding issues with Hebrew
python -c "
import json, re, sys, urllib.request

api_key = sys.argv[1]
full_date = sys.argv[2]
output_file = sys.argv[3]

prompt = '''אתה עוזר לצוות ספריות תל אביב ליצור תוכן לעמוד הפייסבוק שלהם.

התאריך של היום: ''' + full_date + '''

צור JSON עם המבנה הבא:
{
  \"date\": \"''' + full_date + '''\",
  \"hebrew_date\": \"התאריך העברי המתאים\",
  \"literary_events\": [
    {
      \"title\": \"כותרת האירוע\",
      \"description\": \"תיאור קצר\",
      \"type\": \"israeli\" או \"international\",
      \"year\": שנה
    }
  ],
  \"post_suggestions\": [
    {
      \"title\": \"כותרת ההצעה\",
      \"description\": \"תיאור מפורט של הפוסט המוצע, כולל רעיונות לתוכן\",
      \"hashtags\": [\"#ספריותתלאביב\", \"#האשטאגנוסף\"]
    }
  ]
}

הנחיות:
1. כלול 4-8 אירועים ספרותיים שקרו בתאריך הזה (ימי הולדת/פטירה של סופרים, יום פרסום ספרים חשובים)
2. העדף אירועים ישראליים ועבריים (סמן אותם כ-israeli)
3. כלול גם אירועים בינלאומיים חשובים (סמן כ-international)
4. הצע 3-5 רעיונות לפוסטים בפייסבוק המתאימים לספריות תל אביב
5. הפוסטים צריכים להיות רלוונטיים, מעניינים ומעודדים קריאה
6. כל הטקסט בעברית
7. החזר JSON בלבד, ללא טקסט נוסף'''

body = json.dumps({
    'model': 'claude-sonnet-4-20250514',
    'max_tokens': 4096,
    'messages': [{'role': 'user', 'content': prompt}]
}, ensure_ascii=False).encode('utf-8')

req = urllib.request.Request(
    'https://api.anthropic.com/v1/messages',
    data=body,
    headers={
        'Content-Type': 'application/json',
        'x-api-key': api_key,
        'anthropic-version': '2023-06-01'
    }
)

try:
    with urllib.request.urlopen(req) as resp:
        response = json.loads(resp.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    err = json.loads(e.read().decode('utf-8'))
    print(f'API Error: {json.dumps(err, ensure_ascii=False)}', file=sys.stderr)
    sys.exit(1)

text = response['content'][0]['text']
match = re.search(r'\{[\s\S]*\}', text)
if not match:
    print('Error: No JSON found in response', file=sys.stderr)
    print('Response text: ' + text[:500], file=sys.stderr)
    sys.exit(1)

data = json.loads(match.group())

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f'Content saved to {output_file}')
" "$ANTHROPIC_API_KEY" "$FULL_DATE" "$OUTPUT_FILE"
