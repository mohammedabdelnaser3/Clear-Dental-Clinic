# Form Validation Examples

## How It Works

### Example 1: Email Validation

**Invalid Email:**
```
User types: "john@"
Error shown: "Please enter a valid email address"
Submit button: Blocked
```

**Valid Email:**
```
User types: "john@example.com"
Error shown: None
Submit button: Enabled
```

### Example 2: Phone Number Validation

**Invalid Phone:**
```
User types: "123"
Error shown: "Phone number must have at least 10 digits"
Submit button: Blocked
```

**Valid Phone:**
```
User types: "123-456-7890" or "+1 (234) 567-8900"
Error shown: None
Submit button: Enabled
```

### Example 3: Required Fields

**Empty Required Field:**
```
User leaves First Name empty
Error shown: "First name is required"
Submit button: Blocked
```

**Filled Required Field:**
```
User types: "John"
Error shown: None
Submit button: Enabled
```

### Example 4: Date of Birth Validation

**Future Date:**
```
User selects: 2026-01-01
Error shown: "Date of birth cannot be in the future"
Submit button: Blocked
```

**Valid Date:**
```
User selects: 1990-01-01
Error shown: None
Submit button: Enabled
```

### Example 5: ZIP Code Validation

**Invalid ZIP:**
```
User types: "12"
Error shown: "Please enter a valid ZIP/postal code"
Submit button: Blocked
```

**Valid ZIP:**
```
User types: "12345" or "12345-6789" or "A1A 1A1"
Error shown: None
Submit button: Enabled
```

## User Flow

1. **User starts filling form** → No errors shown initially
2. **User enters invalid data** → Error appears below field in red
3. **User starts correcting** → Error disappears as they type
4. **User tries to submit with errors** → Form blocked, message shown: "Please fix the validation errors before submitting"
5. **User fixes all errors** → Form submits successfully

## Visual Indicators

- **Error State**: Red text below input field
- **Error Message**: Clear, actionable text (e.g., "Email is required")
- **Form-Level Error**: Alert banner at top when submission blocked
- **Success State**: Green success message after valid submission

## Accessibility

- Error messages are associated with their input fields
- Color is not the only indicator (text messages provided)
- Screen readers can announce validation errors
- Keyboard navigation fully supported
