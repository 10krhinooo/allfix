/**
 * The password strength meter.
 *
 * A courtesy, and deliberately not a control. It tells somebody their password
 * is weak before they submit it, which is worth doing, and it decides nothing:
 * anything can post to the API without ever loading this page, so
 * `PasswordPolicy` on the backend applies the same rules again on arrival and
 * that is the one that is authoritative.
 *
 * The rules are mirrored rather than shared, and the backend's own comment says
 * why: sharing them would put the control in the browser, where it can be
 * edited. What must not drift is the *outcome*, so the wording below is the
 * wording `PasswordPolicy` returns, and both should be changed together.
 *
 * The rules are about length and variety rather than a character-class ritual.
 * A long passphrase beats a short password with a punctuation mark bolted on.
 */

export const MIN_LENGTH = 10
export const MAX_LENGTH = 200

/**
 * Refused whatever else they contain: the shop's own name and town are exactly
 * what a hurried customer reaches for. The backend holds the same list, and a
 * real deployment would check a leaked-password corpus behind an interface.
 */
const BANNED = [
  "password", "passw0rd", "12345678", "123456789", "1234567890",
  "qwertyuiop", "letmein", "iloveyou", "welcome", "admin123",
  "allfix", "kipekee", "curtains", "nairobi", "kenya",
]

export type Strength = "empty" | "weak" | "fair" | "strong"

export interface Verdict {
  strength: Strength
  /** Everything wrong with it, because a meter that reports one fault at a time is a guessing game. */
  problems: string[]
  acceptable: boolean
}

function repeatsOneCharacter(password: string): boolean {
  return new Set(password).size <= 2
}

/** Four or more characters running up or down, as in "abcd" or "4321". */
function runsInSequence(lower: string): boolean {
  let ascending = 1
  let descending = 1
  for (let index = 1; index < lower.length; index++) {
    const step = lower.charCodeAt(index) - lower.charCodeAt(index - 1)
    ascending = step === 1 ? ascending + 1 : 1
    descending = step === -1 ? descending + 1 : 1
    if (ascending >= 4 || descending >= 4) return true
  }
  return false
}

/**
 * A name or an email address showing up in the password.
 *
 * Every significant word, not the whole string: "p.ochieng" as one candidate
 * misses "ochieng-rails-99", which is exactly the password somebody called
 * Ochieng reaches for, and a surname is the first thing a guess tries. Fragments
 * under four characters are ignored so an initial does not ban half the alphabet.
 */
function containsIdentity(lower: string, identity: string): boolean {
  if (!identity.trim()) return false
  return identity
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length >= 4)
    .some((part) => lower.includes(part))
}

export function assess(password: string, email = "", displayName = ""): Verdict {
  if (!password) return { strength: "empty", problems: [], acceptable: false }

  const problems: string[] = []
  const lower = password.toLowerCase()

  if (password.length < MIN_LENGTH) problems.push(`Use at least ${MIN_LENGTH} characters.`)
  if (password.length > MAX_LENGTH) problems.push(`Use at most ${MAX_LENGTH} characters.`)

  let classes = 0
  if (/[A-Z]/.test(password)) classes++
  if (/[a-z]/.test(password)) classes++
  if (/[0-9]/.test(password)) classes++
  if (/[^A-Za-z0-9]/.test(password)) classes++
  if (classes < 2) problems.push("Mix at least two of: capitals, lower case, numbers, symbols.")

  if (BANNED.some((banned) => lower.includes(banned))) {
    problems.push("That is too easy to guess. Avoid common words and the shop's name.")
  }
  if (repeatsOneCharacter(password) || runsInSequence(lower)) {
    problems.push("Avoid repeated characters and runs like abcd or 1234.")
  }
  if (containsIdentity(lower, email) || containsIdentity(lower, displayName)) {
    problems.push("Do not use your name or email address in your password.")
  }

  // Passing is the floor, not the goal, so the meter keeps climbing past it:
  // length is what actually makes a password hard to guess.
  const acceptable = problems.length === 0
  const strength: Strength = !acceptable
    ? "weak"
    : password.length >= 16 || (password.length >= 12 && classes >= 3)
      ? "strong"
      : "fair"

  return { strength, problems, acceptable }
}
