export function passwordProblem(password: string) {
  if (password.length < 8) return "Password needs at least 8 characters.";
  if (!/[a-z]/.test(password)) return "Password needs a lowercase letter.";
  if (!/[A-Z]/.test(password)) return "Password needs an uppercase letter.";
  if (!/[0-9]/.test(password)) return "Password needs a number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password needs a special character. A full stop counts.";
  return null;
}
