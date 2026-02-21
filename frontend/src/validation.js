const VALIDATION_RULES = {
  email: {
    pattern: /@/,
    message: 'Email must contain @'
  },
  password: {
    uppercase: /[A-Z]/,
    number: /[0-9]/,
    minUppercase: 1,
    minNumber: 1,
    messages: {
      uppercase: 'Password must contain at least 1 uppercase letter',
      number: 'Password must contain at least 1 number'
    }
  }
};

function validateEmail(email) {
  const errors = [];
  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
    return { valid: false, errors };
  }
  if (!VALIDATION_RULES.email.pattern.test(email)) {
    errors.push(VALIDATION_RULES.email.message);
  }
  return { valid: errors.length === 0, errors };
}

function validatePassword(password) {
  const errors = [];
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { valid: false, errors };
  }
  
  const uppercaseMatches = password.match(VALIDATION_RULES.password.uppercase);
  const uppercaseCount = uppercaseMatches ? uppercaseMatches.length : 0;
  if (uppercaseCount < VALIDATION_RULES.password.minUppercase) {
    errors.push(VALIDATION_RULES.password.messages.uppercase);
  }
  
  const numberMatches = password.match(VALIDATION_RULES.password.number);
  const numberCount = numberMatches ? numberMatches.length : 0;
  if (numberCount < VALIDATION_RULES.password.minNumber) {
    errors.push(VALIDATION_RULES.password.messages.number);
  }
  
  return { valid: errors.length === 0, errors };
}

function validateConfirmPassword(password, confirmPassword) {
  const errors = [];
  if (!confirmPassword) {
    errors.push('Please confirm your password');
    return { valid: false, errors };
  }
  if (password !== confirmPassword) {
    errors.push('Passwords do not match');
    return { valid: false, errors };
  }
  return { valid: true, errors };
}

function validateLogin(data) {
  const errors = {};
  const emailResult = validateEmail(data.email);
  const passwordResult = validatePassword(data.password);
  
  if (!emailResult.valid) errors.email = emailResult.errors;
  if (!passwordResult.valid) errors.password = passwordResult.errors;
  
  return {
    valid: emailResult.valid && passwordResult.valid,
    errors
  };
}

function validateRegister(data) {
  const errors = {};
  const emailResult = validateEmail(data.email);
  const passwordResult = validatePassword(data.password);
  const confirmResult = validateConfirmPassword(data.password, data.confirmPassword);
  
  if (!emailResult.valid) errors.email = emailResult.errors;
  if (!passwordResult.valid) errors.password = passwordResult.errors;
  if (!confirmResult.valid) errors.confirmPassword = confirmResult.errors;
  
  return {
    valid: emailResult.valid && passwordResult.valid && confirmResult.valid,
    errors
  };
}

export { validateEmail, validatePassword, validateConfirmPassword, validateLogin, validateRegister };
