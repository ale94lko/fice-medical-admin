# Code Style Guidelines

This project uses [ESLint](https://eslint.org/) to keep the codebase consistent and error free. The configuration lives in [`eslint.config.js`](eslint.config.js) and enforces the rules summarized below.

## Environment and Language Features
- Browser and jQuery globals are available.
- ECMAScript 2020 syntax with JavaScript modules.

## Formatting
- Indent using two spaces; `switch` cases are indented once.
- Lines should not exceed 80 characters and block depth should be at most three levels.
- Use single quotes for strings; escape when necessary.
- Do not use semicolons at the end of statements.
- Trailing commas are allowed only in multiline constructs.
- End files with a single newline character.
- No trailing whitespace or mixed tabs and spaces.

## Spacing
- Require spaces around keywords and before blocks and function parentheses.
- Disallow spaces inside brackets or parentheses and around computed properties.
- Enforce spacing around commas, operators, arrows, and unary operators.
- Objects must have spaces inside curly braces.

## Best Practices
- Always use curly braces for control statements.
- Avoid extending native objects and unnecessary string concatenation.
- Variables must be defined before use and unused variables should be removed.
- Prefer camelCase naming and capitalize constructor functions.
- Loose equality (`==`) is permitted only when type coercion is safe.
- Console statements and `new` without assignment are allowed.

## Complexity Limits
- Maximum of 30 statements per function.
- Warn when function nesting depth exceeds three levels.

Refer to the ESLint configuration for the full list of rules and their options.
