
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  // At least 8 characters, 1 letter and 1 number
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
};

export const validatePhone = (phone: string): boolean => {
  // Simple validation for phone number (accepts formats: XXX-XXX-XXXX, XXXXXXXXXX, XXX.XXX.XXXX, etc.)
  const phoneRegex = /^\+?[\d\s\-().]{10,15}$/;
  return phoneRegex.test(phone);
};

export const validateName = (name: string): boolean => {
  return name.trim().length >= 2;
};

export const validatePrice = (price: string): boolean => {
  const priceNumber = parseFloat(price);
  return !isNaN(priceNumber) && priceNumber > 0;
};

export const validateRooms = (rooms: string): boolean => {
  const roomsNumber = parseInt(rooms, 10);
  return !isNaN(roomsNumber) && roomsNumber > 0;
};

export const getFormErrors = (formData: Record<string, unknown>): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (formData.name !== undefined && typeof formData.name === 'string') {
    if (!validateName(formData.name)) {
      errors.name = "Name must be at least 2 characters";
    }
  }

  if (formData.email !== undefined && typeof formData.email === 'string') {
    if (!validateEmail(formData.email)) {
      errors.email = "Please enter a valid email address";
    }
  }

  if (formData.password !== undefined && typeof formData.password === 'string') {
    if (!validatePassword(formData.password)) {
      errors.password = "Password must be at least 8 characters with 1 letter and 1 number";
    }
  }

  if (formData.phone !== undefined && typeof formData.phone === 'string') {
    if (!validatePhone(formData.phone)) {
      errors.phone = "Please enter a valid phone number";
    }
  }

  if (formData.price !== undefined && typeof formData.price === 'string') {
    if (!validatePrice(formData.price)) {
      errors.price = "Please enter a valid price";
    }
  }

  if (formData.rooms !== undefined && typeof formData.rooms === 'string') {
    if (!validateRooms(formData.rooms)) {
      errors.rooms = "Please enter a valid number of rooms";
    }
  }

  return errors;
};
