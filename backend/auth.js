const bcrypt = require('bcrypt');
const { pool } = require('./db');
const { validateLogin, validateRegister } = require('../shared/validation');

const SALT_ROUNDS = 10;

async function register(email, password, confirmPassword) {
  const validation = validateRegister({ email, password, confirmPassword });
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }
  
  try {
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return {
        success: false,
        errors: { email: ['Email already registered'] }
      };
    }
    
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
      [email, hashedPassword]
    );
    
    return {
      success: true,
      user: { id: result.rows[0].id, email: result.rows[0].email }
    };
  } catch (err) {
    console.error('Register error:', err.message);
    return {
      success: false,
      errors: { general: ['Database error'] }
    };
  }
}

async function login(email, password, humanToken, captchaAnswer) {
  if (!humanToken || captchaAnswer === undefined) {
    return {
      success: false,
      errors: { human: 'Human validation is required' }
    };
  }
  
  const userAnswer = parseInt(humanToken);
  if (isNaN(userAnswer) || userAnswer !== captchaAnswer) {
    return {
      success: false,
      errors: { human: 'Incorrect captcha answer' }
    };
  }
  
  const validation = validateLogin({ email, password });
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }
  
  try {
    const result = await pool.query(
      'SELECT id, email, password FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return {
        success: false,
        errors: { email: ['Invalid email or password'] }
      };
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return {
        success: false,
        errors: { password: ['Invalid email or password'] }
      };
    }
    
    return {
      success: true,
      user: { id: user.id, email: user.email }
    };
  } catch (err) {
    console.error('Login error:', err.message);
    return {
      success: false,
      errors: { general: ['Database error'] }
    };
  }
}

module.exports = { register, login };
