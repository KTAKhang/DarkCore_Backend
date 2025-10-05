// errorHandler middleware
const errorHandler = (err, req, res, next) => {
  console.error(err); // log ra console để debug

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  // FIXED: Handle Mongoose errors cụ thể
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(e => e.message).join(', ');
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.code === 11000) { // MongoDB duplicate key
    statusCode = 409;
    message = 'Duplicate field value entered';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token';
  }
  // Thêm dev stack nếu dev mode
//   if (process.env.NODE_ENV === 'development') {
//     message += ` | Stack: ${err.stack}`;
//   }

  res.status(statusCode).json({
    status: "ERR",
    message,
  });
};

module.exports = errorHandler;