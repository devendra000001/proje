const sendControllerError = (res, error, fallbackMessage) => {
  const isDuplicate = error?.code === 11000;
  const isInvalid = ['ValidationError', 'CastError', 'StrictModeError'].includes(error?.name);
  const status = isDuplicate ? 409 : isInvalid ? 400 : 500;
  const message = isDuplicate
    ? 'A resource with one of these values already exists'
    : isInvalid ? 'Invalid request data' : fallbackMessage;
  console.error(`[Request Error] ${error?.name || 'Error'}`);
  return res.status(status).json({ success: false, message });
};

module.exports = sendControllerError;
