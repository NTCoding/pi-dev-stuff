const path = require('node:path')

const forbiddenWordsWithSuggestions = {
  common: 'Name the module after its specific responsibility',
  data: 'Name the value after the concept it represents',
  helper: 'Name the module after what it does',
  helpers: 'Name the module after what it does',
  manager: 'Name the class after its responsibility',
  managers: 'Name the class after its responsibility',
  processor: 'Name the class after what it processes',
  processors: 'Name the class after what it processes',
  service: 'Name the class after its domain action',
  services: 'Name the class after its domain action',
  shared: 'Name the module after the capability being shared',
  utilities: 'Name the module after what it does',
  utility: 'Name the module after what it does',
  utils: 'Name the module after what it does',
}

const forbiddenWords = Object.keys(forbiddenWordsWithSuggestions)
const forbiddenPattern = new RegExp(
  `(^|/|-|[a-z])(${forbiddenWords.join('|')})(-|[.]ts$|[.]tsx$|/|$)`,
  'i',
)

function findForbiddenWord(text) {
  const lowerText = text.toLowerCase()
  return forbiddenWords.find((word) => lowerText.includes(word))
}

function isForbiddenName(name) {
  if (name) {
    const lowerName = name.toLowerCase()
    return forbiddenWords.some(
      (word) => lowerName === word || lowerName.startsWith(word) || lowerName.endsWith(word),
    )
  }

  return false
}

function buildMessage(subject, text) {
  const matchedWord = findForbiddenWord(text)
  if (matchedWord) {
    return `Generic word "${matchedWord}" in ${subject}. ${forbiddenWordsWithSuggestions[matchedWord]}`
  }

  return `Generic ${subject}. Use an intention revealing name.`
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Forbid generic names in filenames and class names',
      recommended: true,
    },
  },
  create(context) {
    const filename = path.basename(context.filename || '')
    return {
      ClassDeclaration(node) {
        if (node.id && isForbiddenName(node.id.name)) {
          context.report({
            node: node.id,
            message: buildMessage(`class "${node.id.name}"`, node.id.name),
          })
        }
      },
      Program(node) {
        if (forbiddenPattern.test(filename)) {
          context.report({
            node,
            message: buildMessage('filename', filename),
          })
        }
      },
    }
  },
}
