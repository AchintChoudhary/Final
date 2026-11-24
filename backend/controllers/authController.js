import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ENV } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { isValidIndianMobile, normalizeIndianMobile } from '../utils/validators.js';

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN,
  });
};

// Driver Signup
export const driverSignup = async (req, res, next) => {
  try {
    const { name, mobile, password } = req.body;

    if (!name || !mobile || !password) {
      throw new ApiError(400, 'Full name, mobile number, and password are required');
    }

    if (!isValidIndianMobile(mobile)) {
      throw new ApiError(400, 'Please enter a valid 10-digit Indian mobile number');
    }

    const cleanMobile = normalizeIndianMobile(mobile);
    const existing = await User.findOne({ mobile: cleanMobile });
    if (existing) {
      throw new ApiError(409, 'An account with this mobile number already exists');
    }

    const user = await User.create({
      name: name.trim(),
      mobile: cleanMobile,
      passwordHash: password,
      role: 'DRIVER',
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Driver account created successfully',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// Passenger Signup
export const passengerSignup = async (req, res, next) => {
  try {
    const { name, mobile, password } = req.body;

    if (!name || !mobile || !password) {
      throw new ApiError(400, 'Full name, mobile number, and password are required');
    }

    if (!isValidIndianMobile(mobile)) {
      throw new ApiError(400, 'Please enter a valid 10-digit Indian mobile number');
    }

    const cleanMobile = normalizeIndianMobile(mobile);
    const existing = await User.findOne({ mobile: cleanMobile });
    if (existing) {
      throw new ApiError(409, 'An account with this mobile number already exists');
    }

    const user = await User.create({
      name: name.trim(),
      mobile: cleanMobile,
      passwordHash: password,
      role: 'PASSENGER',
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Passenger account created successfully',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// User Login (Driver or Passenger using Mobile + Password, with role validation)
export const login = async (req, res, next) => {
  try {
    const { mobile, password, role } = req.body;

    if (!mobile || !password) {
      throw new ApiError(400, 'Mobile number and password are required');
    }

    const cleanMobile = normalizeIndianMobile(mobile);
    const user = await User.findOne({ mobile: cleanMobile });

    if (!user) {
      throw new ApiError(401, 'Invalid mobile number or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid mobile number or password');
    }

    // Validate that user is logging into their actual registered role
    if (role) {
      const normalizedRole = role.toUpperCase();
      if (user.role !== normalizedRole) {
        const expectedRoleName = user.role === 'DRIVER' ? 'Driver' : 'Passenger';
        throw new ApiError(
          403,
          `This account is registered as a ${expectedRoleName}. Please switch to the ${expectedRoleName} tab to log in.`
        );
      }
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};
