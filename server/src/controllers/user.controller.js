import {
  registerUser,
  loginUser,
} from "../services/user.service.js";

export const registerUserController = async (req, res, next) => {
  try {
    const user = await registerUser(req.body);

    const { password, ...userWithoutPassword } = user.toObject();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};

export const loginUserController = async (req, res, next) => {
  try {
    const { user, token } = await loginUser(req.body);

    const { password, ...userWithoutPassword } = user.toObject();

    res.status(200).json({
      success: true,
      token,
      data: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};